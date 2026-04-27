create extension if not exists pgcrypto;

create or replace function public._migrate_try_parse_uuid(value text)
returns uuid
language plpgsql
as $$
begin
  if value is null or btrim(value) = '' then
    return null;
  end if;
  return value::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function public._migrate_try_parse_timestamptz(value text)
returns timestamptz
language plpgsql
as $$
begin
  if value is null or btrim(value) = '' then
    return null;
  end if;
  return value::timestamptz;
exception
  when others then
    return null;
end;
$$;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table if not exists public.shift_patterns (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  pattern_id text not null,
  version text not null,
  seed_date date not null,
  shift_cycle jsonb not null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (family_id, pattern_id, version)
);

create table if not exists public.agent_api_keys (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  agent_name text not null,
  hashed_key text not null unique,
  expires_at timestamptz not null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.shift_overrides (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  override_type text not null check (override_type in ('vacation', 'training', 'swap', 'extra', 'sick', 'business', 'custom')),
  override_shift text check (override_shift in ('A', 'B', 'C', 'OFF')),
  label text not null,
  start_time timestamptz,
  end_time timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.family_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid,
  title text,
  start_time timestamptz,
  end_time timestamptz,
  is_routine boolean default false,
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table public.family_events add column if not exists family_id uuid;
alter table public.family_events add column if not exists title text;
alter table public.family_events add column if not exists start_time timestamptz;
alter table public.family_events add column if not exists end_time timestamptz;
alter table public.family_events add column if not exists is_routine boolean default false;
alter table public.family_events add column if not exists created_by uuid;
alter table public.family_events add column if not exists created_at timestamptz default now();

do $$
begin
  if to_regclass('public.family_info') is not null then
    insert into public.families (id, name, created_at)
    select
      fi.user_id,
      coalesce(nullif(btrim(fi.data -> 'me' ->> 'name'), ''), 'Family ' || substr(fi.user_id::text, 1, 8)),
      now()
    from public.family_info fi
    where not exists (select 1 from public.families f where f.id = fi.user_id);

    insert into public.family_members (family_id, user_id, role, created_at)
    select fi.user_id, fi.user_id, 'admin', now()
    from public.family_info fi
    where not exists (
      select 1
      from public.family_members fm
      where fm.family_id = fi.user_id and fm.user_id = fi.user_id
    );
  end if;
end;
$$;

insert into public.families (id, name, created_at)
select distinct candidate.user_id, 'Family ' || substr(candidate.user_id::text, 1, 8), now()
from (
  select public._migrate_try_parse_uuid(to_jsonb(fe) ->> 'user_id') as user_id
  from public.family_events fe
) as candidate
where candidate.user_id is not null
  and not exists (select 1 from public.families f where f.id = candidate.user_id);

insert into public.family_members (family_id, user_id, role, created_at)
select distinct candidate.user_id, candidate.user_id, 'admin', now()
from (
  select public._migrate_try_parse_uuid(to_jsonb(fe) ->> 'user_id') as user_id
  from public.family_events fe
) as candidate
where candidate.user_id is not null
  and not exists (
    select 1
    from public.family_members fm
    where fm.family_id = candidate.user_id and fm.user_id = candidate.user_id
  );

update public.family_events fe
set
  created_by = coalesce(fe.created_by, public._migrate_try_parse_uuid(to_jsonb(fe) ->> 'user_id')),
  title = coalesce(nullif(btrim(fe.title), ''), nullif(btrim(to_jsonb(fe) -> 'data' ->> 'title'), ''), 'Legacy event'),
  start_time = coalesce(fe.start_time, public._migrate_try_parse_timestamptz(to_jsonb(fe) -> 'data' ->> 'start_time'), public._migrate_try_parse_timestamptz(to_jsonb(fe) -> 'data' ->> 'startTime'), fe.created_at, now()),
  end_time = coalesce(fe.end_time, public._migrate_try_parse_timestamptz(to_jsonb(fe) -> 'data' ->> 'end_time'), public._migrate_try_parse_timestamptz(to_jsonb(fe) -> 'data' ->> 'endTime'), coalesce(fe.start_time, public._migrate_try_parse_timestamptz(to_jsonb(fe) -> 'data' ->> 'start_time'), public._migrate_try_parse_timestamptz(to_jsonb(fe) -> 'data' ->> 'startTime'), fe.created_at, now()) + interval '1 hour'),
  is_routine = coalesce(fe.is_routine, lower(coalesce(to_jsonb(fe) -> 'data' ->> 'is_routine', to_jsonb(fe) -> 'data' ->> 'isRoutine', 'false')) = 'true'),
  family_id = coalesce(fe.family_id, (select fm.family_id from public.family_members fm where fm.user_id = coalesce(fe.created_by, public._migrate_try_parse_uuid(to_jsonb(fe) ->> 'user_id')) order by fm.created_at asc limit 1))
where
  fe.created_by is null
  or fe.title is null
  or fe.start_time is null
  or fe.end_time is null
  or fe.family_id is null;

update public.family_events
set end_time = start_time + interval '1 hour'
where start_time is not null and (end_time is null or end_time <= start_time);

create index if not exists idx_family_members_user_id on public.family_members (user_id);
create index if not exists idx_family_events_family_time on public.family_events (family_id, start_time, end_time);
create index if not exists idx_shift_overrides_family_date on public.shift_overrides (family_id, date);
