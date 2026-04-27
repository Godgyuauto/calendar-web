create extension if not exists pgcrypto;

do $$
begin
  execute 'create extension if not exists pg_cron with schema extensions';
exception
  when insufficient_privilege or undefined_file then
    raise notice 'pg_cron extension is not available in this environment.';
end $$;

do $$
begin
  execute 'create extension if not exists pg_net with schema extensions';
exception
  when insufficient_privilege or undefined_file then
    raise notice 'pg_net extension is not available in this environment.';
end $$;

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  event_id uuid references public.family_events(id) on delete cascade,
  channel text not null default 'telegram' check (channel in ('telegram')),
  title text not null,
  body text not null default '',
  remind_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  dedupe_key text not null,
  notified_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_jobs_sent_requires_notified_at
    check (status <> 'sent' or notified_at is not null)
);

create unique index if not exists idx_notification_jobs_family_dedupe
  on public.notification_jobs (family_id, dedupe_key);

create index if not exists idx_notification_jobs_due
  on public.notification_jobs (status, remind_at)
  where status in ('pending', 'failed');

create index if not exists idx_notification_jobs_family_status
  on public.notification_jobs (family_id, status, remind_at);

alter table public.notification_jobs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_jobs'
      and policyname = 'notification_jobs_select_family'
  ) then
    execute 'create policy "notification_jobs_select_family"
      on public.notification_jobs for select
      using (public.is_family_member(family_id))';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_jobs'
      and policyname = 'notification_jobs_write_family'
  ) then
    execute 'create policy "notification_jobs_write_family"
      on public.notification_jobs for all
      using (public.is_family_member(family_id))
      with check (public.is_family_member(family_id))';
  end if;
end $$;

create or replace function public.touch_notification_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_notification_jobs_updated_at on public.notification_jobs;
create trigger trg_touch_notification_jobs_updated_at
before update on public.notification_jobs
for each row
execute function public.touch_notification_jobs_updated_at();

create or replace function public.claim_due_notification_jobs(
  batch_size integer default 25,
  max_attempts integer default 5
)
returns table (
  id uuid,
  family_id uuid,
  event_id uuid,
  title text,
  body text,
  remind_at timestamptz,
  status text,
  attempt_count integer,
  dedupe_key text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with picked as (
    select job.id
    from public.notification_jobs job
    where job.status in ('pending', 'failed')
      and job.remind_at <= now()
      and job.attempt_count < greatest(max_attempts, 1)
      and (job.locked_at is null or job.locked_at < now() - interval '5 minutes')
    order by job.remind_at asc, job.created_at asc
    for update skip locked
    limit greatest(batch_size, 1)
  )
  update public.notification_jobs job
  set
    status = 'pending',
    attempt_count = job.attempt_count + 1,
    last_error = null,
    locked_at = now(),
    updated_at = now()
  from picked
  where job.id = picked.id
  returning
    job.id,
    job.family_id,
    job.event_id,
    job.title,
    job.body,
    job.remind_at,
    job.status,
    job.attempt_count,
    job.dedupe_key;
end;
$$;

revoke all on function public.claim_due_notification_jobs(integer, integer) from public;
grant execute on function public.claim_due_notification_jobs(integer, integer) to service_role;

create or replace function public.schedule_notification_dispatcher(
  edge_function_url text,
  bearer_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cron_command text;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'pg_cron extension is not enabled.';
  end if;

  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise exception 'pg_net extension is not enabled.';
  end if;

  cron_command := format(
    'select net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb);',
    edge_function_url,
    jsonb_build_object(
      'Authorization', 'Bearer ' || bearer_token,
      'Content-Type', 'application/json'
    )::text,
    '{}'::text
  );

  execute 'select cron.schedule($1, $2, $3)'
    using 'notification-dispatcher-every-minute', '* * * * *', cron_command;
end;
$$;

revoke all on function public.schedule_notification_dispatcher(text, text) from public;
grant execute on function public.schedule_notification_dispatcher(text, text) to service_role;
