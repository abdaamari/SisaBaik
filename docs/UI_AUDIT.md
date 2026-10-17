# UI Audit Report

## Overview

Proyek SisaBaik adalah aplikasi web untuk menghubungkan penyedia makanan berlebih dengan mitra penyalur terverifikasi. Berikut adalah audit komprehensif dari antarmuka pengguna, yang mengidentifikasi masalah, peluang perbaikan, dan rekomendasi untuk memenuhi standar HCI dan WCAG 2.1 AA.

## 1. Struktur Folder dan Route

### Struktur Folder
```
src/app/
├── (public)/          # Halaman publik (tidak memerlukan autentikasi)
│   ├── page.tsx      # Landing page
│   ├── login/page.tsx # Halaman login
│   └── register/page.tsx # Halaman register
├── (provider)/        # Halaman untuk penyedia makanan
│   ├── provider/     # Folder dashboard provider
│   │   ├── dashboard/page.tsx # Dashboard
│   │   ├── donations/page.tsx # Daftar donasi
│   │   └── donations/new/page.tsx # Form donasi baru
├── (partner)/         # Halaman untuk mitra penyalur
│   └── partner/dashboard/page.tsx # Dashboard
├── (admin)/           # Halaman admin
│   └── admin/verification/page.tsx # Halaman verifikasi
└── layout.tsx       # Layout root
```

### Daftar Route
1. `/` - Landing page (public)
2. `/login` - Halaman login (public)
3. `/register` - Halaman register (public)
4. `/provider/dashboard` - Dashboard penyedia (terproteksi)
5. `/provider/donations` - Daftar donasi penyedia (terproteksi)
6. `/provider/donations/new` - Form donasi baru (terproteksi)
7. `/partner/dashboard` - Dashboard mitra (terproteksi)
8. `/admin/verification` - Halaman verifikasi admin (terproteksi)

## 2. Masalah UI yang Ditemukan

### 2.1 Masalah Teknis

#### 2.1.1 Konfigurasi next.config.ts
**Masalah:** `cacheComponents: true` dapat menyebabkan error pada halaman yang memerlukan data dinamis.

**Lokasi:** `next.config.ts:5`

**Dampak:** Halaman dashboard dan daftar donasi mungkin gagal dimuat karena cache komponen yang agresif.

**Rekomendasi:** Nonaktifkan `cacheComponents: true` atau bungkus pengambilan data dinamis dengan `<Suspense>`.

#### 2.1.2 Bahasa Antarmuka
**Masalah:** Banyak teks antarmuka masih dalam bahasa Inggris.

**Lokasi:**
- Landing page: "Templates", "Learning center"
- Login page: Error messages dalam bahasa Inggris
- Register page: Beberapa pesan dalam bahasa Inggris

**Dampak:** Antarmuka tidak sesuai dengan target pasar Indonesia.

**Rekomendasi:** Terjemahkan semua teks ke bahasa Indonesia yang ramah pengguna.

#### 2.1.3 Missing Design System
**Masalah:** Tidak ada sistem desain yang konsisten.

**Dampak:** Inkonsistensi dalam ukuran, warna, spacing, dan komponen.

**Rekomendasi:** Buat design system lengkap dengan CSS variables, komponen bersama, dan pedoman penggunaan.

#### 2.1.4 Missing Dark Mode
**Masalah:** Tidak ada toggle dark mode.

**Dampak:** Pengguna tidak bisa menyesuaikan tema sesuai preferensi.

**Rekomendasi:** Tambahkan theme toggle di navbar dengan preferensi yang disimpan.

#### 2.1.5 Missing Bottom Navigation
**Masalah:** Tidak ada bottom navigation untuk mobile.

**Dampak:** Navigasi sulit di perangkat mobile.

**Rekomendasi:** Buat bottom navigation dengan 4-5 target sentuh minimal 44px.

#### 2.1.6 Missing Sidebar
**Masalah:** Tidak ada sidebar untuk desktop.

**Dampak:** Navigasi kurang intuitif di layar besar.

**Rekomendasi:** Buat sidebar dengan ikon + label, item aktif yang jelas.

### 2.2 Masalah Komponen

#### 2.2.1 Missing Required Components
**Masalah:** Banyak komponen yang diperlukan tidak ada.

**Komponen yang hilang:**
- `AppShell` - Layout wrapper utama
- `PageHeader` - Header dengan judul dan breadcrumb
- `StatCard` - Kartu statistik
- `StatusBadge` - Badge status (warna + ikon + teks)
- `StatusTimeline` - Timeline status
- `DonationCard` - Kartu donasi
- `DataTable` - Tabel responsif
- `ExpiryCountdown` - Countdown kedaluwarsa
- `FilterBar` - Bar filter
- `EmptyState` - State kosong
- `ErrorState` - State error
- `Skeleton*` - Skeleton loading
- `ConfirmDialog` - Dialog konfirmasi
- `FormField` - Field form dengan label dan error
- `VerificationBanner` - Banner verifikasi
- `ThemeToggle` - Toggle tema
- `Logo` - Logo aplikasi

**Dampak:** Antarmuka tidak konsisten dan kurang profesional.

**Rekomendasi:** Buat semua komponen yang diperlukan.

#### 2.2.2 Missing Navigation Menu
**Masalah:** Menu navigasi berbeda untuk setiap role tidak ada.

**Dampak:** Pengguna tidak bisa melihat menu navigasi yang sesuai dengan role mereka.

