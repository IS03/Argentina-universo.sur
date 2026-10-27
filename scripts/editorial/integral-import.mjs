// Private extension of the PR9/PR17 importer. No network or publication on module load.
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { canonicalJson, fingerprint, rowKey, stableId, MASTER_ID, SHEETS } from './import-core.mjs';
import { planWorkImport } from './work-import.mjs';
import { readPrivateJson, writePrivateJson } from './private-io.mjs';

const SINGLE = { jurisdiccion_id:'Jurisdicciones', destino_id:'Destinos', atractivo_id:'Atractivos', fuente_id:'Fuentes', fuente_actualizacion_id:'Fuentes', registro_fuente_id:'Fuentes', entidad_id:null, origen_id:null };
const MULTIPLE = { fuente_ids:'Fuentes', fuente_ids_propuesta:'Fuentes', evidencia_ids_propuesta:'Evidencias', componentes_condicionados_ids:'Datos_variables', bloqueantes_ids:'Pendientes', evidencia_practica_ids:'Evidencias', evidencia_auditoria_ids:'Evidencias', fuente_canal_ids:'Fuentes', respuesta_evidencia_ids:'Evidencias' };
const byKey = (a,b) => canonicalJson([a.sheet,a.original_id]).localeCompare(canonicalJson([b.sheet,b.original_id]), 'en');

function makeRow(origin,sheet,key,payload,metadata,kind,state) {
  const canonical_payload = canonicalJson({payload,metadata});
  const source_hash = fingerprint({payload,metadata});
  const previous = state?.rows?.find(r=>r.sheet===sheet && r.original_id===key);
  return {sheet,original_id:key,identity_kind:kind,payload:structuredClone(payload),metadata,canonical_payload,source_hash,expected_hash:previous?.source_hash??null,
    operation:!previous?'insert':previous.source_hash===source_hash?'unchanged':'update',internal_id:stableId(origin,sheet,key)};
}
function finishBundle(origin,revision,rows,relations) {
  rows.sort(byKey);
  relations.sort((a,b)=>canonicalJson(a).localeCompare(canonicalJson(b),'en'));
  const manifest={origin,revision,rows:rows.map(r=>({sheet:r.sheet,original_id:r.original_id,source_hash:r.source_hash})),relations};
  const canonical_manifest=canonicalJson(manifest),checksum=fingerprint(manifest);
  return {origin,revision,checksum,canonical_manifest,rows,relations};
}

export function planIntegralImport(snapshot,{states={},repository=null,expectedCount=84}={}) {
  // Keep PR17's explicit 84-record selection, source identity and typed-date rules intact.
  const work = planWorkImport(snapshot,null,{expectedCount});
  const issues = [...work.issues];
  for(const sheet of SHEETS) if(!Array.isArray(snapshot?.tables?.[sheet])) issues.push({code:'MISSING_SHEET',sheet});
  if(!work.canStage || issues.length) return {mode:'dry-run',canStage:false,issues,bundles:[],publicWrites:0};
  const origin=MASTER_ID, rows=[], relations=[], idIndex=new Map();
  for(const [sheet,values]of Object.entries(snapshot.tables)) for(const row of values) if(row.id) idIndex.set(row.id,sheet);
  const dateIndex=new Map();
  for(const [key,value]of Object.entries(snapshot.dateCells??{})) {
    const prefix=key.slice(0,key.lastIndexOf('/'));
    if(!dateIndex.has(prefix)) dateIndex.set(prefix,{});
    dateIndex.get(prefix)[key]=value;
  }
  for(const sheet of SHEETS) snapshot.tables[sheet].forEach((payload,index)=>{
    const key=rowKey(sheet,payload,index),kind=sheet==='Exportacion_piloto'?'proposal-version':payload.id?'original-id':'source-row';
    const metadata={dateCells:dateIndex.get(sheet+'/'+(payload.id??String(index)))??{},...(snapshot.cellMetadata?.[sheet+'/'+key]?{sourceCells:snapshot.cellMetadata[sheet+'/'+key]}:{})};
    rows.push(makeRow(origin,sheet,key,payload,metadata,kind,states[origin]));
    const add=(field,targetId,targetSheet,position)=>{
      const resolved=idIndex.get(targetId);
      if(!resolved || targetSheet && resolved!==targetSheet) {issues.push({code:'UNRESOLVED_REFERENCE',sheet,originalId:key,field});return;}
      relations.push({sheet,original_id:key,field_key:field,position,target_sheet:resolved,target_id:targetId});
    };
    for(const [field,target]of Object.entries(SINGLE)) if(payload[field]) add(field,payload[field],sheet==='Relaciones'&&field==='destino_id'?null:target,1);
    for(const [field,target]of Object.entries(MULTIPLE)) if(payload[field]) String(payload[field]).split(';').map(x=>x.trim()).forEach((id,i)=>{if(id)add(field,id,target,i+1);});
    if(sheet==='Exportacion_piloto') add('registro_id',payload.registro_id,payload.tabla,1);
  });
  const bundles=[finishBundle(origin,snapshot.source.revision,rows,relations)];
  if(repository) {
    const repoRows=repository.records.map(r=>makeRow(repository.origin,r.sheet,r.key,r.payload,r.metadata??{},r.identityKind??'original-id',states[repository.origin]));
    bundles.push(finishBundle(repository.origin,repository.revision,repoRows,[]));
  }
  const counts={sheets:SHEETS.length,mainRecords:snapshot.selection.length,masterRows:rows.length,bySheet:Object.fromEntries(SHEETS.map(s=>[s,snapshot.tables[s].length])),
    proposals: snapshot.tables.Exportacion_piloto.length,proposalsAreEntities:false,sourceReferences:relations.length,
    repositoryRows:repository?.records.length??0,operations:{insert:0,update:0,unchanged:0},retainedMissing:0,publicWrites:0};
  for(const b of bundles) {
    for(const row of b.rows) counts.operations[row.operation]++;
    counts.retainedMissing+=(states[b.origin]?.rows??[]).filter(old=>!b.rows.some(r=>r.sheet===old.sheet&&r.original_id===old.original_id)).length;
  }
  return {schemaVersion:1,mode:'dry-run',canStage:issues.length===0,issues,bundles,counts,publicationAuthorized:false,publicWrites:0,remoteWrites:0};
}

