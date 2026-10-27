import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { MASTER_ID,validateImport,planImport,stableId } from '../scripts/editorial-import.mjs';
import { catalogMapping } from '../scripts/catalog-migration-map.mjs';
import { readSupabaseConfig } from '../lib/supabase/config.ts';
import { normalizeAssetPath } from '../scripts/media-inventory.mjs';
const fixture=()=>({schemaVersion:1,source:{spreadsheetId:MASTER_ID,revision:'synthetic-1'},tables:{Jurisdicciones:[{id:'J-FIXTURE',nombre:'Synthetic'}],Destinos:[{id:'D-FIXTURE',jurisdiccion_id:'J-FIXTURE',slug:'synthetic',estado_verificacion:'verificado_documental',dictamen_publicacion:'aprobable_acotado',publicable:'si',unknown_original_field:'preserved'}],Fuentes:[{id:'F-FIXTURE',url:'https://example.org'}],Evidencias:[{id:'EV-FIXTURE',entidad_id:'D-FIXTURE',fuente_id:'F-FIXTURE'}]},selection:[{sheet:'Destinos',id:'D-FIXTURE'}]});
test('master identity, explicit selection, duplicates, relations, dates and coordinates are validated',()=>{
  assert.deepEqual(validateImport(fixture(),{expectedCount:1}).errors,[]);
  const wrong=fixture();wrong.source.spreadsheetId='another-master';assert.ok(validateImport(wrong).errors.length);
  const bad=fixture();bad.tables.Destinos.push({...bad.tables.Destinos[0]});bad.tables.Evidencias[0].fuente_id='missing';
  assert.match(validateImport(bad,{expectedCount:1}).errors.join(),/Duplicate/);assert.match(validateImport(bad,{expectedCount:1}).errors.join(),/Unknown relation/);
  const coord=fixture();coord.tables.Destinos[0].latitud=91;coord.tables.Destinos[0].longitud=0;
  assert.match(validateImport(coord,{expectedCount:1}).errors.join(),/coordinates/);
  assert.match(validateImport(fixture()).errors.join(),/Expected 84/);
});
test('dry-run never promotes documentary candidates and repeated snapshots have no changes',()=>{
  const source=fixture();const before=structuredClone(source);
  const plan=planImport(source,null,{expectedCount:1});assert.equal(plan.canStage,true);assert.equal(plan.publicWrites,0);
  assert.ok(plan.changes.every(r=>r.approvalStatus==='pending'&&!r.publicationPermitted));
  assert.deepEqual(source,before);
  const repeated=planImport(source,source,{expectedCount:1});assert.ok(repeated.changes.every(r=>r.operation==='unchanged'));
  source.tables.Destinos[0].unknown_original_field='new private evidence';
  const changed=planImport(source,before,{expectedCount:1}).changes.find(r=>r.originalId==='D-FIXTURE');
  assert.equal(changed.operation,'update');assert.deepEqual(changed.changedFields,['unknown_original_field']);
  assert.equal(changed.stableId,stableId(MASTER_ID,'Destinos','D-FIXTURE'));
  const removed=structuredClone(before);removed.tables.Evidencias=[];
  assert.deepEqual(planImport(removed,before,{expectedCount:1}).retainedMissing,['Evidencias/EV-FIXTURE']);
});
test('multiple export proposals are distinct from the original entity; duplicates still fail',()=>{
  const s=fixture();s.tables.Exportacion_piloto=[{lote_id:'one',tabla:'Destinos',registro_id:'D-FIXTURE'},{lote_id:'two',tabla:'Destinos',registro_id:'D-FIXTURE'}];
  assert.deepEqual(validateImport(s,{expectedCount:1}).errors,[]);
  s.tables.Exportacion_piloto.push({...s.tables.Exportacion_piloto[0]});assert.match(validateImport(s,{expectedCount:1}).errors.join(),/Duplicate ID\/proposal/);
});
test('legacy mapping preserves 24 provinces, 72 activities, 23 PDFs, canonicals and Catamarca',async()=>{
  const mapping=await catalogMapping();
  assert.deepEqual(mapping,JSON.parse(await readFile('docs/supabase/legacy-catalog-map.json','utf8')));
  assert.equal(mapping.entries.filter(e=>e.kind==='jurisdiction').length,24);
  assert.equal(mapping.entries.filter(e=>e.kind==='activity').length,72);
  assert.equal(mapping.entries.filter(e=>e.pdf).length,23);
  assert.equal(new Set(mapping.entries.map(e=>e.id)).size,119);
  assert.ok(mapping.entries.filter(e=>e.pdf).every(e=>e.jurisdictionSlugs.every(Boolean)));
  assert.deepEqual(mapping.aliases,[{from:'/provincias/catarmaca',to:'/provincias/catamarca',status:308}]);
  assert.equal(mapping.publicationPermitted,false);
});
test('optional Supabase rejects secret keys and mismatched hosts, and works without env or network',()=>{
  assert.equal(readSupabaseConfig({}),null);assert.throws(()=>readSupabaseConfig({SUPABASE_URL:'invalid'}));
  const env={SUPABASE_PROJECT_REF:'vpbonlzixodxvbybkffv',SUPABASE_URL:'https://vpbonlzixodxvbybkffv.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture'};
  assert.ok(readSupabaseConfig(env));
  for(const key of ['sb_secret_fixture','eyJhbGciOiJIUzI1NiJ9.fake.service_role'])assert.throws(()=>readSupabaseConfig({...env,SUPABASE_PUBLISHABLE_KEY:key}),/inválida/);
  assert.throws(()=>readSupabaseConfig({...env,SUPABASE_URL:'https://another-project.supabase.co'}),/inválida/);
  const code=`import assert from 'node:assert/strict'; import {createOptionalSupabaseClient,withStaticFallback} from './lib/supabase/server.ts'; let calls=0;globalThis.fetch=()=>{calls++;throw Error('network forbidden')};assert.equal(createOptionalSupabaseClient({}),null);assert.ok(createOptionalSupabaseClient(${JSON.stringify(env)}));assert.equal(calls,0);assert.equal(await withStaticFallback(async()=>{throw Error('offline')},async()=>42),42);`;
  const p=spawnSync(process.execPath,['--conditions=react-server','--experimental-strip-types','--input-type=module','-e',code],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);
});
test('inventory normalizes cache keys and Unicode URLs without allowing traversal',()=>{
  assert.equal(normalizeAssetPath('/img/home/1.jpg?v=3'),'/img/home/1.jpg');
  assert.equal(normalizeAssetPath('/pdf/ca%C3%B1afate.pdf'),'/pdf/cañafate.pdf');
  for(const p of ['//other.test/image.jpg','/img/%2e%2e/secret','/%ZZ'])assert.equal(normalizeAssetPath(p),null);
});
test('invalid and incomplete original dates are reported without inferring a year',()=>{
  const s=fixture();s.tables.Agenda=[{id:'AG-FIXTURE',fecha_inicio:'2026-13-01',fecha_fin:'2026-02-31'}];
  assert.equal(validateImport(s,{expectedCount:1}).errors.filter(e=>e.includes('Invalid ISO date')).length,2);
  s.tables.Agenda[0].fecha_inicio='';s.tables.Agenda[0].fecha_fin='';s.tables.Agenda[0].fecha_texto_fuente='23 de octubre; año desconocido';
  assert.deepEqual(validateImport(s,{expectedCount:1}).errors,[]);
});
test('unselected master entities remain context and never become import operations',()=>{
  const s=fixture();s.tables.Destinos.push({id:'D-OTHER',slug:'other',jurisdiccion_id:'J-FIXTURE'});
  const p=planImport(s,null,{expectedCount:1});
  assert.equal(p.canStage,true);assert.ok(p.contextOnly.some(r=>r.key==='Destinos/D-OTHER'));
  assert.ok(!p.changes.some(r=>r.originalId==='D-OTHER'));
});
