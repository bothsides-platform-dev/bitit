'use client';

import { motion, AnimatePresence } from 'motion/react';

type PGEntry = {
  name: string;
  cardRate: string;
  settlement: string;
  deposit: string;
  best?: boolean;
};

const PG_DATA: PGEntry[] = [
  { name: '토스페이먼츠', cardRate: '1.95', settlement: 'D+1', deposit: '—' },
  { name: 'KG이니시스', cardRate: '2.10', settlement: 'D+2', deposit: '50만원' },
  { name: 'NHN KCP', cardRate: '1.85', settlement: 'D+1', deposit: '—', best: true },
];

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_DECELERATE = [0.05, 0.7, 0.1, 1] as const;

type Props = {
  currentStep?: 0 | 1 | 2 | 3;
};

export function LiveBidSimulation({ currentStep = 3 }: Props) {
  const allDone = currentStep === 3;

  return (
    <div className="overflow-x-auto -mx-8 px-8 md:mx-0 md:px-0">
      <div className="relative min-w-[560px] border border-[var(--md-sys-color-outline)] rounded-md overflow-hidden">

        {/* Column header */}
        <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr_1fr] border-b border-[var(--md-sys-color-outline)] px-[var(--s-5)] py-[var(--s-3)] bg-[var(--md-sys-color-surface-container-high)]">
          {['PG사', '상태', '카드수수료', '정산주기', '보증금'].map(h => (
            <span key={h} className="font-mono text-[var(--text-2xs)] tracking-[0.16em] uppercase text-[var(--md-sys-color-on-surface-variant)]">
              {h}
            </span>
          ))}
        </div>

        {/* Data rows */}
        {PG_DATA.map((pg, i) => {
          const revealed = currentStep > i;
          const isBest = !!(pg.best && allDone);

          return (
            <motion.div
              key={pg.name}
              initial={false}
              animate={{
                opacity: revealed ? 1 : 0.2,
                filter: revealed ? 'blur(0px)' : 'blur(3px)',
              }}
              transition={{ duration: 0.4, ease: EASE_DECELERATE }}
              className={[
                'relative grid grid-cols-[2fr_1.4fr_1fr_1fr_1fr]',
                'px-[var(--s-5)] py-[var(--s-5)]',
                'border-b border-[var(--md-sys-color-outline-variant)] last:border-b-0',
                isBest ? 'bg-[var(--md-sys-color-surface-container-high)]' : '',
              ].filter(Boolean).join(' ')}
              style={{ transition: 'background-color 420ms ease' }}
            >
              {isBest && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--md-sys-color-tertiary)]" />
              )}

              {/* PG name */}
              <span className={[
                'font-mono text-[var(--text-base)] tracking-[-0.01em]',
                isBest ? 'text-[var(--md-sys-color-tertiary)]' : 'text-[var(--md-sys-color-on-surface)]',
              ].join(' ')}>
                {pg.name}
                {isBest && (
                  <span className="ml-2 text-[var(--text-2xs)] tracking-[0.12em] uppercase text-[var(--md-sys-color-tertiary)]">
                    최저가
                  </span>
                )}
              </span>

              {/* Status */}
              <span className="font-mono text-[var(--text-xs)] tracking-[0.08em] text-[var(--md-sys-color-outline)]">
                {revealed ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.24, ease: EASE_OUT }}
                    className={isBest ? 'text-[var(--md-sys-color-tertiary)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}
                  >
                    [ 제출완료 ]
                  </motion.span>
                ) : (
                  '[ 대기 ]'
                )}
              </span>

              {/* Numeric cells */}
              {([
                { key: 'cardRate',   value: `${pg.cardRate}%` },
                { key: 'settlement', value: pg.settlement },
                { key: 'deposit',    value: pg.deposit },
              ] as const).map(({ key, value }) => (
                <span
                  key={key}
                  className="font-mono tabular-nums text-[var(--text-base)] text-[var(--md-sys-color-on-surface)] tracking-[-0.01em]"
                >
                  {revealed ? (
                    <motion.span
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, ease: EASE_OUT }}
                    >
                      {value}
                    </motion.span>
                  ) : (
                    <span className="text-[var(--md-sys-color-outline)]">—</span>
                  )}
                </span>
              ))}
            </motion.div>
          );
        })}

        {/* Summary row */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: EASE_OUT }}
              className="px-[var(--s-5)] py-[var(--s-4)] border-t border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-high)]"
            >
              <span className="font-mono text-[var(--text-xs)] tracking-[0.06em] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                총 3개사 응답 완료 — 최저 카드수수료{' '}
                <span className="text-[var(--md-sys-color-tertiary)] tabular-nums">1.85%</span>
                {' '}(최고 대비 연간{' '}
                <span className="text-[var(--md-sys-color-tertiary)] tabular-nums">2,500만원</span>{' '}
                절감 가능)
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blur peek overlay — fades out once all rows are revealed */}
        <AnimatePresence>
          {!allDone && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center pb-4 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, transparent, var(--md-sys-color-surface))' }}
            >
              <motion.div
                animate={{ y: [0, 3, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="pointer-events-auto flex items-center gap-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-full px-4 py-2 shadow-[var(--md-sys-elevation-1)]"
              >
                <span className="font-mono text-[12px] tracking-[0.06em] text-[var(--md-sys-color-primary)]">
                  ↓ 스크롤해서 나머지 확인
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
