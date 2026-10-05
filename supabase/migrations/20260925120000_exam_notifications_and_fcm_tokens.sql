create unique index if not exists fcm_tokens_user_token_key
  on public.fcm_tokens (user_id, token);

create unique index if not exists notifications_exam_reminder_key
  on public.notifications (user_id, related_exam_id, title)
  where related_exam_id is not null;

alter table public.fcm_tokens enable row level security;

drop policy if exists "Users can manage their own FCM tokens" on public.fcm_tokens;
create policy "Users can manage their own FCM tokens"
  on public.fcm_tokens
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
