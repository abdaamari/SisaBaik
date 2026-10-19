import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimelineStep = {
  label: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
  description?: string;
};

interface StatusTimelineProps {
  steps: TimelineStep[];
  /** "vertical" suits a detail page; "horizontal" suits a compact card. */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

function StepDot({ status }: { status: TimelineStep['status'] }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full',
        status === 'completed' && 'bg-primary text-primary-foreground',
        status === 'current' && 'bg-soon text-[#13261e]',
        status === 'pending' && 'bg-muted text-muted-foreground',
        status === 'failed' && 'bg-urgent text-white',
      )}
    >
      {status === 'completed' && <Check className="size-4" />}
      {status === 'failed' && <X className="size-4" />}
      {status === 'current' && <span className="size-2.5 rounded-full bg-[#13261e]" />}
      {status === 'pending' && <span className="size-2 rounded-full bg-muted-foreground/50" />}
    </span>
  );
}

const STATUS_WORD: Record<TimelineStep['status'], string> = {
  completed: 'selesai',
  current: 'sedang berlangsung',
  pending: 'belum',
  failed: 'gagal',
};

export function StatusTimeline({ steps, orientation = 'vertical', className }: StatusTimelineProps) {
  if (orientation === 'horizontal') {
    return (
      <ol
        className={cn('grid gap-0', className)}
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => {
          const last = index === steps.length - 1;
          return (
            <li key={step.label} aria-current={step.status === 'current' ? 'step' : undefined}>
              <div className="flex items-center">
                <StepDot status={step.status} />
                {!last && (
                  <span
                    aria-hidden="true"
                    className={cn('mx-2 h-0.5 flex-1', step.status === 'completed' ? 'bg-primary' : 'bg-border')}
                  />
                )}
              </div>
              <p className={cn('mt-2 pr-2 text-xs font-semibold leading-snug', step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground')}>
                {step.label}
                <span className="sr-only"> ({STATUS_WORD[step.status]})</span>
              </p>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className={className}>
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li
            key={step.label}
            aria-current={step.status === 'current' ? 'step' : undefined}
            className={cn('relative flex gap-4', !last && 'pb-6')}
          >
            {!last && (
              <span
                aria-hidden="true"
                className={cn('absolute top-8 bottom-0 left-[15px] w-0.5', step.status === 'completed' ? 'bg-primary' : 'bg-border')}
              />
            )}
            <StepDot status={step.status} />
            <div className="min-w-0 pt-1">
              <p className={cn('text-sm font-semibold', step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground')}>
                {step.label}
                <span className="sr-only"> ({STATUS_WORD[step.status]})</span>
              </p>
              {step.description && (
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{step.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Progress of one donation, from the provider's point of view. */
export function getDonationTimeline(status: string): TimelineStep[] {
  const created: TimelineStep = {
    label: 'Donasi dicatat',
    status: 'completed',
    description: 'Sudah tampil di daftar mitra penyalur.',
  };
  switch (status) {
    case 'available':
      return [
        created,
        { label: 'Diklaim mitra', status: 'current', description: 'Menunggu mitra terverifikasi mengambilnya.' },
        { label: 'Disalurkan', status: 'pending' },
      ];
    case 'claimed':
      return [
        created,
        { label: 'Diklaim mitra', status: 'completed', description: 'Mitra bertanggung jawab atas penjemputan.' },
        { label: 'Disalurkan', status: 'current', description: 'Menunggu serah terima ke penerima.' },
      ];
    case 'delivered':
      return [
        created,
        { label: 'Diklaim mitra', status: 'completed' },
        { label: 'Disalurkan', status: 'completed', description: 'Makanan sudah sampai ke penerima.' },
      ];
    case 'cancelled':
      return [created, { label: 'Dibatalkan', status: 'failed', description: 'Donasi ini tidak disalurkan.' }];
    default:
      return [created];
  }
}

/** Progress of one order, from the partner's point of view. */
export function getOrderTimeline(status: string): TimelineStep[] {
  const claimed: TimelineStep = { label: 'Diklaim', status: 'completed' };
  switch (status) {
    case 'pending':
      return [claimed, { label: 'Dalam pengiriman', status: 'current' }, { label: 'Selesai', status: 'pending' }];
    case 'in_transit':
      return [claimed, { label: 'Dalam pengiriman', status: 'current' }, { label: 'Selesai', status: 'pending' }];
    case 'completed':
      return [claimed, { label: 'Dalam pengiriman', status: 'completed' }, { label: 'Selesai', status: 'completed' }];
    case 'cancelled':
      return [claimed, { label: 'Dibatalkan', status: 'failed' }];
    default:
      return [claimed];
  }
}
