# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository State

**Pre-bootstrap.** No code yet — 5 design/spec markdown documents only. Next.js 16 project will be scaffolded into the same directory at M0 (see IMPLEMENTATION.md §2.1). Until then, every "implementation" task is a documentation task: edit the relevant md files, do not create stray files.

## Document Hierarchy (read in this order to gain context)

1. **PG_RFQ_SPEC.md** — Product spec (v0). The most authoritative document. 15 policy decisions, domain model, screen IA, scenarios. **Read this first.** This is the result of a brainstorming pivot from the original generic B2B quotation system to a **PG (Korean Payment Gateway) -focused private 1:N RFQ platform**.
2. **SCREEN_DESIGN.md** — Screens, IA, UX flows. Includes §11.5 email auth (P1~P11). Some sections (결재선·캘린더·템플릿) are now v0-out-of-scope per the PG pivot but kept as architectural reference.
3. **DESIGN.md** — Design system (*Korean Editorial Modernism*). Tokens, typography, color, component visual rules, motion, anti-clichés. **Single source of truth for visual decisions** — `styles/tokens.css` syncs from here unidirectionally.
4. **SPEC.md** — Tech spec. Stack, directory layout, domain TypeScript types, App Router strategy, public-vs-app route groups, middleware guard.
5. **IMPLEMENTATION.md** — Milestones M0~M8 + M1.5 (auth), bootstrap commands, verification checklists, work order.
6. **[NOTIFICATION.md](./NOTIFICATION.md)** — 알림 시스템 설계. 이메일(Resend) + 인앱(SSE + Drawer) 채널, NotificationService 모듈 구조, 이벤트→알림 매핑 테이블.
7. **[BACKEND_MIGRATION.md](./BACKEND_MIGRATION.md)** — M8 백엔드 마이그레이션 계획. mock/Zustand 캐시 → Postgres + Drizzle + Auth.js v5 + 서버 액션 14-step 컷오버. 슬림 BizProfile, NTS 단독 enrichment, P6 buyer/PG 라디오, RFQ별 bizProfile 스냅샷, drizzle-adapter outbox.

If these conflict, **PG_RFQ_SPEC.md wins** (newest, post-pivot). Distribute its §8 changes back into the other four files when implementing — do not let them drift.

## Domain Context (memorize)

- **Two-sided platform**: `buyer` workspace (구매사) sends RFQs; `pg` workspace (결제대행사 영업담당) responds with bids
- **Private 1:N RFQ, NOT a marketplace**: matching is by buyer-supplied PG email allowlist. PGs don't see each other (완전 비공개 — `Bid.competitorCount` etc. do not exist by design)
- **PG workspace identity = email domain** (e.g. `@toss.im` → 토스페이먼츠 workspace, auto-merge on signup)
- **Per-RFQ unique URL + token** in invitation email; token authoritative only for first entry, then workspace membership takes over
- **사업자번호 → automatic enrichment** at RFQ creation: 국세청 (free, mandatory), 공정위 통신판매업 (free), NICE 추정 매출 (paid, opt-in)
- **가맹점 등급 = 카드 우대수수료 등급** (영세/중소1~3/일반). Card fees for 영세·중소 are **statutorily fixed** — `STATUTORY_CARD_FEE` constant in SPEC.md §4 — PGs cannot quote different card rates for these grades. Competition shifts to settlement cycle, deposit, setup fee, monthly minimum, bank transfer %, easy-pay %. Only 일반 grade negotiates card fees per issuer (9 cards: BC/SHINHAN/SAMSUNG/HYUNDAI/KB/LOTTE/NH/HANA/WOORI).
- **v0 has NO 결재선** on either side. Single-decider model. Don't add approval flow components even though SCREEN_DESIGN.md still describes them.

## Planned Stack (post-M0)

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** App Router, Turbopack default, async `params`/`searchParams` |
| Language | TypeScript strict |
| Styling | **Tailwind CSS v4** + CSS Variables (`@theme` block) |
| Headless UI | Radix primitives |
| State | Zustand (UI toggles, signup draft) |
| Forms | react-hook-form + zod |
| Fonts | `next/font/local` — Pretendard Variable + JetBrains Mono Variable, self-hosted in `public/fonts/` |
| Motion | Motion (formerly Framer Motion) |
| Package mgr | **pnpm** |

