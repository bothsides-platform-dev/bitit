import Link from 'next/link'
import { cn } from '@/lib/utils'

type LogoVariant = 'default' | 'compact'

type LogoProps = {
  variant?: LogoVariant
  className?: string
}

export function Logo({ variant = 'default', className }: LogoProps) {
  if (variant === 'compact') {
    return (
      <Link
        href="/home"
        aria-label="bidit 홈"
        className={cn(
          'group flex items-center justify-center',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-paper)]',
          'rounded-[var(--r-xs)]',
          className,
        )}
      >
        {/* "b" mark — white on dark sidebar background */}
        <svg
          viewBox="0 0 18 18"
          width="18"
          height="18"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g
            fill="white"
            className="opacity-[0.82] group-hover:opacity-100 transition-opacity duration-[140ms]"
          >
            <rect x="3" y="1.5" width="2.6" height="15" rx="1.3" />
            <circle cx="9.6" cy="12" r="4.8" />
          </g>
        </svg>
      </Link>
    )
  }

  return (
    <Link
      href="/"
      aria-label="bidit 홈"
      className={cn(
        'group inline-flex items-center',
        'opacity-100 hover:opacity-70 transition-opacity duration-[140ms]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]',
        'rounded-[var(--r-xs)]',
        className,
      )}
    >
      {/* "bidit" wordmark — navy→cyan gradient across "dit" */}
      <svg
        viewBox="0 0 92 34"
        width="92"
        height="34"
        aria-label="bidit"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="logo-wm-grad"
            x1="0"
            x2="92"
            y1="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#0B1560" />
            <stop offset="33%" stopColor="#0B1560" />
            <stop offset="70%" stopColor="#1565C0" />
            <stop offset="100%" stopColor="#29B6F6" />
          </linearGradient>
          <clipPath id="logo-wm-clip">
            <text
              x="1"
              y="27"
              fontFamily="'Pretendard Variable', Pretendard, sans-serif"
              fontWeight="800"
              fontSize="27"
              letterSpacing="-0.5"
            >
              bidit
            </text>
          </clipPath>
        </defs>
        <rect
          x="0"
          y="0"
          width="92"
          height="34"
          fill="url(#logo-wm-grad)"
          clipPath="url(#logo-wm-clip)"
        />
      </svg>
    </Link>
  )
}
