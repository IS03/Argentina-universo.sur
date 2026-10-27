-- No new public permissions. The institutional project keeps ALL binary buckets private for now.
-- The migration deployer applies this in the SAME transaction as the initial PR9/24 schema.
begin;
update storage.buckets set public=false where id='tourism-published';
-- Future accidental Data API configuration changes still cannot grant editorial access.
revoke all on schema editorial from public,anon,authenticated;
revoke all on all tables in schema editorial from public,anon,authenticated;
revoke all on all functions in schema editorial from public,anon,authenticated;
revoke all on function public.aus_import_state(text),public.aus_stage_import(jsonb,boolean) from public,anon,authenticated;
-- Restrict exposure explicitly at the API role as well as grants/RLS.
alter role authenticator set pgrst.db_schemas='public';
notify pgrst,'reload config';
notify pgrst,'reload schema';
commit;
