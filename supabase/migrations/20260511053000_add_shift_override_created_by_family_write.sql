alter table public.shift_overrides
  add column if not exists created_by uuid references auth.users(id) on delete restrict;

update public.shift_overrides
set created_by = user_id
where created_by is null;

alter table public.shift_overrides
  alter column created_by set not null;

create index if not exists idx_shift_overrides_family_created_by
  on public.shift_overrides (family_id, created_by);

drop policy if exists "shift_overrides_write_owner_only" on public.shift_overrides;
drop policy if exists "shift_overrides_write_family" on public.shift_overrides;

create policy "shift_overrides_write_family"
  on public.shift_overrides
  for all
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));
