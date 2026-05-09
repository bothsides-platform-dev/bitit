'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BizProfile } from '@/lib/types/biz-profile';

// `id` is the attachment row id returned by POST /api/files/upload
// (Step 11). Pre-Step 11 the dropzone carried only name/size in
// memory; the file now lives on disk + in `attachments` at upload
// time (`ownerId='__draft__'`), and `createRfqAction` patches the row's
// ownerId to the freshly minted RFQ id at form submit.
// Name kept for blast-radius reasons (Step 13 will sweep `Mock` naming).
export type RfqMockFile = { id: string; name: string; size: number };

export type PgWorkspaceItem = { id: string; displayName: string };

type RfqDraftStore = {
  step: number;
  bizProfile: BizProfile | null;
  title: string;
  memo: string;
  rfpFiles: RfqMockFile[];
  allowedPgWorkspaceIds: PgWorkspaceItem[];
  deadline: string;
  setStep: (step: number) => void;
  setBizProfile: (biz: BizProfile | null) => void;
  setField: <K extends keyof RfqDraftStore>(key: K, value: RfqDraftStore[K]) => void;
  reset: () => void;
};

const defaultState = {
  step: 0,
  bizProfile: null,
  title: '',
  memo: '',
  rfpFiles: [] as RfqMockFile[],
  allowedPgWorkspaceIds: [] as PgWorkspaceItem[],
  deadline: '',
};

export const useRfqDraftStore = create<RfqDraftStore>()(
  persist(
    (set) => ({
      ...defaultState,
      setStep: (step) => set({ step }),
      setBizProfile: (bizProfile) => set({ bizProfile }),
      setField: (key, value) => set({ [key]: value } as Partial<RfqDraftStore>),
      reset: () => set(defaultState),
    }),
    {
      name: 'bidit-rfq-draft',
      storage: createJSONStorage(() => localStorage),
      // Only persist form data fields, not UI/method state
      partialize: (state) => ({
        title: state.title,
        memo: state.memo,
        rfpFiles: state.rfpFiles,
        allowedPgWorkspaceIds: state.allowedPgWorkspaceIds,
        deadline: state.deadline,
      }),
    },
  ),
);
