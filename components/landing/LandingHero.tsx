'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Logo } from '@/components/primitives/Logo';
import { Button } from '@/components/primitives/Button';
import { SavingsCalculator } from '@/components/landing/SavingsCalculator';
import { LiveBidSimulation } from '@/components/landing/LiveBidSimulation';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const COUNTER_TARGET = 50_000_000;
const COUNTER_DURATION_MS = 2400;

function useAnimatedCounter(target: number, durationMs: number, active: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let rafId: number;
    let startTime: number | null = null;
    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    const delay = setTimeout(() => { rafId = requestAnimationFrame(tick); }, 500);
    return () => { clearTimeout(delay); cancelAnimationFrame(rafId); };
  }, [target, durationMs, active]);
  return value;
}

function formatCounter(n: number): string {
  return '₩' + n.toLocaleString('ko-KR');
}

const PAIN_ITEMS = [
  {
    num: '01',
    text: '담당 영업에게 연락해서\n"더 낮춰줄 수 있나요?"라고 물어본다',
  },
  {
    num: '02',
    text: '경쟁사가 어떤 조건을\n받는지 전혀 모른다',
  },
  {
    num: '03',
    text: '정산주기·보증금·셋업비는\n협상 대상인지도 몰랐다',
  },
];

const HOW_STEPS = [
  {
    num: '01',
    title: 'RFQ 작성',
    desc: 'PG사 이메일 입력 + 거래 조건 기입\n5분이면 충분합니다',
  },
  {
    num: '02',
    title: '비교·검토',
    desc: '모든 PG 응답이 표준 포맷으로\n자동 정렬됩니다',
  },
  {
    num: '03',
    title: '낙찰·계약',
    desc: '최적 PG를 선택하고\n협상을 마무리하세요',
  },
];

