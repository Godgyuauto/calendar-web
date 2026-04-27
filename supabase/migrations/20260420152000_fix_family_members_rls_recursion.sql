-- Fix recursive RLS evaluation on public.family_members.
-- Previous policy referenced public.is_family_member(family_id), which queries
-- public.family_members again and can recurse until stack overflow.
drop policy if exists "family_members_select_own_family" on public.family_members;

create policy "family_members_select_own_family"
on public.family_members
for select
using (user_id = auth.uid());
