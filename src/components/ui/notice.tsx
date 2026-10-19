import { Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoticeProps {
  tone?: "warning" | "info";
  title: string;
  children?: React.ReactNode;
  className?: string;
}

const TONES = {
  warning: { box: "border-soon/50 bg-soon-soft text-soon-ink", Icon: ShieldAlert },
  info: { box: "border-border bg-fresh-soft text-fresh-ink", Icon: Info },
} as const;

/** A message that stays on the page until the situation changes. Toasts vanish; this does not. */
export function Notice({ tone = "warning", title, children, className }: NoticeProps) {
  const { box, Icon } = TONES[tone];
  return (
    <div role="status" className={cn("flex items-start gap-3 rounded-xl border px-4 py-3.5", box, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="text-sm leading-relaxed">
        <p className="font-bold">{title}</p>
        {children && <p className="mt-0.5">{children}</p>}
      </div>
    </div>
  );
}
