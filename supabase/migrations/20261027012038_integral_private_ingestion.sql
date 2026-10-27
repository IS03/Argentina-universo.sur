-- Private staging extends PR9. This migration does not import or publish any tourism content.
begin;
-- Private snapshots/manifests are JSON/CSV, not public assets. Keep existing size/access limits.
update storage.buckets set allowed_mime_types=allowed_mime_types || array['application/json','text/csv']
where id='editorial-private' and not public;
alter table editorial.import_rows
  add column content_version integer not null default 1 check (content_version > 0),
  add column source_revision text,
  add column identity_kind text not null default 'original-id' check (identity_kind in ('original-id','proposal-version','source-row')),
  add column cell_metadata jsonb not null default '{}' check (jsonb_typeof(cell_metadata) = 'object');

create function editorial.version_import_row() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if row(new.source_hash,new.original_payload,new.cell_metadata) is distinct from row(old.source_hash,old.original_payload,old.cell_metadata) then
    new.content_version := old.content_version + 1;
  else new.content_version := old.content_version; end if;
  return new;
end; $$;
create trigger import_rows_version before update on editorial.import_rows for each row execute function editorial.version_import_row();
revoke all on function editorial.version_import_row() from public, anon, authenticated;
grant execute on function editorial.version_import_row() to service_role;

-- These are explicit SOURCE references, not approved public business relationships.
create table editorial.import_relations (
  origin text not null,
  sheet text not null,
  original_id text not null,
  field_key text not null,
  position integer not null check (position > 0),
  target_sheet text not null,
  target_id text not null,
  batch_id uuid not null references editorial.import_batches(id),
  primary key(origin,sheet,original_id,field_key,position),
  foreign key(origin,sheet,original_id) references editorial.import_rows(origin,sheet,original_id),
  foreign key(origin,target_sheet,target_id) references editorial.import_rows(origin,sheet,original_id)
);
create index import_relations_target_idx on editorial.import_relations(origin,target_sheet,target_id);
create index import_relations_batch_idx on editorial.import_relations(batch_id);
alter table editorial.import_relations enable row level security;
revoke all on editorial.import_relations from public,anon,authenticated;
grant select,insert,update,delete on editorial.import_relations to service_role;
create trigger import_relations_audit after insert or update or delete on editorial.import_relations for each row execute function editorial.audit_change();

-- Service-only RPCs allow private staging without exposing the editorial schema in PostgREST.
-- SECURITY INVOKER: no elevated privileges, no publication capability, no browser grants.
create function public.aus_import_state(p_origin text) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'rows',coalesce((select jsonb_agg(jsonb_build_object('sheet',r.sheet,'original_id',r.original_id,'source_hash',r.source_hash,'content_version',r.content_version,'batch_id',r.batch_id) order by r.sheet,r.original_id) from editorial.import_rows r where r.origin=p_origin),'[]'::jsonb),
    'batches',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'revision',b.source_revision,'checksum',b.checksum,'status',b.status) order by b.created_at) from editorial.import_batches b where b.origin=p_origin),'[]'::jsonb)
  );
$$;
revoke all on function public.aus_import_state(text) from public,anon,authenticated;
grant execute on function public.aus_import_state(text) to service_role;

create function public.aus_stage_import(p_batch jsonb, p_dry_run boolean default true) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  source_origin text := p_batch->>'origin';
  revision text := p_batch->>'revision';
  batch_checksum text := p_batch->>'checksum';
  rows_json jsonb := p_batch->'rows';
  refs jsonb := p_batch->'relations';
  item jsonb; current_row editorial.import_rows%rowtype;
  computed_hash text; batch uuid; new_count integer := 0; changed_count integer := 0; same_count integer := 0;
