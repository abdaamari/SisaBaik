-- 009_add_reviews.sql
-- Sistem rating dan ulasan untuk donasi yang telah disalurkan.
-- Jalankan SETELAH 008_add_admin_select_redemptions.sql.

------------------------------------------------------------------
-- 1. Tabel reviews (ulasan dari partner terhadap provider)
------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references donations(id) on delete cascade,
  partner_id uuid not null references profiles(id) on delete cascade,
  provider_id uuid not null references profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table reviews is 'Ulasan dan rating partner terhadap provider setelah donasi disalurkan';
comment on column reviews.rating is 'Skala 1-5 bintang';

------------------------------------------------------------------
-- 2. Unique constraint: satu partner hanya bisa review satu donasi sekali
------------------------------------------------------------------
create unique index reviews_one_per_partner_donation
  on reviews (donation_id, partner_id);

------------------------------------------------------------------
-- 3. RLS policies
------------------------------------------------------------------
alter table reviews enable row level security;

-- Siapa pun boleh melihat review (untuk ditampilkan di detail donasi)
create policy "reviews_select_public"
  on reviews for select
  using (true);

-- Hanya partner yang dapat membuat review untuk donasi yang diklaimnya
create policy "reviews_insert_partner"
  on reviews for insert
  with check (
    auth.uid() = partner_id
    and exists (
      select 1 from orders
      where orders.donation_id = reviews.donation_id
        and orders.partner_id = auth.uid()
        and orders.status = 'completed'
    )
  );

-- Hanya pemilik review yang dapat mengubah/hapus
create policy "reviews_update_owner"
  on reviews for update
  using (auth.uid() = partner_id)
  with check (auth.uid() = partner_id);

create policy "reviews_delete_owner"
  on reviews for delete
  using (auth.uid() = partner_id);

------------------------------------------------------------------
-- 4. Indeks untuk performa
------------------------------------------------------------------
create index on reviews (provider_id, created_at desc);
create index on reviews (donation_id);
create index on reviews (rating);

------------------------------------------------------------------
-- 5. Enable Realtime untuk notifikasi review baru
------------------------------------------------------------------
alter publication supabase_realtime add table reviews;
