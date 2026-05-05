'use client';

import { create } from 'zustand';
import type { BizProfile } from '@/lib/types/biz-profile';

type RfqDraftStore = {
  step: number;
  bizProfile: BizProfile | null;
  title: string;
  memo: string;
  allowedPgEmails: string[];
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
  allowedPgEmails: [],
  deadline: '',
};

export const useRfqDraftStore = create<RfqDraftStore>((set) => ({
  ...defaultState,
  setStep: (step) => set({ step }),
  setBizProfile: (bizProfile) => set({ bizProfile }),
  setField: (key, value) => set({ [key]: value } as Partial<RfqDraftStore>),
  reset: () => set(defaultState),
}));
