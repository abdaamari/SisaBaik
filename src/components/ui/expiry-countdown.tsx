"use client";

import { Clock } from "lucide-react";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { formatTimeLeft, freshnessTone, getFreshness } from "./freshness";

interface ExpiryCountdownProps {
  expiryTime: string; // ISO string
  className?: string;
}

/** A small live pill: "2 jam 14 menit", tinted by urgency. */
export function ExpiryCountdown({ expiryTime, className }: ExpiryCountdownProps) {
  const now = useNow();

  if (!now) {
    return <span aria-hidden="true" className={cn("inline-block h-6 w-28 rounded-full bg-muted", className)} />;
  }

  const msLeft = new Date(expiryTime).getTime() - now;
  const tone = freshnessTone[getFreshness(msLeft)];

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold tabular-nums",
        tone.soft,
        className,
      )}
    >
      <Clock className="size-3" aria-hidden="true" />
      {formatTimeLeft(msLeft, true)}
    </span>
  );
}
