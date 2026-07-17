-- Time To Party Magazzino · configurazione Supabase cloud
-- Eseguire una sola volta in Supabase > SQL Editor > New query.

create table if not exists public.app_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.app_state enable row level security;

drop policy if exists "app_state_read_authenticated" on public.app_state;
create policy "app_state_read_authenticated"
on public.app_state for select
to authenticated
using (true);

drop policy if exists "app_state_insert_authenticated" on public.app_state;
create policy "app_state_insert_authenticated"
on public.app_state for insert
to authenticated
with check (updated_by = auth.uid());

drop policy if exists "app_state_update_authenticated" on public.app_state;
create policy "app_state_update_authenticated"
on public.app_state for update
to authenticated
using (true)
with check (updated_by = auth.uid());

grant select, insert, update on public.app_state to authenticated;
revoke all on public.app_state from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  20971520,
  array['application/pdf','application/xml','text/xml','image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documents_read_authenticated" on storage.objects;
create policy "documents_read_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'documents');

drop policy if exists "documents_insert_own_folder" on storage.objects;
create policy "documents_insert_own_folder"
on storage.objects for insert
to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_update_own_folder" on storage.objects;
create policy "documents_update_own_folder"
on storage.objects for update
to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_delete_own_folder" on storage.objects;
create policy "documents_delete_own_folder"
on storage.objects for delete
to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
