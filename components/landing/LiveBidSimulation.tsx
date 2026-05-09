'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Serial } from '@/components/primitives/Serial';

type BidStatus = 'waiting' | 'typing' | 'done';

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

function StatusBadge({ status }: { status: BidStatus }) {
  if (status === 'waiting') {
    return (
      <span className="font-mono text-[var(--text-xs)] tracking-[0.08em] text-[var(--color-ink-faint)]">
        [ 대기 ]
      </span>
    );
  }
  if (status === 'typing') {
    return (
      <span className="font-mono text-[var(--text-xs)] tracking-[0.08em] text-[var(--color-amber)] inline-flex items-baseline">
        [ 응답중
        <span className="dot-1">.</span>
        <span className="dot-2">.</span>
        <span className="dot-3">.</span>
        {' '}]
      </span>
    );
  }
  return (
    <span className="font-mono text-[var(--text-xs)] tracking-[0.08em] text-[var(--color-moss)]">
      [ 제출완료 ]
    </span>
  );
}

export function LiveBidSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.35 });
  const [statuses, setStatuses] = useState<BidStatus[]>(['waiting', 'waiting', 'waiting']);
  const [showHighlight, setShowHighlight] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const runSequence = () => {
    setStatuses(['waiting', 'waiting', 'waiting']);
    setShowHighlight(false);
    setIsDone(false);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const at = (ms: number, fn: () => void) => {
      const t = setTimeout(fn, ms);
      timersRef.current.push(t);
    };

    at(500,  () => setStatuses(prev => { const n = [...prev]; n[0] = 'typing'; return n; }));
    at(1500, () => setStatuses(prev => { const n = [...prev]; n[0] = 'done'; return n; }));
    at(1800, () => setStatuses(prev => { const n = [...prev]; n[1] = 'typing'; return n; }));
    at(2900, () => setStatuses(prev => { const n = [...prev]; n[1] = 'done'; return n; }));
    at(3200, () => setStatuses(prev => { const n = [...prev]; n[2] = 'typing'; return n; }));
    at(4300, () => setStatuses(prev => { const n = [...prev]; n[2] = 'done'; return n; }));
    at(4900, () => { setShowHighlight(true); setIsDone(true); });
  };

  useEffect(() => {
    if (isInView) runSequence();
    return () => timersRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  const allDone = statuses.every(s => s === 'done');

  return (
    <section ref={containerRef} className="py-[var(--s-11)] px-8 border-t border-b border-[var(--color-hair)]">
      <style>{`
        @keyframes dot-fade {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 1;    }
        }
        .dot-1 { animation: dot-fade 1.1s ease-in-out infinite 0s;    }
        .dot-2 { animation: dot-fade 1.1s ease-in-out infinite 0.18s; }
        .dot-3 { animation: dot-fade 1.1s ease-in-out infinite 0.36s; }
      `}</style>

      <div className="mx-auto w-full max-w-[1080px] flex flex-col gap-[var(--s-9)]">

        {/* Header */}
        <div className="flex flex-col gap-[var(--s-5)]">
          <Serial current={3} total={5} label="경쟁이 만드는 차이" />
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.36, ease: EASE_OUT }}
            className="text-[clamp(22px,3vw,40px)] leading-[1.1] tracking-[-0.022em] font-medium text-[var(--color-ink)]"
          >
            3개 PG사가<br />동시에 응답합니다.
          </motion.h2>
        </div>

        {/* RFQ summary card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.36, ease: EASE_OUT }}
          className="border border-[var(--color-hair-strong)] rounded-md p-[var(--s-5)]"
        >
          <div className="flex flex-wrap items-baseline gap-x-[var(--s-7)] gap-y-[var(--s-2)]">
            <span className="font-mono text-[var(--text-2xs)] tracking-[0.18em] uppercase text-[var(--color-ink-soft)]">
              RFQ № 042
            </span>
            <span className="font-mono text-[var(--text-xs)] tracking-[0.06em] text-[var(--color-ink-muted)]">
              연 거래액{' '}
              <span className="tabular-nums text-[var(--color-ink)]">100억</span>
            </span>
            <span className="font-mono text-[var(--text-xs)] tracking-[0.06em] text-[var(--color-ink-muted)]">
              업종 <span className="text-[var(--color-ink)]">이커머스</span>
            </span>
            <span className="font-mono text-[var(--text-xs)] tracking-[0.06em] text-[var(--color-ink-muted)]">
              등급 <span className="text-[var(--color-ink)]">일반</span>
            </span>
            <span className="font-mono text-[var(--text-xs)] tracking-[0.06em] text-[var(--color-ink-muted)]">
              초대 PG사{' '}
              <span className="tabular-nums text-[var(--color-ink)]">3개사</span>
            </span>
          </div>
        </motion.div>

        {/* Bid table */}
        <div className="overflow-x-auto -mx-8 px-8 md:mx-0 md:px-0">
          <div className="min-w-[560px] border border-[var(--color-hair-strong)] rounded-md overflow-hidden">

            {/* Column header */}
            <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr_1fr] border-b border-[var(--color-hair-strong)] px-[var(--s-5)] py-[var(--s-3)] bg-[var(--color-paper-warm)]">
              {['PG사', '상태', '카드수수료', '정산주기', '보증금'].map(h => (
                <span key={h} className="font-mono text-[var(--text-2xs)] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
                  {h}
                </span>
              ))}
            </div>

            {/* Data rows */}
            {PG_DATA.map((pg, i) => {
              const status = statuses[i];
              const revealed = status === 'done';
              const isBest = !!(pg.best && showHighlight);

              return (
                <div
                  key={pg.name}
                  className={[
                    'relative grid grid-cols-[2fr_1.4fr_1fr_1fr_1fr]',
                    'px-[var(--s-5)] py-[var(--s-5)]',
                    'border-b border-[var(--color-hair)] last:border-b-0',
                    isBest ? 'bg-[var(--color-paper-warm)]' : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    transition: 'background-color 420ms ease',
                  }}
                >
                  {isBest && (
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-moss)]" />
                  )}

                  {/* PG name */}
                  <span className={[
                    'font-mono text-[var(--text-base)] tracking-[-0.01em]',
                    isBest ? 'text-[var(--color-moss)]' : 'text-[var(--color-ink)]',
                  ].join(' ')}>
                    {pg.name}
                    {isBest && (
                      <span className="ml-2 text-[var(--text-2xs)] tracking-[0.12em] uppercase text-[var(--color-moss)]">
                        최저가
                      </span>
                    )}
                  </span>

                  {/* Status */}
                  <StatusBadge status={status} />

                  {/* Numeric cells */}
                  {([
                    { key: 'cardRate',   value: `${pg.cardRate}%` },
                    { key: 'settlement', value: pg.settlement },
                    { key: 'deposit',    value: pg.deposit },
                  ] as const).map(({ key, value }) => (
                    <span
                      key={key}
                      className="font-mono tabular-nums text-[var(--text-base)] text-[var(--color-ink)] tracking-[-0.01em]"
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
                        <span className="text-[var(--color-hair-strong)]">—</span>
                      )}
                    </span>
                  ))}
                </div>
              );
            })}

            {/* Summary row */}
            {allDone && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5, ease: EASE_OUT }}
                className="px-[var(--s-5)] py-[var(--s-4)] border-t border-[var(--color-hair-strong)] bg-[var(--color-paper-warm)]"
              >
                <span className="font-mono text-[var(--text-xs)] tracking-[0.06em] text-[var(--color-ink-soft)] leading-relaxed">
                  총 3개사 응답 완료 — 최저 카드수수료{' '}
                  <span className="text-[var(--color-moss)] tabular-nums">1.85%</span>
                  {' '}(최고 대비 연간{' '}
                  <span className="text-[var(--color-moss)] tabular-nums">2,500만원</span>{' '}
                  절감 가능)
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Replay */}
        {isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
          >
            <button
              onClick={runSequence}
              className="font-mono text-[var(--text-2xs)] tracking-[0.14em] uppercase text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] transition-colors duration-[140ms]"
            >
              ↺ 다시 보기
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
