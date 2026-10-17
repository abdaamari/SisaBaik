import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { StatusBadge } from './status-badge';

interface DonationCardProps {
  id: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  status: 'available' | 'claimed' | 'delivered' | 'cancelled';
  providerName: string;
  expiryTime?: string;
  onClaim?: () => void;
  className?: string;
}

export function DonationCard({
  id,
  foodName,
  category,
  quantity,
  unit,
  status,
  providerName,
  expiryTime,
  onClaim,
  className
}: DonationCardProps) {
  const router = useRouter();

  const getExpiryStatus = (expiryTime: string | undefined) => {
    if (!expiryTime) return null;

    const expiryDate = new Date(expiryTime);
    const now = new Date();
    const diffHours = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 0) return 'expired';
    if (diffHours <= 24) return 'expiring-soon';
    return 'valid';
  };

  const expiryStatus = getExpiryStatus(expiryTime);

  return (
    <div
      className={cn(
        "group flex w-full flex-col rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer",
        className
      )}
      onClick={() => router.push(`/donations/${id}`)}
    >
      <div className="flex flex-col p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">{foodName}</h3>
          <StatusBadge status={status} />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Kategori:</span>
            <span className="font-medium">{category}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Jumlah:</span>
            <span className="font-medium">{quantity} {unit}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Dari:</span>
            <span className="font-medium">{providerName}</span>
          </div>

          {expiryTime && (
            <div className={cn(
              "flex items-center gap-2 px-2 py-1 rounded",
              expiryStatus === 'expired' && "bg-destructive/10 text-destructive",
              expiryStatus === 'expiring-soon' && "bg-warning/10 text-warning",
              expiryStatus === 'valid' && "bg-success/10 text-success"
            )}
            >
              <span className="text-xs font-medium">
                {expiryStatus === 'expired' ? 'Kadaluarsa' :
                 expiryStatus === 'expiring-soon' ? 'Segera kadaluarsa' :
                 'Masih berlaku'}
              </span>
            </div>
          )}
        </div>

        {onClaim && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClaim();
            }}
            className="mt-2 w-full justify-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Klaim Donasi
          </button>
        )}
      </div>
    </div>
  );
}