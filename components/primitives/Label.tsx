import { cn } from '@/lib/utils';

export type LabelSize = 'lg' | 'md' | 'sm';

type LabelProps = {
  children: React.ReactNode;
  size?: LabelSize;
  className?: string;
  muted?: boolean;
  as?: 'span' | 'p' | 'label' | 'legend' | 'div';
};

const sizeMap: Record<LabelSize, string> = {
  lg: 'text-[length:var(--md-typescale-label-large-size)] font-[number:var(--md-typescale-label-large-weight)] leading-[var(--md-typescale-label-large-line-height)] tracking-[var(--md-typescale-label-large-tracking)]',
  md: 'text-[length:var(--md-typescale-label-medium-size)] font-[number:var(--md-typescale-label-medium-weight)] leading-[var(--md-typescale-label-medium-line-height)] tracking-[var(--md-typescale-label-medium-tracking)]',
  sm: 'text-[length:var(--md-typescale-label-small-size)] font-[number:var(--md-typescale-label-small-weight)] leading-[var(--md-typescale-label-small-line-height)] tracking-[var(--md-typescale-label-small-tracking)]',
};

export function Label({ children, size = 'md', className, muted = true, as: Tag = 'span' }: LabelProps) {
  return (
    <Tag className={cn(
      sizeMap[size],
      muted ? 'text-[var(--md-sys-color-on-surface-variant)]' : 'text-[var(--md-sys-color-on-surface)]',
      className,
    )}>
      {children}
    </Tag>
  );
}
