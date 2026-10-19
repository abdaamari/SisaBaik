import { Clock, CheckCircle, XCircle, Hand, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DonationStatus = 'available' | 'claimed' | 'delivered' | 'cancelled';
export type OrderStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  status: string;
  type?: 'donation' | 'order';
  className?: string;
}

type StatusConfig = { label: string; icon: React.ElementType; className: string };

const cancelled: StatusConfig = {
  label: 'Dibatalkan',
  icon: XCircle,
  className: 'bg-muted text-muted-foreground',
};

const donationStatusConfig: Record<DonationStatus, StatusConfig> = {
  available: { label: 'Tersedia', icon: Package, className: 'bg-fresh-soft text-fresh-ink' },
  claimed: { label: 'Diklaim', icon: Hand, className: 'bg-soon-soft text-soon-ink' },
  delivered: { label: 'Disalurkan', icon: CheckCircle, className: 'bg-primary text-primary-foreground' },
  cancelled,
};

const orderStatusConfig: Record<OrderStatus, StatusConfig> = {
  pending: { label: 'Menunggu', icon: Clock, className: 'bg-soon-soft text-soon-ink' },
  in_transit: { label: 'Dalam pengiriman', icon: Truck, className: 'bg-fresh-soft text-fresh-ink' },
  completed: { label: 'Selesai', icon: CheckCircle, className: 'bg-primary text-primary-foreground' },
  cancelled,
};

/** Icon + word + colour, so status never depends on colour alone. */
export function StatusBadge({ status, type = 'donation', className }: StatusBadgeProps) {
  const config =
    type === 'donation'
      ? donationStatusConfig[status as DonationStatus]
      : orderStatusConfig[status as OrderStatus];

  if (!config) {
    return (
      <span className={cn('inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-xs font-semibold text-muted-foreground', className)}>
        Status tidak dikenal
      </span>
    );
  }

  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap',
        config.className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}
