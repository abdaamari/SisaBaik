-- Migration: 001_init.sql
-- Membuat tipe enum untuk role pengguna dan status donasi

create type user_role as enum ('provider', 'partner', 'admin');
create type donation_status as enum ('available', 'claimed', 'delivered', 'cancelled');
create type order_status as enum ('pending', 'in_transit', 'completed', 'cancelled');

-- Tabel profiles: menyimpan informasi organisasi pengguna
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  organization_name text not null,
  organization_type text,            -- contoh: Restoran, Katering, LSM, Bank Makanan
  phone text,
  address text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tabel donations: menyimpan daftar donasi makanan berlebih
create table donations (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references profiles(id) on delete cascade,
  food_name text not null,
  category text not null,            -- Makanan Berat, Roti/Kue, Minuman, Buah/Sayur, Lainnya
  quantity integer not null check (quantity > 0),
  unit text not null default 'porsi',
  expiry_time timestamptz not null,
  pickup_address text not null,
  description text,
  status donation_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabel orders: mencatat klaim donasi oleh mitra
create table orders (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null unique references donations(id) on delete cascade,
  partner_id uuid not null references profiles(id) on delete cascade,
  status order_status not null default 'pending',
  claimed_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Indeks untuk performa query
create index on donations (status, expiry_time);
create index on donations (provider_id);
create index on orders (partner_id);

-- Trigger untuk membuat profil otomatis saat pengguna mendaftar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Validasi role: admin tidak boleh dibuat lewat metadata auth.users
  if new.raw_user_meta_data ->> 'role' = 'admin' then
    raise exception 'Role admin tidak dapat dibuat lewat registrasi. Hubungi administrator.';
  end if;

  -- Validasi role yang diizinkan
  if (new.raw_user_meta_data ->> 'role') not in ('provider', 'partner') then
    raise exception 'Role tidak valid. Pilih provider atau partner.';
  end if;

  -- Buat profil baru
  insert into public.profiles (
    id,
    role,
    organization_name,
    organization_type,
    phone,
    address,
    is_verified
  ) values (
    new.id,
    (new.raw_user_meta_data ->> 'role')::user_role,
    new.raw_user_meta_data ->> 'organization_name',
    new.raw_user_meta_data ->> 'organization_type',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'address',
    false  -- Mitra perlu diverifikasi oleh admin
  );

  return new;
end;
$$ language plpgsql security definer;

-- Terapkan trigger setelah insert ke tabel auth.users
create trigger on_auth_user_insert
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Fungsi RPC: claim_donation
create or replace function public.claim_donation(p_donation_id uuid)
returns json
language plpgsql
security definer
-- Mengatur search_path untuk keamanan
as $$
declare
  v_donation donations%rowtype;
  v_order orders%rowtype;
  v_partner profiles%rowtype;
  v_error_message text;
begin
  -- Validasi partner terverifikasi
  select * into v_partner
  from profiles
  where id = auth.uid() and role = 'partner' and is_verified = true;

  if not found then
    raise exception 'Akun belum terverifikasi. Hubungi administrator untuk verifikasi.';
  end if;

  -- Pilih donasi dengan kunci baris untuk mencegah race condition
  select * into v_donation
  from donations
  where id = p_donation_id
  for update;

  if not found then
    raise exception 'Donasi tidak ditemukan.';
  end if;

  -- Validasi status donasi
  if v_donation.status != 'available' then
    if v_donation.status = 'claimed' then
      raise exception 'Donasi sudah diklaim pihak lain.';
    else
      raise exception 'Donasi tidak tersedia (status: %s).', v_donation.status;
    end if;
  end if;

  -- Validasi waktu kedaluwarsa
  if v_donation.expiry_time <= now() then
    raise exception 'Donasi sudah melewati batas kelayakan (expired).';
  end if;

  -- Update status donasi
  update donations
  set status = 'claimed', updated_at = now()
  where id = p_donation_id;

  -- Buat order baru
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
  -- Kembalikan pesan error yang ramah pengguna
  return json_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- Fungsi RPC: update_order_status
create or replace function public.update_order_status(p_order_id uuid, p_new_status order_status)
returns json
language plpgsql
security definer
as $$
declare
  v_order orders%rowtype;
  v_donation donations%rowtype;
  v_partner profiles%rowtype;
  v_valid_transitions boolean := false;
begin
  -- Validasi partner pemilik order
  select * into v_order
  from orders
  join profiles on orders.partner_id = profiles.id
  where orders.id = p_order_id
    and profiles.id = auth.uid()
    and profiles.role = 'partner'
    and profiles.is_verified = true;

  if not found then
    raise exception 'Akses ditolak: Anda bukan pemilik order ini.';
  end if;

  -- Validasi transisi status
  case v_order.status
    when 'pending' then
      if p_new_status in ('in_transit', 'cancelled') then
        v_valid_transitions := true;
      end if;
    when 'in_transit' then
      if p_new_status in ('completed', 'cancelled') then
        v_valid_transitions := true;
      end if;
    when 'completed', 'cancelled' then
      -- Tidak ada transisi dari status final
      raise exception 'Tidak dapat mengubah status dari %s.', v_order.status;
  end case;

  if not v_valid_transitions then
    raise exception 'Transisi status tidak valid: %s → %s', v_order.status, p_new_status;
  end if;

  -- Update order
  update orders
  set status = p_new_status,
      completed_at = case when p_new_status = 'completed' then now() else completed_at end
  where id = p_order_id
  returning * into v_order;

  -- Sinkronisasi status donasi
  update donations
  set status = case
    when p_new_status = 'completed' then 'delivered'
    when p_new_status = 'cancelled' and (select expiry_time from donations where id = p_order_id) > now() then 'available'
    when p_new_status = 'cancelled' then 'cancelled'
    else (select status from donations where id = p_order_id)
  end,
  updated_at = now()
  where id = v_order.donation_id;

  return json_build_object(
    'success', true,
    'order_id', v_order.id,
    'new_status', v_order.status,
    'donation_status', (select status from donations where id = v_order.donation_id)
  );

exception when others then
  return json_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- Fungsi RPC: cancel_donation
create or replace function public.cancel_donation(p_donation_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_donation donations%rowtype;
  v_provider profiles%rowtype;
begin
  -- Validasi provider pemilik donasi
  select * into v_donation
  from donations
  join profiles on donations.provider_id = profiles.id
  where donations.id = p_donation_id
    and profiles.id = auth.uid()
    and profiles.role = 'provider';

  if not found then
    raise exception 'Akses ditolak: Anda bukan pemilik donasi ini.';
  end if;

  -- Validasi status donasi
  if v_donation.status != 'available' then
    raise exception 'Hanya donasi dengan status "available" yang dapat dibatalkan. Untuk donasi yang sudah diklaim, hubungi mitra penyalur.';
  end if;

  -- Batalkan donasi
  update donations
  set status = 'cancelled', updated_at = now()
  where id = p_donation_id
  returning * into v_donation;

  return json_build_object(
    'success', true,
    'donation_id', v_donation.id,
    'new_status', v_donation.status
  );

exception when others then
  return json_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- Fungsi RPC: verify_profile
create or replace function public.verify_profile(p_profile_id uuid, p_verified boolean)
returns json
language plpgsql
security definer
as $$
declare
  v_admin profiles%rowtype;
begin
  -- Validasi admin
  select * into v_admin
  from profiles
  where id = auth.uid() and role = 'admin';

  if not found then
    raise exception 'Akses ditolak: Hanya admin yang dapat memverifikasi profil.';
  end if;

  -- Update status verifikasi
  update profiles
  set is_verified = p_verified
  where id = p_profile_id
  returning * into v_admin;

  return json_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'is_verified', p_verified
  );

exception when others then
  return json_build_object(
    'success', false,
    'error', sqlerrm
  );
end;
$$;

-- RLS Policies untuk tabel profiles
alter table profiles enable row level security;

-- SELECT/UPDATE profil sendiri
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = role and is_verified = is_verified);

-- Admin dapat melihat semua profil
create policy "profiles_select_all_for_admin" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- RLS Policies untuk tabel donations
alter table donations enable row level security;

-- Provider dapat melihat/simpan/update donasi miliknya
create policy "donations_select_own" on donations
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'provider' and provider_id = donations.provider_id)
  );

