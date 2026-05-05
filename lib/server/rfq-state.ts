import type { RfqStatus } from '@/lib/types/rfq';

const ALLOWED: Partial<Record<RfqStatus, RfqStatus[]>> = {
  draft: ['sent'],
  sent: ['closed', 'cancelled', 'awarded'],
};

export function canTransition(from: RfqStatus, to: RfqStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: RfqStatus, to: RfqStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid RFQ transition: ${from} → ${to}`);
  }
}
