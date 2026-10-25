import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {checkPr14} from '../scripts/pr14/check.mjs';
import {scope} from '../scripts/pr14/manifest.mjs';
import {readEditorialTrips,auditPublicArtifact} from '../scripts/pages/editorial-security.mjs';
import {tripPublishable,tripContentHash} from '../lib/pages/trips.ts';
test('PR14 binds eight exact drafts, preserves all permissions and PDF relationships, and leaves 16 drafts unchanged',async()=>{
 const result=await checkPr14();assert.deepEqual(result.errors,[]);assert.equal(result.pilot,4);assert.equal(result.priorityEnrichments,4);assert.equal(result.publishable,0);
});
test('editorial review never authorizes publication, including the previously permitted El Palmar',async()=>{
 const trips=await readEditorialTrips(process.cwd());
 for(const slug of scope){const trip=trips.find(t=>t.slug===slug);assert.equal(trip.status,'draft');assert.equal(trip.review,null);assert.equal(tripPublishable(trip),false);}
 assert.equal(trips.find(t=>t.slug==='el-palmar').publicationAuthorized,true);
 const changed=structuredClone(trips),trip=changed.find(t=>t.slug==='caba');trip.publicationAuthorized=true;
 assert.ok((await checkPr14({trips:changed})).errors.some(e=>e.includes('permission')));
});
test('a text change invalidates both the exact review hash and its paragraph ledger',async()=>{
 const trips=await readEditorialTrips(process.cwd()),trip=trips.find(t=>t.slug==='caba'),oldHash=tripContentHash(trip);
 trip.sections[0].paragraphs[0]+=' Synthetic unsupported change.';
 assert.notEqual(tripContentHash(trip),oldHash);
 const result=await checkPr14({trips});assert.ok(result.errors.some(e=>/hash|ledger/.test(e)));
});
test('revised pilot and priority texts cannot appear in public HTML, RSC, JavaScript or JSON',async()=>{
 const trips=await readEditorialTrips(process.cwd()),dir=await mkdtemp(join(tmpdir(),'aus-pr14-'));
 try{for(const trip of trips.filter(t=>scope.includes(t.slug)))for(const [extension,text]of [['html',trip.description],['txt',trip.sections[0].paragraphs[0]],['js',JSON.stringify(trip)],['json',JSON.stringify({path:'/escapadas/'+trip.slug})]]){
  const path=join(dir,'leak.'+extension);await writeFile(path,text);assert.ok((await auditPublicArtifact(dir,trips)).errors.length,trip.slug+'/'+extension);await rm(path);
 }}finally{await rm(dir,{recursive:true,force:true});}
});
test('review output rejects public paths and conflicting phase flags',()=>{
 for(const args of [['--out=public/review'],['--pr13','--pr14']])assert.throws(()=>execFileSync(process.execPath,['--experimental-strip-types','scripts/editorial/review.mjs',...args],{stdio:'pipe'}));
});
test('photograph license declarations remain candidates, not independent rights approvals',async()=>{
 const photos=JSON.parse(await readFile('docs/pr14/photo-candidates.json','utf8'));
 assert.equal(photos.length,6);for(const p of photos){assert.ok(p.originalImageUrl);assert.ok(p.author);assert.ok(p.licenseUrl);assert.equal(p.approved,false);assert.equal(p.humanReview,null);assert.equal(p.downloaded,false);}
});
