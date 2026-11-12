-- 004_add_notifications.sql
-- Tabel notifikasi untuk partner dan provider, dengan Supabase Realtime.
-- Jalankan SETELAH 003_add_donation_images.sql.

------------------------------------------------------------------
-- 1. Tipe notifikasi
------------------------------------------------------------------
create type notification_type as enum (
  'new_donation',
  'donation_claimed',
  'order_status_changed',
  'system'
);

------------------------------------------------------------------
-- 2. Tabel notifications
------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null default 'system',
  title text not null,
  message text,
  data jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table notifications is 'Notifikasi in-app untuk pengguna (partner, provider, admin)';
comment on column notifications.data is 'Data tambahan, mis. donation_id atau order_id';

------------------------------------------------------------------
-- 3. RLS
------------------------------------------------------------------
alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Hanya sistem (melalui service role atau trigger) yang boleh insert
create policy "notifications_insert_system" on notifications
  for insert with check (auth.uid() = user_id);

------------------------------------------------------------------
-- 4. Indeks
------------------------------------------------------------------
create index on notifications (user_id, read);
create index on notifications (user_id, created_at desc);

------------------------------------------------------------------
-- 5. Enable Realtime
------------------------------------------------------------------
alter publication supabase_realtime add table notifications;
