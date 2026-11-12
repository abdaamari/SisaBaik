-- 003_add_donation_images.sql
-- Tambah kolom image_url pada tabel donations.
-- Jalankan SETELAH 002_fixes.sql.
--
-- CATATAN: Buat Storage bucket dan policy-nya lewat Supabase Dashboard
-- (Storage > Bucket > "donation-images"), bukan via SQL Editor,
-- karena storage.objects adalah tabel sistem Supabase yang tidak
-- bisa diubah RLS-nya lewat SQL dengan role biasa.

------------------------------------------------------------------
-- 1. Tambah kolom image_url ke tabel donations
------------------------------------------------------------------
alter table donations
  add column if not exists image_url text;

comment on column donations.image_url is 'URL foto donasi di Supabase Storage (bucket donation-images)';
