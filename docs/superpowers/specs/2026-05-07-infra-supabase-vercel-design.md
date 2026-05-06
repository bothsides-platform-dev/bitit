# 인프라 설계: Vercel + Supabase Free + Resend

**날짜**: 2026-05-07  
**범위**: 프로덕션 배포 인프라 (Next.js 앱 호스팅 + DB + 파일 스토리지)  
**목표**: 비용 없이, 최소한의 코드 변경으로, 단순하게 프로덕션 배포

---

## 1. 전체 구조

```
GitHub → Vercel (Next.js 16 자동 배포)
              └── Cron: /api/cron/flush-outbox (60초마다)
Supabase Free
  ├── Postgres 16 (pooler URL, port 6543)
  └── Storage: bucket "attachments" (service_role 키로 서버 사이드 전용 접근)
Resend
  └── 트랜잭션 이메일 (초대, 인증, 알림)
NTS API
  └── 국세청 사업자등록 상태조회 (외부, 변경 없음)
```

**비용**: $0/월 (소규모 기준)  
**제약**: Supabase 무료 플랜은 7일 미사용 시 프로젝트 자동 정지

---

## 2. 서비스별 설정

### 2.1 Supabase

| 항목 | 값 |
|---|---|
| 플랜 | Free |
| DB | Postgres 16 (Supabase managed) |
| Storage bucket | `attachments` (비공개, 서버 사이드 접근만) |
| 연결 방식 | **Transaction Pooler** (port 6543, pgbouncer 모드) |
| 접근 키 | `service_role` 키만 사용 (anon 키는 클라이언트 노출 금지) |

Supabase 대시보드 → Settings → Database → Connection string에서  
**Transaction pooler** URL 복사 (port 6543).

### 2.2 Vercel

| 항목 | 값 |
|---|---|
| 플랜 | Hobby (무료) |
| 연동 | GitHub 레포 직접 연결, main 브랜치 자동 배포 |
| Cron | `/api/cron/flush-outbox`, 60초 간격 (`vercel.json`) |
| 빌드 커맨드 | `pnpm build` (기본값 그대로) |
| 설치 커맨드 | `pnpm install` |

### 2.3 Resend

기존 설정 그대로 유지. `RESEND_API_KEY`만 Vercel 환경변수에 추가.

---

## 3. 환경변수

### 기존에서 변경되는 것

```bash
# 기존: Docker localhost → 변경: Supabase pooler URL
DATABASE_URL=postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 새로 추가되는 것

```bash
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STORAGE_BACKEND=supabase
```

### 그대로 유지되는 것

```bash
AUTH_SECRET=
RESEND_API_KEY=
NTS_SERVICE_KEY=
NEXT_PUBLIC_BASE_URL=https://[your-vercel-domain].vercel.app
CRON_SECRET=
```

> `UPLOAD_DIR`는 Supabase Storage 사용 시 더 이상 필요 없음.

---

## 4. 코드 변경 (3곳)

### 4.1 `lib/db/client.ts` — 연결 풀 제한

서버리스(Vercel) 환경에서는 함수 인스턴스마다 DB 연결이 생성되므로  
`max` 연결 수를 1로 줄여 Supabase 무료 플랜 연결 한도(60개) 초과를 방지.

```diff
- max: 10,
+ max: 1,
```

### 4.2 `lib/server/storage/supabase.ts` — 신규 파일

`Storage` 인터페이스를 Supabase Storage SDK로 구현.  
`save` / `read` / `delete` 3개 메서드만 구현하면 됨.

```typescript
// lib/server/storage/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Storage } from './local';

const BUCKET = 'attachments';

