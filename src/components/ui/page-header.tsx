import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="font-heading text-[28px] font-normal leading-none tracking-tight text-foreground sm:text-[32px]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action ? <div className="shrink-0 pt-1">{action}</div> : null}
    </div>
  );
}