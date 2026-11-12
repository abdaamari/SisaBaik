-- 007_fix_reward_redemptions_fk.sql
-- Perbaiki foreign key user_id di reward_redemptions dan point_transactions
-- agar merujuk langsung ke profiles(id), bukan auth.users(id).
-- Jalankan SETELAH 005_add_points_and_rewards.sql.

------------------------------------------------------------------
-- 1. Drop foreign key lama (ke auth.users) dan buat baru (ke profiles)
------------------------------------------------------------------

-- reward_redemptions: drop FK lama, buat baru ke profiles
alter table reward_redemptions
  drop constraint if exists reward_redemptions_user_id_fkey;

alter table reward_redemptions
  add constraint reward_redemptions_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- point_transactions: drop FK lama, buat baru ke profiles
alter table point_transactions
  drop constraint if exists point_transactions_user_id_fkey;

alter table point_transactions
  add constraint point_transactions_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

------------------------------------------------------------------
-- 2. Update RLS policy untuk point_transactions (referensi ke profiles)
------------------------------------------------------------------
drop policy if exists "point_transactions_select_own" on point_transactions;
create policy "point_transactions_select_own"
  on point_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "point_transactions_insert_system" on point_transactions;
create policy "point_transactions_insert_system"
  on point_transactions for insert
  with check (auth.uid() = user_id);

------------------------------------------------------------------
-- 3. Update RLS policy untuk reward_redemptions
------------------------------------------------------------------
drop policy if exists "reward_redemptions_select_own" on reward_redemptions;
create policy "reward_redemptions_select_own"
  on reward_redemptions for select
  using (auth.uid() = user_id);

drop policy if exists "reward_redemptions_insert_own" on reward_redemptions;
create policy "reward_redemptions_insert_own"
  on reward_redemptions for insert
  with check (auth.uid() = user_id);
