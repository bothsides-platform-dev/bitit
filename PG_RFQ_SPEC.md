# bidit · PG 비공개 RFQ 플랫폼 — Design Spec (v0)

> **피벗 노트**: 본 spec 은 기존 일반 B2B 견적 시스템(`SCREEN_DESIGN.md`·`DESIGN.md`·`SPEC.md`·`IMPLEMENTATION.md`)에서 **PG(결제대행사) 도메인 특화**로 좁힌 v0 디자인. 일반 시스템의 IA·디자인 시스템·인증 흐름은 베이스로 유지되되, 도메인 객체·핵심 시나리오·결재 흐름은 본 spec 으로 대체된다.

> 짝 문서: [SCREEN_DESIGN.md](./SCREEN_DESIGN.md) · [DESIGN.md](./DESIGN.md) · [SPEC.md](./SPEC.md) · [IMPLEMENTATION.md](./IMPLEMENTATION.md)

---

## 1. 한 줄 요약

**bidit** 은 구매사가 사업자번호 한 번으로 자동 enrichment 된 RFQ 를 작성해 본인이 허용한 PG 들에게 이메일로 발송하고, PG 는 가입 강제 워크스페이스 안에서 정형 견적을 제출하며, 구매사는 6개 정형 수치 + PDF 첨부로 비교한 뒤 선택하는 **비공개 1:N RFQ 플랫폼**이다.

마켓플레이스가 아니라 **이메일 기반 비공개 입찰** — 구매사가 이미 아는 PG 영업담당에게만 RFQ 가 도달하고, PG 들은 서로의 존재를 모른다.

---

## 2. 핵심 사용자

| 사용자 | 워크스페이스 | 핵심 액션 |
|---|---|---|
| 구매사 (영업·재무·대표) | `buyer` 영구 | RFQ 작성·발송·비교·계약. 연간 누적·재계약 관리 |
| PG 영업담당 | `pg` 도메인 자동 통합 (`@toss.im` → 토스페이먼츠) | RFQ 수신 → 견적 작성 → 제출 |

v0 결재선 양측 모두 적용 X — 단일 결정자.

---

## 3. 15개 확정 정책 (브레인스토밍 결과)

| # | 결정 |
|---|---|
| 1 | 사용자 = PG영업담당 + 구매사 양면 |
| 2 | 구조 = 1:N **비공개** 입찰 (마켓플레이스 X) |
| 3 | RFQ 정형성 = **자유서술** + 사업자번호 자동 enrichment |
| 4 | 사업자번호 자동 조회 시점 = RFQ 작성 진입 시 (국세청 L1·공정위 L4 무료, NICE L3 동의 시) |
| 5 | 가맹점 등급 = **카드 우대수수료 등급** (영세/중소1·2·3/일반) |
| 6 | 등급 조회 = NICE 추정 매출 기반 자동 + 구매사 확인/수정 |
| 7 | 매칭 = 구매사가 **이메일로 허용**한 PG 에게만 |
| 8 | RFQ 별 **고유 URL + 토큰** (메일 임베드, 견적 제출용) |
| 9 | PG 진입 = **가입 강제** (PG 워크스페이스 안에서 견적 작성) |
| 10 | 익명 정책 = **완전 비공개** (PG 는 경쟁자 존재를 모름) |
| 11 | PG 워크스페이스 정체성 = **이메일 도메인** (자동 라우팅). 단, RFQ 접근권은 v0에서 초대 이메일/수락 사용자 단위로 제한 |
| 12 | PG 응답 = 자유 PDF + **6개 정형 수치** (등급별 셋) |
| 13 | 구매사 워크스페이스 = **영구** |
| 14 | 수익 모델 = v0 미결정 (풀 우선) |
| 15 | 결재선 = v0 양측 모두 미적용 |

---

## 4. 도메인 모델

### 4.1 핵심 객체

