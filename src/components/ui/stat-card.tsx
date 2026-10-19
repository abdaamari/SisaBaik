"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
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
  /** When set, the whole card becomes a link, e.g. to a list filtered by this status. */
  href?: string;
  className?: string;
}

/** Counts up from the number on screen to the new one. Writes to the DOM directly, so it never triggers a re-render. */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = Math.round(value);
    const from = Number(el.textContent) || 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || from === target) {
      el.textContent = String(target);
      return;
    }
    const duration = 650;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span ref={ref}>0</span>;
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  href,
  className,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fresh-soft text-fresh-ink transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 font-heading text-4xl font-extrabold leading-none tracking-tight text-foreground tabular-nums">
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </p>
      {description && (
        <p className="mt-2 text-sm leading-snug text-muted-foreground">{description}</p>
      )}
      {trend && (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>{" "}
          {trend.label}
        </p>
      )}
    </>
  );

  const base = "group block rounded-xl border border-border bg-card p-5";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn(base, className)}>{body}</div>;
}
