// Single source of truth for "how much time is left" across the whole app.
// Cooked food is judged in hours, so the scale is tight: under 1 hour is urgent, under 6 hours is soon.

export type FreshnessLevel = "fresh" | "soon" | "urgent" | "expired";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function getFreshness(msLeft: number): FreshnessLevel {
  if (msLeft <= 0) return "expired";
  if (msLeft < HOUR) return "urgent";
  if (msLeft < 6 * HOUR) return "soon";
  return "fresh";
}

/** Human wording that never relies on colour alone. */
export const freshnessTone = {
  fresh: {
    bar: "bg-fresh",
    soft: "bg-fresh-soft text-fresh-ink",
    text: "text-fresh-ink",
    label: "Masih lama",
  },
  soon: {
    bar: "bg-soon",
    soft: "bg-soon-soft text-soon-ink",
    text: "text-soon-ink",
    label: "Segera",
  },
  urgent: {
    bar: "bg-urgent",
    soft: "bg-urgent-soft text-urgent-ink",
    text: "text-urgent-ink",
    label: "Mendesak",
  },
  expired: {
    bar: "bg-muted-foreground/40",
    soft: "bg-muted text-muted-foreground",
    text: "text-muted-foreground",
    label: "Kedaluwarsa",
  },
} as const;

/** "5 jam 12 menit", "42 menit 08 detik", "3 hari lagi". */
export function formatTimeLeft(msLeft: number, withSeconds = false): string {
  if (msLeft <= 0) return "Kedaluwarsa";
  const days = Math.floor(msLeft / DAY);
  if (days >= 2) return `${days} hari lagi`;
  const hours = Math.floor(msLeft / HOUR);
  const minutes = Math.floor((msLeft % HOUR) / MINUTE);
  const seconds = Math.floor((msLeft % MINUTE) / 1000);
  if (hours >= 1) return `${hours} jam ${minutes} menit`;
  if (withSeconds) return `${minutes} menit ${String(seconds).padStart(2, "0")} detik`;
  return `${Math.max(1, minutes)} menit`;
}

/** Clock-style "05:12:08" for the large countdown on the landing board. */
export function formatClock(msLeft: number): string {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export const METER_SEGMENTS = 6;

/** How many of the 6 segments are lit: 1 under an hour, up to 6 at a day or more. */
export function getFilledSegments(msLeft: number): number {
  if (msLeft <= 0) return 0;
  const steps = [HOUR, 3 * HOUR, 6 * HOUR, 12 * HOUR, DAY];
  return 1 + steps.filter((s) => msLeft >= s).length;
}
