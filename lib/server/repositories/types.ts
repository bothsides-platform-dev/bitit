// Repository interfaces for Step 4 — backend-agnostic contracts.
// Drizzle implementations live in ./drizzle/*. In-memory implementations
// live in ./in-memory/* and are used as test doubles.
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { DB } from '@/lib/db/client';
import type { PgliteDB } from '@/lib/db/client-pglite';

import type { RFQ, RfqStatus } from '@/lib/types/rfq';
import type { RfqInvitation } from '@/lib/types/invitation';
import type { Workspace } from '@/lib/types/workspace';
import type { User } from '@/lib/types/user';
import type { BizProfile } from '@/lib/types/biz-profile';
import type { Bid } from '@/lib/types/bid';
import type { Contract } from '@/lib/types/contract';
import type { Notification } from '@/lib/types/notification';
import type { Attachment } from '@/lib/types/common';
import type { VerificationToken } from '@/lib/types/auth';
import type { OutboxEntry, OutboxEvent, Sender } from '../outbox/types';

// Tx union — postgres-js DB, pglite DB, or a transactional handle from either.
// `any` generics are localised here so individual method signatures stay clean.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tx = DB | PgliteDB | PgTransaction<any, any, any>;

export type TokenClaimResult =
  | { ok: true; invitation: RfqInvitation }
  | { ok: false; reason: 'expired' | 'used' | 'invalid' };

// ── RFQ ───────────────────────────────────────────────────────────────
export interface RfqRepo {
  /** RFQ insert/upsert(by id). 호출자가 id 미리 발급(`rfq-id.ts`). */
  save(rfq: RFQ, tx?: Tx): Promise<void>;
  /** id 단건 조회. 없으면 undefined. */
  findById(id: string, tx?: Tx): Promise<RFQ | undefined>;
  /** 한 구매사 워크스페이스의 모든 RFQ. */
  findByBuyerWs(wsId: string, tx?: Tx): Promise<RFQ[]>;
  /** 상태 전이 + 패치. DB 레이어에서 `WHERE status=$prev` 동시성 가드. */
  transition(id: string, to: RfqStatus, patch?: Partial<RFQ>, tx?: Tx): Promise<RFQ>;
}

// ── Invitation ────────────────────────────────────────────────────────
export interface InvitationRepo {
  /** 초대 발송 — raw 토큰을 hash로 변환해 저장. raw 비저장. */
  save(inv: RfqInvitation, rawToken: string, tx?: Tx): Promise<void>;
  /** id 조회. */
  findById(id: string, tx?: Tx): Promise<RfqInvitation | undefined>;
  /** raw 토큰의 sha256 hash로 조회. claim 전 email 매칭 검사용. */
  findByTokenHash(tokenHash: string, tx?: Tx): Promise<RfqInvitation | undefined>;
  /** 한 RFQ의 초대 목록. */
  findByRfq(rfqId: string, tx?: Tx): Promise<RfqInvitation[]>;
  /** PG 사용자가 클레임한 초대 + 해당 RFQ pair (PG 인박스용). */
  findByPgUser(
    userId: string,
    tx?: Tx,
  ): Promise<{ invitation: RfqInvitation; rfq: RFQ }[]>;
  /** 토큰 atomic claim — 만료/사용/무효 분기. 동일 raw 토큰 동시 진입 가드. */
  claimToken(rawToken: string, userId: string, tx?: Tx): Promise<TokenClaimResult>;
  /** 같은 도메인 동료도 차단 — acceptedByUserId 매칭만 통과. */
  canAccess(rfqId: string, userId: string, tx?: Tx): Promise<boolean>;
}

// ── Workspace ─────────────────────────────────────────────────────────
export interface WorkspaceRepo {
  /** 워크스페이스 + 멤버 동기화. */
  save(ws: Workspace, tx?: Tx): Promise<void>;
  /** id 조회 — 멤버/bizProfile hydration 포함. */
  findById(id: string, tx?: Tx): Promise<Workspace | undefined>;
  /** 도메인 매칭(PG 전용 partial unique). */
  findByDomain(domain: string, tx?: Tx): Promise<Workspace | undefined>;
  /** 도메인 매칭 PG ws에 사용자 합류. 없으면 null(생성하지 않음). */
  autoJoinPg(userEmail: string, user: User, tx?: Tx): Promise<Workspace | null>;
}

// ── User ──────────────────────────────────────────────────────────────
export interface UserRepo {
  /** upsert(by id). bcrypt hash는 호출자 책임. */
  save(user: User & { passwordHash: string }, tx?: Tx): Promise<void>;
  /** id 조회. */
  findById(id: string, tx?: Tx): Promise<User | undefined>;
  /** email 조회 — passwordHash 포함(로그인용). */
  findByEmail(
    email: string,
    tx?: Tx,
  ): Promise<(User & { passwordHash: string }) | undefined>;
}

