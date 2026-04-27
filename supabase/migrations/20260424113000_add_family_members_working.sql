-- Add persistent per-member working flag used by members/settings UI.
-- Safe on environments that already have the column in a partial form.

alter table public.family_members
  add column if not exists working boolean;

update public.family_members
set working = true
where working is null;

alter table public.family_members
  alter column working set default true;

alter table public.family_members
  alter column working set not null;