export function LandingHero() {
  const [counterActive, setCounterActive] = useState(false);
  const counter = useAnimatedCounter(COUNTER_TARGET, COUNTER_DURATION_MS, counterActive);

  useEffect(() => {
    setCounterActive(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)] flex flex-col">

      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-8 h-[var(--shell-topbar)] border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        <Logo />
        <Link
          href="/login"
          className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors duration-[140ms]"
        >
          Sign in →
        </Link>
      </header>

      <main className="flex-1 pt-[var(--shell-topbar)]">

        {/* ── 01 / 05  Hero ── */}
        <section className="relative overflow-hidden px-8 py-[var(--s-11)] min-h-[calc(100svh-60px)] flex items-center border-b border-[var(--md-sys-color-outline-variant)]">

          {/* Watermark */}
          <span
            aria-hidden
            className="absolute right-6 bottom-8 font-mono font-black leading-none text-[var(--md-sys-color-on-surface)] select-none pointer-events-none hidden md:block"
            style={{
              fontSize: 'clamp(80px, 16vw, 220px)',
              opacity: 0.030,
              letterSpacing: '-0.03em',
            }}
          >
            № 001
          </span>

          <div className="mx-auto w-full max-w-[1080px] flex flex-col gap-[var(--s-8)]">

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, ease: EASE_OUT }}
            >
            </motion.div>

            {/* Headline */}
            <div className="flex flex-col gap-0">
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.44, delay: 0.08, ease: EASE_OUT }}
                className="text-[clamp(30px,5.5vw,72px)] leading-[1.06] tracking-[-0.028em] font-medium text-[var(--md-sys-color-on-surface)]"
              >
                0.5%의 차이가,
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.44, delay: 0.18, ease: EASE_OUT }}
                className="text-[clamp(30px,5.5vw,72px)] leading-[1.06] tracking-[-0.028em] font-medium text-[var(--md-sys-color-on-surface)] flex items-baseline flex-wrap gap-x-[0.2em]"
              >
                <span>연</span>
                <span className="font-mono tabular-nums text-[var(--md-sys-color-primary)]">
                  {formatCounter(counter)}
                </span>
                <span>을 만듭니다.</span>
              </motion.div>
            </div>

            {/* Sub-copy */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.36, delay: 0.46, ease: EASE_OUT }}
              className="max-w-[500px] text-[var(--text-md)] leading-[1.72] tracking-[-0.006em] text-[var(--md-sys-color-on-surface-variant)]"
            >
              bidit은 PG사를 1:N 사적 입찰로 비교합니다.
              카드수수료뿐 아니라 정산주기·보증금·셋업비 등
              모든 비용을 한 번에 협상하세요.
              PG사끼리는 서로를 알 수 없습니다.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.36, delay: 0.6, ease: EASE_OUT }}
              className="flex flex-col items-start gap-[var(--s-4)]"
            >
              <Link href="/signup/buyer">
                <Button size="lg">RFQ 무료로 시작하기 →</Button>
              </Link>
              <span className="font-mono text-[var(--text-2xs)] tracking-[0.06em] text-[var(--md-sys-color-outline)]">
                신용카드 불필요 — 입찰 시작까지 5분
              </span>
            </motion.div>

          </div>
        </section>

        {/* ── 02 / 05  Pain ── */}
        <section className="py-[var(--s-11)] px-8 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="mx-auto w-full max-w-[1080px] flex flex-col gap-[var(--s-9)]">

            <div className="flex flex-col gap-[var(--s-5)]">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.36, ease: EASE_OUT }}
                className="text-[clamp(22px,3.2vw,42px)] leading-[1.1] tracking-[-0.022em] font-medium text-[var(--md-sys-color-on-surface)]"
              >
                PG 계약,<br />이렇게 하고 있지 않나요?
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--s-4)]">
              {PAIN_ITEMS.map((item, i) => (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.36, delay: i * 0.12, ease: EASE_OUT }}
                  className="relative border border-[var(--md-sys-color-outline)] rounded-md p-[var(--s-6)] overflow-hidden"
                >
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--md-sys-color-on-surface)]" />
                  <div className="flex flex-col gap-[var(--s-4)]">
                    <span className="font-mono text-[var(--text-2xs)] tracking-[0.18em] uppercase text-[var(--md-sys-color-outline)]">
                      [ {item.num} ]
                    </span>
                    <p className="text-[var(--text-md)] leading-[1.68] tracking-[-0.006em] text-[var(--md-sys-color-on-surface-variant)] whitespace-pre-line">
                      {item.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 03 / 05  Live Bid Simulation ── */}
        <LiveBidSimulation />

        {/* ── 04 / 05  How It Works ── */}
        <section className="py-[var(--s-11)] px-8 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="mx-auto w-full max-w-[1080px] flex flex-col gap-[var(--s-9)]">

            <div className="flex flex-col gap-[var(--s-5)]">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.36, ease: EASE_OUT }}
                className="text-[clamp(22px,3.2vw,42px)] leading-[1.1] tracking-[-0.022em] font-medium text-[var(--md-sys-color-on-surface)]"
              >
                세 단계면<br />충분합니다.
              </motion.h2>
            </div>

            {/* Hairline connector — desktop only */}
            <div className="hidden md:block overflow-hidden">
              <motion.div
                className="h-px bg-[var(--md-sys-color-outline)]"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                style={{ originX: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--s-7)]">
              {HOW_STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.36, delay: i * 0.12, ease: EASE_OUT }}
                  className="flex flex-col gap-[var(--s-5)]"
                >
                  <span
                    className="font-mono tabular-nums font-medium leading-none text-[var(--md-sys-color-outline)]"
                    style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.02em' }}
                  >
                    {step.num}
                  </span>
                  <div className="flex flex-col gap-[var(--s-3)]">
                    <span className="font-mono text-[var(--text-xs)] tracking-[0.16em] uppercase text-[var(--md-sys-color-on-surface-variant)]">
                      {step.title}
                    </span>
                    <p className="text-[var(--text-md)] leading-[1.68] tracking-[-0.006em] text-[var(--md-sys-color-on-surface-variant)] whitespace-pre-line">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 05 / 05  Savings Calculator ── */}
        <section className="py-[var(--s-11)] px-8 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="mx-auto w-full max-w-[1080px] flex flex-col gap-[var(--s-9)]">
            <div className="flex flex-col gap-[var(--s-5)]">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.36, ease: EASE_OUT }}
                className="text-[clamp(22px,3.2vw,42px)] leading-[1.1] tracking-[-0.022em] font-medium text-[var(--md-sys-color-on-surface)]"
              >
                직접 계산해 보세요.
              </motion.h2>
            </div>
            <SavingsCalculator />
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-[var(--s-11)] px-8 bg-[var(--md-sys-color-on-surface)]">
          <div className="mx-auto w-full max-w-[1080px] flex flex-col gap-[var(--s-8)]">

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.36, ease: EASE_OUT }}
              className="flex flex-col gap-[var(--s-3)]"
            >
              <span className="font-mono text-[var(--text-xs)] tracking-[0.18em] uppercase text-[var(--md-sys-color-on-surface-variant)]">
                — 경쟁이 만드는 차이
              </span>
              <h2 className="text-[clamp(26px,4.5vw,60px)] leading-[1.06] tracking-[-0.026em] font-medium text-[var(--md-sys-color-surface)]">
                지금 바로<br />비교를 시작하세요.
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.36, delay: 0.2, ease: EASE_OUT }}
              className="flex flex-col items-start gap-[var(--s-5)]"
            >
              <Link href="/signup/buyer">
                <button className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-mono text-[13px] tracking-[0.06em] uppercase transition-opacity duration-[140ms] hover:opacity-85 active:scale-[0.98]">
                  RFQ 무료로 시작하기 →
                </button>
              </Link>
            </motion.div>

          </div>
        </section>

      </main>
    </div>
  );
}
