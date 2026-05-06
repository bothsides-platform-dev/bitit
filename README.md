# bidit

PG(결제대행사) 1:N 비공개 RFQ 플랫폼. 자세한 도메인·디자인·기술 스펙은 [`PG_RFQ_SPEC.md`](./PG_RFQ_SPEC.md) → [`SCREEN_DESIGN.md`](./SCREEN_DESIGN.md) → [`DESIGN.md`](./DESIGN.md) → [`SPEC.md`](./SPEC.md) → [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) 순으로 읽는다.

---

## 요구사항

- **Node.js** 20+
- **pnpm** 9+ (`corepack enable` 또는 `npm i -g pnpm`)
- **Docker** (로컬 Postgres 컨테이너용)

## 1. 의존성 설치

```bash
pnpm install
```

## 2. 환경 변수

`.env.example` 을 `.env.local` 로 복사한 뒤 비어 있는 값을 채운다.

```bash
cp .env.example .env.local
```

| 키 | 용도 | 비고 |
|---|---|---|
| `DATABASE_URL` | 런타임 Postgres 연결 | 기본값 그대로 두면 docker compose `pg` 서비스에 연결됨 |
| `DATABASE_URL_TEST` | 통합 테스트용 Postgres | docker compose `pg-test` 프로필 사용 시 |
| `AUTH_SECRET` | Auth.js v5 JWT 서명 | `openssl rand -base64 32` 로 생성 |
| `RESEND_API_KEY` | 트랜잭셔널 이메일 발송 | Resend 대시보드에서 발급 |
| `NTS_SERVICE_KEY` | 국세청 사업자등록 조회 | data.go.kr 에서 발급 |
| `NEXT_PUBLIC_BASE_URL` | 이메일/리디렉션 절대 URL | 로컬은 `http://localhost:3000` |
| `CRON_SECRET` | 크론 라우트 보호 (outbox flush 등) | 임의 문자열 |
| `UPLOAD_DIR` | 로컬 파일 업로드 경로 | 기본 `./uploads` |

> 외부 키(`RESEND_API_KEY`, `NTS_SERVICE_KEY`) 가 비어 있어도 개발 서버는 뜨지만, 메일 발송·사업자번호 enrichment 흐름은 동작하지 않는다.

## 3. Postgres 기동

```bash
docker compose up -d pg
```

기동 확인:

```bash
docker compose ps
```

## 4. 데이터베이스 마이그레이션 + 시드

```bash
pnpm db:migrate   # drizzle/0000_*.sql 적용
pnpm db:seed      # scripts/seed.ts — 테스트 워크스페이스/사용자/RFQ 시드
```

스키마를 직접 보고 싶으면:

```bash
pnpm db:studio    # https://local.drizzle.studio
```

## 5. 개발 서버

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속. 비로그인 상태면 `/login` 으로 리디렉션된다. 시드된 계정 정보는 `scripts/seed.ts` 참고.

## 6. 테스트

```bash
pnpm test            # Vitest 단위/계약 테스트
pnpm test:watch      # 워치 모드
pnpm e2e             # Playwright E2E (사전: pnpm dlx playwright install --with-deps chromium)
pnpm lint            # ESLint
```

DB 가 필요한 통합 테스트는 별도 컨테이너를 사용한다:

```bash
docker compose --profile test up -d pg-test
```

## 7. 프로덕션 빌드

```bash
pnpm build
pnpm start           # 기본 포트 3000
```

## 8. 자주 쓰는 작업

| 명령 | 설명 |
|---|---|
| `pnpm db:generate` | 스키마 변경 후 새 마이그레이션 SQL 생성 |
| `pnpm db:push` | 스키마를 마이그레이션 없이 즉시 푸시 (dev 전용) |
| `docker compose down -v` | DB 볼륨까지 초기화 (시드부터 다시) |

## 트러블슈팅

- **`AUTH_SECRET` 미설정**: Auth.js 가 부팅하지 못한다. `.env.local` 에 값을 넣고 dev 서버 재시작.
- **포트 5432 점유 중**: 로컬에 다른 Postgres 가 떠 있다. `docker compose.yml` 의 포트 매핑을 변경하거나 기존 인스턴스를 정리.
- **마이그레이션 실패**: `docker compose down -v` 로 볼륨을 비운 뒤 `pnpm db:migrate` 재실행.
- **이메일이 안 옴**: `RESEND_API_KEY` 미설정 또는 outbox flush 가 안 도는 경우. `pnpm db:studio` 로 `outbox` 테이블 확인 후 `/api/cron/flush-outbox` 호출 (헤더 `x-cron-secret: $CRON_SECRET`).
