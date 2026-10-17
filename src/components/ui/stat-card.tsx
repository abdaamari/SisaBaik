import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-5 py-5 shadow-[0_1px_2px_rgba(41,45,40,0.06)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{title}</h3>
          <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-foreground tabular-nums">{value}</p>
          {description && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs font-medium tabular-nums text-foreground">
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
