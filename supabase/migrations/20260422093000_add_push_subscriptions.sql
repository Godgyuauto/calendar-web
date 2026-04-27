create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_family_id
  on public.push_subscriptions (family_id);

create index if not exists idx_push_subscriptions_user_id
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_read_family" on public.push_subscriptions;
create policy "push_subscriptions_read_family"
on public.push_subscriptions
for select
using (public.is_family_member(family_id));

drop policy if exists "push_subscriptions_write_owner" on public.push_subscriptions;
create policy "push_subscriptions_write_owner"
on public.push_subscriptions
for all
using (public.is_family_member(family_id) and user_id = auth.uid())
with check (public.is_family_member(family_id) and user_id = auth.uid());

create or replace function public.touch_push_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_push_subscriptions_updated_at on public.push_subscriptions;
create trigger trg_touch_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute function public.touch_push_subscriptions_updated_at();
