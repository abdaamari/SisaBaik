-- Run after 014: organization type and phone are optional, like manual signup.
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
    or coalesce(length(trim(p_type)), 0) > 100
    or coalesce(length(trim(p_phone)), 0) > 30
    or (coalesce(trim(p_phone), '') <> '' and trim(p_phone) !~ '^[0-9+[:space:]-]+$')
    or coalesce(length(trim(p_address)), 0) not between 5 and 1000 then
    raise exception 'Lengkapi data organisasi dengan benar.';
  end if;
  insert into public.profiles
    (id, role, organization_name, organization_type, phone, address, is_verified)
  values (auth.uid(), p_role::public.user_role, trim(p_name),
    nullif(trim(p_type), ''), nullif(trim(p_phone), ''), trim(p_address), false)
  on conflict (id) do nothing;
  select role::text into v_role from public.profiles where id = auth.uid();
  return v_role;
end;
$$;
revoke all on function public.complete_google_profile(text,text,text,text,text) from public, anon;
grant execute on function public.complete_google_profile(text,text,text,text,text) to authenticated;