**Rekomendasi:** Tampilkan menu navigasi yang berbeda untuk provider, partner, dan admin.

### 2.3 Masalah Aksesibilitas

#### 2.3.1 Missing Skip Link
**Masalah:** Tidak ada skip link untuk mengakses konten utama.

**Dampak:** Pengguna screen reader harus navigasi melalui navbar.

**Rekomendasi:** Tambahkan skip link "Lewati ke konten utama".

#### 2.3.2 Missing ARIA
**Masalah:** Banyak elemen tidak memiliki atribut ARIA yang diperlukan.

**Dampak:** Tidak ramah bagi pengguna dengan disabilitas.

**Rekomendasi:** Tambahkan `aria-live` untuk toast, `aria-current` untuk navigasi aktif, `aria-label` untuk ikon, dll.

#### 2.3.3 Missing Keyboard Navigation
**Masalah:** Banyak interaksi tidak bisa dilakukan dengan keyboard.

**Dampak:** Pengguna keyboard tidak bisa mengakses semua fitur.

**Rekomendasi:** Pastikan semua fungsi bisa diakses dengan keyboard, fokus yang jelas, urutan tab logis.

### 2.4 Masalah State dan Feedback

#### 2.4.1 Missing Empty States
**Masalah:** Tidak ada state kosong yang informatif.

**Dampak:** Pengguna bingung ketika tidak ada data.

**Rekomendasi:** Buat empty state yang informatif dengan ikon dan CTA.

#### 2.4.2 Missing Loading States
**Masalah:** Tidak ada skeleton loading yang memadai.

**Dampak:** Pengguna tidak tahu apakah aplikasi sedang loading.

**Rekomendasi:** Buat skeleton loading untuk setiap daftar dan kartu.

#### 2.4.3 Missing Error States
**Masalah:** Tidak ada state error yang ramah pengguna.

**Dampak:** Pengguna tidak tahu apa yang salah dan bagaimana memperbaikinya.

**Rekomendasi:** Buat error state dengan penjelasan masalah dan tombol "Coba lagi".

### 2.5 Masalah RPC dan Supabase

#### 2.5.1 Missing RPC Error Handling
**Masalah:** Banyak pemanggilan RPC tidak mengecek `data.success`.

**Dampak:** Pengguna tidak tahu apakah operasi berhasil atau gagal.

**Rekomendasi:** Pastikan semua pemanggilan RPC mengecek `data.success` dan menampilkan `data.error` ke pengguna.

#### 2.5.2 Missing Toast Notifications
**Masalah:** Tidak ada toast notifications untuk feedback pengguna.

**Dampak:** Pengguna tidak tahu hasil operasi.

**Rekomendasi:** Tambahkan toast notifications untuk semua operasi sukses dan error.

## 3. Daftar Perbaikan Prioritas

### Prioritas 1: HCI dan Aksesibilitas
1. Buat design system lengkap dengan CSS variables, komponen bersama, dan pedoman.
2. Tambahkan dark mode toggle di navbar.
3. Buat bottom navigation untuk mobile dan sidebar untuk desktop.
4. Tambahkan skip link untuk aksesibilitas.
5. Tambahkan semua komponen yang diperlukan (AppShell, PageHeader, StatCard, dll.).
6. Pastikan semua interaksi bisa dilakukan dengan keyboard.
7. Tambahkan ARIA yang diperlukan.
8. Buat empty state, loading state, dan error state yang informatif.

### Prioritas 2: Bahasa dan Konten
1. Terjemahkan semua teks antarmuka ke bahasa Indonesia.
2. Buat pesan error yang ramah pengguna.
3. Buat konten yang sesuai dengan target pasar Indonesia.

### Prioritas 3: Technical
1. Nonaktifkan `cacheComponents: true` atau bungkus dengan `<Suspense>`.
2. Perbaiki semua pemanggilan RPC untuk mengecek error.
3. Tambahkan toast notifications untuk semua operasi.
4. Jalankan Playwright testing dan axe accessibility testing.

## 4. Rekomendasi Alat dan Proses

### 4.1 Testing
- Pasang Playwright (`@playwright/test`) dan `@axe-core/playwright` sebagai devDependency.
- Tulis skrip yang membuka semua halaman pada viewport yang berbeda.
- Jalankan pemeriksaan axe dan laporkan pelanggaran.
- Untuk halaman yang memerlukan login, sediakan akun demo di README.

### 4.2 Build dan Lint
- Jalankan `npm run lint` dan `npm run build` untuk memastikan tidak ada error.
- Perbaiki semua error TypeScript dan ESLint.

### 4.3 Dokumentasi
- Buat `docs/UI_AUDIT.md` (sudah dibuat).
- Buat `docs/DESIGN_SYSTEM.md`.
- Buat `docs/HCI_NOTES.md`.
- Buat `README.md` yang diperbarui.

## 5. Kesimpulan

Proyek ini memiliki banyak masalah HCI dan aksesibilitas yang perlu diperbaiki sebelum bisa dianggap selesai. Prioritas utama adalah membuat design system yang konsisten, memastikan aksesibilitas WCAG 2.1 AA, dan menyediakan feedback pengguna yang baik.

Semua masalah ini perlu diperbaiki secara sistematis sesuai dengan urutan yang direkomendasikan. Setelah perbaikan ini selesai, proyek akan memiliki antarmuka yang profesional, aksesibel, dan sesuai dengan standar HCI.