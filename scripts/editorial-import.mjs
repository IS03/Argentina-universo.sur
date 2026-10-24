// Offline, read-only preparation. This module has no DB client and no write/apply mode.
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const MASTER_ID='1fwed8poUbIaLBnMLJta5WkyAnYg_SFc453m-wl3aB1w';
export const SHEETS=['Inicio','Destinos','Atractivos','Experiencias','Circuitos','Agenda','Servicios','Multimedia','Fuentes','Evidencias','Datos_variables','Relaciones','Pendientes','Jurisdicciones','Expansion_Santa_Fe','Gobernanza','Diccionario','Exportacion_piloto'];
const ENTITY_SHEETS=['Jurisdicciones','Destinos','Atractivos','Experiencias','Circuitos','Agenda','Servicios','Multimedia'];
const ID_SHEETS=[...ENTITY_SHEETS,'Fuentes','Evidencias','Datos_variables','Relaciones','Pendientes'];
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function canonicalJson(value) {
  if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']';
  if(object(value))return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalJson(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
export const fingerprint=value=>createHash('sha256').update(canonicalJson(value)).digest('hex');
export function stableId(origin,sheet,id) {
  // RFC 4122 UUIDv5, URL namespace. Original IDs remain separately stored unchanged.
  const namespace=Buffer.from('6ba7b8119dad11d180b400c04fd430c8','hex');
  const h=createHash('sha1').update(namespace).update(JSON.stringify([origin,sheet,id])).digest();
  h[6]=(h[6]&0x0f)|0x50;h[8]=(h[8]&0x3f)|0x80;
  const s=h.subarray(0,16).toString('hex');return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}
function rowKey(sheet,row,index) {
  if(sheet==='Exportacion_piloto')return [row.lote_id,row.tabla,row.registro_id,row.version_propuesta||''].join('|');
  return typeof row.id==='string'&&row.id.trim()&&row.id===row.id.trim()&&!/[\u0000-\u001f]/.test(row.id)?row.id:`snapshot-row-${index+1}`;
}
function validDate(value) {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const d=new Date(value+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;
}
export function validateImport(snapshot,{expectedCount=84}={}) {
  const errors=[],warnings=[];
  if(!object(snapshot)||snapshot.schemaVersion!==1||!object(snapshot.source)||snapshot.source.spreadsheetId!==MASTER_ID||typeof snapshot.source.revision!=='string'||!snapshot.source.revision.trim()||!object(snapshot.tables)||!Array.isArray(snapshot.selection))return {errors:['Invalid envelope: schemaVersion, original master ID, revision, tables and explicit selection required.'],warnings};
  const ids=new Map(),tableIds=new Map();
  for(const [sheet,rows] of Object.entries(snapshot.tables)) {
    if(!SHEETS.includes(sheet)){errors.push(`Unknown sheet: ${sheet}`);continue;}
    if(!Array.isArray(rows)){errors.push(`Expected rows: ${sheet}`);continue;}
    const seen=new Set(),slugs=new Set();tableIds.set(sheet,seen);
    rows.forEach((row,index)=>{
      if(!object(row)){errors.push(`Invalid row: ${sheet}/${index+1}`);return;}
      if(ID_SHEETS.includes(sheet)&&!(typeof row.id==='string'&&row.id.trim()&&row.id===row.id.trim()&&!/[\u0000-\u001f]/.test(row.id)))errors.push(`Missing original ID: ${sheet}/${index+1}`);
      const key=rowKey(sheet,row,index);
      if(seen.has(key))errors.push(`Duplicate ID/proposal: ${sheet}/${key}`);seen.add(key);
      if(typeof row.id==='string'){
        if(ids.has(row.id))errors.push(`Ambiguous ID across sheets: ${row.id}`);
        ids.set(row.id,sheet);
      }
      if(row.slug){if(!/^[a-z0-9]+([_-][a-z0-9]+)*$/.test(row.slug)||slugs.has(row.slug))errors.push(`Invalid/duplicate slug: ${sheet}/${row.slug}`);slugs.add(row.slug);}
      for(const [lat,lon] of [['latitud','longitud']]) {
        const has=v=>v!==undefined&&v!==''&&v!==null;
        if(has(row[lat])!==has(row[lon]) || has(row[lat])&&(!Number.isFinite(Number(row[lat]))||Math.abs(Number(row[lat]))>90||!Number.isFinite(Number(row[lon]))||Math.abs(Number(row[lon]))>180))errors.push(`Invalid coordinates: ${sheet}/${key}`);
      }
      for(const name of ['fecha_inicio','fecha_fin','valido_desde','valido_hasta'])if(row[name]&&!validDate(row[name]))errors.push(`Invalid ISO date: ${sheet}/${key}/${name}`);
      if(row.fecha_inicio&&row.fecha_fin&&row.fecha_fin<row.fecha_inicio)errors.push(`Reversed dates: ${sheet}/${key}`);
    });
  }
  const targets={jurisdiccion_id:'Jurisdicciones',destino_id:'Destinos',atractivo_id:'Atractivos',fuente_id:'Fuentes',fuente_actualizacion_id:'Fuentes',entidad_id:null,origen_id:null,destino_relacion_id:null};
  for(const [sheet,rows] of Object.entries(snapshot.tables))for(const row of Array.isArray(rows)?rows:[]) {
    if(!object(row))continue;
    const fields={...targets};
    if(sheet==='Relaciones')fields.destino_id=null;
    for(const [field,target] of Object.entries(fields))if(row[field]) {
      if(!ids.has(row[field])||target&&ids.get(row[field])!==target)errors.push(`Unknown relation: ${sheet}/${row.id}/${field}=${row[field]}`);
    }
    for(const [field,target] of [['fuente_ids','Fuentes'],['fuente_ids_propuesta','Fuentes'],['evidencia_ids_propuesta','Evidencias'],['evidencia_practica_ids','Evidencias'],['componentes_condicionados_ids','Datos_variables'],['bloqueantes_ids','Pendientes']]) {
      if(row[field])for(const id of String(row[field]).split(';').map(s=>s.trim()).filter(Boolean))if(ids.get(id)!==target)errors.push(`Unknown reference: ${sheet}/${row.id}/${field}=${id}`);
    }
    if(sheet==='Exportacion_piloto'&&(!tableIds.get(row.tabla)?.has(row.registro_id)))errors.push(`Unknown proposal target: ${row.tabla}/${row.registro_id}`);
    if(sheet==='Fuentes'&&row.url&&!/^https?:\/\//.test(row.url))errors.push(`Invalid source URL: ${row.id}`);
  }
  const selected=new Set();
  for(const item of snapshot.selection) {
    if(!object(item)||!ENTITY_SHEETS.includes(item.sheet)||typeof item.id!=='string'||!tableIds.get(item.sheet)?.has(item.id)){errors.push('Unknown selected entity');continue;}
    const key=item.sheet+'/'+item.id;if(selected.has(key))errors.push('Duplicate selection: '+key);selected.add(key);
  }
  if(selected.size!==expectedCount)errors.push(`Expected ${expectedCount} explicitly selected entities, got ${selected.size}`);
  warnings.push('Documental, aprobable_acotado, candidate, source publicable and export proposals are NOT human publication permission. All staging remains private and pending.');
  return {errors,warnings};
}
export function planImport(snapshot,previous=null,options={}) {
  const validation=validateImport(snapshot,options);
  if(validation.errors.length)return {...validation,mode:'dry-run',canStage:false};
  if(previous){const v=validateImport(previous,options);if(v.errors.length)return {errors:['Invalid previous snapshot',...v.errors],warnings:[],mode:'dry-run',canStage:false};}
  const flatten=s=>new Map(Object.entries(s?.tables||{}).flatMap(([sheet,rows])=>rows.map((row,i)=>[sheet+'/'+rowKey(sheet,row,i),{sheet,row,key:rowKey(sheet,row,i)}])));
  const old=flatten(previous),current=flatten(snapshot);
  const selected=new Set(snapshot.selection.map(r=>r.sheet+'/'+r.id));
  const contextOnly=[...current].filter(([,r])=>ENTITY_SHEETS.includes(r.sheet)&&!selected.has(r.sheet+'/'+r.row.id)).map(([key,r])=>({key,sourceHash:fingerprint(r.row)}));
  const changes=[...current].filter(([,r])=>!ENTITY_SHEETS.includes(r.sheet)||selected.has(r.sheet+'/'+r.row.id)).map(([key,{sheet,row,key:sourceId}])=>{
    const before=old.get(key)?.row;
    return {sheet,originalId:sourceId,stableId:stableId(MASTER_ID,sheet,sourceId),sourceHash:fingerprint(row),operation:before?fingerprint(before)===fingerprint(row)?'unchanged':'update':'insert',changedFields:before?[...new Set([...Object.keys(before),...Object.keys(row)])].filter(k=>canonicalJson(before[k]??null)!==canonicalJson(row[k]??null)):Object.keys(row),approvalStatus:'pending',publicationPermitted:false};
  });
  return {...validation,mode:'dry-run',canStage:true,sourceRevision:snapshot.source.revision,checksum:fingerprint(snapshot.tables),changes,contextOnly,retainedMissing:[...old.keys()].filter(key=>!current.has(key)),publicWrites:0};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [input,...args]=process.argv.slice(2);
  if(!input||args.some(a=>!a.startsWith('--previous=')&&!a.startsWith('--output=')))throw new Error('Usage: editorial-import.mjs PRIVATE.json [--previous=PRIVATE.json] [--output=.artifacts/plan.json]; dry-run only.');
  const prev=args.find(a=>a.startsWith('--previous='))?.slice(11);
  const result=planImport(JSON.parse(await readFile(input,'utf8')),prev?JSON.parse(await readFile(prev,'utf8')):null);
  const output=args.find(a=>a.startsWith('--output='))?.slice(9)||'.artifacts/import-plan.json';
  const destination=resolve(output);const artifacts=resolve('.artifacts')+'/';
  if(!destination.startsWith(artifacts))throw new Error('Private plans must stay in ignored .artifacts/.');
  await mkdir(resolve(destination,'..'),{recursive:true});await writeFile(destination,JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify({output,canStage:result.canStage,errors:result.errors,publicWrites:0}));
  if(result.errors.length)process.exitCode=1;
}