// ── BizProfile ────────────────────────────────────────────────────────
export interface BizProfileRepo {
  /** 불변 — 신규 row 생성. id는 호출자가 발급(uuid). */
  save(profile: BizProfile & { id: string }, tx?: Tx): Promise<void>;
  /** id 조회. */
  findById(id: string, tx?: Tx): Promise<(BizProfile & { id: string }) | undefined>;
}

// ── Bid ───────────────────────────────────────────────────────────────
export interface BidRepo {
  /** 입찰 저장 — `(rfqId, pgWsId)` UNIQUE 위배 시 throw. */
  save(bid: Bid, tx?: Tx): Promise<void>;
  /** id 조회. */
  findById(id: string, tx?: Tx): Promise<Bid | undefined>;
  /** 한 RFQ의 모든 입찰. */
  findByRfq(rfqId: string, tx?: Tx): Promise<Bid[]>;
  /** 한 PG 워크스페이스의 모든 입찰. */
  findByPgWs(pgWsId: string, tx?: Tx): Promise<Bid[]>;
}

// ── Notification ──────────────────────────────────────────────────────
export interface NotificationRepo {
  /** 인앱/이메일 알림 저장. */
  save(n: Notification, tx?: Tx): Promise<void>;
  /** 사용자 최근 알림(생성 역순) — limit 제한. */
  findRecentForUser(userId: string, limit: number, tx?: Tx): Promise<Notification[]>;
  /** 단건 읽음 처리. */
  markRead(id: string, tx?: Tx): Promise<void>;
  /** 사용자 전부 읽음 처리. */
  markAllRead(userId: string, tx?: Tx): Promise<void>;
}

// ── Contract ──────────────────────────────────────────────────────────
export interface ContractRepo {
  /** 수주 확정. RFQ에 1:1 unique. */
  save(c: Contract, tx?: Tx): Promise<void>;
  /** RFQ 조회 — 수주 행 단건. */
  findByRfq(rfqId: string, tx?: Tx): Promise<Contract | undefined>;
}

// ── VerificationToken ─────────────────────────────────────────────────
export interface VerificationTokenRepo {
  /** 발급 — raw 비저장, hash만. */
  save(
    token: Omit<VerificationToken, 'token'> & { tokenHash: string },
    tx?: Tx,
  ): Promise<void>;
  /** atomic 소비 — 미사용/미만료만 통과. 성공 시 row 반환. */
  consume(
    tokenHash: string,
    now: Date,
    tx?: Tx,
  ): Promise<(Omit<VerificationToken, 'token'> & { tokenHash: string }) | undefined>;
  /** 만료 전 조회 — UI에서 토큰 유효성 미리보기. */
  findValid(
    tokenHash: string,
    now: Date,
    tx?: Tx,
  ): Promise<(Omit<VerificationToken, 'token'> & { tokenHash: string }) | undefined>;
}

// ── Attachment ────────────────────────────────────────────────────────
export interface AttachmentRepo {
  /** 첨부 row 저장 — 파일 본체는 다른 스토리지. */
  save(
    a: Attachment & {
      ownerKind: 'rfq_rfp' | 'bid_proposal';
      ownerId: string;
      storagePath: string;
      uploadedBy: string;
    },
    tx?: Tx,
  ): Promise<void>;
  /** id 조회. */
  findById(
    id: string,
    tx?: Tx,
  ): Promise<
    | (Attachment & {
        ownerKind: 'rfq_rfp' | 'bid_proposal';
        ownerId: string;
        storagePath: string;
        uploadedBy: string;
      })
    | undefined
  >;
}

// ── Outbox ────────────────────────────────────────────────────────────
export interface OutboxRepo {
  /** 메일 전송 큐 enqueue — dedupeKey UNIQUE 위배 시 null. */
  enqueue(
    params: {
      event: OutboxEvent;
      to: string;
      subject: string;
      html: string;
      dedupeKey?: string;
      maxAttempts?: number;
    },
    tx?: Tx,
  ): Promise<OutboxEntry | null>;
  /** 송신 대기 batch 조회. */
  pending(limit: number, tx?: Tx): Promise<OutboxEntry[]>;
  /** 전송 결과 반영(성공/실패 + 시도횟수 +1). */
  markResult(
    id: string,
    result: { ok: true } | { ok: false; error: string },
    tx?: Tx,
  ): Promise<void>;
  /**
   * Drain pending entries through `sender`.
   *
   * Postgres impl uses `SELECT ... FOR UPDATE SKIP LOCKED LIMIT $limit` so
   * concurrent flush callers (cron + post-commit fire-and-forget) don't
   * double-deliver. Returns counts: `ok` = sender returned ok, `failed` =
   * sender returned !ok (regardless of whether maxAttempts was hit on this
   * pass — `markResult` decides the persistent state).
   */
  flush(
    sender: Sender,
    limit?: number,
    tx?: Tx,
  ): Promise<{ ok: number; failed: number }>;
}
