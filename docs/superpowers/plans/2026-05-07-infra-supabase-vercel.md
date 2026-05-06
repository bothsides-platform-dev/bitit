# Vercel + Supabase Free 인프라 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 16 앱을 Vercel에, DB + 파일 스토리지를 Supabase Free에 배포해 $0 비용으로 프로덕션 운영

**Architecture:** Vercel이 Next.js 앱을 호스팅하고 GitHub push마다 자동 배포. Supabase가 Postgres DB(pooler URL)와 파일 스토리지(attachments 버킷)를 제공. `STORAGE_BACKEND=supabase` 환경변수로 LocalStorage → SupabaseStorage 전환.

**Tech Stack:** `@supabase/supabase-js`, Vercel Cron, Drizzle ORM (연결 설정만 변경), Vitest (mock 기반 단위 테스트)

---

## 파일 구조

| 파일 | 작업 | 역할 |
|---|---|---|
| `lib/server/storage/supabase.ts` | **신규** | `Storage` 인터페이스의 Supabase Storage 구현체 |
| `lib/server/storage/__tests__/supabase.test.ts` | **신규** | SupabaseStorage 단위 테스트 (SDK mock) |
| `lib/server/storage/index.ts` | **수정** | `STORAGE_BACKEND=supabase` 시 SupabaseStorage 반환 |
| `lib/db/client.ts` | **수정** | `max: 10` → `max: 1` (서버리스 연결 수 제한) |
| `.env.example` | **수정** | Supabase 환경변수 추가, UPLOAD_DIR 주석 처리 |
| `vercel.json` | **신규** | Vercel Cron 설정 (outbox flush 60초) |

---

## Task 1: Supabase 수동 설정 (코드 없음)

> 브라우저에서 진행하는 수동 작업. 이 태스크 완료 후 환경변수 4개를 메모해 두세요.