create policy "donations_insert_own" on donations
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'provider') and
    provider_id = auth.uid()
  );

create policy "donations_update_own" on donations
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'provider' and provider_id = donations.provider_id)
  );

-- Partner terverifikasi dapat melihat donasi tersedia dan donasi yang terkait order miliknya
create policy "donations_select_for_verified_partner" on donations
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'partner' and p.is_verified = true
      and (
        (status = 'available' and expiry_time > now()) or
        exists (select 1 from orders where donation_id = donations.id and partner_id = p.id)
      )
    )
  );

-- RLS Policies untuk tabel orders
alter table orders enable row level security;

-- Provider dapat melihat order atas donasinya
create policy "orders_select_provider" on orders
  for select using (
    exists (
      select 1 from donations d
      join profiles p on d.provider_id = p.id
      where d.id = orders.donation_id and p.id = auth.uid() and p.role = 'provider'
    )
  );

-- Partner dapat melihat order miliknya
create policy "orders_select_partner" on orders
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'partner' and id = orders.partner_id)
  );

-- Tidak ada INSERT/UPDATE langsung untuk orders (hanya lewat RPC)
-- (Tidak ada policy yang dibuat untuk INSERT/UPDATE)

-- RLS Policies untuk tabel auth.users (opsional, untuk keamanan tambahan)
-- (Biarkan default Supabase)

-- Komentar untuk dokumentasi
comment on table profiles is 'Tabel profil pengguna (provider, partner, admin)';
comment on table donations is 'Tabel donasi makanan berlebih';
comment on table orders is 'Tabel order/klaim donasi';

comment on function public.claim_donation is 'RPC untuk mengklaim donasi';
comment on function public.update_order_status is 'RPC untuk memperbarui status order';
comment on function public.cancel_donation is 'RPC untuk membatalkan donasi';
comment on function public.verify_profile is 'RPC untuk memverifikasi profil';