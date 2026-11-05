import type { Priority } from '@inbox/contracts';
import { ArrowDown, ArrowUp, ChevronsUp, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const display: Record<Priority, { label: string; Icon: LucideIcon; className?: string }> = {
  urgent: {
    label: 'Urgent',
    Icon: ChevronsUp,
    className: 'text-destructive font-semibold',
  },
  high: { label: 'High', Icon: ArrowUp, className: 'text-destructive' },
  normal: { label: 'Normal', Icon: Minus },
  low: { label: 'Low', Icon: ArrowDown },
};

/** Text label plus icon; colour is reinforcement for urgent and high only. */
export function PriorityLabel({ priority }: { priority: Priority }) {
  const { label, Icon, className } = display[priority];
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </span>
  );
}
