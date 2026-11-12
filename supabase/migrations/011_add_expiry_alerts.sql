-- 011_add_expiry_alerts.sql
-- Sistem peringatan kedaluwarsa donasi.
-- Jalankan SETELAH 010_add_donation_location.sql.

------------------------------------------------------------------
-- 1. Tambah kolom expiry_notified_at ke tabel donations
--    Untuk melacak kapan terakhir kali notifikasi kedaluwarsa dikirim,
--    mencegah notifikasi duplikat.
------------------------------------------------------------------
alter table donations
  add column if not exists expiry_notified_at timestamptz;

comment on column donations.expiry_notified_at is 'Timestamp terakhir notifikasi kedaluwarsa donasi dikirim ke provider';

------------------------------------------------------------------
-- 2. Indeks untuk performa query donasi yang akan kedaluwarsa
------------------------------------------------------------------
create index if not exists donations_expiry_notified_idx
  on donations (expiry_time, expiry_notified_at)
  where status = 'available';
