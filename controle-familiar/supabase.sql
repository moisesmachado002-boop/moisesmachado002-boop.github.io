-- Gestão Financeira Familiar - armazenamento separado do Meu Financeiro
-- Execute este script no SQL Editor do MESMO projeto Supabase usado pelo Meu Financeiro.
-- A tabela finance_state existente NÃO é alterada.

begin;

create table if not exists public.family_finance_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_family_finance_state_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_family_finance_state_updated_at on public.family_finance_state;
create trigger trg_family_finance_state_updated_at
before update on public.family_finance_state
for each row
execute function public.set_family_finance_state_updated_at();

revoke all on table public.family_finance_state from anon;
grant select, insert, update, delete on table public.family_finance_state to authenticated;

alter table public.family_finance_state enable row level security;

drop policy if exists family_finance_select_own on public.family_finance_state;
create policy family_finance_select_own
on public.family_finance_state
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists family_finance_insert_own on public.family_finance_state;
create policy family_finance_insert_own
on public.family_finance_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists family_finance_update_own on public.family_finance_state;
create policy family_finance_update_own
on public.family_finance_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists family_finance_delete_own on public.family_finance_state;
create policy family_finance_delete_own
on public.family_finance_state
for delete
to authenticated
using ((select auth.uid()) = user_id);

commit;