- [ ] **Step 1: Supabase 프로젝트 생성**

  [supabase.com](https://supabase.com) → New project  
  - Name: `bidit`  
  - Database Password: 안전한 비밀번호 생성 후 **메모**  
  - Region: Southeast Asia (Singapore) — 한국과 가장 가까운 무료 리전

- [ ] **Step 2: Postgres pooler URL 복사**

  Supabase 대시보드 → Project Settings → Database → **Connection string**  
  탭에서 **Transaction** 선택 → URI 복사  
  형식: `postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`  
  → `DATABASE_URL` 값으로 메모

- [ ] **Step 3: API 키 복사**

  Project Settings → API  
  - `Project URL` → `SUPABASE_URL` 값으로 메모  
  - `service_role` (Secret) → `SUPABASE_SERVICE_ROLE_KEY` 값으로 메모  
  ⚠️ `anon` 키는 사용하지 않음 (클라이언트 노출 위험)

- [ ] **Step 4: Storage 버킷 생성**

  Supabase 대시보드 → Storage → New bucket  
  - Name: `attachments`  
  - Public bucket: **OFF** (비공개)  
  - Create bucket

---

## Task 2: 패키지 추가 + 환경변수 + DB 클라이언트 수정

**Files:**
- Modify: `package.json` (pnpm add)
- Modify: `.env.example`
- Modify: `lib/db/client.ts:12-18`

- [ ] **Step 1: Supabase JS SDK 설치**

  ```bash
  pnpm add @supabase/supabase-js
  ```

  Expected: `dependencies` 에 `@supabase/supabase-js` 추가됨

- [ ] **Step 2: `.env.example` 업데이트**

  `/Users/yeonseong/project/bidit/.env.example` 를 아래로 교체:

  ```bash
  # Supabase Transaction Pooler URL (port 6543, pgbouncer 모드)
  # Settings → Database → Connection string → Transaction 탭
  DATABASE_URL=postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  # Test Postgres (docker compose pg-test profile). 로컬 통합 테스트 전용.
  DATABASE_URL_TEST=postgres://bidit:bidit@localhost:5433/bidit_test
  # Auth.js v5 JWT signing secret. Generate with: openssl rand -base64 32
  AUTH_SECRET=
  # Resend API key for transactional email (invitations, verify, notifications).
  RESEND_API_KEY=
  # 국세청 사업자등록 상태조회 service key (data.go.kr).
  NTS_SERVICE_KEY=
  # Public-facing absolute origin used for emailed links and absolute redirects.
  NEXT_PUBLIC_BASE_URL=http://localhost:3000
  # Shared secret guarding cron route handlers (e.g., outbox flush safety net).
  CRON_SECRET=
  # Supabase project URL (Settings → API → Project URL)
  SUPABASE_URL=https://[project-ref].supabase.co
  # Supabase service_role secret key (Settings → API → service_role). 서버 사이드 전용.
  SUPABASE_SERVICE_ROLE_KEY=
  # Storage 구현체 선택: 'supabase' | 미설정(로컬 디스크)
  STORAGE_BACKEND=supabase
  # 로컬 개발용 파일 스토리지 디렉토리 (STORAGE_BACKEND 미설정 시만 사용)
  # UPLOAD_DIR=./uploads
  ```

- [ ] **Step 3: DB 클라이언트 연결 풀 제한**

  `lib/db/client.ts` 의 `max: 10` 을 `max: 1` 로 변경:

  ```typescript
  const client =
    globalThis.__bidit_pg__ ??
    postgres(process.env.DATABASE_URL!, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  ```

  > Vercel 서버리스 함수는 인스턴스마다 독립 연결을 열므로 `max: 1` 이 적합.
  > Supabase 무료 플랜 최대 동시 연결 60개 초과를 방지.

- [ ] **Step 4: 커밋**

  ```bash
  git add package.json pnpm-lock.yaml .env.example lib/db/client.ts
  git commit -m "chore: add @supabase/supabase-js, update env.example, limit DB pool to 1"
  ```

---

## Task 3: SupabaseStorage 구현 (TDD)

**Files:**
- Create: `lib/server/storage/__tests__/supabase.test.ts`
- Create: `lib/server/storage/supabase.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

  `lib/server/storage/__tests__/supabase.test.ts` 생성:

  ```typescript
  import { vi, describe, it, expect, beforeEach } from 'vitest';

  const mockUpload = vi.fn();
  const mockDownload = vi.fn();
  const mockRemove = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({
    upload: mockUpload,
    download: mockDownload,
    remove: mockRemove,
  });

  vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn().mockReturnValue({
      storage: { from: mockFrom },
    }),
  }));

  import { SupabaseStorage } from '../supabase';
  import { newAttachmentPath } from '../path';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  async function collectStream(s: ReadableStream<Uint8Array>): Promise<Buffer> {
    const reader = s.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { out.set(c, off); off += c.length; }
    return Buffer.from(out);
  }

  describe('SupabaseStorage', () => {
    it('save() calls upload with correct key, buffer, and mime', async () => {
      mockUpload.mockResolvedValue({ error: null });
      const storage = new SupabaseStorage();
      const key = newAttachmentPath('test.pdf');
      const body = Buffer.from('PDF bytes');

      await storage.save(key, body, 'application/pdf');

      expect(mockFrom).toHaveBeenCalledWith('attachments');
      expect(mockUpload).toHaveBeenCalledWith(
        key,
        body,
        { contentType: 'application/pdf', upsert: true },
      );
    });

    it('save() throws when upload returns an error', async () => {
      mockUpload.mockResolvedValue({ error: new Error('upload failed') });
      const storage = new SupabaseStorage();

      await expect(
        storage.save('any/key.pdf', Buffer.from('x'), 'application/pdf'),
      ).rejects.toThrow('upload failed');
    });

    it('read() returns a ReadableStream and correct byte size', async () => {
      const body = Buffer.from('hello supabase');
      mockDownload.mockResolvedValue({ data: new Blob([body]), error: null });
      const storage = new SupabaseStorage();
      const key = newAttachmentPath('hello.txt');

      const { stream, size } = await storage.read(key);

      expect(size).toBe(body.length);
      const got = await collectStream(stream);
      expect(got.equals(body as unknown as Uint8Array)).toBe(true);
    });

    it('read() throws when download returns an error', async () => {
      mockDownload.mockResolvedValue({ data: null, error: new Error('not found') });
      const storage = new SupabaseStorage();

      await expect(storage.read('missing/key.txt')).rejects.toThrow('not found');
    });

    it('delete() calls remove with key wrapped in array', async () => {
      mockRemove.mockResolvedValue({ data: [], error: null });
      const storage = new SupabaseStorage();
      const key = newAttachmentPath('bye.jpg');

      await storage.delete(key);

      expect(mockFrom).toHaveBeenCalledWith('attachments');
      expect(mockRemove).toHaveBeenCalledWith([key]);
    });
  });
  ```

- [ ] **Step 2: 테스트가 실패하는지 확인**

  ```bash
  pnpm test --project=unit-node lib/server/storage/__tests__/supabase.test.ts
  ```

  Expected: `Cannot find module '../supabase'` 또는 유사한 import 에러

- [ ] **Step 3: SupabaseStorage 구현**

  `lib/server/storage/supabase.ts` 생성:

  ```typescript
  import { createClient } from '@supabase/supabase-js';
  import type { Storage } from './local';

  const BUCKET = 'attachments';

  export class SupabaseStorage implements Storage {
    private sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    async save(key: string, buffer: Buffer, mime: string): Promise<void> {
      const { error } = await this.sb.storage
        .from(BUCKET)
        .upload(key, buffer, { contentType: mime, upsert: true });
      if (error) throw error;
    }

    async read(key: string): Promise<{ stream: ReadableStream<Uint8Array>; size: number }> {
      const { data, error } = await this.sb.storage.from(BUCKET).download(key);
      if (error) throw error;
      const buf = await data!.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      });
      return { stream, size: bytes.byteLength };
    }

    async delete(key: string): Promise<void> {
      const { error } = await this.sb.storage.from(BUCKET).remove([key]);
      if (error) throw error;
    }
  }
  ```

- [ ] **Step 4: 테스트 통과 확인**

  ```bash
  pnpm test --project=unit-node lib/server/storage/__tests__/supabase.test.ts
  ```

  Expected: 5개 테스트 모두 PASS

- [ ] **Step 5: 커밋**

  ```bash
  git add lib/server/storage/supabase.ts lib/server/storage/__tests__/supabase.test.ts
  git commit -m "feat: add SupabaseStorage implementing Storage interface"
  ```

---

## Task 4: Storage 팩토리에 STORAGE_BACKEND 분기 추가

**Files:**
- Modify: `lib/server/storage/index.ts:33-42`

- [ ] **Step 1: index.ts getStorage() 함수 수정**

  `lib/server/storage/index.ts` 의 `getStorage()` 함수를 아래로 교체:

  ```typescript
  export function getStorage(): Storage {
    if (!globalThis.__bidit_storage__) {
      if (process.env.STORAGE_BACKEND === 'supabase') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { SupabaseStorage } = require('./supabase') as typeof import('./supabase');
        globalThis.__bidit_storage__ = new SupabaseStorage();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { LocalStorage } = require('./local') as typeof import('./local');
        globalThis.__bidit_storage__ = new LocalStorage();
      }
    }
    return globalThis.__bidit_storage__;
  }
  ```

- [ ] **Step 2: 전체 스토리지 테스트 통과 확인**

  ```bash
  pnpm test --project=unit-node lib/server/storage/
  ```

  Expected: `local.test.ts` + `supabase.test.ts` + `permissions.test.ts` + `sniff.test.ts` 모두 PASS

- [ ] **Step 3: 커밋**

  ```bash
  git add lib/server/storage/index.ts
  git commit -m "feat: route getStorage() to SupabaseStorage when STORAGE_BACKEND=supabase"
  ```

---

## Task 5: vercel.json Cron 설정

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: vercel.json 생성**

  `/Users/yeonseong/project/bidit/vercel.json` 생성:

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

  > `* * * * *` = 매 분 실행. Vercel 무료 플랜 허용 범위(최소 1분 간격).  
  > `/api/cron/flush-outbox` 핸들러는 `CRON_SECRET` 헤더로 인증 보호 (기존 구현).

- [ ] **Step 2: 커밋**

  ```bash
  git add vercel.json
  git commit -m "chore: add Vercel Cron config for outbox flush"
  ```

---

## Task 6: Supabase DB 마이그레이션 실행

> 로컬 터미널에서 Supabase DB를 향해 마이그레이션 실행.  
> Task 1에서 메모한 `DATABASE_URL` (pooler URL, port 6543) 사용.

- [ ] **Step 1: `.env.local` 에 Supabase 환경변수 임시 설정**

  `.env.local` 파일 생성 (`.gitignore` 에 이미 포함됨):

  ```bash
  DATABASE_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  SUPABASE_URL=https://[ref].supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  AUTH_SECRET=[openssl rand -base64 32 결과]
  RESEND_API_KEY=re_...
  NTS_SERVICE_KEY=...
  NEXT_PUBLIC_BASE_URL=https://[vercel-domain].vercel.app
  CRON_SECRET=[openssl rand -base64 32 결과]
  STORAGE_BACKEND=supabase
  ```

- [ ] **Step 2: 마이그레이션 실행**

  ```bash
  pnpm db:migrate
  ```

  Expected: `✓ migration applied` 또는 유사 성공 메시지. Supabase 대시보드 → Table Editor에서 테이블 목록 확인.

- [ ] **Step 3: 빌드 확인**

  ```bash
  pnpm build
  ```

  Expected: 에러 없이 빌드 완료

---

## Task 7: Vercel 배포 수동 설정 (코드 없음)

- [ ] **Step 1: Vercel 프로젝트 생성**

  [vercel.com](https://vercel.com) → Add New → Project  
  → GitHub 레포 `bidit` 선택 → Import

- [ ] **Step 2: 빌드 설정 확인**

  - Framework Preset: **Next.js** (자동 감지)
  - Build Command: `pnpm build`
  - Install Command: `pnpm install`
  - Output Directory: `.next` (기본값)

- [ ] **Step 3: 환경변수 입력**

  Settings → Environment Variables 에서 아래 모두 추가:

  | Key | Value |
  |---|---|
  | `DATABASE_URL` | Supabase pooler URL (port 6543) |
  | `AUTH_SECRET` | `openssl rand -base64 32` 결과 |
  | `RESEND_API_KEY` | Resend 대시보드에서 복사 |
  | `NTS_SERVICE_KEY` | data.go.kr 서비스 키 |
  | `NEXT_PUBLIC_BASE_URL` | `https://[your-project].vercel.app` |
  | `CRON_SECRET` | `openssl rand -base64 32` 결과 |
  | `SUPABASE_URL` | `https://[ref].supabase.co` |
  | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 |
  | `STORAGE_BACKEND` | `supabase` |

