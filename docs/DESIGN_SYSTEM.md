# Design System - SisaBaik

## Warna (Colors)

### Warna Primer
- **Primary**: `#0A9C95` (Teal) - Aplikasi utama
- **Primary Foreground**: `#FFFFFF` (Putih)
- **Primary Hover**: `#087972`
- **Primary Active**: `#065F66`

### Warna Sekunder
- **Secondary**: `#84CC16 (Lime)` - Highlight/Accent
- **Secondary Foreground**: `#000000` (Hitam)
- **Secondary Hover**: `#6EAA10`
- **Secondary Active**: `#5A950A`

### Warna Status
- **Success**: `#10B981` (Green) - Tersedia/Diterima
- **Success Foreground**: `#FFFFFF`
- **Warning**: `#F59E0B` (Yellow) - Diklaim/Sedang proses
- **Warning Foreground**: `#000000`
- **Error**: `#EF4444` (Red) - Dibatalkan/Kesalahan
- **Error Foreground**: `#FFFFFF`
- **Info**: `#3B82F6` (Blue) - Informasi

### Warna Neutral
- **50**: `#F8FAFC`
- **100**: `#F1F5F9`
- **200**: `#E2E8F0`
- **300**: `#CBD5E1`
- **400**: `#94A3B8`
- **500**: `#64748B` - Teks utama
- **600**: `#475569` - Teks secondary
- **700**: `#334155` - Teks tertiary
- **800**: `#1E293B` - Teks terang
- **900**: `#0F172A` - Teks gelap
- **950**: `#020617` - Tema gelap

### Warna Background
- **Background**: `#F8FAFC` - Light mode
- **Background Foreground**: `#0F172A` - Light mode
- **Dark Background**: `#0F172A` - Dark mode
- **Dark Background Foreground**: `#F8FAFC` - Dark mode

### Warna Card
- **Card**: `#FFFFFF` - Light mode
- **Card Foreground**: `#0F172A` - Light mode
- **Dark Card**: `#1E293B` - Dark mode
- **Dark Card Foreground**: `#F8FAFC` - Dark mode

### Warna Muted
- **Muted**: `#64748B` - Teks secondary
- **Muted Foreground**: `#64748B`
- **Dark Muted**: `#94A3B8` - Dark mode

## Typography

### Font Family
- **Sans**: `Inter`, sistem font stack
- **Mono**: `JetBrains Mono`, sistem font stack

### Font Size
- **xs**: `0.75rem` (12px)
- **sm**: `0.875rem` (14px)
- **base**: `1rem` (16px)
- **lg**: `1.125rem` (18px)
- **xl**: `1.25rem` (20px)
- **2xl**: `1.5rem` (24px)
- **3xl**: `1.875rem` (30px)
- **4xl**: `2.25rem` (36px)
- **5xl**: `3rem` (48px)

### Font Weight
- **Light**: `300`
- **Normal**: `400`
- **Medium**: `500`
- **Semibold**: `600`
- **Bold**: `700`

### Line Height
- **None**: `1`
- **Tight**: `1.25`
- **Snug**: `1.375`
- **Normal**: `1.5`
- **Relaxed**: `1.625`
- **Loose**: `2`

## Spacing

### Scale
- **0**: `0rem`
- **1**: `0.25rem` (4px)
- **2**: `0.5rem` (8px)
- **3**: `0.75rem` (12px)
- **4**: `1rem` (16px)
- **5**: `1.25rem` (20px)
- **6**: `1.5rem` (24px)
- **8**: `2rem` (32px)
- **10**: `2.5rem` (40px)
- **12**: `3rem` (48px)
- **16**: `4rem` (64px)
- **20**: `5rem` (80px)
- **24**: `6rem` (96px)

## Border Radius

### Scale
- **none**: `0`
- **sm**: `0.125rem` (2px)
- **md**: `0.3125rem` (5px)
- **lg**: `0.5rem` (8px)
- **xl**: `0.75rem` (12px)
- **2xl**: `1rem` (16px)
- **3xl**: `1.5rem` (24px)
- **full**: `9999px`

## Shadows

### Scale
- **sm**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)`
- **2xl**: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`

## Components

### Button

#### Variants
- **default**: Background primer, teks putih
- **outline**: Border primer, teks primer, background transparan
- **ghost**: Background transparan, hover warna abu-abu
- **danger**: Background error, teks white

