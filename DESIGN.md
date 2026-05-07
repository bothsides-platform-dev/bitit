# bidit — 디자인 시스템

> 짝 문서: [SCREEN_DESIGN.md](./SCREEN_DESIGN.md) (화면·IA·UX) · [SPEC.md](./SPEC.md) (기술 스펙)
> 본 문서: 미적 방향, 디자인 토큰, 타이포그래피, 컬러, 컴포넌트 시각 원칙

---

## 1. 미적 방향 — *Korean Editorial Modernism*

B2B 견적은 신뢰·정밀·정형성이 핵심. 보랏빛 SaaS 그라데이션·둥근 모달·푸른 차트 등 **AI 생성물 클리셰를 의도적으로 회피**하고, 한국 편집물(잡지·신문)의 정형 미감을 차용한다.

**3대 원칙**
1. **종이 위의 잉크** — 따뜻한 오프화이트 종이톤 위에 거의 검정에 가까운 잉크. 그림자·그라데이션 최소화, 헤어라인이 구조를 만든다.
2. **수치는 활자** — 모든 금액·수량·날짜·견적번호는 모노스페이스 + `tabular-nums`. 숫자가 정렬되는 시각이 곧 신뢰의 시각이다.
3. **편집 마킹** — 섹션 시리얼(`01 / 14`), 이슈 번호(`№ 042`), 발행일 캡스 라인 등 **편집물의 메타 마킹**을 UI에 차용해 정보 위계를 강화한다.

**한 가지 기억점**: 모든 화면 어딘가에 **편집물 마킹**이 보인다. KPI 라벨 끝의 `A`/`B`/`C`, 견적번호 형식 `Q-2605-0042`, 상태의 브래킷 `[ 결재중 ]`. 이 작은 마킹이 누적되어 "다른 SaaS와 다르다"는 인상을 만든다.

**참고**: 시각적 영감은 *Wallpaper\* magazine* 그리드, *Financial Times* 데이터 테이블, *Werkplaats Typografie* 의 모노 사용, *나인하이어* 의 정보 밀도. 클리셰 회피 목록: 보라/파랑 그라데이션, 큰 둥근 모서리(>12px), 네온 강조, 일러스트형 빈 상태, 펄스 애니메이션, glassmorphism.

---

## 2. 컬러 토큰

```css
@theme {
  /* Ink — 텍스트와 거의 모든 라인 */
  --color-ink:        #0a0a0f;   /* 본문, 강조 */
  --color-ink-muted:  #5a5560;   /* 보조 텍스트 */
  --color-ink-soft:   #8c8690;   /* 메타, 캡션 */
  --color-ink-faint:  #b8b0a4;   /* 비활성 */

  /* Paper — 면 */
  --color-paper:      #faf7f0;   /* 메인 배경 (따뜻한 종이) */
  --color-paper-pure: #fefdf9;   /* 카드/표면 (살짝 더 밝음) */
  --color-paper-warm: #f3eddd;   /* 강조 면, 호버 배경 */

  /* Night — 사이드바 등 다크 면 */
  --color-night:      #0a0a0f;
  --color-night-2:    #14141b;

  /* Hairline — 1px 분할선 */
  --color-hair:        #ece5d2;
  --color-hair-strong: #c8c0ac;

  /* Accent — 1차 액션, 주요 강조 (청록 잉크) */
  --color-accent:      #1a3a52;
  --color-accent-deep: #0e2538;
  --color-accent-tint: #e0e6ea;

  /* Status — 자연 톤. 무지개색·네온 회피 */
  --color-amber:      #b97a25;   /* 발송됨, 주의 */
  --color-terracotta: #a8443a;   /* 실주, 만료, 경고 */
  --color-moss:       #4a6f3f;   /* 수주, 완료 */
  --color-lavender:   #6b5d7a;   /* 결재 진행 중 */
}
```

**사용 규칙**
- 1차 액션 버튼: 검정(`--color-ink`) 채움. 강조가 더 필요할 때만 `--color-accent`.
- 상태 색은 **텍스트 컬러로만** 사용 (브래킷 태그). 풀 배경은 KPI 칩·드로어 카드 등 1~2 곳에만.
- 그라데이션 사용 금지. 단, 견적 작성 화면 우측 PDF 미리보기 패널 배경에 **2점 라디얼 그라데이션 5% 투명도**로 종이의 미세한 톤 변화만 허용.