begin
  if p_dry_run is null or p_batch is null or jsonb_typeof(p_batch) <> 'object'
    or coalesce(length(source_origin),0)=0 or length(source_origin)>300
    or coalesce(length(revision),0)=0 or length(revision)>300
    or batch_checksum is null or batch_checksum !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(rows_json) is distinct from 'array' or jsonb_typeof(refs) is distinct from 'array'
    or jsonb_array_length(rows_json)>10000 or octet_length(p_batch::text)>16777216
    then raise exception using message='INVALID_IMPORT_ENVELOPE',errcode='22023'; end if;
  if p_batch->>'canonical_manifest' is null
    or encode(sha256(convert_to(p_batch->>'canonical_manifest','UTF8')),'hex') <> batch_checksum
    or (p_batch->>'canonical_manifest')::jsonb is distinct from jsonb_build_object('origin',source_origin,'revision',revision,
      'rows',(select coalesce(jsonb_agg(jsonb_build_object('sheet',x->>'sheet','original_id',x->>'original_id','source_hash',x->>'source_hash') order by i),'[]'::jsonb) from jsonb_array_elements(rows_json) with ordinality t(x,i)),
      'relations',refs)
    then raise exception using message='IMPORT_MANIFEST_MISMATCH',errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(rows_json) x group by x->>'sheet',x->>'original_id' having count(*)>1)
    then raise exception using message='DUPLICATE_IMPORT_KEY',errcode='22023'; end if;
  if not p_dry_run then perform pg_advisory_xact_lock(hashtextextended(source_origin,0)); end if;
  for item in select value from jsonb_array_elements(rows_json) loop
    if jsonb_typeof(item) <> 'object' or coalesce(length(item->>'sheet'),0)=0 or coalesce(length(item->>'original_id'),0)=0
      or coalesce(item->>'identity_kind','') not in ('original-id','proposal-version','source-row')
      or jsonb_typeof(item->'payload') is distinct from 'object' or jsonb_typeof(item->'metadata') is distinct from 'object'
      or item->>'source_hash' is null or item->>'source_hash' !~ '^[a-f0-9]{64}$'
      or item->>'canonical_payload' is null
      then raise exception using message='INVALID_IMPORT_ROW',errcode='22023'; end if;
    if (item->>'canonical_payload')::jsonb is distinct from jsonb_build_object('payload',item->'payload','metadata',item->'metadata')
      then raise exception using message='IMPORT_PAYLOAD_MISMATCH',errcode='22023'; end if;
    computed_hash := encode(sha256(convert_to(item->>'canonical_payload','UTF8')),'hex');
    if computed_hash <> item->>'source_hash' then raise exception using message='IMPORT_HASH_MISMATCH',errcode='22023'; end if;
    select * into current_row from editorial.import_rows where origin=source_origin and sheet=item->>'sheet' and original_id=item->>'original_id';
    if found and current_row.source_hash = computed_hash then same_count := same_count+1;
    else
      if current_row.source_hash is distinct from item->>'expected_hash'
        then raise exception using message='STALE_IMPORT_ROW',errcode='40001'; end if;
      if current_row.origin is null then new_count := new_count+1; else changed_count := changed_count+1; end if;
    end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(refs) f where
    coalesce(length(f->>'field_key'),0)=0 or coalesce((f->>'position')::integer,0)<1
    or not exists(select 1 from jsonb_array_elements(rows_json) candidate where candidate->>'sheet'=f->>'sheet' and candidate->>'original_id'=f->>'original_id' and btrim(split_part(candidate->'payload'->>(f->>'field_key'),';',(f->>'position')::integer))=f->>'target_id')
    or (not exists(select 1 from jsonb_array_elements(rows_json) candidate where candidate->>'sheet'=f->>'target_sheet' and candidate->>'original_id'=f->>'target_id')
      and not exists(select 1 from editorial.import_rows r where r.origin=source_origin and r.sheet=f->>'target_sheet' and r.original_id=f->>'target_id')))
    then raise exception using message='UNRESOLVED_IMPORT_REFERENCE',errcode='23503'; end if;
  if exists(select 1 from jsonb_array_elements(refs) f group by f->>'sheet',f->>'original_id',f->>'field_key',f->>'position' having count(*)>1)
    then raise exception using message='DUPLICATE_IMPORT_REFERENCE',errcode='22023'; end if;
  if p_dry_run then return jsonb_build_object('dryRun',true,'insert',new_count,'update',changed_count,'unchanged',same_count,'publicWrites',0); end if;
  -- An identical retry has no data/audit mutations, including when the first response was lost.
  select b.id into batch from editorial.import_batches b where b.origin=source_origin and b.source_revision=revision and b.checksum=batch_checksum;
  if batch is not null then
    if new_count+changed_count>0 then raise exception using message='COMMITTED_BATCH_STATE_CHANGED',errcode='40001'; end if;
    return jsonb_build_object('dryRun',false,'batchId',batch,'insert',0,'update',0,'unchanged',same_count,'replayed',true,'publicWrites',0);
  end if;
  insert into editorial.import_batches(origin,source_revision,checksum,status) values(source_origin,revision,batch_checksum,'staged') returning id into batch;
  perform set_config('aus.import_batch_id',batch::text,true);
  for item in select value from jsonb_array_elements(rows_json) loop
    insert into editorial.import_rows(origin,sheet,original_id,batch_id,source_hash,original_payload,source_revision,identity_kind,cell_metadata)
    values(source_origin,item->>'sheet',item->>'original_id',batch,item->>'source_hash',item->'payload',revision,item->>'identity_kind',item->'metadata')
    on conflict(origin,sheet,original_id) do update set batch_id=excluded.batch_id,source_hash=excluded.source_hash,original_payload=excluded.original_payload,
      source_revision=excluded.source_revision,identity_kind=excluded.identity_kind,cell_metadata=excluded.cell_metadata
    where import_rows.source_hash is distinct from excluded.source_hash;
  end loop;
  delete from editorial.import_relations old where old.origin=source_origin
    and exists(select 1 from jsonb_array_elements(rows_json) candidate where candidate->>'sheet'=old.sheet and candidate->>'original_id'=old.original_id)
    and not exists(select 1 from jsonb_array_elements(refs) f where f->>'sheet'=old.sheet and f->>'original_id'=old.original_id and f->>'field_key'=old.field_key and (f->>'position')::integer=old.position);
  insert into editorial.import_relations(origin,sheet,original_id,field_key,position,target_sheet,target_id,batch_id)
    select source_origin,f->>'sheet',f->>'original_id',f->>'field_key',(f->>'position')::integer,f->>'target_sheet',f->>'target_id',batch from jsonb_array_elements(refs) f
    on conflict(origin,sheet,original_id,field_key,position) do update set target_sheet=excluded.target_sheet,target_id=excluded.target_id,batch_id=excluded.batch_id
    where row(import_relations.target_sheet,import_relations.target_id) is distinct from row(excluded.target_sheet,excluded.target_id);
  update editorial.import_batches set status='committed' where id=batch;
  return jsonb_build_object('dryRun',false,'batchId',batch,'insert',new_count,'update',changed_count,'unchanged',same_count,'replayed',false,'publicWrites',0);
end; $$;
revoke all on function public.aus_stage_import(jsonb,boolean) from public,anon,authenticated;
grant execute on function public.aus_stage_import(jsonb,boolean) to service_role;
comment on function public.aus_stage_import(jsonb,boolean) is 'Private, atomic source staging only. Never approves, publishes or writes public tourism entries.';
commit;
