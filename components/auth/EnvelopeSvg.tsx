type EnvelopeSvgProps = { className?: string; size?: number };

export function EnvelopeSvg({ size = 80, className }: EnvelopeSvgProps) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.75)}
      viewBox="0 0 80 60"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="8" width="72" height="44" rx="2" />
      <path d="M4 16l36 22 36-22" />
      <path d="M4 52l22-18M76 52L54 34" />
    </svg>
  );
}

type CheckSvgProps = { className?: string; size?: number };

export function CheckSvg({ size = 64, className }: CheckSvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="32" cy="32" r="28" />
      <path d="M20 32l8.5 9 15.5-18" />
    </svg>
  );
}
