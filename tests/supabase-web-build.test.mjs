import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,readFile,cp,rm,mkdir,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readPublication } from '../scripts/editorial/publication.mjs';
import { CATALOG_PATHS } from '../lib/supabase/catalog-pins.ts';
import { publicationHash } from '../lib/destinos/publication-contract.ts';
import { prepareWebContent } from '../scripts/supabase/prepare-web-content.mjs';
import { validateRemotePage } from '../lib/destinos/remote-page.ts';
const{release,pages}=await readPublication();
const catalogs=Object.fromEntries(await Promise.all(Object.entries(CATALOG_PATHS).map(async([k,p])=>[k,JSON.parse(await readFile(p,'utf8'))])));
const payload={schemaVersion:1,catalogs,release,destinations:pages};
const env={AUS_CONTENT_SOURCE:'supabase',SUPABASE_PROJECT_REF:'vpbonlzixodxvbybkffv',SUPABASE_URL:'https://vpbonlzixodxvbybkffv.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic'};
const fetcher=(body=payload,extras=[],hash=publicationHash(body))=>async url=>new Response(JSON.stringify(String(url).includes('/web_build_releases')?[{payload:body,payload_sha256:hash,version:1}]:extras),{status:200,headers:{'Content-Type':'application/json'}});
async function rootFixture(){const root=await mkdtemp(join(tmpdir(),'aus-approved-build-'));await mkdir(join(root,'public/media'),{recursive:true});await cp('public/media/review',join(root,'public/media/review'),{recursive:true});return root;}
test('build consumes only a hash-verified public snapshot with the exact historical two permissions',async()=>{
 const root=await rootFixture();try{
  const result=await prepareWebContent({root,env:{...env,AUS_CONTENT_FALLBACK:'deny'},fetcher:fetcher()});assert.equal(result.source,'supabase');assert.equal(result.destinations,2);
  const cache=JSON.parse(await readFile(join(root,'content/supabase/build-cache.json')));assert.deepEqual(cache.payload.destinations,pages);assert.equal(cache.projectRef,env.SUPABASE_PROJECT_REF);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('unavailability gives controlled static fallback, clears stale cache, and strict mode stops',async()=>{
 const root=await rootFixture();try{
  await mkdir(join(root,'content/supabase'),{recursive:true});await writeFile(join(root,'content/supabase/build-cache.json'),'stale');
  const offline=async()=>new Response('unavailable',{status:503});
  assert.equal((await prepareWebContent({root,env,fetcher:offline})).source,'static-fallback');
  await assert.rejects(readFile(join(root,'content/supabase/build-cache.json')),/ENOENT/);
  await assert.rejects(prepareWebContent({root,env:{...env,AUS_CONTENT_FALLBACK:'deny'},fetcher:offline}),/UNAVAILABLE/);
  let calls=0;assert.equal((await prepareWebContent({root,env:{},fetcher:()=>{calls++;throw Error('must not call');}})).source,'static');assert.equal(calls,0);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('integrity, approval and catalog changes never silently fall back',async()=>{
 const root=await rootFixture();try{
  const changed=structuredClone(payload);changed.destinations[0].resumen='unapproved';
  await assert.rejects(prepareWebContent({root,env,fetcher:fetcher(changed)}),/VERSION_MISMATCH/);
  const privateField=structuredClone(payload);privateField.catalogs.provincias[0].private_evidence='must not reach public output';
  await assert.rejects(prepareWebContent({root,env,fetcher:fetcher(privateField)}),/VERSION_MISMATCH/);
  await assert.rejects(prepareWebContent({root,env,fetcher:fetcher(payload,[],'0'.repeat(64))}),/HASH_MISMATCH/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('future exact approved versions add routes without per-destination code; stale/unknown fields are blocked',async()=>{
 const root=await rootFixture();try{
  const page=structuredClone(pages[0]);page.slug='synthetic-approved';page.id='synthetic-approved';page.seo.proposedCanonical='https://www.argentinauniversosur.com/destinos/'+page.slug;
  assert.ok(validateRemotePage(page));
  const entry={id:'synthetic-only',kind:'destination',slug:page.slug,name:page.nombre,canonical_path:'/destinos/'+page.slug,latitude:null,longitude:null,content_version:1,approved_version:1,publication_permitted:true,document_status:'verified',approval_status:'approved',approved_at:'2026-10-27',verified_at:'2026-10-27',body:{page,assets:release.entries.find(e=>e.slug===pages[0].slug).assets}};
  assert.equal((await prepareWebContent({root,env,fetcher:fetcher(payload,[entry])})).destinations,3);
  assert.equal(JSON.parse(await readFile(join(root,'content/supabase/build-cache.json'))).extraDestinations[0].slug,page.slug);
  await assert.rejects(prepareWebContent({root,env,fetcher:fetcher(payload,[{...entry,approved_version:2}])}),/UNAPPROVED/);
  const leaked=structuredClone(entry);leaked.body.page.originalPayload={private:true};await assert.rejects(prepareWebContent({root,env,fetcher:fetcher(payload,[leaked])}),/UNSAFE/);
  const hidden=structuredClone(entry);hidden.body.page.photos[0].foto.leyenda={private:'not public text'};await assert.rejects(prepareWebContent({root,env,fetcher:fetcher(payload,[hidden])}),/UNSAFE/);
  const tampered=structuredClone(entry);tampered.body.assets[0].sha256='0'.repeat(64);await assert.rejects(prepareWebContent({root,env,fetcher:fetcher(payload,[tampered])}),/ASSET_CHANGED/);
 }finally{await rm(root,{recursive:true,force:true});}
});
