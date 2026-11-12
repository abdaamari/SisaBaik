-- 006_add_reward_images.sql
-- Tambah kolom image_url pada tabel rewards untuk foto voucher/hadiah.
-- Jalankan SETELAH 005_add_points_and_rewards.sql.

------------------------------------------------------------------
-- 1. Tambah kolom image_url ke tabel rewards
------------------------------------------------------------------
alter table rewards
  add column if not exists image_url text;

comment on column rewards.image_url is 'URL foto voucher/hadiah di Supabase Storage';
