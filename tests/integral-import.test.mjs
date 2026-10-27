import test from 'node:test';
import assert from 'node:assert/strict';
import { rm, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createTestDatabase } from '../scripts/supabase/test-db.mjs';
import { syntheticWorkSnapshot } from '../scripts/editorial/work-fixtures.mjs';
import { SHEETS, MASTER_ID, canonicalJson, fingerprint } from '../scripts/editorial/import-core.mjs';
import { planIntegralImport } from '../scripts/editorial/integral-import.mjs';
import { stageIntegralPlan, resumeIntegralJournal, verifiedImportTarget } from '../scripts/supabase/import-transport.mjs';
import { readPrivateJson } from '../scripts/editorial/private-io.mjs';

const fixture=()=>{const s=syntheticWorkSnapshot();for(const name of SHEETS)s.tables[name]??=[];return s;};
const db=await createTestDatabase();
test.after(()=>db.close());
const rpc=async(name,args)=>{
 try {const {rows}=await db.query(name==='aus_stage_import'?'select public.aus_stage_import($1,$2) as result':'select public.aus_import_state($1) as result',name==='aus_stage_import'?[args.p_batch,args.p_dry_run]:[args.p_origin]);return {data:rows[0].result,error:null};}
 catch(e){return {data:null,error:{code:e.code}};}
};
const refreshManifest=b=>{
 const manifest={origin:b.origin,revision:b.revision,rows:b.rows.map(({sheet,original_id,source_hash})=>({sheet,original_id,source_hash})),relations:b.relations};
 b.canonical_manifest=canonicalJson(manifest);b.checksum=fingerprint(manifest);return b;
};

test('all 18 tabs are staged losslessly; repeated proposals are versions, not new entities',()=>{
 const s=fixture();s.tables.Destinos[0].unmapped={nested:['kept',123],approved:true};
 s.cellMetadata={['Destinos/'+s.tables.Destinos[0].id]:{cells:{perfil:{note:'Synthetic private note',formula:'=SYNTHETIC()'}}}};
 s.tables.Exportacion_piloto.push({...s.tables.Exportacion_piloto[0],version_propuesta:'historical-version'});
 const p=planIntegralImport(s);assert.equal(p.canStage,true);assert.equal(p.counts.mainRecords,84);
 assert.equal(p.counts.masterRows,Object.values(s.tables).reduce((n,r)=>n+r.length,0));
 assert.equal(p.bundles[0].rows.filter(r=>r.sheet==='Exportacion_piloto').length,s.tables.Exportacion_piloto.length);
 const row=p.bundles[0].rows.find(r=>r.sheet==='Destinos'&&r.original_id===s.tables.Destinos[0].id);
 assert.deepEqual(row.payload,s.tables.Destinos[0]);assert.deepEqual(row.metadata.sourceCells,s.cellMetadata['Destinos/'+s.tables.Destinos[0].id]);assert.equal(p.publicWrites,0);assert.equal(p.publicationAuthorized,false);
 assert.equal(new Set(p.bundles[0].rows.map(r=>r.sheet+'/'+r.original_id)).size,p.counts.masterRows);
});

test('real SQL transaction: dry-run, insert, replay, update and append-only versions; no public entries',async()=>{
 const s=fixture(),p=planIntegralImport(s),b=p.bundles[0];
 const before=(await db.query('select count(*)::int n from editorial.import_rows')).rows[0].n;
 const dry=await rpc('aus_stage_import',{p_batch:b,p_dry_run:true});assert.equal(dry.error,null);assert.equal(dry.data.insert,b.rows.length);
 assert.equal((await db.query('select count(*)::int n from editorial.import_rows')).rows[0].n,before);
 const applied=await rpc('aus_stage_import',{p_batch:b,p_dry_run:false});assert.equal(applied.error,null);assert.equal(applied.data.publicWrites,0);
 const audit=(await db.query('select count(*)::int n from editorial.revisions')).rows[0].n;
 const replay=await rpc('aus_stage_import',{p_batch:b,p_dry_run:false});assert.equal(replay.data.replayed,true);
 assert.equal((await db.query('select count(*)::int n from editorial.revisions')).rows[0].n,audit);
 const state=(await rpc('aus_import_state',{p_origin:MASTER_ID})).data;
 assert.equal(planIntegralImport(s,{states:{[MASTER_ID]:state}}).counts.operations.unchanged,b.rows.length);
 s.tables.Destinos[0].perfil='Changed synthetic research, never public';s.source.revision='synthetic-r2';
 const changed=planIntegralImport(s,{states:{[MASTER_ID]:state}});assert.equal(changed.counts.operations.update,1);
 const updated=await rpc('aus_stage_import',{p_batch:changed.bundles[0],p_dry_run:false});assert.equal(updated.error,null);assert.equal(updated.data.update,1);
 const current=(await db.query('select content_version,original_payload from editorial.import_rows where origin=$1 and sheet=$2 and original_id=$3',[MASTER_ID,'Destinos',s.tables.Destinos[0].id])).rows[0];
 assert.equal(current.content_version,2);assert.equal(current.original_payload.perfil,s.tables.Destinos[0].perfil);
 assert.equal((await db.query('select count(*)::int n from public.entries')).rows[0].n,0);
 // A changed record after the same committed checksum is not replayed over a newer version.
 const stale=await rpc('aus_stage_import',{p_batch:b,p_dry_run:false});assert.equal(stale.error.code,'40001');
});

