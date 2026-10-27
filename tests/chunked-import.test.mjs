import test from 'node:test';
import assert from 'node:assert/strict';
import{createHash,randomUUID}from'node:crypto';
import{createTestDatabase}from'../scripts/supabase/test-db.mjs';
import{syntheticWorkSnapshot}from'../scripts/editorial/work-fixtures.mjs';
import{SHEETS,canonicalJson,fingerprint}from'../scripts/editorial/import-core.mjs';
import{planIntegralImport}from'../scripts/editorial/integral-import.mjs';
const db=await createTestDatabase();test.after(()=>db.close());
const sha=s=>createHash('sha256').update(s).digest('hex');
const s=syntheticWorkSnapshot();for(const name of SHEETS)s.tables[name]??=[];
const b=planIntegralImport(s).bundles[0];
test('remote-size transport validates parts without writes, rejects unresolved references',async()=>{
 const rows=b.rows.slice(0,10),manifest={origin:b.origin,revision:b.revision,rows:rows.map(({sheet,original_id,source_hash})=>({sheet,original_id,source_hash})),relations:[]};
 const part={...b,rows,relations:[],checksum:fingerprint(manifest),canonical_manifest:canonicalJson(manifest)};
 const refs=b.relations.filter(r=>rows.some(row=>row.sheet===r.sheet&&row.original_id===r.original_id));
 const keys=b.rows.map(({sheet,original_id})=>({sheet,original_id}));
 const r=await db.query('select public.aus_validate_import_part($1,$2,$3) result',[part,refs,keys]);assert.equal(r.rows[0].result.insert,10);
 assert.equal((await db.query('select count(*)::int n from editorial.import_rows')).rows[0].n,0);
 if(refs.length)await assert.rejects(db.query('select public.aus_validate_import_part($1,$2,$3)',[part,refs,[]]),/UNRESOLVED/);
});
test('immutable packets resume exactly; missing/bad packets fail and final staging remains atomic',async()=>{
 const body=JSON.stringify(b),upload=randomUUID(),chunks=body.match(/[\s\S]{1,20000}/g);
 await assert.rejects(db.query('select public.aus_import_packet($1,1,$2,$3)',[upload,chunks[0],'0'.repeat(64)]),/HASH/);
 for(const [i,chunk]of chunks.entries()){
  await db.query('select public.aus_import_packet($1,$2,$3,$4)',[upload,i+1,chunk,sha(chunk)]);
  const retry=await db.query('select public.aus_import_packet($1,$2,$3,$4) result',[upload,i+1,chunk,sha(chunk)]);assert.equal(retry.rows[0].result.replayed,true);
 }
 await assert.rejects(db.query('select public.aus_import_packet($1,1,$2,$3)',[upload,'conflict',sha('conflict')]),/CONFLICT/);
 await assert.rejects(db.query('select public.aus_finish_import($1,$2,$3,true)',[upload,chunks.length+1,sha(body)]),/INCOMPLETE/);
 const dry=await db.query('select public.aus_finish_import($1,$2,$3,true) result',[upload,chunks.length,sha(body)]);assert.equal(dry.rows[0].result.insert,b.rows.length);
 assert.equal((await db.query('select count(*)::int n from editorial.import_rows')).rows[0].n,0);
 const applied=await db.query('select public.aus_finish_import($1,$2,$3,false) result',[upload,chunks.length,sha(body)]);assert.equal(applied.rows[0].result.publicWrites,0);
 const audit=(await db.query('select count(*)::int n from editorial.revisions')).rows[0].n;
 assert.equal((await db.query('select public.aus_finish_import($1,$2,$3,false) result',[upload,chunks.length,sha(body)])).rows[0].result.replayed,true);
 assert.equal((await db.query('select count(*)::int n from editorial.revisions')).rows[0].n,audit);
 for(const role of ['anon','authenticated'])for(const fn of ['public.aus_import_packet(uuid,integer,text,text)','public.aus_finish_import(uuid,integer,text,boolean)','public.aus_validate_import_part(jsonb,jsonb,jsonb)'])assert.equal((await db.query("select has_function_privilege($1,$2,'execute') allowed",[role,fn])).rows[0].allowed,false);
});