```ts
type Workspace = {
  id: string;
  type: 'buyer' | 'pg';
  name: string;
  domain?: string;                // pg 만. 이메일 도메인 (toss.im, inicis.com)
  bizProfile?: BizProfile;        // buyer 의 사업자정보
  members: User[];
  createdAt: string;
};

type BizProfile = {
  bizNo: string;                  // 123-45-67890
  name: string;                   // (주)노온
  ceoName: string;
  ksic: string;                   // J62 소프트웨어 개발
  taxType: 'general' | 'simple' | 'exempt';
  status: 'active' | 'suspended' | 'closed';
  mailOrderNo?: string;           // 통신판매업 신고번호 (공정위)
  // NICE 추정 (L3, 옵션)
  estimatedRevenue?: number;
  revenueYear?: string;
  niceLookedUpAt?: string;
  // 등급 (카드 우대수수료)
  grade?: 'small' | 'sme1' | 'sme2' | 'sme3' | 'general';
  gradeSource: 'auto_nice' | 'user_confirmed' | 'user_overridden';
  gradeConfirmedBy?: string;
  gradeConfirmedAt?: string;
};

type RFQ = {
  id: string;                     // RFQ-2605-0001
  buyerWsId: string;
  bizProfile: BizProfile;         // 발송 시점 스냅샷
  title: string;
  memo: string;                   // 자유 서술 RFP
  rfpFiles: Attachment[];
  allowedPgEmails: string[];      // 구매사가 직접 입력
  deadline: string;
  status: 'draft' | 'sent' | 'closed' | 'cancelled' | 'awarded';
  awardedBidId?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
};

type Invitation = {
  id: string;
  rfqId: string;
  pgEmail: string;
  pgWsId?: string;                // PG 가입/매칭 후 채워짐
  acceptedByUserId?: string;       // v0 RFQ 접근 권한 주체
  uniqueToken: string;            // URL 임베드 (≥32 byte)
  sentAt: string;
  openedAt?: string;
  expiresAt: string;              // = RFQ.deadline
  status: 'sent' | 'opened' | 'accepted' | 'declined' | 'expired';
};

type Bid = {
  id: string;
  rfqId: string;
  pgWsId: string;
  invitationId: string;
  // 등급별 정형 6필드 (영세/중소 공통)
  settleCycle: 'D+0' | 'D+1' | 'D+2' | 'weekly' | 'monthly';
  deposit: number;
  setupFee: number;
  monthlyMin: number;
  bankTransferFeePct: number;
  easyPayFeePct: number;
  // 일반등급 추가 (옵션)
  cardFeesByIssuer?: Record<'BC'|'SHINHAN'|'SAMSUNG'|'HYUNDAI'|'KB'|'LOTTE'|'NH'|'HANA'|'WOORI', number>;
  overseasCardFeePct?: number;
  proposalPdf: Attachment;
  memo?: string;
  status: 'draft' | 'submitted' | 'withdrawn';
  submittedBy: string;
  submittedAt?: string;
};

type Contract = {
  id: string;
  rfqId: string;
  bidId: string;
  awardedAt: string;
  awardedBy: string;
};
```

### 4.2 카드 우대수수료 (자동 표시, PG 입력 불필요)

```ts
const STATUTORY_CARD_FEE: Record<Grade, number> = {
  small:   0.005,   // 영세 (≤3억)
  sme1:    0.011,   // 중소1 (3~5억)
  sme2:    0.0125,  // 중소2 (5~10억)
  sme3:    0.015,   // 중소3 (10~30억)
  general: NaN,     // 일반 — PG 가 카드사별 입력
};
```

---

## 5. 화면 IA

### 5.1 공통 (인증/온보딩)

| # | 라우트 | 역할 |
|---|---|---|
| C1 | `/login` | 이메일+비밀번호 |
| C2 | `/signup` | 이메일 인증 → 프로필 → **워크스페이스 선택** (구매사 신규 / PG 신규 / 초대 합류) |
| C3 | `/invite/rfq/:token` | RFQ 초대 메일 링크 진입점. 토큰 검증 → 가입/로그인 → 도메인 자동 라우팅 → RFQ 수신함 |
| C4 | `/logout` | |

### 5.2 구매사 워크스페이스

