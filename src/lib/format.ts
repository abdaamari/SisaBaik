// Small formatting helpers shared by the dashboard pages.
// Dates are always shown the Indonesian way, in the viewer's own time zone.

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "17 Okt, 18.30": short enough for a card. */
export function formatShortDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Supabase returns an embedded relation either as an object or as a one-item array. */
export type ProfileRef =
  | { organization_name: string }
  | { organization_name: string }[]
  | null
  | undefined;

export function getProviderName(profiles: ProfileRef): string {
  if (!profiles) return "Penyedia";
  if (Array.isArray(profiles)) return profiles[0]?.organization_name ?? "Penyedia";
  return profiles.organization_name ?? "Penyedia";
}
