/**
 * Utilitas deteksi donasi yang akan kedaluwarsa segera.
 * Donasi dianggap "segera kadaluwarsa" jika waktu tersisa <= 24 jam.
 */

export const EXPIRY_SOON_HOURS = 24;

/** Mengecek apakah donasi akan kadaluwarsa dalam EXPIRY_SOON_HOURS jam. */
export function isExpiringSoon(expiryTime: string): boolean {
  const expiry = new Date(expiryTime).getTime();
  const now = new Date().getTime();
  const diffHours = (expiry - now) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= EXPIRY_SOON_HOURS;
}

/** Mengecek apakah donasi sudah kadaluwarsa. */
export function isExpired(expiryTime: string): boolean {
  return new Date(expiryTime).getTime() <= new Date().getTime();
}

/** Menghitung sisa jam hingga kedaluwarsa. */
export function hoursUntilExpiry(expiryTime: string): number {
  const expiry = new Date(expiryTime).getTime();
  const now = new Date().getTime();
  return Math.max(0, (expiry - now) / (1000 * 60 * 60));
}

/** Mengecek apakah donasi perlu notifikasi kedaluwarsa (belum pernah diberi notifikasi). */
export function needsExpiryNotification(
  expiryTime: string,
  expiryNotifiedAt: string | null
): boolean {
  if (isExpired(expiryTime)) return false; // Sudah kadaluwarsa, jangan notifikasi lagi
  if (expiryNotifiedAt) return false; // Sudah pernah diberi notifikasi
  return isExpiringSoon(expiryTime);
}
