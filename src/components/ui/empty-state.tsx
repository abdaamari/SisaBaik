import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

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
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
        {icon || (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2-5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>
      <h3 className="font-heading text-[20px] font-normal leading-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      {action ? <div className="mt-6 flex items-center justify-center gap-3">{action}</div> : null}
    </div>
  );
}