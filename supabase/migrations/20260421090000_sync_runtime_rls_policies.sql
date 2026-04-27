-- Sync runtime RLS hotfixes (applied via MCP on 2026-04-20) into append-only migrations.
-- Goal: eliminate drift between live Supabase and repository migrations.

-- 1) Keep non-recursive membership select policy.
drop policy if exists "family_members_select_own_family" on public.family_members;
create policy "family_members_select_own_family"
on public.family_members
for select
using (user_id = auth.uid());

-- 2) Remove legacy family_events policies that conflict with family-scope model.
drop policy if exists "Allow all" on public.family_events;
drop policy if exists "Users can only access their own events" on public.family_events;

-- 3) Re-assert canonical family-scoped policies (idempotent, deterministic).
drop policy if exists "family_events_read_family" on public.family_events;
create policy "family_events_read_family"
on public.family_events
for select
using (public.is_family_member(family_id));

drop policy if exists "family_events_write_family" on public.family_events;
create policy "family_events_write_family"
on public.family_events
for all
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));
