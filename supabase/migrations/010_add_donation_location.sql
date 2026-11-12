-- 010_add_donation_location.sql
-- Tambah kolom latitude dan longitude di tabel donations untuk share lokasi pengambilan.
-- Jalankan SETELAH 009_add_reviews.sql.

------------------------------------------------------------------
-- 1. Tambah kolom latitude dan longitude ke tabel donations
------------------------------------------------------------------
alter table donations
  add column if not exists latitude double precision;

alter table donations
  add column if not exists longitude double precision;

comment on column donations.latitude is 'Lokasi latitude pengambilan donasi (opsional)';
comment on column donations.longitude is 'Lokasi longitude pengambilan donasi (opsional)';

------------------------------------------------------------------
-- 2. Indeks untuk performa query radius (jika diperlukan di masa depan)
------------------------------------------------------------------
create index if not exists donations_lat_long_idx on donations (latitude, longitude);
