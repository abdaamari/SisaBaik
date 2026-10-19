"use client";

import { useEffect, useState } from "react";
import { CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/donation-card";
import { MeterView } from "@/components/ui/freshness-meter";
import { StatusBadge } from "@/components/ui/status-badge";

// Fictional sample data. The board is a demo of how a real donation list behaves, and says so on screen.
interface DemoDonation {
  id: string;
  name: string;
  detail: string;
  category: string;
  seconds: number;
  partner: string;
}

const DEMO_DONATIONS: DemoDonation[] = [
  {
    id: "nasi",
    name: "Nasi kotak sisa rapat",
    detail: "40 porsi dari Resto Sari Rasa",
    category: "Makanan Berat",
    seconds: 5 * 3600 + 48 * 60 + 12,
    partner: "Yayasan Pangan Kita",
  },
  {
    id: "roti",
    name: "Roti tawar dan pastry",
    detail: "25 buah dari Toko Roti Pagi Hari",
    category: "Roti/Kue",
    seconds: 52 * 60 + 30,
    partner: "Bank Makanan Kota",
  },
  {
    id: "soto",
    name: "Soto ayam dan nasi",
    detail: "60 porsi dari Katering Bu Wati",
    category: "Makanan Berat",
    seconds: 14 * 3600 + 20 * 60,
    partner: "Komunitas Berbagi Rasa",
  },
];

function initialSeconds() {
  return Object.fromEntries(DEMO_DONATIONS.map((d) => [d.id, d.seconds])) as Record<string, number>;
}

/** The one live thing on the landing page: claim a donation and watch the deadline run. */
export function LiveBoard() {
  const [seconds, setSeconds] = useState<Record<string, number>>(initialSeconds);
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [announcement, setAnnouncement] = useState("");

  // Every unclaimed donation loses one second per second. No wall-clock reads, so the first render is stable.
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        const next: Record<string, number> = {};
        for (const key of Object.keys(prev)) {
          next[key] = Math.max(0, prev[key] - 1);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const claimedCount = DEMO_DONATIONS.filter((d) => claimed[d.id]).length;
  const availableCount = DEMO_DONATIONS.length - claimedCount;

  const claim = (item: DemoDonation) => {
    setClaimed((prev) => ({ ...prev, [item.id]: true }));
    setAnnouncement(`${item.partner} mengklaim ${item.name}.`);
  };

  const reset = () => {
    setClaimed({});
    setSeconds(initialSeconds());
    setAnnouncement("Contoh dimulai dari awal.");
  };

  return (
    // data-ui: this is a real interface fragment, so it keeps its own borders and dividers.
    <div data-ui className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <h2 className="text-base font-bold text-foreground">Donasi tersedia sekarang</h2>
        <p className="text-sm font-semibold text-muted-foreground tabular-nums">
          {availableCount} tersedia, {claimedCount} diklaim
        </p>
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {DEMO_DONATIONS.map((item) => {
          const isClaimed = !!claimed[item.id];
          const left = seconds[item.id] ?? 0;
          const expired = left <= 0;

          return (
            <li key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <span
                  className={
                    isClaimed
                      ? "flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : "flex size-11 shrink-0 items-center justify-center rounded-full bg-fresh-soft text-fresh-ink"
                  }
                >
                  {isClaimed ? (
                    <CheckCircle className="size-5 animate-settle" aria-hidden="true" />
                  ) : (
                    <CategoryIcon category={item.category} className="size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="leading-snug font-bold text-foreground">{item.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
                </div>
                {!isClaimed && (
                  <Button size="sm" disabled={expired} onClick={() => claim(item)}>
                    Klaim
                  </Button>
                )}
              </div>

              {isClaimed ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-14">
                  <StatusBadge status="claimed" />
                  <p className="text-sm text-muted-foreground">
                    Dijemput oleh <span className="font-semibold text-foreground">{item.partner}</span>
                  </p>
                </div>
              ) : (
                <MeterView msLeft={left * 1000} clock className="sm:pl-14" />
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <p className="text-xs text-muted-foreground">Contoh tampilan dengan data fiktif.</p>
        {claimedCount > 0 && (
          <Button variant="ghost" size="xs" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Ulangi contoh
          </Button>
        )}
      </div>

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
