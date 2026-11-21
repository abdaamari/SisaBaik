-- Run manually after 015. Only public display fields of accessible participants.
create or replace function public.get_chat_profiles()
returns table (id uuid, full_name text, organization_name text, avatar_url text, role text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.full_name, p.organization_name, p.avatar_url, p.role::text
  from public.profiles p
  where auth.uid() is not null and exists (
    select 1 from public.chat_threads t
    where public.can_access_chat_thread(t.id)
      and (
        p.id in (t.provider_id, t.partner_id, t.requester_id)
        or (t.kind in ('provider_admin', 'partner_admin') and p.role = 'admin')
      )
  );
$$;
revoke all on function public.get_chat_profiles() from public, anon;
grant execute on function public.get_chat_profiles() to authenticated;

-- Match the topic as text: malformed topics never cause UUID cast errors.
drop policy if exists chat_typing_read on realtime.messages;
create policy chat_typing_read on realtime.messages for select to authenticated
using (
  extension = 'broadcast' and exists (
    select 1 from public.chat_threads t
    where 'chat-typing:' || t.id::text = (select realtime.topic())
      and public.can_access_chat_thread(t.id)
  )
);
drop policy if exists chat_typing_write on realtime.messages;
create policy chat_typing_write on realtime.messages for insert to authenticated
with check (
  extension = 'broadcast' and exists (
    select 1 from public.chat_threads t
    where 'chat-typing:' || t.id::text = (select realtime.topic())
      and public.can_access_chat_thread(t.id)
  )
);
