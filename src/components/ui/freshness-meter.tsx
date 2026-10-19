"use client";

import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import {
  METER_SEGMENTS,
  formatClock,
  formatTimeLeft,
  freshnessTone,
  getFilledSegments,
  getFreshness,
} from "./freshness";

interface MeterViewProps {
  /** Milliseconds until the food is no longer safe to hand over. */
  msLeft: number;
  /** Show "05:12:08" instead of "5 jam 12 menit". Used where seconds are the point. */
  clock?: boolean;
  /** "lg" is for the one meter a page is about, e.g. a donation's detail page. */
  size?: "default" | "lg";
  className?: string;
}

/** The meter itself: time in words, a verdict, and six segments. Pure, so any clock can drive it. */
export function MeterView({ msLeft, clock = false, size = "default", className }: MeterViewProps) {
  const level = getFreshness(msLeft);
  const tone = freshnessTone[level];
  const filled = getFilledSegments(msLeft);
  const timeText = clock && msLeft > 0 ? formatClock(msLeft) : formatTimeLeft(msLeft, true);

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("font-bold tabular-nums", size === "lg" ? "text-3xl" : "text-sm", tone.text)}>{timeText}</span>
        <span className="text-xs font-medium text-muted-foreground">{tone.label}</span>
      </div>
      <div
        role="img"
        aria-label={`Sisa waktu ${formatTimeLeft(msLeft)}, ${tone.label}`}
        className="mt-1.5 flex gap-1"
      >
        {Array.from({ length: METER_SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-500",
              i < filled ? tone.bar : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface FreshnessMeterProps {
  /** ISO timestamp of the food's "batas kelayakan". */
  expiryTime: string;
  clock?: boolean;
  size?: "default" | "lg";
  className?: string;
}

/** Time left for a real donation, driven by the shared one-second clock. */
export function FreshnessMeter({ expiryTime, clock = false, size = "default", className }: FreshnessMeterProps) {
  const now = useNow();

  if (!now) {
    // Before the first client tick: same height, nothing that depends on the current time.
    return (
      <div className={cn("min-w-0", className)} aria-hidden="true">
        <div className="h-5 w-28 rounded bg-muted" />
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted" />
      </div>
    );
  }

  return <MeterView msLeft={new Date(expiryTime).getTime() - now} clock={clock} size={size} className={className} />;
}
