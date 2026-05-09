'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type LandingToastItem = {
  id: string;
  title: string;
  fee: string;
  isBest?: boolean;
};

type Props = {
  items: LandingToastItem[];
  onDismiss: (id: string) => void;
};

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function ToastItem({ item, onDismiss }: { item: LandingToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), 5000);
    return () => clearTimeout(t);
  }, [item.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      className={[
        'flex items-start justify-between gap-4',
        'rounded-[var(--md-sys-shape-extra-small)] px-4 py-3',
        'shadow-[var(--md-sys-elevation-3)] min-w-[260px] max-w-[320px]',
        item.isBest
          ? 'bg-[#1a3a2a] border border-[rgba(0,109,67,0.4)]'
          : 'bg-[var(--md-sys-color-inverse-surface)]',
      ].join(' ')}
    >
      <div className="flex flex-col gap-0.5">
        <span className={[
          'text-[length:var(--md-typescale-body-medium-size)] font-medium leading-snug',
          item.isBest ? 'text-[#a8e6c8]' : 'text-[var(--md-sys-color-inverse-on-surface)]',
        ].join(' ')}>
          {item.title}
        </span>
        <span className={[
          'font-mono tabular-nums text-[length:var(--md-typescale-body-small-size)]',
          item.isBest ? 'text-[rgba(168,230,200,0.7)]' : 'text-[var(--md-sys-color-inverse-primary)]',
        ].join(' ')}>
          카드수수료 {item.fee}
        </span>
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="닫기"
        className={[
          'text-[length:var(--md-typescale-label-medium-size)] opacity-60 hover:opacity-100 transition-opacity shrink-0 mt-0.5',
          item.isBest ? 'text-[#a8e6c8]' : 'text-[var(--md-sys-color-inverse-primary)]',
        ].join(' ')}
      >
        ×
      </button>
    </motion.div>
  );
}

export function LandingToast({ items, onDismiss }: Props) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {items.map(item => (
          <div key={item.id} className="pointer-events-auto">
            <ToastItem item={item} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