test('a late invalid FK rolls back every row and the batch; hash or invented references are rejected',async()=>{
 const p=planIntegralImport(fixture()),b=structuredClone(p.bundles[0]);b.origin='synthetic-rollback';
 b.relations.push({...b.relations[0],field_key:'invented',target_id:'UNKNOWN'});refreshManifest(b);
 const result=await rpc('aus_stage_import',{p_batch:b,p_dry_run:false});assert.equal(result.error.code,'23503');
 assert.equal((await db.query('select count(*)::int n from editorial.import_batches where origin=$1',[b.origin])).rows[0].n,0);
 assert.equal((await db.query('select count(*)::int n from editorial.import_rows where origin=$1',[b.origin])).rows[0].n,0);
 const tampered=structuredClone(b);tampered.rows[0].payload.secret_field='not in signed manifest';tampered.relations=[];refreshManifest(tampered);
 assert.equal((await rpc('aus_stage_import',{p_batch:tampered,p_dry_run:false})).error.code,'22023');
});

test('RLS and grants deny anonymous and merely authenticated users every private table and RPC',async()=>{
 for(const role of ['anon','authenticated']){
  for(const fn of ['public.aus_import_state(text)','public.aus_stage_import(jsonb,boolean)'])assert.equal((await db.query('select has_function_privilege($1,$2,\'EXECUTE\') allowed',[role,fn])).rows[0].allowed,false);
  await db.exec('set role '+role);
  try{await assert.rejects(db.query('select * from editorial.import_relations'),/permission denied/);await assert.rejects(db.query("select public.aus_import_state('fixture')"),/permission denied/);}finally{await db.exec('reset role');}
 }
 assert.equal((await db.query("select count(*)::int n from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname in ('public','editorial') and p.prosecdef")).rows[0].n,0);
});

test('failure during the last insert rolls back prior rows, references, batch and audit together',async()=>{
 const b=structuredClone(planIntegralImport(fixture()).bundles[0]);b.origin='synthetic-transaction-failure';refreshManifest(b);
 await db.query("select set_config('fixture.fail_id',$1,false)",[b.rows.at(-1).original_id]);
 await db.exec(`create function editorial.fixture_fail_last() returns trigger language plpgsql as $$ begin
   if new.origin='synthetic-transaction-failure' and new.original_id=current_setting('fixture.fail_id') then raise exception using message='SYNTHETIC_LATE_FAILURE',errcode='23514'; end if; return new; end $$;
   create trigger fixture_fail_last before insert on editorial.import_rows for each row execute function editorial.fixture_fail_last();`);
 try {
  const result=await rpc('aus_stage_import',{p_batch:b,p_dry_run:false});assert.equal(result.error.code,'23514');
  assert.equal((await db.query('select count(*)::int n from editorial.import_rows where origin=$1',[b.origin])).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from editorial.import_batches where origin=$1',[b.origin])).rows[0].n,0);
 } finally {await db.exec('drop trigger fixture_fail_last on editorial.import_rows; drop function editorial.fixture_fail_last();');}
});

test('lost commit response: private journal retains every unit; resume replays exactly and skips completed units',async()=>{
 const b=structuredClone(planIntegralImport(fixture()).bundles[0]);b.origin='synthetic-resume';refreshManifest(b);
 const second={...structuredClone(b),origin:'synthetic-next-unit'};refreshManifest(second);
 const plan={canStage:true,publicWrites:0,bundles:[b,second]},path='.artifacts/pr24/test-'+randomUUID()+'/journal.json';
 let lost=true;
 const client={rpc:async(name,args)=>{const result=await rpc(name,args);if(lost&&!result.error){lost=false;throw Error('simulated lost response');}return result;}};
 try{
  await assert.rejects(stageIntegralPlan(plan,{client,journalPath:path,dryRun:false,targetIdentity:'fixture-local'}),/OUTCOME_UNKNOWN/);
  const journal=await readPrivateJson(path);assert.equal(journal.units.length,2);assert.equal(journal.units[0].status,'unknown');
  await assert.rejects(stageIntegralPlan(plan,{client,journalPath:path,dryRun:false,targetIdentity:'fixture-local'}),/EXISTING_JOURNAL/);
  assert.equal((await stat(path)).mode&0o077,0);
  const result=await resumeIntegralJournal(journal,{client:{rpc},journalPath:path,targetIdentity:'fixture-local'});
  assert.equal(result.units.length,2);assert.equal(result.units[0].result.replayed,true);assert.ok(result.units.every(u=>u.status==='committed'));
  const again=await resumeIntegralJournal(await readPrivateJson(path),{client:{rpc:()=>{throw Error('must not send completed units');}},journalPath:path,targetIdentity:'fixture-local'});
  assert.equal(again.publicWrites,0);
 }finally{await rm(path.slice(0,path.lastIndexOf('/')),{recursive:true,force:true});}
});

test('remote target identity and staging authorization fail closed before writes; never reuse other applications',async()=>{
 await assert.rejects(verifiedImportTarget({mode:'remote',projectName:'other-application'},{write:false}),/DEDICATED_PROJECT/);
 const target={mode:'remote',projectName:'Display name irrelevant',projectRef:'vpbonlzixodxvbybkffv',organizationId:'mzfanqzfjskgapsulpip',url:'https://vpbonlzixodxvbybkffv.supabase.co',authorization:{verifiedAt:'2026-10-26'}};
 await assert.rejects(verifiedImportTarget(target,{write:true}),/AUTHORIZATION/);
 await assert.rejects(verifiedImportTarget(target,{env:{}}),/VERIFICATION/);
 await assert.rejects(verifiedImportTarget(target,{env:{SUPABASE_ACCESS_TOKEN:'synthetic-only'},fetcher:async()=>({ok:true,json:async()=>({id:target.projectRef,name:'other-application',organization_id:'personal-org',region:'us-east-1',status:'ACTIVE_HEALTHY'})})}),/PROJECT_MISMATCH/);
});
