import { Serial } from '@/components/primitives/Serial';
import { Button } from '@/components/primitives/Button';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div>
        <Serial current={1} total={2} label="LOGIN" className="block mb-4" />
        <h2 className="text-[26px] font-[700] tracking-[-0.02em] text-[var(--color-ink)]">
          로그인
        </h2>
      </div>

      <form className="space-y-6" action="/api/auth/login" method="POST">
        <div className="space-y-1">
          <label className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
            이메일
          </label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            placeholder="your@email.com"
          />
        </div>

        <div className="space-y-1">
          <label className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
            비밀번호
          </label>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            className="block w-full bg-transparent border-0 border-b border-[var(--color-hair-strong)] py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
          />
        </div>

        <Button type="submit" fullWidth size="lg">
          로그인
        </Button>
      </form>

      <div className="flex items-center justify-between">
        <Link
          href="/password/forgot"
          className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          비밀번호를 잊으셨나요?
        </Link>
        <Link
          href="/signup"
          className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          회원가입
        </Link>
      </div>

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-faint)] text-center">
        — FIN —
      </p>
    </div>
  );
}
