'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';

import { hashPassword } from '@/lib/auth/password';
import {
  bizProfiles,
  rfqInvitations,
  users,
  workspaceMembers,
  workspaces,
} from '@/lib/db/schema';
import {
  getInvitationRepo,
  getWorkspaceRepo,
} from '@/lib/server/repositories/factory';
import { hashToken } from '@/lib/server/token';
import {
  actionDb,
  emailDomain,
  normalizeEmail,
  type AuthActionResult,
} from './_shared';

const BizProfileInput = z
  .object({
    bizNo: z.string().min(8).max(20),
    taxType: z.enum(['general', 'simple', 'exempt']),
    status: z.enum(['active', 'suspended', 'closed']),
    grade: z.enum(['small', 'sme1', 'sme2', 'sme3', 'general']).optional(),
    gradeSource: z.enum(['user_confirmed', 'user_overridden']).default(
      'user_confirmed',
    ),
  })
  .strict();

const Input = z
  .object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
    password: z.string().min(10).max(200),
    inviteToken: z.string().min(1).max(256).optional(),
    wsKind: z.enum(['buyer', 'pg']).optional(),
    wsName: z.string().min(1).max(200).optional(),
    bizProfile: BizProfileInput.optional(),
  })
  .strict();

export type SignupCompleteInput = z.infer<typeof Input>;
export type SignupCompleteResult = AuthActionResult<{
  redirectTo: string;
  email: string;
  password: string;
}>;

/**
 * P6 — finalise signup.
 *
 * Branches:
 *   - inviteToken set → claim invite, auto-join (or create) PG workspace by
 *     email domain. Returns redirectTo=/inbox/{rfqId}.
 *   - wsKind='buyer' → insert biz_profiles + workspaces(type='buyer') +
 *     member(role='admin'). Returns redirectTo=/home.
 *   - wsKind='pg' → domain conflict check → join existing PG ws or create new.
 *     Returns redirectTo=/home.
 *
 * Auth.js v5 + Next 16 makes server-side signIn flaky (cookies can't be set
 * from a server action without a route response). Per advisor block C the
 * action returns `{ password }` so the client immediately calls
 * signIn('credentials', { email, password, redirect: false }) and pushes.
 */
export async function signupCompleteAction(
  input: SignupCompleteInput,
): Promise<SignupCompleteResult> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' };

  const email = normalizeEmail(parsed.data.email);
  const domain = emailDomain(email);
  if (!domain) return { ok: false, error: 'INVALID_EMAIL_DOMAIN' };

  const passwordHash = await hashPassword(parsed.data.password);
  const userId = randomUUID();

  const db = actionDb();

  return await db.transaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (tx: any): Promise<SignupCompleteResult> => {
      // 1. Insert user. Email UNIQUE — collision means an account already
      //    exists for the address; surface that explicitly.
      try {
        await tx.insert(users).values({
          id: userId,
          email,
          passwordHash,
          name: parsed.data.name,
          avatarColor: 'ink',
          status: 'active',
        });
      } catch {
        return { ok: false, error: 'EMAIL_TAKEN' };
      }

      // 2a. Invite branch — claim invite, auto-join PG ws by domain.
      if (parsed.data.inviteToken) {
        const invitations = await getInvitationRepo();
        const claim = await invitations.claimToken(
          parsed.data.inviteToken,
          userId,
          tx,
        );
        if (!claim.ok) {
          return { ok: false, error: `INVITE_${claim.reason.toUpperCase()}` };
        }

        // Find or create PG workspace by email domain.
        const [existing] = await tx
          .select()
          .from(workspaces)
          .where(and(eq(workspaces.domain, domain), eq(workspaces.type, 'pg')))
          .limit(1);

        let pgWsId: string;
        if (existing) {
          pgWsId = existing.id;
        } else {
          pgWsId = randomUUID();
          await tx.insert(workspaces).values({
            id: pgWsId,
            type: 'pg',
            name: domain,
            domain,
          });
        }

        await tx
          .insert(workspaceMembers)
          .values({
            workspaceId: pgWsId,
            userId,
            role: 'member',
          })
          .onConflictDoNothing({
            target: [workspaceMembers.workspaceId, workspaceMembers.userId],
          });

        // Stamp the invitation with pg_ws_id so downstream queries can scope
        // the bid form by workspace, not just by user.
        await tx
          .update(rfqInvitations)
          .set({ pgWsId })
          .where(eq(rfqInvitations.tokenHash, hashToken(parsed.data.inviteToken)));

        return {
          ok: true,
          redirectTo: `/inbox/${claim.invitation.rfqId}`,
          email,
          password: parsed.data.password,
        };
      }

      // 2b. Buyer branch.
      if (parsed.data.wsKind === 'buyer') {
        if (!parsed.data.wsName) {
          return { ok: false, error: 'MISSING_WS_NAME' };
        }
        let bizProfileId: string | null = null;
        if (parsed.data.bizProfile) {
          bizProfileId = randomUUID();
          await tx.insert(bizProfiles).values({
            id: bizProfileId,
            bizNo: parsed.data.bizProfile.bizNo,
            taxType: parsed.data.bizProfile.taxType,
            status: parsed.data.bizProfile.status,
            grade: parsed.data.bizProfile.grade ?? null,
            gradeSource: parsed.data.bizProfile.gradeSource,
            gradeConfirmedBy: userId,
            gradeConfirmedAt: new Date(),
          });
        }

        const wsId = randomUUID();
        await tx.insert(workspaces).values({
          id: wsId,
          type: 'buyer',
          name: parsed.data.wsName,
          domain: null,
          bizProfileId,
        });
        await tx.insert(workspaceMembers).values({
          workspaceId: wsId,
          userId,
          role: 'admin',
        });

        return {
          ok: true,
          redirectTo: '/home',
          email,
          password: parsed.data.password,
        };
      }

      // 2c. PG branch (no invite). Auto-derive workspace from email domain.
      if (parsed.data.wsKind === 'pg') {
        // Try auto-join first.
        const wsRepo = await getWorkspaceRepo();
        const joined = await wsRepo.autoJoinPg(
          email,
          {
            id: userId,
            name: parsed.data.name,
            email,
            avatarColor: 'ink',
            role: 'member',
            status: 'active',
            joinedAt: new Date().toISOString(),
          },
          tx,
        );
        if (joined) {
          return {
            ok: true,
            redirectTo: '/home',
            email,
            password: parsed.data.password,
          };
        }
        // Otherwise create a new PG ws.
        const wsId = randomUUID();
        await tx.insert(workspaces).values({
          id: wsId,
          type: 'pg',
          name: parsed.data.wsName ?? domain,
          domain,
        });
        await tx.insert(workspaceMembers).values({
          workspaceId: wsId,
          userId,
          role: 'admin',
        });
        return {
          ok: true,
          redirectTo: '/home',
          email,
          password: parsed.data.password,
        };
      }

      return { ok: false, error: 'MISSING_WS_KIND' };
    },
  );
}
