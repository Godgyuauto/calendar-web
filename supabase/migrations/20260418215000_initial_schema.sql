create extension if not exists pgcrypto;

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

create table if not exists public.family_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_routine boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint family_events_time_check check (end_time > start_time)
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

create index if not exists idx_shift_overrides_family_date
  on public.shift_overrides (family_id, date);

create index if not exists idx_family_events_family_time
  on public.family_events (family_id, start_time, end_time);

alter table public.family_members enable row level security;
alter table public.shift_patterns enable row level security;
alter table public.family_events enable row level security;
alter table public.shift_overrides enable row level security;
alter table public.agent_api_keys enable row level security;

create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = target_family_id
      and fm.user_id = auth.uid()
  );
$$;

create policy "family_members_select_own_family"
on public.family_members
for select
using (public.is_family_member(family_id));

create policy "shift_patterns_select_family"
on public.shift_patterns
for select
using (public.is_family_member(family_id));

create policy "shift_patterns_admin_write"
on public.shift_patterns
for all
using (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = shift_patterns.family_id
      and fm.user_id = auth.uid()
      and fm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = shift_patterns.family_id
      and fm.user_id = auth.uid()
      and fm.role = 'admin'
  )
);

create policy "family_events_read_family"
on public.family_events
for select
using (public.is_family_member(family_id));

create policy "family_events_write_family"
on public.family_events
for all
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

create policy "shift_overrides_read_family"
on public.shift_overrides
for select
using (public.is_family_member(family_id));

create policy "shift_overrides_write_owner_only"
on public.shift_overrides
for all
using (public.is_family_member(family_id) and user_id = auth.uid())
with check (public.is_family_member(family_id) and user_id = auth.uid());

create policy "agent_keys_admin_only"
on public.agent_api_keys
for all
using (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = agent_api_keys.family_id
      and fm.user_id = auth.uid()
      and fm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.family_members fm
    where fm.family_id = agent_api_keys.family_id
      and fm.user_id = auth.uid()
      and fm.role = 'admin'
  )
);

-- TODO(product): 가족 생성/초대 플로우가 확정되면 families 테이블의 기본 row 생성 트리거(신규 가입 시 자동 생성) 여부 결정 필요.
-- TODO(security): agent_api_keys는 원본 키 저장 금지 원칙에 따라 Edge Function에서 bcrypt/argon2 해시 저장 강제 구현 필요.
