import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkPr13} from '../scripts/pr13/check.mjs';
import {readEditorialTrips,auditPublicArtifact} from '../scripts/pages/editorial-security.mjs';
import {validateTripAsOf,publishedTripProjection,tripPublishable} from '../lib/pages/trips.ts';
test('PR13 covers exact batches, preserves PDF lineage, binds human review text to hashes and freezes existing permissions',async()=>{
 const result=await checkPr13();assert.deepEqual(result.errors,[]);assert.equal(result.newDrafts,20);assert.equal(result.totalDrafts,24);assert.equal(result.publishable,0);
});
test('all 20 draft payloads and routes are rejected in HTML, JavaScript, RSC, JSON and sitemap artifacts',async()=>{
 const trips=await readEditorialTrips(process.cwd());
 const rows=JSON.parse(await readFile('docs/pr13/pdf-equivalence.json','utf8'));
 const dir=await mkdtemp(join(tmpdir(),'aus-pr13-public-'));
 try{
  for(const row of rows){const trip=trips.find(t=>t.id===row.draftId);for(const [file,body]of [['page.html',trip.description],['chunk.js',JSON.stringify(trip)],['page.txt',trip.sections[0].paragraphs[0]],['index.json',JSON.stringify({path:'/escapadas/'+trip.slug})],['sitemap.xml','<loc>https://www.argentinauniversosur.com/escapadas/'+trip.slug+'</loc>']]){
   await writeFile(join(dir,file),body);const report=await auditPublicArtifact(dir,trips);assert.ok(report.errors.length,`${row.legacyGuideId}: ${file}`);await rm(join(dir,file));
  }}
  assert.deepEqual((await auditPublicArtifact(dir,trips)).errors,[]);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('Moconá observation expires without making its closure permanent or bypassing human approval',async()=>{
 const trip=JSON.parse(await readFile('content/escapadas/misiones.json','utf8'));
 assert.deepEqual(validateTripAsOf(trip,'2026-10-24'),[]);assert.equal(tripPublishable(trip),false);
 assert.throws(()=>publishedTripProjection(trip),/no valid publication approval/);
 assert.equal(trip.operationalNotices[0].expiresAt,'2026-11-07');
 assert.match(trip.operationalNotices[0].observation,/24 de octubre de 2026/);
 assert.match(trip.operationalNotices[0].observation,/mostraba/);
 assert.doesNotMatch(trip.sections.map(s=>s.paragraphs.join(' ')).join(' '),/parque (?:está |permanece )?cerrado/i);
});
test('raw private research references are blocked even under innocent field names',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'aus-pr13-references-'));
 try{for(const reference of ['D-ER-999','A-COR-999','EV-9999','F-9999','https://docs.google.com/document/d/synthetic-private-document/edit','https://docs.google.com/spreadsheets/d/synthetic-private-sheet/edit']){
  await writeFile(join(dir,'payload.json'),JSON.stringify({reference}));
  assert.ok((await auditPublicArtifact(dir,[])).errors.some(e=>e.rule==='private-master-data'));
 }}finally{await rm(dir,{recursive:true,force:true});}
});
