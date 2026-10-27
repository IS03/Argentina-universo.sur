begin;
-- Immutable private transport packets are not public entities or publication approvals.
create table editorial.import_packets (
 upload_id uuid not null,
 ordinal integer not null check(ordinal between 1 and 2000),
 payload text not null check(octet_length(payload)<=262144),
 payload_sha256 text not null check(payload_sha256 ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 primary key(upload_id,ordinal)
);
alter table editorial.import_packets enable row level security;
revoke all on editorial.import_packets from public,anon,authenticated;
grant select,insert on editorial.import_packets to service_role;

-- First pass: zero writes, with the complete intended identity set for cross-part references.
create function public.aus_validate_import_part(p_batch jsonb,p_relations jsonb,p_keys jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if jsonb_typeof(p_relations) is distinct from 'array' or jsonb_typeof(p_keys) is distinct from 'array'
  or p_batch->'relations' is distinct from '[]'::jsonb or jsonb_array_length(p_keys)>10000 then raise exception 'INVALID_VALIDATION_PART' using errcode='22023'; end if;
 result:=public.aus_stage_import(p_batch,true);
 if exists(select 1 from jsonb_array_elements(p_relations) f where
  coalesce((f->>'position')::integer,0)<1
  or not exists(select 1 from jsonb_array_elements(p_batch->'rows') r where r->>'sheet'=f->>'sheet' and r->>'original_id'=f->>'original_id'
    and btrim(split_part(r->'payload'->>(f->>'field_key'),';',(f->>'position')::integer))=f->>'target_id')
  or not exists(select 1 from jsonb_array_elements(p_keys) k where k->>'sheet'=f->>'target_sheet' and k->>'original_id'=f->>'target_id'))
 then raise exception 'UNRESOLVED_IMPORT_REFERENCE' using errcode='23503'; end if;
 return result||jsonb_build_object('references',jsonb_array_length(p_relations));
end $$;
create function public.aus_import_packet(p_upload_id uuid,p_ordinal integer,p_payload text,p_sha256 text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare existing_hash text;
begin
 if p_upload_id is null or p_ordinal is null or p_payload is null or p_sha256 is null or
  encode(sha256(convert_to(p_payload,'UTF8')),'hex')<>p_sha256 then raise exception 'INVALID_PACKET_HASH' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_upload_id::text,0));
 select payload_sha256 into existing_hash from editorial.import_packets where upload_id=p_upload_id and ordinal=p_ordinal;
 if found then
  if existing_hash<>p_sha256 then raise exception 'PACKET_CONFLICT' using errcode='40001'; end if;
  return jsonb_build_object('accepted',true,'replayed',true);
 end if;
 insert into editorial.import_packets(upload_id,ordinal,payload,payload_sha256) values(p_upload_id,p_ordinal,p_payload,p_sha256);
 return jsonb_build_object('accepted',true,'replayed',false);
end $$;
create function public.aus_finish_import(p_upload_id uuid,p_packets integer,p_sha256 text,p_dry_run boolean default true) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare body text; total integer; first_part integer; last_part integer; result jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_upload_id::text,0));
 select count(*),min(ordinal),max(ordinal),string_agg(payload,'' order by ordinal) into total,first_part,last_part,body from editorial.import_packets where upload_id=p_upload_id;
 if p_packets is null or total<>p_packets or first_part<>1 or last_part<>p_packets or octet_length(body)>16777216 or p_sha256 is null or
  encode(sha256(convert_to(body,'UTF8')),'hex')<>p_sha256 then raise exception 'INCOMPLETE_OR_INVALID_UPLOAD' using errcode='22023'; end if;
 result:=public.aus_stage_import(body::jsonb,p_dry_run);
 return result;
end $$;
revoke all on function public.aus_validate_import_part(jsonb,jsonb,jsonb),public.aus_import_packet(uuid,integer,text,text),public.aus_finish_import(uuid,integer,text,boolean) from public,anon,authenticated;
grant execute on function public.aus_validate_import_part(jsonb,jsonb,jsonb),public.aus_import_packet(uuid,integer,text,text),public.aus_finish_import(uuid,integer,text,boolean) to service_role;
commit;
