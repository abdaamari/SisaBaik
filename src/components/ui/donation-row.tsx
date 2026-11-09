"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CategoryIcon } from "./donation-card";
import { FreshnessMeter } from "./freshness-meter";
import { StatusBadge } from "./status-badge";

interface DonationRowProps {
  href: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  /** Replaces the category in the second line, e.g. the provider's name for a partner. */
  byline?: string;
  expiryTime: string;
  status: string;
  /** Live meter while the food is still available; otherwise the status badge stands alone. */
  showMeter?: boolean;
}

/** One row in a dashboard: the name, how long is left, and where it stands. */
export function DonationRow({
  href,
  foodName,
  category,
  quantity,
  unit,
  byline,
  expiryTime,
  status,
  showMeter = false,
}: DonationRowProps) {
  return (
    <li>
      <Link
        href={href}
        className="group flex flex-row gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fresh-soft text-fresh-ink"
            aria-hidden="true"
          >
            <CategoryIcon category={category} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-foreground">{foodName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {byline ?? category} <span aria-hidden="true">·</span> {" "}
              <span className="tabular-nums">
                {quantity} {unit}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:justify-end">
          {showMeter ? (
            <FreshnessMeter expiryTime={expiryTime} className="flex-1" />
          ) : (
            <StatusBadge status={status} />
          )}
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </Link>
    </li>
  );
}
