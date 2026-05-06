// Shared helpers for the 7 buyer-side RFQ actions.
//
// - `actionDb()`/`baseUrl()`는 auth/_shared.ts 의 것을 그대로 재사용 (재정의
//   없음 — 한 군데에서만 관리). Auth 액션과 동일한 testdb 핸들 override가
//   적용되도록 단일 globalThis 키 (`__bidit_action_db_override__`) 로 통일.
// - `devLogRfqInviteLink`만 신규 — Step 5의 `devLogVerifyLink` 패턴을 invite
//   링크용으로 재사용. NODE_ENV=='development' && !RESEND_API_KEY 조건에서만
//   `[DEV rfq-invite] {URL} (to: {email})`을 console.log. Step 10 시점에 한 줄
//   삭제.

export { actionDb, baseUrl } from '../auth/_shared';

// `T` defaults to {} so callers without payload can write `RfqActionResult`.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type RfqActionResult<T extends object = {}> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export function devLogRfqInviteLink(url: string, email: string): void {
  if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
    console.log(`[DEV rfq-invite] ${url}  (to: ${email})`);
  }
}
