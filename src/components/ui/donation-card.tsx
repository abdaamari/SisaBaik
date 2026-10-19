"use client";

import Link from 'next/link';
import { Clock, Cookie, CupSoda, Leaf, Loader2, MapPin, Package, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatShortDateTime } from '@/lib/format';
import { Button, buttonVariants } from './button';
import { FreshnessMeter } from './freshness-meter';
import { StatusBadge } from './status-badge';

/** Picks a glyph for a donation category. Unknown categories fall back to a box. */
export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const name = category.toLowerCase();
  const Icon =
    name.includes('roti') || name.includes('kue')
      ? Cookie
      : name.includes('minum')
        ? CupSoda
        : name.includes('buah') || name.includes('sayur')
          ? Leaf
          : name.includes('makanan')
            ? Utensils
            : Package;
  return <Icon className={className} aria-hidden="true" />;
}

interface DonationCardProps {
  href: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  /** Shown under the title. Leave out on a provider's own list, where the category is shown instead. */
  providerName?: string;
  expiryTime: string;
  address?: string;
  description?: string | null;
  /** Adds a status badge, e.g. on a provider's own list where donations are in different stages. */
  status?: string;
  /** The live freshness meter only makes sense while the food can still be handed over. Defaults to true. */
  showMeter?: boolean;
  /** Shows a "Klaim donasi" button when provided. */
  onClaim?: () => void;
  claiming?: boolean;
  claimDisabled?: boolean;
  /** Explains why claiming is disabled, e.g. an unverified account. */
  claimHint?: string;
  /** Any extra button, e.g. "Batalkan". Sits above the stretched link, so it stays clickable. */
  extraAction?: React.ReactNode;
  className?: string;
}

export function DonationCard({
  href,
  foodName,
  category,
  quantity,
  unit,
  providerName,
  expiryTime,
  address,
  description,
  status,
  showMeter = true,
  onClaim,
  claiming = false,
  claimDisabled = false,
  claimHint,
  extraAction,
  className,
}: DonationCardProps) {
  const hasExpiry = expiryTime !== '' && !Number.isNaN(new Date(expiryTime).getTime());

  return (
    <article
      className={cn(
        'group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fresh-soft text-fresh-ink"
          title={category}
        >
          <CategoryIcon category={category} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base leading-snug font-bold text-foreground">
            {/* The title link stretches over the whole card; real buttons sit above it with z-10. */}
            <Link
              href={href}
              className="rounded-sm after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {foodName}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{providerName ?? category}</p>
        </div>
        <p className="shrink-0 text-right text-sm font-bold text-foreground tabular-nums">
          {quantity} <span className="font-medium text-muted-foreground">{unit}</span>
        </p>
      </div>

      {status && (
        <div>
          <StatusBadge status={status} />
        </div>
      )}

      {showMeter && hasExpiry ? (
        <FreshnessMeter expiryTime={expiryTime} />
      ) : hasExpiry ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          Batas layak {formatShortDateTime(expiryTime)}
        </p>
      ) : null}

      {address && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2">{address}</span>
        </p>
      )}
      {description && <p className="line-clamp-2 text-sm leading-relaxed text-foreground/80">{description}</p>}

      <div className="relative z-10 mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Link href={href} className={cn(buttonVariants({ variant: 'outline' }), onClaim ? '' : 'flex-1')}>
          Lihat detail
        </Link>
        {onClaim && (
          <Button className="flex-1" disabled={claimDisabled || claiming} onClick={onClaim}>
            {claiming && <Loader2 className="animate-spin" aria-hidden="true" />}
            Klaim donasi
          </Button>
        )}
        {extraAction}
      </div>
      {onClaim && claimHint && <p className="-mt-1 text-xs text-muted-foreground">{claimHint}</p>}
    </article>
  );
}