## Bootstrap (M0, when ready)

```bash
cd /Users/yeonseong/project
pnpm create next-app@latest bidit-next-tmp \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias="@/*" --turbopack

rsync -av --exclude='.git' bidit-next-tmp/ bidit/
rm -rf bidit-next-tmp
cd bidit

pnpm add zustand react-hook-form zod @hookform/resolvers \
         motion @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
         @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-popover \
         @tanstack/react-table cmdk \
         clsx tailwind-merge

pnpm add -D prettier prettier-plugin-tailwindcss
pnpm add -D vitest @testing-library/react @testing-library/user-event \
 @testing-library/jest-dom jsdom playwright
pnpm dlx playwright install --with-deps chromium
```

Then place `Pretendard Variable` and `JetBrains Mono Variable` woff2 in `public/fonts/`. Wire CSS variables `--font-sans` / `--font-mono` from `next/font/local`. Copy DESIGN.md §2~4 tokens into `styles/tokens.css` inside `@theme {}`.

## Routing Architecture (critical)

Two route groups under `app/`:

```
app/
├─ (public)/    # Unauthenticated: /login, /signup/*, /password/*, /invite/rfq/:token, /auth/*
├─ (app)/       # Authenticated, AppShell wrapped
│  ├─ home/
│  ├─ rfq/                    # buyer workspace pages (B1~B7)
│  ├─ inbox/                  # pg workspace pages (P2~P4)
│  └─ settings/
├─ logout/route.ts            # POST handler
└─ middleware.ts              # session guard
```

`middleware.ts` redirects unauthenticated `(app)/*` to `/login?next=...` and authenticated `(public)/*` (except `/logout`) to `/home`. Workspace type (`buyer` vs `pg`) determines which sub-tree of `(app)/*` is shown — same shell, different navigation.

## Korean Editorial Modernism — Hard Rules

These are non-negotiable visual decisions enforced across all screens. Violating them produces "AI slop" aesthetic that this project actively avoids.

- **No** Inter/Roboto/Arial. Pretendard Variable (KR + Latin) + JetBrains Mono only.
- **No** purple-to-blue gradients (canonical SaaS cliché). Solid `--color-ink` for primary actions.
- **No** rounded corners > 12px. Default radius is 5px.
- **No** illustrated empty states. Line SVGs (1.4 stroke) only.
- **No** pulse/spinner loading. Use mono `LOADING…` text.
- **No** glassmorphism, neon accents, fill-color status badges.
- **All** numerics (₩, qty, dates, RFQ numbers like `Q-2605-0042`) use `font-mono` + `tabular-nums`.
- **Status tags** are bracketed text-color only: `[ 결재중 ]` — never filled pills.
- **Editorial markings** on every screen: section serials (`01 / 14`), figure numbers (`FIG. 03`), issue numbers (`№ 042`).

If frontend code looks "generic SaaS", check DESIGN.md §9 (clichés to avoid) before defending it.

## Work Order

Follow IMPLEMENTATION.md milestones strictly: **M0 → M1 → M1.5 → M2 → ... → M7**. Do not skip M1 (AppShell + 12 primitives) to start a feature page — primitives must exist first or the feature page will reinvent them off-spec.

Per-PR verification checklist lives in IMPLEMENTATION.md §4. Copy it into PR body. Three end-to-end scenarios (A/B/C in PG_RFQ_SPEC.md §6) are the ultimate clickthrough acceptance tests.

## When Editing Documentation

The five docs cross-reference each other heavily. After any change:
- If you edit DESIGN.md tokens → also bump `styles/tokens.css` (once code exists)
- If you edit PG_RFQ_SPEC.md §4 (domain types) → also update SPEC.md §5 to match
- If you add a screen → register it in both SCREEN_DESIGN.md (IA) and IMPLEMENTATION.md (milestone)
- If a decision contradicts the 15 policies in PG_RFQ_SPEC.md §3, **stop and ask** — that table is the canonical product definition.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
