-- 008_add_admin_select_redemptions.sql
-- Tambah RLS policy agar admin dapat melihat semua reward_redemptions dan point_transactions.
-- Jalankan SETELAH 007_fix_reward_redemptions_fk.sql.

------------------------------------------------------------------
-- 1. Admin dapat melihat semua reward_redemptions
------------------------------------------------------------------
drop policy if exists "reward_redemptions_select_admin" on reward_redemptions;
create policy "reward_redemptions_select_admin"
  on reward_redemptions for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

------------------------------------------------------------------
-- 2. Admin dapat melihat semua point_transactions
------------------------------------------------------------------
drop policy if exists "point_transactions_select_admin" on point_transactions;
create policy "point_transactions_select_admin"
  on point_transactions for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
