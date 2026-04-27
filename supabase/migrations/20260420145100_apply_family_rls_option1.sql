do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'family_events_time_check'
      and conrelid = 'public.family_events'::regclass
  ) then
    alter table public.family_events
      add constraint family_events_time_check check (end_time > start_time) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'family_events_family_id_fkey'
      and conrelid = 'public.family_events'::regclass
  ) then
    alter table public.family_events
      add constraint family_events_family_id_fkey
      foreign key (family_id) references public.families(id) on delete cascade not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'family_events_created_by_fkey'
      and conrelid = 'public.family_events'::regclass
  ) then
    alter table public.family_events
      add constraint family_events_created_by_fkey
      foreign key (created_by) references auth.users(id) on delete restrict not valid;
  end if;
end;
$$;

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

alter table public.family_members enable row level security;
alter table public.family_events enable row level security;
alter table public.shift_overrides enable row level security;
alter table if exists public.shift_patterns enable row level security;
alter table if exists public.agent_api_keys enable row level security;

drop policy if exists "family_members_select_own_family" on public.family_members;
create policy "family_members_select_own_family" on public.family_members for select using (public.is_family_member(family_id));
drop policy if exists "family_events_read_family" on public.family_events;
create policy "family_events_read_family" on public.family_events for select using (public.is_family_member(family_id));
drop policy if exists "family_events_write_family" on public.family_events;
create policy "family_events_write_family" on public.family_events for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
drop policy if exists "shift_overrides_read_family" on public.shift_overrides;
create policy "shift_overrides_read_family" on public.shift_overrides for select using (public.is_family_member(family_id));
drop policy if exists "shift_overrides_write_owner_only" on public.shift_overrides;
create policy "shift_overrides_write_owner_only" on public.shift_overrides for all using (public.is_family_member(family_id) and user_id = auth.uid()) with check (public.is_family_member(family_id) and user_id = auth.uid());

do $$
begin
  if to_regclass('public.shift_patterns') is not null then
    drop policy if exists "shift_patterns_select_family" on public.shift_patterns;
    create policy "shift_patterns_select_family" on public.shift_patterns for select using (public.is_family_member(family_id));
    drop policy if exists "shift_patterns_admin_write" on public.shift_patterns;
    create policy "shift_patterns_admin_write" on public.shift_patterns for all using (exists (select 1 from public.family_members fm where fm.family_id = shift_patterns.family_id and fm.user_id = auth.uid() and fm.role = 'admin')) with check (exists (select 1 from public.family_members fm where fm.family_id = shift_patterns.family_id and fm.user_id = auth.uid() and fm.role = 'admin'));
  end if;

  if to_regclass('public.agent_api_keys') is not null then
    drop policy if exists "agent_keys_admin_only" on public.agent_api_keys;
    create policy "agent_keys_admin_only" on public.agent_api_keys for all using (exists (select 1 from public.family_members fm where fm.family_id = agent_api_keys.family_id and fm.user_id = auth.uid() and fm.role = 'admin')) with check (exists (select 1 from public.family_members fm where fm.family_id = agent_api_keys.family_id and fm.user_id = auth.uid() and fm.role = 'admin'));
  end if;
end;
$$;

drop function if exists public._migrate_try_parse_uuid(text);
drop function if exists public._migrate_try_parse_timestamptz(text);