---

## 3. 타이포그래피

| 역할 | 폰트 | 비고 |
|---|---|---|
| 본문 | **Pretendard Variable** | 100~900 가변, 한글 가독성 + 라틴 일관성 |
| 디스플레이 | **Pretendard Variable Black (800~900)** + `letter-spacing: -0.034em` | 별도 디스플레이 폰트 없이 극단 웨이트 대비로 편집 느낌 |
| 수치/라벨 | **JetBrains Mono Variable** | 모든 숫자, 시리얼 마크, 시간 표기 |

**자체 호스팅** (`public/fonts/`) — `next/font/local` 로 로드, 외부 CDN 의존성 제거.

```css
@theme {
  --font-sans: 'Pretendard Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

**스케일** (px)

| 토큰 | 크기 | 용도 |
|---|---|---|
| `text-2xs` | 10 | 시리얼 마크, 캡션 |
| `text-xs` | 11 | 모노 라벨, 메타 |
| `text-sm` | 12 | 보조 텍스트 |
| `text-base` | 13 | 본문 (밀도 우선 영역) |
| `text-md` | 14 | 본문 표준 |
| `text-lg` | 16 | 카드 제목 |
| `text-xl` | 20 | 섹션 제목 |
| `text-2xl` | 26 | 페이지 부제 |
| `text-3xl` | 36 | 페이지 제목 |
| `text-4xl` | 52 | 인사말 (홈) |
| `text-display` | 84 | KPI 거대 숫자 |

**위계 패턴**
- 페이지 제목: 36px / 800 / `tracking: -0.034em`
- 인사말: 52px / 800 / 줄바꿈으로 두 줄 유도, 두번째 줄 일부에 `font-weight: 200`로 약화 → "안녕하세요, **이성연** _—_ 님."
- 섹션 시리얼: 11px 모노 / `letter-spacing: 0.18em` / `text-transform: uppercase` / `--color-ink-soft`
- KPI 숫자: 84px / **300 weight** / `letter-spacing: -0.04em` (가는 거대 숫자가 잡지 풀 인용구 느낌)
- 모노 라벨: 모든 모노 텍스트는 **항상** `letter-spacing: 0.16em` / `uppercase`
- 본문 한국어: `letter-spacing: -0.006em` (Pretendard 가독 최적)

---

## 4. 레이아웃 토큰

```css
@theme {
  /* Shell */
  --shell-sidebar: 68px;
  --shell-subnav:  244px;
  --shell-topbar:  60px;
  --content-max:   1440px;

  /* Spacing scale */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 20px; --s-6: 24px; --s-7: 32px; --s-8: 40px;
  --s-9: 56px; --s-10: 80px; --s-11: 120px;

  /* Radius — 작게 유지. >12px 회피 */
  --r-xs: 2px;  --r-sm: 3px;  --r: 5px;
  --r-md:  8px; --r-lg: 12px;

  /* Motion */
  --ease:     cubic-bezier(0.22, 0.72, 0.18, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --d-fast:   140ms;
  --d:        240ms;
  --d-slow:   420ms;
}
```

**그리드**: `sidebar(68) / subnav(244) / main` 3열, 상단 topbar(60) 고정. 홈은 subnav 없는 변형.

**Breakpoint**
- ≥ 1280px — 풀 그리드 (기본)
- 1024–1279 — Subnav collapse (햄버거)
- < 1024 — 작성·편집 화면은 데스크톱 권장 안내, 읽기 위주만 동작

---

## 5. 컴포넌트 시각 원칙

### 5.1 Tag (상태 표시)
브래킷 + 모노 + uppercase + 컬러 텍스트(풀 배경 X).
```
[ 결재중 ]   [ 발송됨 ]   [ 수주 ]
```
- 폰트: mono / 11px / `letter-spacing: 0.1em`
- 브래킷 `[ ]`: `opacity: 0.5`로 약화

### 5.2 DataTable (헤어라인 테이블)
- 행 사이 1px 헤어라인, 행 배경 X
- 호버 시 `--color-paper-warm` 배경 + **첫 셀 좌측에 8px 검정 마커** 등장 (편집물의 마진 마킹 차용)
- 헤더: mono / uppercase / 11px / `--color-ink-soft`
- 숫자 셀: mono / `tabular-nums` / 우정렬

### 5.3 KPI (거대 숫자 칩)
- 숫자 84px / weight 300 (가늘게)
- 라벨은 상단에 mono uppercase
- 라벨 우측에 시리얼 `A` / `B` / `C` (편집 마킹)
- 델타: `↑` / `↓` / `—` 부호 + mono

### 5.4 Greeting (홈 인사말)
- 두 줄 강제. 두번째 줄에 emdash 한 글자만 `font-weight: 200`로 약화
- 좌측 byline: mono uppercase + 우측 끝까지 헤어라인 (편집물 머리띠)

### 5.5 Sidebar (다크)
- 배경 `--color-night`, 텍스트 `--color-paper`
- 활성 항목: 좌측 2px 인디케이터 — **앰버 컬러** (잉크 위에 한 점의 색)
- 하단에 세로 글자로 `v0 · 2026` 인쇄 마킹

### 5.6 Empty State
- 일러스트 사용 X. 단순 라인 SVG 아이콘만
- 본문 카피 + CTA 버튼 1개

### 5.7 PDF Preview (작성 화면 우측)
- A4 비율 (1 : 1.414), `--color-paper-pure` 배경
- **유일하게 그림자 허용**: `0 1px 3px rgba(15,15,20,0.04), 0 20px 60px -10px rgba(15,15,20,0.18)` — 종이가 떠 있는 느낌
- 패널 배경에 2점 라디얼 그라데이션 5% (종이의 미세 톤)
- 견적서 본문은 헤더 아래 **2px 검정 라인** 으로 분리 (신문 헤더 차용)

### 5.8 Form Section
- 카드 박스 X. **헤어라인 분할** 만 사용
- 섹션 헤드: 시리얼 + 제목 → "01 거래처"
- 입력 필드: `border: 0; border-bottom: 1px solid var(--color-hair-strong)` — 종이 양식 차용
- 포커스: 하단 라인이 `--color-ink` 로 두꺼워짐

### 5.9 Notification Drawer
- 우측 슬라이드, 폭 420
- 진입 모션: `translateX(100%) → 0`, `--d-slow` `--ease-out`
- 빈 상태: 봉투 라인 SVG + "새로운 알림이 없습니다."

### 5.10 Command Palette (⌘K)
- 모달, 폭 620, 12vh top
- 배경 오버레이: `rgba(10,10,15,0.4)` + `backdrop-filter: blur(4px)`
- 그룹 헤더: mono uppercase
- 결과 메타(우측): mono — 단축키나 `12 견적` 같은 카운트

### 5.11 Auth 화면 (Public 영역)
인증 영역(P1~P11)의 시각 규칙. 모든 화면은 SCREEN_DESIGN §11.5 의 명세에 따른다.

- **레이아웃**: 단일 컬럼 max-w 380~420, 화면 중앙 배치, 상하단 여백 `--s-11`
- **헤더**: 좌상단 워드마크 `B  BIDIT` + 우상단 serial `EDITION 01 · v0`
- **카드 박스 사용 X** — 헤어라인 외곽 + 패딩 `--s-7` 만 사용 (종이 양식 차용)
- **입력 필드**: §5.8 Form Section 패턴 그대로 — `border: 0; border-bottom: 1px solid var(--color-hair-strong)`, 포커스 시 하단 라인 `--color-ink` 두꺼워짐
- **진행 표시**: 모노 시리얼 마크 `01 / 03 — EMAIL` (uppercase, `letter-spacing: 0.16em`, `--color-ink-soft`)
- **비밀번호 강도 인디케이터**: 4칸 헤어라인 채움
  - 1칸: `--color-terracotta` (약함)
  - 2칸: `--color-amber` (보통)
  - 3칸: `--color-lavender` (양호)
  - 4칸: `--color-moss` (강함)
  - 트랜지션 `--d-fast` `--ease`
- **비밀번호 정책 캡션**: mono uppercase — `MIN 10 · A-Z · 0-9 · !@#`
- **에러 메시지**: 인라인 캡션, mono uppercase, `--color-terracotta`
- **재발송 카운트다운**: mono `재발송 (00:60)` 형식, 시간은 `tabular-nums`
- **안내 화면 일러스트**: 봉투(P3·P7) / 체크(P8 완료) 라인 SVG (1.4 stroke) 만 — 색이 들어간 일러스트 금지
- **CTA 버튼**: 1차 액션은 full-width, 검정 채움 (`--color-ink`)
- **링크 위계**: 보조 액션은 `--color-ink-muted`, 호버 시 `--color-ink`, 밑줄 X

---

## 6. 모션

**원칙**: 서너 곳의 큰 모션 + 어디에도 없는 마이크로 인터랙션. 펄스·바운스·스피너 애니메이션은 사용하지 않는다.

| 위치 | 모션 | 듀레이션 / 이징 |
|---|---|---|
| 페이지 진입 | 위젯 stagger rise (8px ↑ / opacity) | 420ms / `ease-out`, 60ms 간격 |
| Drawer 진입 | translateX 슬라이드 | 420ms / `ease-out` |
| Cmdk 진입 | scale 0.96 → 1 + opacity | 240ms / `ease-out` |
| 호버 (chip/btn) | 색·배경 트랜지션 | 140ms / `ease` |
| 테이블 행 호버 | 좌측 마커 등장 | 140ms / `ease` |
| PDF 미리보기 동기화 | 좌측 입력 → 우측 반영 디바운스 | 300ms |

**금지**: rotate 스피너, 펄스 닷, parallax, 컬러 그라데이션 트랜지션, 큰 라디우스 morph.

---

## 7. 아이콘

- 자체 SVG 컴포넌트, **선형 1.4 stroke**, 20×20 또는 16×16
- 모서리 라운드: `stroke-linecap: round`, `stroke-linejoin: round`
- 채움 X (단, 활성 사이드바 인디케이터·태그 닷 같은 미세 요소는 채움)
- 아이콘 라이브러리(lucide 등) 직접 import 금지 — 시각 통일을 위해 모두 직접 그린다.

---

## 8. 접근성

- 명도 대비 WCAG AA 이상 (본문 7:1, 보조 4.5:1)
- 포커스 링: `outline: 2px solid var(--color-ink)`, `outline-offset: 2px`. 보랏빛 OS 기본 링 회피
- 모든 인터랙티브 요소 키보드 진입 가능 (`Tab`)
- 모노 텍스트의 letter-spacing 은 가독성을 해치지 않는 0.1~0.18em 범위 내
- 한국어 줄바꿈은 의미 단위로 `<br/>` 강제 (인사말, 공지 헤드라인 등 큰 텍스트만)

---

## 9. 클리셰 금지 목록

| 금지 | 이유 |
|---|---|
| Inter / Roboto / Arial | 한국어 부재 + AI 생성물 시그니처 |
| 보라(#7C3AED) → 파랑(#3B82F6) 그라데이션 | 모든 SaaS의 기본값 |
| 큰 둥근 모서리 (16px+) | "AI 카드" 룩 |
| 일러스트형 빈 상태 | 비용 + 톤 분산 |
| 펄스/스피너 로딩 인디케이터 | 노이즈, 모노 `LOADING…` 으로 대체 |
| Glassmorphism (`backdrop-filter` 강함) | 가독성 저하, 트렌드 꼬리 |
| 네온 그린/시안 강조 | 자연 톤 원칙 위배 |
| 모달 풀 스크린 인터스티셜 | 작업 중단, 결재 모달처럼 사이드 슬라이드 선호 |

---

## 10. PG 견적 비교 도메인 규칙

본 섹션은 PG 견적 비교라는 도메인 특성을 시각 시스템에 고정하기 위한 운영 규칙이다. 공통 미감은 앞선 섹션을 따르고, 이 섹션은 비교·검토·결재 흐름에 필요한 정보 설계를 정의한다.

### 10.1 제품 원칙 (Domain Lens)

1. **Trust** — 숫자는 흔들리지 않게 보인다.  
   금액·수수료·기간·정산주기·수량은 항상 같은 규칙(모노, 우정렬, 단위 분리)으로 렌더링한다.
2. **Comparability** — 한 화면에서 비교가 끝난다.  
   공급사별 핵심 조건이 같은 축으로 배치되어 스크롤 없이 1차 판단이 가능해야 한다.
3. **Auditability** — 결론의 근거가 추적된다.  
   "왜 이 공급사를 선택했는지"를 구성 항목, 가정값, 타임라인으로 되돌아볼 수 있어야 한다.
4. **Actionability** — 비교 다음 행동이 즉시 이어진다.  
   요청·결재·확정 액션은 비교 UI와 분리하지 않고 인접 배치한다.

### 10.2 상태 색 의미 고정

상태 색은 프로젝트 전역에서 의미를 바꾸지 않는다.

- `--color-moss`: 유리/확정/완료
- `--color-amber`: 검토 필요/주의
- `--color-terracotta`: 불리/만료/차단
- `--color-lavender`: 결재 진행/대기

규칙:
- 상태 표현은 기본적으로 **텍스트 + 브래킷 태그**로 처리한다.
- 상태색 풀 배경은 요약 칩, 경고 배너 등 제한된 영역에서만 사용한다.
- "위험"을 의미하지 않는 정보성 강조에는 상태색을 사용하지 않는다.

### 10.3 숫자·단위 표기 규칙

- 금액: `1,234,567원` (천단위 콤마 필수)
- 비율: `2.15%` (소수 자릿수는 화면별 고정)
- 건수: `12,450건`
- 월 추정치: `월 3,420,000원`
- 모든 숫자 필드는 `font-mono + tabular-nums + right-align`
- 단위(원, %, 건, 일)는 숫자와 시각적으로 분리된 컬럼 또는 suffix 스타일로 고정

### 10.4 도메인 전용 컴포넌트

1. **Quote Comparison Matrix**  
   공급사별 핵심 항목(수수료, 정산주기, 지원 결제수단, 계약 조건)을 같은 행/열 축으로 비교.
2. **Fee Breakdown Waterfall**  
   기준 매출에서 항목별 공제를 거쳐 실수령/총비용으로 이어지는 흐름을 시각화.
3. **Scenario Toggle**  
   월 거래액·객단가·환불률 등의 가정을 바꿔 비교 결과를 즉시 재계산.
4. **Confidence Badge**  
   견적 최신성, 입력 완결성, 확인 주체를 기반으로 신뢰도를 노출.
5. **Decision Timeline**  
   요청 → 수신 → 내부 검토 → 결재 → 확정의 이력을 시간순으로 기록.
6. **Constraint Chips**  
   "해외결제 필수", "D+2 정산 필수" 같은 하드 조건 미충족 항목을 즉시 표기.

### 10.5 차트 사용 규칙

차트는 표를 대체하지 않고 보조한다.

- 허용 차트: 막대(비교), 워터폴(구성), 라인(추세)
- 금지 차트: 파이, 3D, 강한 그라데이션 차트, 장식형 모션 차트
- 모든 차트는 축/단위/기준 시점/가정값을 명시한다.
- 금액 비교의 최종 판단 UI는 반드시 테이블에도 동일 데이터가 존재해야 한다.

### 10.6 의사결정 UX 규칙

- 비교 화면에서 주요 CTA(요청/결재/확정)를 숨긴 2단계 이동 구조를 피한다.
- "최저 비용"과 "운영 리스크"를 동시에 보여 단일 지표 오판을 줄인다.
- 선택 근거는 최소 2개 이상(예: 총비용 + 정산주기) 노출한다.
- 견적 만료/갱신 필요 시점은 경고 색 + 날짜 텍스트를 함께 사용한다.

### 10.7 QA 체크리스트 (출시 전)

- [ ] 상태 색 의미가 화면마다 뒤바뀌지 않는가
- [ ] 숫자 열이 모두 모노 + 우정렬 + tabular-nums 인가
- [ ] 비교 화면에서 1차 의사결정이 스크롤 과다 없이 가능한가
- [ ] 차트 수치와 테이블 수치가 일치하는가
- [ ] 결론(추천/선택)에 대한 근거가 화면에 남아 있는가
- [ ] 편집물 마킹(시리얼/번호/브래킷)이 주요 화면에 유지되는가

---

## 11. 변경 이력

- 2026-05-05 v0.1 — 초안. Korean Editorial Modernism 방향 확정, 토큰·타이포·컴포넌트 원칙 정리.
- 2026-05-05 v0.2 — PG 견적 비교 도메인 규칙 추가(비교·감사·결재 중심), 숫자/상태/차트/QA 운영 기준 명시.
