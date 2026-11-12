-- 005_add_points_and_rewards.sql
-- Sistem poin dan hadiah untuk mendorong donasi.
-- Jalankan SETELAH 004_add_notifications.sql.

------------------------------------------------------------------
-- 1. Tambah kolom points ke tabel profiles
------------------------------------------------------------------
alter table profiles
  add column if not exists points integer not null default 0;

comment on column profiles.points is 'Poin reward yang terkumpul dari donasi';

------------------------------------------------------------------
-- 2. Tabel rewards (hadiah yang disediakan admin)
------------------------------------------------------------------
create type reward_status as enum ('pending', 'fulfilled', 'cancelled');

create table rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  points_cost integer not null check (points_cost > 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table rewards is 'Katalog hadiah yang dapat ditukarkan dengan poin';
comment on column rewards.points_cost is 'Biaya poin untuk menukar hadiah ini';
comment on column rewards.stock is 'Stok hadiah yang tersedia';

------------------------------------------------------------------
-- 3. Tabel point_transactions (riwayat perubahan poin)
------------------------------------------------------------------
create type point_transaction_type as enum ('earned', 'redeemed');

create table point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type point_transaction_type not null,
  amount integer not null check (amount > 0),
  description text,
  created_at timestamptz not null default now()
);

comment on table point_transactions is 'Riwayat penambahan dan pengurangan poin';

------------------------------------------------------------------
-- 4. Tabel reward_redemptions (permintaan penukaran hadiah)
------------------------------------------------------------------
create table reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid not null references rewards(id) on delete cascade,
  points_spent integer not null check (points_spent > 0),
  status reward_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table reward_redemptions is 'Permintaan penukaran hadiah oleh pengguna';

------------------------------------------------------------------
-- 5. RLS policies
------------------------------------------------------------------
alter table rewards enable row level security;
alter table point_transactions enable row level security;
alter table reward_redemptions enable row level security;

-- Siapa pun boleh melihat reward yang aktif
create policy "rewards_select_public"
  on rewards for select
  using (is_active = true);

-- Hanya admin yang boleh insert/update/delete reward
create policy "rewards_insert_admin"
  on rewards for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "rewards_update_admin"
  on rewards for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "rewards_delete_admin"
  on rewards for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- User hanya boleh melihat poin transaksi miliknya
create policy "point_transactions_select_own"
  on point_transactions for select
  using (auth.uid() = user_id);

-- Hanya sistem/trigger yang boleh insert poin transaksi
create policy "point_transactions_insert_system"
  on point_transactions for insert
  with check (auth.uid() = user_id);

-- User hanya boleh melihat redemption miliknya
create policy "reward_redemptions_select_own"
  on reward_redemptions for select
  using (auth.uid() = user_id);

-- User hanya boleh insert redemption miliknya
create policy "reward_redemptions_insert_own"
  on reward_redemptions for insert
  with check (auth.uid() = user_id);

-- Hanya admin yang boleh update status redemption
create policy "reward_redemptions_update_admin"
  on reward_redemptions for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

------------------------------------------------------------------
-- 6. Indeks untuk performa
------------------------------------------------------------------
create index on profiles (points);
create index on point_transactions (user_id, created_at desc);
create index on reward_redemptions (user_id, created_at desc);
create index on reward_redemptions (status);

------------------------------------------------------------------
-- 7. Fungsi RPC: add_points (SECURITY DEFINER untuk bypass RLS)
------------------------------------------------------------------
create or replace function public.add_points(
  p_user_id uuid,
  p_amount integer,
  p_description text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Update poin pada profil
  update profiles
  set points = points + p_amount
  where id = p_user_id;

  -- Catat transaksi poin
  insert into point_transactions (user_id, type, amount, description)
  values (p_user_id, 'earned', p_amount, p_description);

end;
$$;

------------------------------------------------------------------
-- 8. Enable Realtime untuk notifikasi poin baru
------------------------------------------------------------------
alter publication supabase_realtime add table point_transactions;
alter publication supabase_realtime add table reward_redemptions;