#### Sizes
- **sm**: `h-8 py-1 px-3 text-sm`
- **default**: `h-10 py-2 px-4 text-base`
- **lg**: `h-12 py-3 px-6 text-lg`
- **icon**: `h-10 w-10`

### Card

#### Default
- Background: `white` (light) / `1E293B` (dark)
- Border: `1px solid #E2E8F0` / `334155`
- Radius: `md`
- Shadow: `md`

### Status Badge

#### States
- **available**: Background `#D1FAE5` (Green 100), teks `#10B981`, ikon check
- **claimed**: Background `#FEF3C7` (Yellow 100), teks `#F59E0B`, ikon clock
- **delivered**: Background `#BBF7D0` (Green 100), teks `#059669`, ikon check-circle
- **cancelled**: Background `#FECACA` (Red 100), teks `#EF4444`, ikon x-circle
- **pending**: Background `#F3F4F6` (Gray 100), teks `#64748B`, ikon clock

### Timeline

#### Steps
- **Completed**: Background primer, teks white
- **Current**: Background warning, teks #000000
- **Pending**: Background gray-200, teks #64748B
- **Failed**: Background error, teks white

### Empty State

#### Structure
- Ikon besar (32px-48px)
- Judul: "Tidak ada data"
- Deskripsi: Penjelasan singkat
- CTA (Call to Action) jika relevan

### Error State

#### Structure
- Ikon error (48px)
- Judul: "Terjadi kesalahan"
- Deskripsi: Penjelasan masalah
- Tombol "Coba lagi"

### Skeleton Loading

#### Variants
- **line**: `h-4 w-24` - Untuk teks
- **card**: `h-96 w-full` - Untuk kartu
- **button**: `h-6 w-24` - Untuk button

## Navigation

### Desktop Sidebar

#### Structure
- Logo di atas
- Nav links vertikal
- Item aktif dengan background highlight
- Badge notifikasi jika ada

#### Breakpoints
- **xl**: Tampil sidebar penuh
- **lg**: Sidebar collapse dengan icon saja
- **sm**: Tidak tampil, bottom navigation

### Mobile Bottom Navigation

#### Structure
- 5 item navigasi
- Minimum target sentuh: 44px × 44px
- Active item dengan badge warna
- Inactive item dengan icon abu-abu

#### Items
1. **Beranda** - Home
2. **Donasi** - Donations
3. **Profil** - Profile
4. **Klaim** - Claims (partner only)
5. **Pengaturan** - Settings

## Accessibility

### WCAG 2.1 AA Compliance

#### Contrast Ratio
- **Normal text**: Minimal 4.5:1
- **Large text**: Minimal 3:1
- **UI Components**: Minimal 3:1

#### Keyboard Navigation
- Semua interaksi bisa diakses dengan Tab
- Urutan tab logis
- Focus visible dengan outline yang jelas
- Shortcut yang konsisten

#### Screen Reader
- Semantic HTML elements
- ARIA labels pada ikon dan button
- Live regions untuk toast notifications
- Skip link ke konten utama

#### Focus Management
- Focus ring: `2px solid #0A9C95` atau `2px solid #84CC16`
- Focus ring pada element interaktif
- Tidak ada focus yang hilang secara tiba-tiba

## Responsive Breakpoints

- **xs**: <640px
- **sm**: ≥640px
- **md**: ≥768px
- **lg**: ≥1024px
- **xl**: ≥1280px
- **2xl**: ≥1536px

## Color Tokens (Tailwind Config)

```javascript
module.exports = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'oklch(0.205 0 0)',
          foreground: 'oklch(0.985 0 0)',
        },
        secondary: {
          DEFAULT: 'oklch(0.97 0 0)',
          foreground: 'oklch(0.205 0 0)',
        },
        success: {
          DEFAULT: 'oklch(0.87 0.13 145.2)',
          foreground: 'oklch(0.145 0 0)',
        },
        warning: {
          DEFAULT: 'oklch(0.97 0.19 83.1)',
          foreground: 'oklch(0.205 0 0)',
        },
        error: {
          DEFAULT: 'oklch(0.577 0.245 27.325)',
          foreground: 'oklch(0.985 0 0)',
        },
        info: {
          DEFAULT: 'oklch(0.647 0.148 226.3)',
          foreground: 'oklch(0.985 0 0)',
        },
      },
    },
  },
};