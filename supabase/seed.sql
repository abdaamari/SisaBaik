-- Seed data untuk SisaBaik
-- Petunjuk: Jalankan di SQL Editor Supabase setelah migrasi 001_init.sql

-- ============================================
-- 1. Buat akun demo melalui Supabase Auth
-- ============================================
-- Catatan: Akun harus dibuat melalui Supabase Auth (Sign Up) atau
-- melalui SQL Editor dengan insert ke auth.users (memerlukan service role key).
-- Berikut adalah contoh email dan password untuk akun demo:

-- Admin: admin@sisabaik.id / Admin123!
-- Provider 1: provider1@sisabaik.id / Provider123!
-- Provider 2: provider2@sisabaik.id / Provider123!
-- Partner 1: partner1@sisabaik.id / Partner123!
-- Partner 2: partner2@sisabaik.id / Partner123!

-- ============================================
-- 2. Setelah akun dibuat, insert profil ke tabel profiles
-- ============================================
-- Ganti UUID dengan id yang dihasilkan dari auth.users

-- Contoh (ganti UUID dengan yang sebenarnya):
-- insert into profiles (id, role, organization_name, organization_type, phone, address, is_verified)
-- values
--   ('<admin-uuid>', 'admin', 'Admin SisaBaik', 'Administrator', '081234567890', 'Jakarta, Indonesia', true),
--   ('<provider1-uuid>', 'provider', 'Resto Sejahtera', 'Restoran', '081234567891', 'Jakarta Pusat, Indonesia', true),
--   ('<provider2-uuid>', 'provider', 'Bakery Manis', 'Toko Roti', '081234567892', 'Jakarta Selatan, Indonesia', true),
--   ('<partner1-uuid>', 'partner', 'Yayasan Pangan Indonesia', 'LSM', '081234567893', 'Jakarta Barat, Indonesia', true),
--   ('<partner2-uuid>', 'partner', 'Bank Makanan Jakarta', 'Bank Makanan', '081234567894', 'Jakarta Timur, Indonesia', true);

-- ============================================
-- 3. Seed data donasi (contoh)
-- ============================================
-- Ganti <provider1-uuid> dan <provider2-uuid> dengan UUID sebenarnya

-- insert into donations (provider_id, food_name, category, quantity, unit, expiry_time, pickup_address, description, status)
-- values
--   ('<provider1-uuid>', 'Nasi Goreng Spesial', 'Makanan Berat', 50, 'porsi', now() + interval '2 hours', 'Jl. Sudirman No. 1, Jakarta Pusat', 'Nasi goreng dengan ayam dan telur, siap dikonsumsi.', 'available'),
--   ('<provider1-uuid>', 'Roti Tawar Segar', 'Roti/Kue', 30, 'buah', now() + interval '6 hours', 'Jl. Sudirman No. 1, Jakarta Pusat', 'Roti tawar segar dari oven, expired besok pagi.', 'available'),
--   ('<provider2-uuid>', 'Jus Buah Campuran', 'Minuman', 20, 'gelas', now() + interval '1 hour', 'Jl. Kebon Sirih No. 5, Jakarta Selatan', 'Jus buah segar tanpa gula tambah.', 'available'),
--   ('<provider1-uuid>', 'Salad Buah Segar', 'Buah/Sayur', 15, 'porsi', now() + interval '3 hours', 'Jl. Sudirman No. 1, Jakarta Pusat', 'Salad buah dengan berbagai jenis buah segar.', 'claimed'),
--   ('<provider2-uuid>', 'Kue Bolu Panggang', 'Roti/Kue', 25, 'potong', now() + interval '8 hours', 'Jl. Kebon Sirih No. 5, Jakarta Selatan', 'Kue bolu panggang homemade.', 'available'),
--   ('<provider1-uuid>', 'Mie Ayam Spesial', 'Makanan Berat', 40, 'porsi', now() - interval '1 hour', 'Jl. Sudirman No. 1, Jakarta Pusat', 'Mie ayam yang sudah melewati batas kelayakan.', 'cancelled'),
--   ('<provider2-uuid>', 'Nasi Kuning Tumpeng', 'Makanan Berat', 10, 'porsi', now() + interval '4 hours', 'Jl. Kebon Sirih No. 5, Jakarta Selatan', 'Nasi kuning untuk acara spesial.', 'available'),
--   ('<provider1-uuid>', 'Es Teh Manis', 'Minuman', 60, 'gelas', now() + interval '5 hours', 'Jl. Sudirman No. 1, Jakarta Pusat', 'Es teh manis segar.', 'delivered');

-- ============================================
-- 4. Cara membuat admin secara manual
-- ============================================
-- Admin tidak dapat dibuat melalui registrasi. Buat manual lewat SQL:
-- 1. Daftarkan akun melalui halaman register (akan menjadi provider atau partner)
-- 2. Update role menjadi 'admin' dan is_verified = true di tabel profiles:
--    update profiles set role = 'admin', is_verified = true where id = '<user-uuid>';
-- 3. Atau insert langsung ke profiles dengan role 'admin' setelah membuat user di auth.users

-- ============================================
-- 5. Petunjuk menjalankan seed
-- ============================================
-- 1. Buat project Supabase baru
-- 2. Jalankan migrasi 001_init.sql di SQL Editor
-- 3. Buat akun demo melalui halaman register atau Supabase Auth
-- 4. Insert profil ke tabel profiles dengan UUID yang sesuai
-- 5. Jalankan seed data donasi di atas
-- 6. Pastikan untuk memverifikasi partner (is_verified = true) agar dapat mengklaim donasi