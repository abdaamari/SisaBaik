-- 013_add_private_chat.sql
-- Private realtime chat for donation participants and account support.
-- Run after 012_add_profile_identity.sql.

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('donation', 'provider_admin', 'partner_admin')),
  donation_id uuid references public.donations(id) on delete cascade,
  provider_id uuid references public.profiles(id) on delete cascade,
  partner_id uuid references public.profiles(id) on delete cascade,
  requester_id uuid references public.profiles(id) on delete cascade,
  subject text not null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint chat_threads_participants_check check (
    (kind = 'donation' and donation_id is not null and provider_id is not null
      and partner_id is not null and requester_id is null)
    or
    (kind in ('provider_admin', 'partner_admin') and donation_id is null
      and provider_id is null and partner_id is null and requester_id is not null)
  )
);

create unique index if not exists chat_threads_one_donation_partner
  on public.chat_threads (donation_id, partner_id)
  where kind = 'donation';
create unique index if not exists chat_threads_one_support_per_requester
  on public.chat_threads (requester_id)
  where requester_id is not null;
create index if not exists chat_threads_provider_recent
  on public.chat_threads (provider_id, last_message_at desc)
  where kind = 'donation';
create index if not exists chat_threads_partner_recent
  on public.chat_threads (partner_id, last_message_at desc)
  where kind = 'donation';
create index if not exists chat_threads_admin_support_recent
  on public.chat_threads (last_message_at desc)
  where kind in ('provider_admin', 'partner_admin');

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_thread_recent
  on public.chat_messages (thread_id, created_at asc);

comment on table public.chat_threads is
  'Private conversations between a donation provider and one partner, or one account and Admin';
comment on table public.chat_messages is
  'Messages visible only to participants of their private chat thread';

-- SECURITY DEFINER avoids recursive RLS evaluation; this exposes only a boolean.
create or replace function public.can_access_chat_thread(p_thread_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.chat_threads t
    where t.id = p_thread_id
      and (
        (t.kind = 'donation' and auth.uid() in (t.provider_id, t.partner_id))
        or (t.kind in ('provider_admin', 'partner_admin') and
          (auth.uid() = t.requester_id or public.current_user_role() = 'admin'))
      )
  )
$$;
revoke all on function public.can_access_chat_thread(uuid) from public, anon;
grant execute on function public.can_access_chat_thread(uuid) to authenticated;

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
revoke all on public.chat_threads from public, anon, authenticated;
revoke all on public.chat_messages from public, anon, authenticated;
grant select on public.chat_threads to authenticated;
grant select on public.chat_messages to authenticated;

drop policy if exists chat_threads_select_participant on public.chat_threads;
create policy chat_threads_select_participant on public.chat_threads
  for select to authenticated using (public.can_access_chat_thread(id));
drop policy if exists chat_messages_select_participant on public.chat_messages;
create policy chat_messages_select_participant on public.chat_messages
  for select to authenticated using (public.can_access_chat_thread(thread_id));
-- No direct write policies: thread/message creation goes through checked RPCs.

create or replace function public.touch_chat_thread_after_message()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.chat_threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end;
$$;
drop trigger if exists chat_messages_touch_thread on public.chat_messages;
create trigger chat_messages_touch_thread
  after insert on public.chat_messages
  for each row execute function public.touch_chat_thread_after_message();

