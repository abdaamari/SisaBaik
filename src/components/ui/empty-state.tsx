import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** An empty screen is an invitation: say what is missing and offer the next step. */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-input bg-card px-6 py-14 text-center",
        className
      )}
    >
      <div
        className="mb-5 flex size-14 items-center justify-center rounded-full bg-fresh-soft text-fresh-ink"
        aria-hidden="true"
      >
        {icon || <Package className="size-6" />}
      </div>
      <h3 className="font-heading text-xl font-bold leading-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action ? <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div> : null}
    </div>
  );
}