| # | 라우트 | 역할 |
|---|---|---|
| B1 | `/home` | 대시보드 — 진행 중 RFQ 카운트, 임박 마감, 받은 견적, 최근 활동 |
| B2 | `/rfq` | 전체 RFQ (탭: 작성중 / 진행중 / 마감 / 계약완료) |
| B3 | `/rfq/new` | **RFQ 작성** — ① 사업자번호 자동조회 ② NICE 등급 추정·확인 ③ 자유 메모·RFP 첨부 ④ PG 이메일 입력 ⑤ 마감일·발송 |
| B4 | `/rfq/:id` | **RFQ 상세 + 받은 견적 비교** — 좌: RFQ 메타·발송 PG 상태 / 우: 6컬럼 비교표 + PDF 라이브 프리뷰 |
| B5 | `/rfq/:id/award` | 수주 처리 — Bid 선택 → 미선택 PG 자동 통보 |
| B6 | `/settings/profile` | 사업자 프로필 (등급 갱신 알림) |
| B7 | `/settings/members` | 워크스페이스 멤버 |

### 5.3 PG 워크스페이스

| # | 라우트 | 역할 |
|---|---|---|
| P1 | `/home` | 대시보드 — 신규 RFQ·임박 마감·제출 완료·수주율 |
| P2 | `/inbox` | **받은 RFQ 함** (탭: 신규 / 작성중 / 제출완료 / 마감) |
| P3 | `/inbox/:rfqId` | **RFQ 상세 + 견적 작성** — 상단: 구매사 메타·등급·RFP. 하단: 등급별 정형 폼(영세/중소 6필드, 일반 +카드사 9개). 법정 카드수수료는 자동 표시. |
| P4 | `/inbox/:rfqId/submitted` | 제출 완료·결과 대기 |
| P5 | `/settings/profile` | PG 회사 정보 (도메인 검증·로고) |
| P6 | `/settings/members` | 같은 도메인 멤버 |

---

## 6. 핵심 사용자 시나리오 (v0 검증)

### 시나리오 A — 구매사 RFQ 발송
1. `/rfq/new` 진입
2. 사업자번호 `123-45-67890` 입력 → 0.5초 안에 회사명·업종·통신판매업 자동 채움
3. NICE 신용조회 동의 → 추정 연매출 8.2억 → "중소2 맞나요?" → 확인
4. 제목 `2026 결제 인프라 견적`, 자유 메모·RFP PDF 첨부
5. PG 이메일 입력: `sales@toss.im`, `biz@inicis.com`, `partner@nicepay.co.kr`
6. 마감 D+7 → 발송
7. 3개 PG 메일 발송 + RFQ 상태 → `진행중`

### 시나리오 B — PG 견적 응답
1. 토스 영업담당 메일함: `노온 → 토스페이먼츠 RFQ #abc123` 수신
2. [수락·견적 작성] → 토큰 검증 → `/login` (next 보존)
3. 가입 (`sales@toss.im`) → `@toss.im` 도메인 PG 워크스페이스 자동 합류
4. `/inbox/abc123` 자동 이동
5. 구매사 메타 확인 (등급 중소2 자동표시) → 정형 폼:
   - 카드 1.25% (자동, 수정 불가)
   - 정산 D+1 / 보증금 0 / 셋업비 0 / 월최저 0 / 계좌 1.5% / 간편결제 1.8%
6. 제안서 PDF + 메모 → [제출] → 구매사 알림

### 시나리오 C — 구매사 비교·계약
1. `/rfq/abc123` → 받은 Bid 3개 비교표
2. 6컬럼 정렬 (정산↑) + 각 행 PDF 라이브 프리뷰
3. 토스 Bid 선택 → [수주 처리]
4. 토스에 "수주 확정" 메일, 미선택 2곳에 "이번엔 다른 PG 선택" 메일
5. RFQ 상태 → `계약완료`, Contract 레코드 생성

---

## 7. 디테일 정책 (default — 사용자 리뷰에서 조정)