export async function repositorySource(root=process.cwd()) {
  // Reuse the existing, reviewed namespace/identities instead of rematching business names.
  const {catalogMapping}=await import('../catalog-migration-map.mjs');
  const mapping=await catalogMapping(root),records=[];
  for(const [table,kind]of [['provincias','jurisdiction'],['actividades','activity'],['escapadas','circuit']]) {
    const rows=JSON.parse(await readFile(resolve(root,'public/data',table+'.json'),'utf8'));
    const identities=mapping.entries.filter(r=>r.kind===kind);
    rows.forEach((row,i)=>records.push({sheet:table,key:String(identities[i].sourceId),payload:row}));
  }
  for(const file of (await readdir(resolve(root,'public/santa-fe/json'))).filter(x=>x.endsWith('.json')).sort()) {
    const rows=JSON.parse(await readFile(resolve(root,'public/santa-fe/json',file),'utf8'));
    rows.forEach((row,i)=>records.push({sheet:'santa-fe/'+file,key:`source-row-${i+1}`,identityKind:'source-row',payload:row}));
  }
  for(const file of (await readdir(resolve(root,'content/escapadas'))).filter(x=>x.endsWith('.json')).sort()) {
    const row=JSON.parse(await readFile(resolve(root,'content/escapadas',file),'utf8'));
    records.push({sheet:'escapadas-editoriales',key:row.id,payload:row});
  }
  const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  return {origin:mapping.origin,revision,records};
}

export async function runIntegralImport(args) {
  const [input,...flags]=args;
  const allowed=/^--(?:integral|with-repository)$|^--(?:state|output)=.+$/;
  if(!input || input.startsWith('--') || flags.some(f=>!allowed.test(f)) || new Set(flags.map(f=>f.split('=')[0])).size!==flags.length) throw Error('INTEGRAL_PRIVATE_DRY_RUN_USAGE');
  const value=name=>flags.find(f=>f.startsWith('--'+name+'='))?.slice(name.length+3);
  const snapshot=await readPrivateJson(input),states=value('state')?await readPrivateJson(value('state')):{};
  const repository=flags.includes('--with-repository')?await repositorySource():null;
  const plan=planIntegralImport(snapshot,{states,repository});
  await writePrivateJson(value('output')??'.artifacts/pr24/private/import-plan.json',plan);
  console.log(JSON.stringify({mode:plan.mode,canStage:plan.canStage,counts:plan.counts,issues:plan.issues.length,publicWrites:0,remoteWrites:0}));
  return plan.canStage?0:1;
}
