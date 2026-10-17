-- 002_fixes.sql
-- Patch untuk 001_init.sql. Jalankan SETELAH 001_init.sql (aman dijalankan ulang).
-- Memperbaiki: RLS rekursif, kebocoran akses donasi, eskalasi role, bug update_order_status,
-- klaim ulang setelah pembatalan, dan hardening fungsi SECURITY DEFINER.

------------------------------------------------------------------
-- 0. Fungsi bantu (SECURITY DEFINER agar tidak memicu RLS rekursif)
------------------------------------------------------------------
create or replace function public.current_user_role()
returns user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_verified_partner()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'partner' and is_verified = true
  )
$$;

create or replace function public.owns_donation(p_donation_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.donations
    where id = p_donation_id and provider_id = auth.uid()
  )
$$;

-- Siapa boleh melihat profil X: diri sendiri, admin, pihak lawan yang terkait donasi/order
create or replace function public.can_view_profile(p_profile_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    p_profile_id = auth.uid()
    or public.current_user_role() = 'admin'
    -- partner terverifikasi boleh melihat provider dari donasi yang tersedia / order miliknya
    or (
      public.is_verified_partner()
      and exists (
        select 1 from public.donations d
        where d.provider_id = p_profile_id
          and (
            (d.status = 'available' and d.expiry_time > now())
            or exists (
              select 1 from public.orders o
              where o.donation_id = d.id and o.partner_id = auth.uid()
            )
          )
      )
    )
    -- provider boleh melihat partner yang mengklaim donasinya
    or exists (
      select 1 from public.orders o
      join public.donations d on d.id = o.donation_id
      where o.partner_id = p_profile_id and d.provider_id = auth.uid()
    )
$$;

------------------------------------------------------------------
-- 1. Perbaikan RLS: profiles
--    (policy lama membuat infinite recursion dan role/is_verified bisa diubah sendiri)
------------------------------------------------------------------
drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_select_all_for_admin" on profiles;
drop policy if exists "profiles_update_own" on profiles;

create policy "profiles_select_visible" on profiles
  for select using (public.can_view_profile(id));

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Batasi kolom yang boleh diubah user: role dan is_verified TIDAK termasuk.
revoke update on public.profiles from anon, authenticated;
grant update (organization_name, organization_type, phone, address)
  on public.profiles to authenticated;

------------------------------------------------------------------
-- 2. Perbaikan RLS: donations
--    (policy lama: "provider_id = donations.provider_id" selalu true -> semua provider
--     bisa melihat dan mengubah donasi provider lain)
------------------------------------------------------------------
drop policy if exists "donations_select_own" on donations;
drop policy if exists "donations_insert_own" on donations;
drop policy if exists "donations_update_own" on donations;
drop policy if exists "donations_select_for_verified_partner" on donations;
drop policy if exists "donations_select_admin" on donations;

create policy "donations_select_own" on donations
  for select using (provider_id = auth.uid());

create policy "donations_insert_own" on donations
  for insert with check (
    provider_id = auth.uid()
    and public.current_user_role() = 'provider'
    and status = 'available'
  );

-- Edit langsung hanya untuk donasi yang masih available dan tetap available.
-- Pembatalan dan perubahan status lain wajib lewat RPC.
create policy "donations_update_own" on donations
  for update
  using (provider_id = auth.uid() and status = 'available')
  with check (provider_id = auth.uid() and status = 'available');

create policy "donations_select_partner" on donations
  for select using (
    public.is_verified_partner()
    and (
      (status = 'available' and expiry_time > now())
      or exists (
        select 1 from public.orders o
        where o.donation_id = donations.id and o.partner_id = auth.uid()
      )
    )
  );

create policy "donations_select_admin" on donations
  for select using (public.current_user_role() = 'admin');

------------------------------------------------------------------
-- 3. Perbaikan RLS: orders
------------------------------------------------------------------
drop policy if exists "orders_select_provider" on orders;
drop policy if exists "orders_select_partner" on orders;
drop policy if exists "orders_select_admin" on orders;

create policy "orders_select_provider" on orders
  for select using (public.owns_donation(donation_id));

create policy "orders_select_partner" on orders
  for select using (partner_id = auth.uid());

create policy "orders_select_admin" on orders
  for select using (public.current_user_role() = 'admin');

------------------------------------------------------------------
-- 4. Klaim ulang setelah order dibatalkan
--    (UNIQUE(donation_id) membuat donasi yang kembali available tidak bisa diklaim lagi)
------------------------------------------------------------------
alter table orders drop constraint if exists orders_donation_id_key;
create unique index if not exists orders_one_active_per_donation
  on orders (donation_id) where status <> 'cancelled';

------------------------------------------------------------------
-- 5. updated_at otomatis
------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists donations_set_updated_at on donations;
create trigger donations_set_updated_at
  before update on donations
  for each row execute function public.set_updated_at();

------------------------------------------------------------------
-- 6. Trigger registrasi (tambah search_path + tangani role kosong)
------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role text := new.raw_user_meta_data ->> 'role';
begin
  if v_role is distinct from 'provider' and v_role is distinct from 'partner' then
    raise exception 'Role tidak valid. Pilih provider atau partner.';
  end if;

  insert into public.profiles (
    id, role, organization_name, organization_type, phone, address, is_verified
  ) values (
    new.id,
    v_role::user_role,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''), 'Tanpa nama'),
    new.raw_user_meta_data ->> 'organization_type',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'address',
    false
  );

  return new;