| 항목 | v0 기본 정책 |
|---|---|
| **토큰 유효기간** | RFQ 마감일까지. 마감 후 자동 만료. 다회 접근 가능. |
| **토큰 1회용 여부** | 1회 인증 후 `Invitation.acceptedByUserId` 가 RFQ 접근 권한이 됨. PG 워크스페이스는 인증/소속 컨테이너이며, 같은 도메인의 다른 멤버가 자동으로 해당 RFQ를 볼 수는 없음. |
| **RFQ 수정** | 발송 후 메모·첨부 수정 가능, PG 에 "RFQ 변경됨" 알림. 마감일 연장 가능. PG 이메일 추가만 가능 (제거 불가). |
| **RFQ 취소** | 가능. 발송된 PG 에 취소 알림. 받은 Bid 는 보관. |
| **재발송** | 동일 PG 이메일에 재발송 불가 (수정·연장으로 처리). |
| **Bid 수정** | 제출 후 마감 전까지 1회 철회·재제출 가능. 구매사 알림. |
| **알림 채널** | 이메일 + 인앱 (탑바 종 알림). v0 SMS·슬랙 미지원. |
| **계약서 서명** | v0 미지원 — 단순 "수주 마킹". 실 계약은 오프라인. |
| **수익 모델** | v0 미정. 데이터 모델은 향후 PG 구독·성사 수수료 모두 수용 가능하게 설계. |
| **권한** | 워크스페이스 관리자(첫 가입자) / 멤버. v0 두 단계만. |

---

## 8. 기존 4개 프로젝트 문서와의 관계

본 spec 승인 후 다음과 같이 분배 반영:

| 파일 | 변경 |
|---|---|
| `SCREEN_DESIGN.md` | **§0 도메인 컨텍스트(PG 특화)** 추가, §3 화면 명세를 본 §5 IA 로 교체. 기존 결재선·캘린더·템플릿은 v0 범위 외로 마킹. §11.5 인증/가입은 유지하되 워크스페이스 선택 단계(C2)에 buyer/pg 분기 추가. |
| `DESIGN.md` | Korean Editorial Modernism 디자인 시스템 그대로 유지. PG 도메인 특수 컴포넌트(BizLookupField, GradeBadge, CardFeeMatrix, BidComparisonTable, A4PdfPreview) 만 §5 컴포넌트 사양에 추가. |
| `SPEC.md` | §5 도메인 타입을 본 §4 로 교체. §3 디렉토리 구조에 `app/(app)/rfq/`·`app/(app)/inbox/` 추가, 기존 `quote/`·`account/`·`approval/` 는 archive. lib/types 에 `bizProfile.ts`, `rfq.ts`, `bid.ts`, `invitation.ts` 추가. |
| `IMPLEMENTATION.md` | M0~M1.5 유지, M2 이후 마일스톤을 본 spec 의 화면 IA 로 재정렬. 새 마일스톤: M2(구매사 RFQ 작성), M3(PG 수신·응답), M4(비교 화면), M5(수주 처리). |

---

## 9. v0 범위 외 (의도적 제외)

- 결재선 (양측 모두 미적용)
- 정산·매출 추적
- 계약서 전자서명
- 결제 연동 (수수료 정산·구독)
- SMS·슬랙·카카오워크 알림
- 모바일 앱
- 영문/일문 i18n
- PG 의 응답 자동 채움 (이전 견적 복제 등)
- 구매사의 입찰 자동 연장·재공고
- 마켓플레이스 발견성·평가·리뷰

---

## 10. 다음 단계

본 spec 승인 시:
1. 본 spec 을 4개 프로젝트 md 파일에 분배 반영 (§8)
2. 구현 계획 작성: 마일스톤 M2~M5 의 PR 단위·태스크·검증 체크리스트
3. M0 부트스트랩 → M1 AppShell → M1.5 인증 → M2(RFQ 작성) → M3(PG 수신/응답) → M4(비교) → M5(수주) 순으로 빌드

---

## 11. 변경 이력

- 2026-05-05 v0.1 — 일반 B2B 견적 시스템 초안.
- 2026-05-05 v0.2 — 인증/가입 §11 추가.
- 2026-05-05 v0.3 — **PG 특화로 피벗**. 15개 정책 확정. 본 spec 으로 분리. v0 범위 압축.