- [ ] **Step 4: 첫 배포**

  Deploy 버튼 클릭 → 빌드 로그 확인 → 배포 URL 메모

- [ ] **Step 5: 스모크 테스트**

  배포 URL에서:
  1. `/login` 접속 → 로그인 화면 렌더링 확인
  2. 신규 가입 → 이메일 인증 → `/home` 진입 확인
  3. Supabase 대시보드 → Table Editor → `users` 테이블에 신규 행 확인

---

## Task 8: GitHub 자동 배포 검증

- [ ] **Step 1: 테스트 커밋 push**

  ```bash
  git push origin main
  ```

- [ ] **Step 2: Vercel 자동 배포 확인**

  Vercel 대시보드 → Deployments 탭에서 새 배포가 자동 시작되는지 확인  
  Expected: 2~3분 내 `Ready` 상태로 전환

- [ ] **Step 3: Cron 동작 확인**

  Vercel 대시보드 → Settings → Cron Jobs 탭에서  
  `/api/cron/flush-outbox` 가 등록됐는지 확인  
  (첫 실행은 다음 분에 자동 트리거)

---

## 주의사항 요약

| 항목 | 조치 |
|---|---|
| Supabase 7일 정지 | Supabase 대시보드 → 프로젝트 재활성화 (수동). 실 서비스 전환 시 Pro 업그레이드 |
| `.env.local` 보안 | Task 6 완료 후 `.env.local`을 `.gitignore`로 커밋되지 않음 확인 (`git status`로 점검) |
| SUPABASE_SERVICE_ROLE_KEY | 절대 클라이언트 컴포넌트나 `NEXT_PUBLIC_` prefix로 노출 금지 |
| Neon 미사용 | 현재 `postgres-js` 직접 연결 유지, Supabase pooler와 완전 호환 |
