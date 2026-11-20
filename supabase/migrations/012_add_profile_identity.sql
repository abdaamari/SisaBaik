-- 012_add_profile_identity.sql
-- Add account identity fields for the shared profile screen.
-- Existing profile rows remain valid; users can fill these fields in later.

alter table public.profiles
  add column if not exists username text,
  add column if not exists full_name text,
  add column if not exists avatar_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (
        username is null
        or username ~ '^[a-z0-9_]{3,24}$'
      );
  end if;
end;
$$;

-- Functional unique index is atomic and case-insensitive, so concurrent claims
-- for the same username cannot both succeed. NULL usernames remain allowed for
-- existing profiles until their owners choose one.
create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

comment on column public.profiles.username is
  'Unique public username; lowercase letters, numbers, and underscores (3-24 characters)';
comment on column public.profiles.full_name is
  'Personal display name; optional for existing accounts';
comment on column public.profiles.avatar_url is
  'Public Supabase Storage URL for the account profile photo';

-- Preserve the existing column-level profile update grants and add only the
-- newly editable fields. Role, verification, id, and points remain ungranted.
grant update (username, full_name, avatar_url)
  on public.profiles to authenticated;
