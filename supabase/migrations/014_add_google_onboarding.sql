-- Run manually after 013. Google users create their profile through the checked RPC.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_role text := new.raw_user_meta_data ->> 'role';
begin
  if new.raw_app_meta_data ->> 'provider' = 'google' then
    return new;
  end if;
  if v_role is distinct from 'provider' and v_role is distinct from 'partner' then
    raise exception 'Role tidak valid. Pilih provider atau partner.';
  end if;
  insert into public.profiles
    (id, role, organization_name, organization_type, phone, address, is_verified)
  values (new.id, v_role::public.user_role,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''), 'Tanpa nama'),
    new.raw_user_meta_data ->> 'organization_type', new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'address', false);
  return new;
end;
$$;

create or replace function public.complete_google_profile(
  p_role text, p_name text, p_type text, p_phone text, p_address text
) returns text language plpgsql security definer set search_path = public
as $$
declare v_role text;
begin
  if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  select role::text into v_role from public.profiles where id = auth.uid();
  if found then return v_role; end if;
  if not exists (select 1 from auth.identities where user_id = auth.uid() and provider = 'google') then
    raise exception 'Akun Google diperlukan.';
  end if;
  if p_role is null or p_role not in ('provider', 'partner') then
    raise exception 'Pilih Penyedia atau Mitra.';
  end if;
  if coalesce(length(trim(p_name)), 0) not between 2 and 150
    or coalesce(length(trim(p_type)), 0) not between 1 and 100
    or coalesce(length(trim(p_phone)), 0) not between 6 and 30
    or coalesce(length(trim(p_address)), 0) not between 5 and 1000 then
    raise exception 'Lengkapi data organisasi dengan benar.';
  end if;
  insert into public.profiles
    (id, role, organization_name, organization_type, phone, address, is_verified)
  values (auth.uid(), p_role::public.user_role, trim(p_name), trim(p_type), trim(p_phone), trim(p_address), false)
  on conflict (id) do nothing;
  select role::text into v_role from public.profiles where id = auth.uid();
  return v_role;
end;
$$;
revoke all on function public.complete_google_profile(text,text,text,text,text) from public, anon;
grant execute on function public.complete_google_profile(text,text,text,text,text) to authenticated;
