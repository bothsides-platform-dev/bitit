'use client';

import { create } from 'zustand';
import type { SignupDraft } from '@/lib/types/auth';

type SignupDraftStore = SignupDraft & {
  setEmail: (email: string) => void;
  setEmailVerified: () => void;
  setProfile: (name: string, phone?: string) => void;
  setAgreedAt: (at: string) => void;
  setStep: (step: SignupDraft['step']) => void;
  setWorkspaceType: (t: 'buyer' | 'pg') => void;
  reset: () => void;
};

const initial: SignupDraft = {
  step: 'email',
  workspaceType: undefined,
  email: '',
  emailVerified: false,
};

export const useSignupDraftStore = create<SignupDraftStore>((set) => ({
  ...initial,
  setEmail: (email) => set({ email }),
  setEmailVerified: () => set({ emailVerified: true }),
  setProfile: (name, phone) => set({ name, phone }),
  setAgreedAt: (agreedAt) => set({ agreedAt }),
  setStep: (step) => set({ step }),
  setWorkspaceType: (workspaceType) => set({ workspaceType }),
  reset: () => set(initial),
}));
