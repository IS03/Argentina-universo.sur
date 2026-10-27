import test from 'node:test';
import assert from 'node:assert/strict';
import{readFile}from'node:fs/promises';
import{createTestDatabase}from'../scripts/supabase/test-db.mjs';
import{CATALOG_PATHS}from'../lib/supabase/catalog-pins.ts';
import{canonicalJSON,publicationHash}from'../lib/destinos/publication-contract.ts';
import{AUTHORIZATION_DIGEST}from'../lib/destinos/authorized.ts';
import{readPublication}from'../scripts/editorial/publication.mjs';
const db=await createTestDatabase();test.after(()=>db.close());
test('public snapshot reads are limited to the frozen approved active version; browser roles cannot edit',async()=>{
 const {release,pages}=await readPublication(),catalogs=Object.fromEntries(await Promise.all(Object.entries(CATALOG_PATHS).map(async([k,p])=>[k,JSON.parse(await readFile(p,'utf8'))])));
 const payload={schemaVersion:1,catalogs,release,destinations:pages};
 await db.query('insert into public.web_build_releases(version,payload,canonical_payload,payload_sha256,authorization_digest,source_git_revision,publication_permitted,active) values(1,$1,$2,$3,$4,$5,true,true)',[payload,canonicalJSON(payload),publicationHash(payload),AUTHORIZATION_DIGEST,'a'.repeat(40)]);
 for(const role of ['anon','authenticated']){
  await db.exec('set role '+role);try{
   assert.equal((await db.query('select count(*)::int n from public.web_build_releases')).rows[0].n,1);
   await assert.rejects(db.exec('update public.web_build_releases set active=false'),/permission denied/);
  }finally{await db.exec('reset role');}
 }
 const changed={...payload,privateResearch:'forbidden'};
 await assert.rejects(db.query('insert into public.web_build_releases(version,payload,canonical_payload,payload_sha256,authorization_digest,source_git_revision) values(2,$1,$2,$3,$4,$5)',[changed,canonicalJSON(changed),publicationHash(changed),AUTHORIZATION_DIGEST,'a'.repeat(40)]),/check constraint/);
 await db.exec('set role service_role; update public.web_build_releases set active=false; reset role;');
 await db.exec('set role anon');try{assert.equal((await db.query('select count(*)::int n from public.web_build_releases')).rows[0].n,0);}finally{await db.exec('reset role');}
});
