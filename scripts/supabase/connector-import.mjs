// Trusted connector adapter; uses PR24's journal, hashes and final atomic staging RPC.
// No admin key leaves the authenticated connector. Never import this file into the web.
import { randomUUID,createHash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { readPrivateJson,writePrivateJson } from '../editorial/private-io.mjs';
import { canonicalJson,fingerprint,stableId } from '../editorial/import-core.mjs';
import { stageIntegralPlan,resumeIntegralJournal } from './import-transport.mjs';
import { assertInstitutionalIdentity,INSTITUTIONAL_PROJECT_REF } from '../../lib/supabase/identity.ts';
const args=process.argv.slice(2),value=n=>args.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const quote=s=>"'"+s.replaceAll("'","''")+"'",root='.artifacts/institucional/private/connector';
const sha=s=>createHash('sha256').update(s).digest('hex');
if(args.some(a=>!/^--(?:plan|journal|resume)=.+$|^--commit$/.test(a))||!value('journal')||!!value('plan')===!!value('resume'))throw Error('PRIVATE_CONNECTOR_USAGE');
async function bridge(name,values){
 const allowed=['aus_stage_import','aus_import_state','aus_validate_import_part','aus_import_packet','aus_finish_import'];
 if(!allowed.includes(name))throw Error('UNEXPECTED_RPC');
 const id=randomUUID(),identity=await readPrivateJson(root+'/identity.json');assertInstitutionalIdentity(identity.project);
 if(Date.now()-Date.parse(identity.verifiedAt)>300000)throw Error('FRESH_IDENTITY_REQUIRED');
 const literals=values.map(v=>typeof v==='boolean'?String(v):typeof v==='number'?String(v):typeof v==='string'?quote(v):quote(JSON.stringify(v))+'::jsonb');
 const sql=`set local statement_timeout='120s'; set local role service_role; select public.${name}(${literals.join(',')}) as result;`;
 if(Buffer.byteLength(sql)>750000)throw Error('CONNECTOR_PART_TOO_LARGE');
 await writePrivateJson(root+'/request.json',{id,projectRef:INSTITUTIONAL_PROJECT_REF,name,sql});
 console.log(JSON.stringify({connectorRequest:id,function:name,sqlBytes:Buffer.byteLength(sql)}));
 for(let i=0;i<4800;i++){
  const response=await readPrivateJson(root+'/response.json').catch(e=>{if(e.code==='ENOENT')return null;throw e;});
  if(response?.id===id){if(response.result.error)throw Error('CONNECTOR_SQL_REJECTED');return response.result.data;}
  await sleep(50);
 }
 throw Error('CONNECTOR_RESPONSE_TIMEOUT');
}
const client={rpc:async(name,params)=>{
 try{
  if(name==='aus_import_state')return{data:await bridge(name,[params.p_origin]),error:null};
  if(name!=='aus_stage_import')throw Error('UNEXPECTED_RPC');
  const b=params.p_batch;
  if(params.p_dry_run){
   const total={dryRun:true,insert:0,update:0,unchanged:0,references:0,publicWrites:0};
   const keys=b.rows.map(({sheet,original_id})=>({sheet,original_id}));
   for(let i=0;i<b.rows.length;i+=25){
    const rows=b.rows.slice(i,i+25),ids=new Set(rows.map(r=>r.sheet+'/'+r.original_id));
    const manifest={origin:b.origin,revision:b.revision,rows:rows.map(({sheet,original_id,source_hash})=>({sheet,original_id,source_hash})),relations:[]};
    const part={...b,rows,relations:[],canonical_manifest:canonicalJson(manifest),checksum:fingerprint(manifest)};
    const result=await bridge('aus_validate_import_part',[part,b.relations.filter(r=>ids.has(r.sheet+'/'+r.original_id)),keys]);
    for(const key of ['insert','update','unchanged','references'])total[key]+=result[key];
   }
   return{data:total,error:null};
  }
  const body=JSON.stringify(b),digest=sha(body),upload=stableId('institutional-transport',b.origin,digest);let ordinal=0;
  for(let start=0;start<body.length;){
   let end=Math.min(start+100000,body.length);const code=body.charCodeAt(end-1);if(end<body.length&&code>=0xd800&&code<=0xdbff)end--;
   const payload=body.slice(start,end);ordinal++;await bridge('aus_import_packet',[upload,ordinal,payload,sha(payload)]);start=end;
  }
  // Complete server-side validation happens again before the final atomic commit.
  await bridge('aus_finish_import',[upload,ordinal,digest,true]);
  return{data:await bridge('aus_finish_import',[upload,ordinal,digest,false]),error:null};
 }catch{return{data:null,error:{code:'CONNECTOR_ERROR'}};}
}};
await writePrivateJson(root+'/status.json',{status:'running'});
const options={client,journalPath:value('journal'),dryRun:!args.includes('--commit'),targetIdentity:INSTITUTIONAL_PROJECT_REF};
try{
 const result=value('resume')?await resumeIntegralJournal(await readPrivateJson(value('resume')),options):await stageIntegralPlan(await readPrivateJson(value('plan')),options);
 await writePrivateJson(root+'/status.json',{status:'complete'});
 console.log(JSON.stringify({mode:result.mode,units:result.units.map(u=>({status:u.status,result:u.result})),publicWrites:0}));
}catch{await writePrivateJson(root+'/status.json',{status:'failed'});console.error('CONNECTOR_IMPORT_INCOMPLETE: resume the same private journal; no payload logged.');process.exitCode=1;}