-- A verified partner can open one private thread per donation before claiming.
create or replace function public.get_or_create_donation_chat(p_donation_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_provider_id uuid;
  v_provider_name text;
  v_partner_name text;
  v_food_name text;
  v_status public.donation_status;
  v_expiry_time timestamptz;
  v_thread_id uuid;
  v_has_order boolean;
begin
  if auth.uid() is null then raise exception 'Silakan masuk untuk memulai percakapan.'; end if;
  if public.current_user_role() is distinct from 'partner' or not public.is_verified_partner() then
    raise exception 'Hanya mitra terverifikasi yang dapat menghubungi penyedia.';
  end if;

  select d.provider_id, d.food_name, d.status, d.expiry_time, p.organization_name
    into v_provider_id, v_food_name, v_status, v_expiry_time, v_provider_name
  from public.donations d join public.profiles p on p.id = d.provider_id
  where d.id = p_donation_id;
  if not found then raise exception 'Donasi tidak ditemukan.'; end if;

  select organization_name into v_partner_name from public.profiles where id = auth.uid();
  select exists (
    select 1 from public.orders o
    where o.donation_id = p_donation_id and o.partner_id = auth.uid()
  ) into v_has_order;
  select id into v_thread_id from public.chat_threads
    where kind = 'donation' and donation_id = p_donation_id and partner_id = auth.uid();
  if v_thread_id is not null then return v_thread_id; end if;

  if (v_status <> 'available' or v_expiry_time <= now()) and not v_has_order then
    raise exception 'Chat baru hanya bisa dimulai untuk donasi yang masih tersedia.';
  end if;

  insert into public.chat_threads (kind, donation_id, provider_id, partner_id, subject)
  values ('donation', p_donation_id, v_provider_id, auth.uid(),
    format('%s — %s ↔ %s', v_food_name, v_provider_name, coalesce(v_partner_name, 'Mitra')))
  on conflict (donation_id, partner_id) where kind = 'donation'
  do nothing
  returning id into v_thread_id;

  if v_thread_id is null then
    select id into v_thread_id from public.chat_threads
    where kind = 'donation' and donation_id = p_donation_id and partner_id = auth.uid();
  else
    insert into public.notifications (user_id, type, title, message, data)
    values (
      v_provider_id,
      'system'::public.notification_type,
      'Mitra ingin menghubungi Anda',
      format('%s memulai percakapan tentang donasi "%s".', coalesce(v_partner_name, 'Mitra'), v_food_name),
      jsonb_build_object('chat_thread_id', v_thread_id, 'donation_id', p_donation_id)
    );
  end if;

  return v_thread_id;
end;
$$;

-- One support thread per provider/partner. A new partner thread notifies admins.
create or replace function public.get_or_create_support_chat()
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_role public.user_role;
  v_name text;
  v_kind text;
  v_thread_id uuid;
  v_created boolean := false;
begin
  if auth.uid() is null then raise exception 'Silakan masuk untuk memulai percakapan.'; end if;
  v_role := public.current_user_role();
  if v_role is distinct from 'provider' and v_role is distinct from 'partner' then
    raise exception 'Chat bantuan tersedia untuk provider dan mitra.';
  end if;
  v_kind := case when v_role = 'partner' then 'partner_admin' else 'provider_admin' end;
  select organization_name into v_name from public.profiles where id = auth.uid();

  insert into public.chat_threads (kind, requester_id, subject)
  values (v_kind, auth.uid(), format('Bantuan — %s', coalesce(v_name, 'Akun pengguna')))
  on conflict (requester_id) where requester_id is not null do nothing
  returning id into v_thread_id;
  if v_thread_id is not null then
    v_created := true;
  else
    select id into v_thread_id from public.chat_threads where requester_id = auth.uid();
  end if;

  if v_created then
    insert into public.notifications (user_id, type, title, message, data)
    select p.id, 'system'::public.notification_type,
      case when v_role = 'partner' then 'Mitra baru menghubungi Admin' else 'Provider menghubungi Admin' end,
      format('%s membuka percakapan bantuan.', coalesce(v_name, 'Pengguna')),
      jsonb_build_object('chat_thread_id', v_thread_id, 'kind', v_kind)
    from public.profiles p where p.role = 'admin';
  end if;
  return v_thread_id;
end;
$$;

-- Validate membership, derive sender from auth.uid(), write message and notify recipient.
create or replace function public.send_chat_message(p_thread_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_thread public.chat_threads%rowtype;
  v_message_id uuid;
  v_body text := btrim(p_body);
  v_recipient uuid;
  v_title text;
begin
  if auth.uid() is null then raise exception 'Silakan masuk untuk mengirim pesan.'; end if;
  if v_body is null or char_length(v_body) < 1 or char_length(v_body) > 2000 then
    raise exception 'Pesan harus berisi 1 sampai 2000 karakter.';
  end if;
  select * into v_thread from public.chat_threads where id = p_thread_id;
  if not found or not public.can_access_chat_thread(p_thread_id) then
    raise exception 'Percakapan tidak ditemukan atau akses ditolak.';
  end if;

  insert into public.chat_messages (thread_id, sender_id, body)
  values (p_thread_id, auth.uid(), v_body) returning id into v_message_id;

  if v_thread.kind = 'donation' then
    v_recipient := case when auth.uid() = v_thread.provider_id then v_thread.partner_id else v_thread.provider_id end;
    insert into public.notifications (user_id, type, title, message, data)
    values (v_recipient, 'system'::public.notification_type, 'Pesan baru tentang donasi', left(v_body, 180),
      jsonb_build_object('chat_thread_id', p_thread_id));
  elsif auth.uid() = v_thread.requester_id then
    v_title := case when v_thread.kind = 'partner_admin' then 'Pesan baru dari mitra' else 'Pesan baru dari provider' end;
    insert into public.notifications (user_id, type, title, message, data)
    select p.id, 'system'::public.notification_type, v_title, left(v_body, 180),
      jsonb_build_object('chat_thread_id', p_thread_id)
    from public.profiles p where p.role = 'admin';
  else
    insert into public.notifications (user_id, type, title, message, data)
    values (v_thread.requester_id, 'system'::public.notification_type, 'Balasan baru dari Admin', left(v_body, 180),
      jsonb_build_object('chat_thread_id', p_thread_id));
  end if;
  return v_message_id;
end;
$$;

revoke all on function public.get_or_create_donation_chat(uuid) from public, anon;
revoke all on function public.get_or_create_support_chat() from public, anon;
revoke all on function public.send_chat_message(uuid, text) from public, anon;
grant execute on function public.get_or_create_donation_chat(uuid) to authenticated;
grant execute on function public.get_or_create_support_chat() to authenticated;
grant execute on function public.send_chat_message(uuid, text) to authenticated;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then alter publication supabase_realtime add table public.chat_messages; end if;
end $$;
