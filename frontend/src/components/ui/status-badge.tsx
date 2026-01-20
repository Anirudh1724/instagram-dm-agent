import { cn } from '@/lib/utils';
import { LeadStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: {
    label: 'New',
    className: 'bg-info/20 text-info border-info/30',
  },
  engaged: {
    label: 'Engaged',
    className: 'bg-primary/20 text-primary border-primary/30',
  },
  qualified: {
    label: 'Qualified',
    className: 'bg-warning/20 text-warning border-warning/30',
  },
  booked: {
    label: 'Booked',
    className: 'bg-success/20 text-success border-success/30',
  },
  converted: {
    label: 'Converted',
    className: 'bg-accent/20 text-accent border-accent/30',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {config.label}
    </span>
  );
}
