import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTestDatabase } from '../scripts/supabase/test-db.mjs';
const db=await createTestDatabase();
test.after(()=>db.close());
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const reviewer=id(999);
await db.query('insert into auth.users(id) values ($1)',[reviewer]);
await db.query("insert into editorial.members(user_id,role) values ($1,'reviewer')",[reviewer]);
async function entry(n,kind='article',extra={}) {
  await db.query('insert into public.entries(id,kind,slug,name,body) values ($1,$2,$3,$4,$5)',[id(n),kind,'fixture-'+n,'Synthetic fixture '+n,extra]);
}
async function approve(n,fields=['name','slug']) {
  const v=(await db.query('select content_version from public.entries where id=$1',[id(n)])).rows[0].content_version;
  await db.query("insert into editorial.human_reviews(entry_id,content_version,decision,approved_fields,reviewer_id,reviewed_at) values ($1,$2,'approved',$3,$4,'2026-10-24T00:00:00Z')",[id(n),v,fields,reviewer]);
  await db.query("update public.entries set document_status='verified',approval_status='approved',publication_permitted=true,verified_at=now(),approved_at='2026-10-24T00:00:00Z',approved_version=content_version where id=$1",[id(n)]);
}
async function asRole(role,sql,args=[]) {
  await db.exec('set role '+role);
  try{return await db.query(sql,args);}finally{await db.exec('reset role');}
}
test('PostgreSQL executes both migrations; all application tables have RLS and no public write grants',async()=>{
  const tables=(await db.query("select schemaname,tablename,rowsecurity from pg_tables where schemaname in ('public','editorial')")).rows;
  assert.ok(tables.length>20);assert.ok(tables.every(t=>t.rowsecurity));
  for(const t of tables)for(const role of ['anon','authenticated']) {
    const {rows}=await db.query('select has_table_privilege($1,$2,\'INSERT\') or has_table_privilege($1,$2,\'UPDATE\') or has_table_privilege($1,$2,\'DELETE\') as allowed',[role,t.schemaname+'.'+t.tablename]);
    assert.equal(rows[0].allowed,false);
  }
  assert.equal((await db.query("select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='editorial' and p.prosecdef")).rows[0].n,0);
});
test('anon/authenticated cannot see drafts, evidence, variable facts, reviews or write entries',async()=>{
  await entry(1);
  for(const role of ['anon','authenticated']) {
    assert.equal((await asRole(role,'select * from public.entries where id=$1',[id(1)])).rows.length,0);
    for(const table of ['evidence','variable_facts','human_reviews','members','import_rows','revisions'])await assert.rejects(asRole(role,'select * from editorial.'+table),/permission denied/);
    await assert.rejects(asRole(role,"insert into public.entries(kind,slug,name) values ('article','unauthorized','Unauthorized')"),/permission denied/);
  }
});
test('only a human review of this version can publish; content changes invalidate it',async()=>{
  await entry(2);
  await assert.rejects(db.query("update public.entries set document_status='verified',approval_status='approved',publication_permitted=true,verified_at=now(),approved_at=now(),approved_version=content_version where id=$1",[id(2)]),/human review/);
  await approve(2);
  assert.equal((await asRole('anon','select * from public.entries where id=$1',[id(2)])).rows.length,1);
  await db.query("update public.entries set name='Changed synthetic fixture' where id=$1",[id(2)]);
  const e=(await db.query('select * from public.entries where id=$1',[id(2)])).rows[0];
  assert.equal(e.publication_permitted,false);assert.equal(e.approval_status,'pending');assert.equal(e.content_version,2);
  assert.equal((await asRole('anon','select * from public.entries where id=$1',[id(2)])).rows.length,0);
});
test('partial human scope does not publish extra body fields or coordinates',async()=>{
  await entry(3,'article',{approved_text:'synthetic',numeric_fact:'unapproved'});
  await assert.rejects(approve(3,['name','slug','body.approved_text']),/human review/);
});
test('foreign keys, entity kinds, coordinates, slugs and route compatibility are enforced',async()=>{
  await entry(4,'jurisdiction');
  await db.query("insert into public.regions(id,name) values ('fixture-region','Synthetic Region')");
  await db.query("insert into public.jurisdictions(entry_id,region_id) values ($1,'fixture-region')",[id(4)]);
  await entry(5,'locality');
  await assert.rejects(db.query('insert into public.localities(entry_id,jurisdiction_id) values ($1,$2)',[id(5),id(888)]),/foreign key/);
  await assert.rejects(db.query('insert into public.localities(entry_id,jurisdiction_id) values ($1,$2)',[id(1),id(4)]),/foreign key/);
  await assert.rejects(db.query('update public.entries set latitude=91,longitude=0 where id=$1',[id(4)]),/check constraint/);
  await assert.rejects(db.query("update public.entries set canonical_path='/provincias/catarmaca' where id=$1",[id(4)]),/check constraint/);
  await assert.rejects(db.query("insert into public.entries(kind,slug,name) values ('jurisdiction','fixture-4','duplicate')"),/unique constraint/);
});
test('detail edits invalidate the parent version; circuit stops support multiple jurisdictions',async()=>{
  await approve(4,['name','slug','details']);
  await db.query("update public.jurisdictions set capital_name='Synthetic capital' where entry_id=$1",[id(4)]);
  assert.equal((await db.query('select publication_permitted from public.entries where id=$1',[id(4)])).rows[0].publication_permitted,false);
  await entry(6,'circuit');await db.query('insert into public.circuits(entry_id) values ($1)',[id(6)]);
  await db.query('insert into public.circuit_stops(circuit_id,position,jurisdiction_id) values ($1,1,$2)',[id(6),id(4)]);
  await assert.rejects(db.query('insert into public.circuit_stops(circuit_id,position,jurisdiction_id,destination_id) values ($1,2,$2,$3)',[id(6),id(4),id(4)]),/check constraint/);
});
test('source updates leave an audit trail and import origins are idempotent keys',async()=>{
  await db.exec("set role service_role; insert into editorial.sources(id,url,title) values ('F-FIXTURE','https://example.org','Synthetic source'); reset role;");
  const {rows}=await db.query("select * from editorial.revisions where table_name='editorial.sources'");
  assert.equal(rows.length,1);assert.equal(rows[0].actor_role,'service_role');
  await assert.rejects(asRole('service_role','delete from editorial.revisions'),/permission denied/);
  const batch=(await db.query("insert into editorial.import_batches(origin,source_revision,checksum,status) values ('fixture','r1','hash','staged') returning id")).rows[0].id;
  const args=['fixture','Atractivos','A-FIXTURE',batch,'a'.repeat(64),{id:'A-FIXTURE',unknown_original_field:'preserved'}];
  const sql='insert into editorial.import_rows(origin,sheet,original_id,batch_id,source_hash,original_payload) values ($1,$2,$3,$4,$5,$6) on conflict (origin,sheet,original_id) do update set source_hash=excluded.source_hash,original_payload=excluded.original_payload';
  await db.query(sql,args);await db.query(sql,args);
  assert.equal((await db.query('select * from editorial.import_rows')).rows.length,1);
});
test('Storage rejects browser uploads/edits/deletes even with a future broad permissive policy',async()=>{
  const b=(await db.query('select * from storage.buckets order by id')).rows;
  assert.equal(b.length,3);assert.equal(b.filter(b=>b.public).length,1);
  await db.exec('create policy fixture_overbroad on storage.objects for all to anon,authenticated using(true) with check(true)');
  for(const bucket of b) {
    await db.query('insert into storage.objects(bucket_id,name) values ($1,$2)',[bucket.id,'fixture']);
    for(const role of ['anon','authenticated']) {
      await assert.rejects(asRole(role,'insert into storage.objects(bucket_id,name) values ($1,$2)',[bucket.id,'forbidden']),/row-level security/);
      assert.equal((await asRole(role,'select * from storage.objects where bucket_id=$1',[bucket.id])).rows.length,0);
      assert.equal((await asRole(role,"update storage.objects set name='forbidden' where bucket_id=$1 returning id",[bucket.id])).rows.length,0);
      assert.equal((await asRole(role,'delete from storage.objects where bucket_id=$1 returning id',[bucket.id])).rows.length,0);
    }
  }
});

test('Storage migration fails closed on an existing private bucket made public',async()=>{
  await db.exec("update storage.buckets set public=true where id='editorial-private'");
  try {
    await assert.rejects(db.exec(await readFile('supabase/migrations/20261024151127_media_storage.sql','utf8')),/Existing bucket access differs/);
  } finally {
    await db.exec('rollback');
    await db.exec("update storage.buckets set public=false where id='editorial-private'");
  }
});
