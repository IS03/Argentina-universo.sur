// Real local Auth/PostgREST/Storage checks. Refuses every non-loopback target.
import assert from 'node:assert/strict';
import { randomUUID, createHash, createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { readPrivateJson, writePrivateJson } from '../editorial/private-io.mjs';
import { SHEETS, canonicalJson, fingerprint } from '../editorial/import-core.mjs';
import { syntheticWorkSnapshot } from '../editorial/work-fixtures.mjs';
import { planIntegralImport } from '../editorial/integral-import.mjs';
import { importClient } from './import-transport.mjs';

const target=await readPrivateJson('.artifacts/pr24/private/local-target.json');
assert.equal(target.mode,'local');assert.equal(target.url,'http://127.0.0.1:59421');
const credentials=await readPrivateJson(target.credentialsPath),service=await importClient(target,{write:true});
const anon=createClient(target.url,credentials.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const report={target:'isolated-local-Supabase',syntheticOnly:true,checks:[],failures:[],remoteWrites:0};
const key='pr24/'+randomUUID()+'/evidence.json',draftId=randomUUID();let userId;
const check=async(name,fn)=>{await fn();report.checks.push({name,passed:true});};
const rowsBefore=await service.from('entries').select('id').eq('id',draftId);assert.equal(rowsBefore.error,null);
try {
 await check('three buckets have reviewed visibility and private JSON is supported',async()=>{
  const {data,error}=await service.storage.listBuckets();assert.equal(error,null);
  for(const id of ['tourism-published','editorial-private','advertising-private'])assert.ok(data.some(b=>b.id===id));
  assert.equal(data.find(b=>b.id==='editorial-private').public,false);
  assert.ok(data.find(b=>b.id==='editorial-private').allowed_mime_types.includes('application/json'));
  assert.equal(data.find(b=>b.id==='advertising-private').public,false);
  assert.equal(data.find(b=>b.id==='tourism-published').public,false);
 });
 const sessionUser=await service.auth.admin.createUser({email:`pr24-${randomUUID()}@example.invalid`,password:'Synthetic-'+randomUUID()+'A1!',email_confirm:true,user_metadata:{role:'publisher'}});
 assert.equal(sessionUser.error,null);userId=sessionUser.data.user.id;
 // Sign a short-lived LOCAL fixture JWT: email logins deliberately stay disabled.
 // A real Auth user exists, but an authenticated role (even metadata.role=publisher) cannot edit.
 const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
 const unsigned=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:userId,role:'authenticated',aud:'authenticated',iss:target.url+'/auth/v1',exp:Math.floor(Date.now()/1000)+300,user_metadata:{role:'publisher'}});
 const jwt=unsigned+'.'+createHmac('sha256',credentials.JWT_SECRET).update(unsigned).digest('base64url');
 const auth=createClient(target.url,credentials.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:'Bearer '+jwt}}});
 await check('research staging over real REST is atomic, idempotent and preserves original payloads',async()=>{
  const snapshot=syntheticWorkSnapshot();for(const name of SHEETS)snapshot.tables[name]??=[];
  const plan=planIntegralImport(snapshot);assert.equal(plan.canStage,true);
  const batch=plan.bundles[0];batch.origin='synthetic:pr24:'+randomUUID();
  const manifest={origin:batch.origin,revision:batch.revision,rows:batch.rows.map(({sheet,original_id,source_hash})=>({sheet,original_id,source_hash})),relations:batch.relations};
  batch.canonical_manifest=canonicalJson(manifest);batch.checksum=fingerprint(manifest);
  const dry=await service.rpc('aus_stage_import',{p_batch:batch,p_dry_run:true});assert.equal(dry.error,null);assert.equal(dry.data.insert,batch.rows.length);
  const first=await service.rpc('aus_stage_import',{p_batch:batch,p_dry_run:false});assert.equal(first.error,null);assert.equal(first.data.publicWrites,0);
  const second=await service.rpc('aus_stage_import',{p_batch:batch,p_dry_run:false});assert.equal(second.error,null);assert.equal(second.data.replayed,true);
  const state=await service.rpc('aus_import_state',{p_origin:batch.origin});assert.equal(state.error,null);assert.equal(state.data.rows.length,batch.rows.length);
  report.syntheticRows=batch.rows.length;report.syntheticReferences=batch.relations.length;
  for(const client of [anon,auth]) {
   assert.ok((await client.rpc('aus_import_state',{p_origin:batch.origin})).error);
   assert.ok((await client.rpc('aus_stage_import',{p_batch:batch,p_dry_run:false})).error);
  }
 });
 await check('anonymous and authenticated clients cannot expose the editorial schema',async()=>{
  for(const client of [anon,auth])assert.ok((await client.schema('editorial').from('import_rows').select('*')).error);
 });
 await check('public draft stays invisible and browser roles cannot publish it',async()=>{
  assert.equal((await service.from('entries').insert({id:draftId,kind:'article',slug:'pr24-fixture-'+draftId,name:'Synthetic private draft'})).error,null);
  for(const client of [anon,auth]) {
   const read=await client.from('entries').select('*').eq('id',draftId);assert.equal(read.error,null);assert.equal(read.data.length,0);
   assert.ok((await client.from('entries').update({publication_permitted:true}).eq('id',draftId)).error);
  }
  assert.ok((await service.from('entries').update({document_status:'verified',approval_status:'approved',publication_permitted:true,approved_version:1,approved_at:new Date().toISOString(),verified_at:new Date().toISOString()}).eq('id',draftId)).error);
 });
 const bytes=Buffer.from(JSON.stringify({synthetic:true,privateResearch:'not a publication approval'}));
 await check('authorized private upload/download keeps exact bytes',async()=>{
  assert.equal((await service.storage.from('editorial-private').upload(key,bytes,{contentType:'application/json',upsert:false})).error,null);
  const downloaded=await service.storage.from('editorial-private').download(key);assert.equal(downloaded.error,null);
  assert.equal(createHash('sha256').update(Buffer.from(await downloaded.data.arrayBuffer())).digest('hex'),createHash('sha256').update(bytes).digest('hex'));
 });
 await check('real Storage API denies private reads, uploads and replacement for browser roles',async()=>{
  for(const client of [anon,auth]) {
   assert.ok((await client.storage.from('editorial-private').download(key)).error);
   assert.ok((await client.storage.from('editorial-private').upload(key,Buffer.from('forbidden'),{contentType:'application/json',upsert:true})).error);
   assert.ok((await client.storage.from('editorial-private').update(key,Buffer.from('forbidden'),{contentType:'application/json'})).error);
   await client.storage.from('editorial-private').remove([key]);
   const intact=await service.storage.from('editorial-private').download(key);assert.equal(intact.error,null);assert.equal(await intact.data.text(),bytes.toString());
  }
 });
 await check('private evidence has no public download URL',async()=>{
  const response=await fetch(target.url+'/storage/v1/object/public/editorial-private/'+key);assert.notEqual(response.status,200);
 });
} catch(error) {
 report.failures.push({code:error.code??'ASSERTION',check:report.checks.length+1,message:error.message,stack:error.stack});process.exitCode=1;
} finally {
 await service.storage.from('editorial-private').remove([key]);
 await service.from('entries').delete().eq('id',draftId);
 if(userId)await service.auth.admin.deleteUser(userId);
 await writePrivateJson('.artifacts/pr24/private/http-results.json',report);
 console.log(JSON.stringify({target:report.target,passed:report.checks.length,failed:report.failures.length,syntheticRows:report.syntheticRows,remoteWrites:0}));
}
