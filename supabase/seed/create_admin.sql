-- ============================================================================
-- File: supabase/seed/create_admin.sql
-- Deskripsi: Skrip untuk membuat akun admin SisaBaik secara manual
-- ============================================================================
--
-- PENTING: Role 'admin' TIDAK dapat dibuat melalui halaman register (/register).
-- Trigger handle_new_user() sengaja menolak role admin saat pendaftaran publik.
-- Oleh karena itu, admin harus dibuat manual lewat SQL atau Supabase Dashboard.
--
-- CARA PENGGUNAAN:
--   1. Buka Supabase Dashboard > SQL Editor
--   2. Salin dan jalankan skrip di bawah ini
--   3. Ganti <USER_UUID> dengan ID user yang sebenarnya dari auth.users
-- ============================================================================

--------------------------------------------------------------------------------
-- OPSI A: Jika Anda sudah mendaftar lewat halaman /register
--------------------------------------------------------------------------------
-- Langkah 1: Daftarkan akun lewat /register (akan menjadi provider atau partner)
-- Langkah 2: Dapatkan ID user dari tabel auth.users
-- Langkah 3: Jalankan UPDATE di bawah ini

-- Contoh: cari user admin (HAPUS tanda < > dari UUID!)
-- select id, email, raw_user_meta_data from auth.users where email = 'admin@sisabaik.id';

--------------------------------------------------------------------------------
-- OPSI B: Buat user baru langsung di auth.users (memerlukan service role key)
--------------------------------------------------------------------------------
-- Catatan: Tidak disarankan dilakukan di SQL Editor publik karena butuh
-- service_role key. Gunakan Supabase Dashboard > Authentication > Users
-- untuk membuat user baru, lalu lanjutkan ke Opsi A di bawah ini.

--------------------------------------------------------------------------------
-- OPSI C: Update profil menjadi admin (Jalankan setelah user sudah ada)
--------------------------------------------------------------------------------

-- Contoh 1: Jika profil sudah ada (misal setelah register), update jadi admin
-- HAPUS tanda < > dari UUID! Contoh benar:
-- where id = '6b78aca8-2e53-4e53-8683-a55d2713bb8e';
update public.profiles
set role = 'admin', is_verified = true
where id = '<USER_UUID>';

-- Contoh 2: Jika profil belum ada, insert baru (pastikan user sudah ada di auth.users)
insert into public.profiles (
  id,
  role,
  organization_name,
  organization_type,
  phone,
  address,
  is_verified
)
values (
  '<USER_UUID>',
  'admin',
  'Admin SisaBaik',
  'Administrator',
  '081234567890',
  'Jakarta, Indonesia',
  true
)
on conflict (id) do update set
  role = 'admin',
  is_verified = true;

--------------------------------------------------------------------------------
-- Contoh lengkap dengan UUID placeholder
--------------------------------------------------------------------------------
-- Ganti '<USER_UUID>' dengan UUID sebenarnya dari auth.users
--
-- update public.profiles
-- set role = 'admin', is_verified = true
-- where id = '550e8400-e29b-41d4-a716-446655440000';

--------------------------------------------------------------------------------
-- Verifikasi setelah dijalankan
--------------------------------------------------------------------------------
-- Jalankan query ini untuk memastikan admin sudah dibuat:
select p.id, p.role, p.organization_name, p.is_verified, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';

-- Hasil yang diharapkan:
-- role = 'admin', is_verified = true, email = 'admin@sisabaik.id'

--------------------------------------------------------------------------------
-- Kredensial default yang disarankan (ubah sesuai kebutuhan)
--------------------------------------------------------------------------------
-- Email:    admin@sisabaik.id
-- Password: admin123
--
-- Catatan: Password diatur saat pendaftaran lewat halaman /register atau
-- Supabase Dashboard > Authentication > Users, bukan di file SQL ini.