function client() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export class SupabaseStorage implements Storage {
  async save(key: string, buffer: Buffer, mime: string): Promise<void> {
    const { error } = await client().storage
      .from(BUCKET)
      .upload(key, buffer, { contentType: mime, upsert: true });
    if (error) throw error;
  }

  async read(key: string): Promise<{ stream: ReadableStream<Uint8Array>; size: number }> {
    const { data, error } = await client().storage.from(BUCKET).download(key);
    if (error) throw error;
    const buf = await data.arrayBuffer();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(buf));
        controller.close();
      },
    });
    return { stream, size: buf.byteLength };
  }

  async delete(key: string): Promise<void> {
    await client().storage.from(BUCKET).remove([key]);
    // 없는 파일 삭제도 에러 없이 통과 (idempotent)
  }
}
```

### 4.3 `lib/server/storage/index.ts` — 백엔드 분기

`STORAGE_BACKEND=supabase` 환경변수로 구현체 전환.  
기존 `LocalStorage` 경로는 그대로 유지 (로컬 개발, 테스트용).

```diff
export function getStorage(): Storage {
  if (!globalThis.__bidit_storage__) {
+   if (process.env.STORAGE_BACKEND === 'supabase') {
+     const { SupabaseStorage } = require('./supabase') as typeof import('./supabase');
+     globalThis.__bidit_storage__ = new SupabaseStorage();
+   } else {
      const { LocalStorage } = require('./local') as typeof import('./local');
      globalThis.__bidit_storage__ = new LocalStorage();
+   }
  }
  return globalThis.__bidit_storage__;
}
```

### 4.4 `vercel.json` — Cron 설정 (신규 파일)

```json
{
  "crons": [
    {
      "path": "/api/cron/flush-outbox",
      "schedule": "* * * * *"
    }
  ]
}
```

> Vercel Cron은 `CRON_SECRET` 헤더 검증으로 보호 (기존 구현 그대로).  
> 무료 플랜: 분당 1회 실행, 최대 2개 cron job 허용.

---

## 5. 배포 절차

### Step 1: Supabase 프로젝트 생성
1. [supabase.com](https://supabase.com) → New project
2. Settings → Database → **Transaction pooler** URL 복사 (port 6543)
3. Settings → API → `service_role` 키 복사
4. Storage → New bucket: `attachments`, **비공개(private)** 설정

### Step 2: DB 스키마 적용
```bash
# 로컬에서 Supabase DB를 향해 마이그레이션 실행
DATABASE_URL="postgres://..." pnpm db:migrate
```

### Step 3: Vercel 프로젝트 생성
1. [vercel.com](https://vercel.com) → New project → GitHub 레포 연결
2. Framework preset: **Next.js** (자동 감지)
3. Environment Variables에 아래 모두 입력:
   - `DATABASE_URL` (Supabase pooler URL)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STORAGE_BACKEND=supabase`
   - `AUTH_SECRET`
   - `RESEND_API_KEY`
   - `NTS_SERVICE_KEY`
   - `NEXT_PUBLIC_BASE_URL` (Vercel 도메인 확정 후)
   - `CRON_SECRET`
4. Deploy

### Step 4: 패키지 추가
```bash
pnpm add @supabase/supabase-js
```

---

## 6. 제약 및 주의사항

| 항목 | 내용 |
|---|---|
| **Supabase 7일 정지** | 무료 플랜은 7일 미접속 시 프로젝트 자동 정지. Supabase 콘솔에서 수동 재활성화 필요. 실 서비스 전환 시 Pro($25/월) 업그레이드 고려 |
| **DB 연결 수** | 무료 플랜 최대 60개 동시 연결. `max: 1` + Pooler URL로 Vercel 서버리스 환경에서 안전 |
| **Storage 접근** | `service_role` 키는 서버 사이드(`lib/server/storage/supabase.ts`)에서만 사용. 클라이언트 컴포넌트에 절대 노출 금지 |
| **파일 크기** | Supabase 무료: 단일 파일 최대 50MB. 기존 `app/api/files/upload` 검증 로직 확인 필요 |
| **Vercel Cron** | 무료 플랜 분당 1회 실행 (기존 docker cron 60초 안전망과 동일 주기) |
| **드리즐 마이그레이션** | `pnpm db:push` 대신 `pnpm db:migrate`로 안전하게 적용. Supabase는 `drizzle-kit migrate` 완전 호환 |

---

## 7. 로컬 개발 환경

로컬에서는 기존 Docker Compose 그대로 유지.  
`STORAGE_BACKEND` 미설정 시 `LocalStorage`(로컬 디스크)가 기본값으로 동작.

```bash
# 로컬 개발 (변경 없음)
docker compose up -d
pnpm dev

# Supabase Storage 로컬 테스트 시
STORAGE_BACKEND=supabase pnpm dev
```

---

## 8. 패키지 변경 요약

```bash
# 추가
pnpm add @supabase/supabase-js

# 제거 없음 (postgres-js, drizzle 등 기존 패키지 그대로 유지)
```