end;
$$;

------------------------------------------------------------------
-- 7. RPC (ditulis ulang: search_path, select tanpa join, bug sinkronisasi status)
--    Catatan: RPC mengembalikan JSON {success, error}. Frontend WAJIB cek `success`.
------------------------------------------------------------------
create or replace function public.claim_donation(p_donation_id uuid)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_donation donations%rowtype;
  v_order orders%rowtype;
begin
  if not public.is_verified_partner() then
    raise exception 'Akun belum terverifikasi. Hubungi administrator untuk verifikasi.';
  end if;

  select * into v_donation from donations where id = p_donation_id for update;

  if not found then
    raise exception 'Donasi tidak ditemukan.';
  end if;

  if v_donation.status <> 'available' then
    if v_donation.status = 'claimed' then
      raise exception 'Donasi sudah diklaim pihak lain.';
    else
      raise exception 'Donasi tidak tersedia (status: %).', v_donation.status;
    end if;
  end if;

  if v_donation.expiry_time <= now() then
    raise exception 'Donasi sudah melewati batas kelayakan.';
  end if;

  update donations set status = 'claimed' where id = p_donation_id;

  insert into orders (donation_id, partner_id, status)
  values (p_donation_id, auth.uid(), 'pending')
  returning * into v_order;

  return json_build_object(
    'success', true,
    'order_id', v_order.id,
    'donation_id', v_order.donation_id,
    'partner_id', v_order.partner_id,
    'status', v_order.status,
    'claimed_at', v_order.claimed_at
  );
exception when others then
  return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.update_order_status(p_order_id uuid, p_new_status order_status)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_donation donations%rowtype;
  v_donation_status donation_status;
begin
  if not public.is_verified_partner() then
    raise exception 'Akses ditolak: akun belum terverifikasi.';
  end if;

  select * into v_order
  from orders
  where id = p_order_id and partner_id = auth.uid()
  for update;

  if not found then
    raise exception 'Akses ditolak: Anda bukan pemilik order ini.';
  end if;

  select * into v_donation from donations where id = v_order.donation_id for update;

  if not (
    (v_order.status = 'pending'    and p_new_status in ('in_transit', 'cancelled')) or
    (v_order.status = 'in_transit' and p_new_status in ('completed', 'cancelled'))
  ) then
    raise exception 'Transisi status tidak valid: % -> %', v_order.status, p_new_status;
  end if;

  update orders
  set status = p_new_status,
      completed_at = case when p_new_status = 'completed' then now() else completed_at end
  where id = p_order_id
  returning * into v_order;

  if p_new_status = 'completed' then
    update donations set status = 'delivered' where id = v_donation.id;
  elsif p_new_status = 'cancelled' then
    update donations
    set status = case
      when v_donation.expiry_time > now() then 'available'::donation_status
      else 'cancelled'::donation_status
    end
    where id = v_donation.id;
  end if;
  -- in_transit: status donasi tetap 'claimed'

  select status into v_donation_status from donations where id = v_donation.id;

  return json_build_object(
    'success', true,
    'order_id', v_order.id,
    'new_status', v_order.status,
    'donation_status', v_donation_status
  );
exception when others then
  return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.cancel_donation(p_donation_id uuid)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_donation donations%rowtype;
begin
  if public.current_user_role() is distinct from 'provider' then
    raise exception 'Akses ditolak: hanya penyedia makanan yang dapat membatalkan donasi.';
  end if;

  select * into v_donation
  from donations
  where id = p_donation_id and provider_id = auth.uid()
  for update;

  if not found then
    raise exception 'Akses ditolak: Anda bukan pemilik donasi ini.';
  end if;

  if v_donation.status <> 'available' then
    raise exception 'Hanya donasi berstatus "available" yang dapat dibatalkan. Untuk donasi yang sudah diklaim, hubungi mitra penyalur.';
  end if;

  update donations set status = 'cancelled'
  where id = p_donation_id
  returning * into v_donation;

  return json_build_object(
    'success', true,
    'donation_id', v_donation.id,
    'new_status', v_donation.status
  );
exception when others then
  return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.verify_profile(p_profile_id uuid, p_verified boolean)
returns json
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'Akses ditolak: hanya admin yang dapat memverifikasi profil.';
  end if;

  update profiles set is_verified = p_verified where id = p_profile_id;

  if not found then
    raise exception 'Profil tidak ditemukan.';
  end if;

  return json_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'is_verified', p_verified
  );
exception when others then
  return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

------------------------------------------------------------------
-- 8. Hak eksekusi RPC: hanya user login
------------------------------------------------------------------
revoke execute on function public.claim_donation(uuid) from public, anon;
revoke execute on function public.update_order_status(uuid, order_status) from public, anon;
revoke execute on function public.cancel_donation(uuid) from public, anon;
revoke execute on function public.verify_profile(uuid, boolean) from public, anon;

grant execute on function public.claim_donation(uuid) to authenticated;
grant execute on function public.update_order_status(uuid, order_status) to authenticated;
grant execute on function public.cancel_donation(uuid) to authenticated;
grant execute on function public.verify_profile(uuid, boolean) to authenticated;
