-- These buckets start empty. Public delivery bypasses object SELECT RLS;
-- only already approved, rights-cleared copies may ever enter tourism-published.
begin;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values
 ('tourism-published','tourism-published',true,50000000,array['image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml','application/pdf']),
 ('editorial-private','editorial-private',false,50000000,array['image/jpeg','image/png','image/webp','image/avif','image/gif','application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain']),
 ('advertising-private','advertising-private',false,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
-- Fail closed if a similarly named pre-existing private bucket was already public.
do $$
begin
  if exists(select 1 from storage.buckets where id in ('editorial-private','advertising-private') and public)
    or exists(select 1 from storage.buckets where id='tourism-published' and not public)
    or exists(select 1 from storage.buckets where id in ('tourism-published','editorial-private','advertising-private')
      and (name is distinct from id or file_size_limit is distinct from
        case when id='advertising-private' then 10485760::bigint else 50000000::bigint end
        or allowed_mime_types is distinct from case id
          when 'tourism-published' then array['image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml','application/pdf']
          when 'editorial-private' then array['image/jpeg','image/png','image/webp','image/avif','image/gif','application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain']
          else array['image/jpeg','image/png','image/webp','image/gif'] end))
  then raise exception 'Existing bucket access differs from the reviewed configuration'; end if;
end; $$;
-- Restrictive guard prevents a future broad permissive policy opening these buckets.
create policy aus_storage_closed on storage.objects as restrictive
for all to anon, authenticated
using (bucket_id not in ('tourism-published','editorial-private','advertising-private'))
with check (bucket_id not in ('tourism-published','editorial-private','advertising-private'));
-- Default-deny: no INSERT/UPDATE/DELETE/SELECT policies for browser roles.
-- Bucket management and object mutations require the trusted backend/service_role.
-- No editor accounts, JWT claim policies, or general authenticated-upload policy.
commit;
