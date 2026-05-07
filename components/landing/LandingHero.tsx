import Link from 'next/link';
import { Logo } from '@/components/primitives/Logo';
import { Button } from '@/components/primitives/Button';
import { SavingsCalculator } from '@/components/landing/SavingsCalculator';

export function LandingHero() {
  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-8 h-[var(--shell-topbar)] border-b border-[var(--color-hair)] bg-[var(--color-paper)]">
        <Logo />
        <Link
          href="/login"
          className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          Sign in →
        </Link>
      </header>

      <main className="flex-1 pt-[calc(var(--shell-topbar)+var(--s-10))] pb-[var(--s-11)] px-8">
        <div className="mx-auto w-full max-w-[1080px] flex flex-col gap-[var(--s-9)]">
          <div className="flex flex-col gap-[var(--s-5)]">
            <h1 className="text-[clamp(28px,4vw,52px)] leading-[1.05] tracking-[-0.022em] text-[var(--color-ink)] font-medium">
              0.5%의 차이가,
              <br />
              연 수천만 원을 만듭니다.
            </h1>
            <p className="max-w-[560px] text-[var(--text-md)] leading-[1.6] tracking-[-0.006em] text-[var(--color-ink-muted)]">
              bidit은 PG사를 1:N 사적 입찰로 비교합니다. 카드수수료뿐 아니라
              정산주기·보증금·셋업비 등 모든 비용을 한 번에 협상하세요. 아래
              슬라이더로 예상 연간 절감 가능액을 확인해 보세요.
            </p>
          </div>

          <SavingsCalculator />

          <div className="flex flex-col items-start gap-[var(--s-5)]">
            <Link href="/signup/buyer">
              <Button size="lg">RFQ 무료로 시작하기 →</Button>
            </Link>
            <span className="font-mono text-[var(--text-2xs)] tracking-[0.08em] text-[var(--color-ink-soft)]">
              결제대행사 영업담당이신가요?{' '}
              <Link
                href="/signup/pg"
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline-offset-4 hover:underline"
              >
                PG로 시작하기
              </Link>
            </span>
          </div>

        </div>
      </main>
    </div>
  );
}
