import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tripContentHash,tripPublishable} from '../../lib/pages/trips.ts';
import {readEditorialTrips} from '../pages/editorial-security.mjs';
export const batches={B02:['esc_08','esc_01','esc_04','esc_12'],B03:['esc_10','esc_05','esc_09','esc_07'],B04:['esc_15','esc_19','esc_16','esc_17'],B05:['esc_14','esc_11','esc_23','esc_21'],B06:['esc_18','esc_22','esc_03','esc_20']};
export async function checkPr13(){
 const read=async p=>JSON.parse(await readFile(p,'utf8'));
 const registry=await read('docs/pr13/research-register.json'),matrix=await read('docs/pr13/pdf-equivalence.json'),old=await read('docs/pr12/pdf-replacements.json'),photos=await read('docs/pr13/photo-proposals.json');
 const baseline=await read('docs/pr13/existing-content-sha256.json'),trips=await readEditorialTrips(process.cwd()),errors=[];
 // PR13 documents remain a historical snapshot. Explicit PR14 revisions bind the old hashes to
 // the new drafts; PR14's independent gate checks every new paragraph, source and preserved state.
 const amendments=(await read('docs/pr14/revisions.json')).records;
 const amendmentFor=trip=>amendments.find(a=>a.slug===trip.slug);
 if(trips.length!==24||registry.records.length!==20||matrix.length!==20||photos.length!==20)errors.push('Expected 24 total drafts and 20 PR13 records');
 const privatePatterns=/docs\.google\.com|\b(?:D|A|C|E)-[A-Z]{2,4}-\d{3}\b|\b(?:EV|F|P|R)-\d{4}\b|original_payload|dictamen_publicacion/;
 for(const [batch,ids] of Object.entries(batches))if(JSON.stringify(registry.records.filter(r=>r.batch===batch).map(r=>r.guide))!==JSON.stringify(ids))errors.push('Incorrect batch order or identities '+batch);
 for(const r of registry.records){
  const trip=trips.find(t=>t.slug===r.slug),row=old.find(p=>p.legacyGuideId===r.guide),next=matrix.find(p=>p.legacyGuideId===r.guide),proposal=photos.find(p=>p.slug===r.slug);
  if(!trip||!row||!next){errors.push('Missing research/draft/PDF association');continue;}
  if(trip.status!=='draft'||trip.publicationAuthorized||trip.review!==null||tripPublishable(trip)||trip.editorial.origin.masterRefs.length)errors.push('PR13 must remain unapproved and without private IDs: '+r.guide);
  if(trip.editorial.origin.legacyGuideIds.length!==1||trip.editorial.origin.legacyGuideIds[0]!==r.guide||row.proposedHtml!=='/escapadas/'+trip.slug)errors.push('Changed legacy mapping: '+r.guide);
  if(JSON.stringify(row.pdf)!==JSON.stringify(next.pdf)||next.redirect.enabled||next.scopeDecision!=='pending-human-review'||next.onePageSufficient!==null||next.originalBackup.externalBackupVerified||next.originalBackup.retirementAuthorized)errors.push('Unsafe equivalence/backup/redirect claim: '+r.guide);
  const amendment=amendmentFor(trip),historicalHash=amendment?.before.contentSha256??tripContentHash(trip);
  if(historicalHash!==next.tripContentSha256||(amendment&&tripContentHash(trip)!==amendment.after.contentSha256))errors.push('Stale review matrix/revision chain: '+r.guide);
  const review=await readFile(`docs/pr13/review/${trip.slug}.md`,'utf8');
  for(const text of amendment?[historicalHash]:[tripContentHash(trip),trip.description,...trip.sections.flatMap(s=>s.paragraphs)])if(!review.includes(text))errors.push('Review does not match exact text/hash: '+r.guide);
  if(r.sources.length<3||new Set(r.sources.map(s=>s.id)).size!==r.sources.length||!r.gaps.length||!r.pdfThemes.length)errors.push('Missing research scope: '+r.guide);
  for(const source of trip.sources.filter(()=>!amendment)){const evidence=r.sources.find(s=>s.id===source.id);if(!evidence||evidence.url!==source.url||evidence.title!==source.title||evidence.checkedAt!==source.checkedAt||!evidence.claims.length||!evidence.limits)errors.push('Missing source assessment: '+r.guide);}
  if(!proposal||proposal.photos.length<2||proposal.photos.some(p=>p.approved||p.downloaded||p.license!==null||p.originalImageUrl!==null||p.reviewStatus!=='pending-identification-and-rights')||trip.photos.length)errors.push('Unreviewed photograph must not be imported: '+r.guide);
  if(privatePatterns.test(JSON.stringify({trip,r,next,proposal,review})))errors.push('Private source payload in PR13 research');
 }
 for(const [slug,hash]of Object.entries(baseline)){const bytes=await readFile(`content/escapadas/${slug}.json`),amendment=amendments.find(a=>a.slug===slug);if((amendment?.before.fileSha256??createHash('sha256').update(bytes).digest('hex'))!==hash||(amendment&&createHash('sha256').update(bytes).digest('hex')!==amendment.after.fileSha256))errors.push('Existing editorial record changed without revision chain: '+slug);}
 return {batches:5,newDrafts:20,totalDrafts:trips.length,publishable:trips.filter(tripPublishable).length,retiredPdfs:0,errors};
}
if(process.argv[1]?.endsWith('/pr13/check.mjs')){const result=await checkPr13();console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=1;}
