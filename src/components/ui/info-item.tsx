import { cn } from "@/lib/utils";

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** One labelled fact on a detail page. Use inside a <dl>. */
export function InfoItem({ icon: Icon, label, children, className }: InfoItemProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fresh-soft text-fresh-ink"
        aria-hidden="true"
      >
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm leading-relaxed font-semibold break-words text-foreground">{children}</dd>
      </div>
    </div>
  );
}
