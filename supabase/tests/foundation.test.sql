-- Prepared for `supabase test db --local` on an isolated Supabase stack.
-- NOT executed by the PGlite harness, which does not provide pgTAP/real Storage.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);
select has_table('public','entries','Canonical entries exist');
select has_table('editorial','evidence','Evidence remains in the private schema');
select ok(not exists(select 1 from pg_tables where schemaname in ('public','editorial') and not rowsecurity),'All application tables have RLS');
select ok(not has_schema_privilege('anon','editorial','USAGE'),'Anonymous role cannot access editorial schema');
select ok(not has_table_privilege('authenticated','public.entries','INSERT'),'Authentication does not grant editing rights');
select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='aus_storage_closed' and permissive='RESTRICTIVE'),'Storage has the restrictive guard');
select is((select count(*)::int from storage.buckets where id in ('tourism-published','editorial-private','advertising-private')),3,'Three independently scoped buckets exist');
insert into public.entries(id,kind,slug,name) values ('f2090000-0000-4000-8000-000000000001','article','pr09-isolated-test','Synthetic test only');
set local role anon;
select is((select count(*)::int from public.entries where id='f2090000-0000-4000-8000-000000000001'),0,'Draft is invisible through public role');
reset role;
select is((select count(*)::int from public.entries where id='f2090000-0000-4000-8000-000000000001' and publication_permitted=false and approval_status='pending'),1,'Default state is private and pending');
select * from finish();
rollback;
