export const REGISTRATION_ROLES = [
  {
    value: 'provider',
    title: 'Penyedia makanan',
    text: 'Punya makanan berlebih yang masih layak, dan ingin menyalurkannya.',
    types: ['Restoran', 'Katering', 'Toko Roti', 'Hotel', 'Kantin'],
  },
  {
    value: 'partner',
    title: 'Mitra penyalur',
    text: 'Menjemput dan menyalurkan makanan ke orang yang membutuhkan.',
    types: ['LSM', 'Bank Makanan', 'Yayasan', 'Komunitas'],
  },
] as const;
