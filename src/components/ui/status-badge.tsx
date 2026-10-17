import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Hand, Package, Truck } from 'lucide-react';

export type DonationStatus = 'available' | 'claimed' | 'delivered' | 'cancelled';
export type OrderStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  status: string;
  type?: 'donation' | 'order';
}

const donationStatusConfig: Record<DonationStatus, { label: string; icon: React.ElementType; className: string }> = {
  available: {
    label: 'Tersedia',
    icon: Package,
    className: 'bg-[#52684D]/10 text-[#3d4a3a] border-[#52684D]/20 dark:bg-[#8A9A86]/15 dark:text-[#C2C8B8] dark:border-[#8A9A86]/25',
  },
  claimed: {
    label: 'Diklaim',
    icon: Hand,
    className: 'bg-[#E8E5DC] text-[#4a4d45] border-[#E8E5DC] dark:bg-[#2E332E] dark:text-[#C2C8B8] dark:border-white/10',
  },
  delivered: {
    label: 'Disalurkan',
    icon: CheckCircle,
    className: 'bg-[#52684D] text-white border-transparent dark:bg-[#8A9A86] dark:text-[#1A1E1A]',
  },
  cancelled: {
    label: 'Dibatalkan',
    icon: XCircle,
    className: 'bg-transparent text-muted-foreground border-border',
  },
};

const orderStatusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: {
    label: 'Menunggu',
    icon: Clock,
    className: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800/50',
  },
  in_transit: {
    label: 'Dalam Pengiriman',
    icon: Truck,
    className: 'bg-[#52684D]/10 text-[#3d4a3a] border-[#52684D]/20 dark:bg-[#8A9A86]/15 dark:text-[#C2C8B8] dark:border-[#8A9A86]/25',
  },
  completed: {
    label: 'Selesai',
    icon: CheckCircle,
    className: 'bg-[#52684D] text-white border-transparent dark:bg-[#8A9A86] dark:text-[#1A1E1A]',
  },
  cancelled: {
    label: 'Dibatalkan',
    icon: XCircle,
    className: 'bg-transparent text-muted-foreground border-border',
  },
};

export function StatusBadge({ status, type = 'donation' }: StatusBadgeProps) {
  const config = type === 'donation'
    ? donationStatusConfig[status as DonationStatus]
    : orderStatusConfig[status as OrderStatus];

  if (!config) {
    return <Badge variant="outline" className="text-muted-foreground">Tidak diketahui</Badge>;
  }

  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium tracking-wide ${config.className}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{config.label}</span>
    </Badge>
  );
}