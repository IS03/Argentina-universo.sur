-- Real role/claim tests. No persistent users, objects, drafts or policy changes.
begin;
set local statement_timeout='30s';
do $$
declare tested_role text; t text; visible integer; denied boolean;
begin
  insert into public.entries(id,kind,slug,name) values ('f2250000-0000-4000-8000-000000000001','article','institutional-security-fixture','Synthetic private fixture');
  foreach tested_role in array array['anon','authenticated'] loop
    perform set_config('request.jwt.claims','{"sub":"f2250000-0000-4000-8000-000000000002","role":"authenticated","user_metadata":{"role":"publisher"}}',true);
    execute format('set local role %I',tested_role);
    select count(*) into visible from public.entries where id='f2250000-0000-4000-8000-000000000001';
    if visible<>0 then raise exception 'DRAFT_VISIBLE'; end if;
    foreach t in array array['evidence','sources','variable_facts','fact_evidence','human_reviews','members','import_batches','import_rows','import_relations','import_packets','revisions'] loop
      denied:=false;
      begin execute format('select count(*) from editorial.%I',t) into visible;
      exception when insufficient_privilege then denied:=true; end;
      if not denied then raise exception 'PRIVATE_TABLE_ACCESS'; end if;
    end loop;
    denied:=false;
    begin perform public.aus_import_state('synthetic'); exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'PRIVATE_RPC_ACCESS'; end if;
    denied:=false;
    begin update public.entries set publication_permitted=true where id='f2250000-0000-4000-8000-000000000001'; exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'BROWSER_WRITE_ACCESS'; end if;
    denied:=false;
    begin insert into storage.objects(bucket_id,name) values ('editorial-private','synthetic-forbidden-upload'); exception when insufficient_privilege then denied:=true; end;
    if not denied then raise exception 'STORAGE_WRITE_ACCESS'; end if;
    reset role;
  end loop;
end $$;
rollback;
select jsonb_build_object('roles',2,'private_tables_per_role',11,'draft_hidden',true,'rpc_denied',true,'publication_denied',true,'storage_insert_denied',true,'persistent_fixture_writes',0) as remote_security;
