// One list of categories and units for the whole app.
// The provider form writes these exact strings and the partner filters read them,
// so the two sides can never drift apart.

export const DONATION_CATEGORIES = [
  "Makanan Berat",
  "Roti/Kue",
  "Minuman",
  "Buah/Sayur",
  "Lainnya",
] as const;

export const DONATION_UNITS = ["porsi", "buah", "gelas", "potong", "kg", "ons"] as const;

export type DonationCategory = (typeof DONATION_CATEGORIES)[number];
