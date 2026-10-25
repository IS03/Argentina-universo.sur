import {readFile} from 'node:fs/promises';
import {readJson,scope,pilot,priorities,baseCommit,sha} from './manifest.mjs';
import {readEditorialTrips} from '../pages/editorial-security.mjs';
import {tripContentHash,tripPublishable,validateTripAsOf} from '../../lib/pages/trips.ts';

// Contract integrity only: this cannot certify historical facts, image rights or human approval.
export async function checkPr14({trips=undefined}={}){
 trips??=await readEditorialTrips(process.cwd());
 const revisions=await readJson('docs/pr14/revisions.json'),sources=await readJson('docs/pr14/source-register.json'),ledger=await readJson('docs/pr14/claim-ledger.json'),pdfs=await readJson('docs/pr14/pdf-equivalence.json'),photos=await readJson('docs/pr14/photo-candidates.json'),briefs=await readJson('docs/pr14/pr13-photo-review.json'),oldPhotos=await readJson('docs/pr13/photo-proposals.json'),oldPdfs=await readJson('docs/pr12/pdf-replacements.json');
 const errors=[];
 if(revisions.baseCommit!==baseCommit||JSON.stringify(revisions.records.map(r=>r.slug))!==JSON.stringify(scope)||trips.length!==24||Object.keys(revisions.baseline).length!==24)errors.push('Incorrect base, scope or draft count');
 if(!Object.keys(revisions.historicalFiles??{}).length)errors.push('Historical PR13 document hashes missing');
 for(const [path,hash]of Object.entries(revisions.historicalFiles??{})){
  if(!/^docs\/pr13\/[a-zA-Z0-9_./-]+$/.test(path)||path.includes('..')||sha(await readFile(path))!==hash)errors.push('Historical PR13 evidence changed: '+path);
 }
 const privateData=/docs\.google\.com\/(?:document|spreadsheets)\/d\/|\b(?:D|A|C|E)-[A-Z]{2,4}-\d{3}\b|\b(?:EV|F|P|R)-\d{4}\b|dictamen_publicacion|original_payload/;
 for(const trip of trips){
  const baseline=revisions.baseline[trip.slug],revision=revisions.records.find(r=>r.slug===trip.slug),bytes=await readFile(`content/escapadas/${trip.slug}.json`);
  if(!baseline){errors.push('Unexpected editorial record');continue;}
  if(trip.id!==baseline.id||JSON.stringify(trip.editorial?.origin.legacyGuideIds??[])!==JSON.stringify(baseline.legacyGuideIds)||trip.status!==baseline.status||trip.publicationAuthorized!==baseline.publicationAuthorized||JSON.stringify(trip.review)!==JSON.stringify(baseline.review)||sha(JSON.stringify(trip.authorization??null))!==baseline.authorizationSha256)errors.push('Identity, relation, permission or review changed: '+trip.slug);
  if(tripPublishable(trip)||trip.status!=='draft'||trip.review!==null)errors.push('All records must remain withheld: '+trip.slug);
  if(!revision){if(sha(bytes)!==baseline.fileSha256)errors.push('Out-of-scope draft changed: '+trip.slug);continue;}
  if(revision.before.fileSha256!==baseline.fileSha256||revision.after.fileSha256!==sha(bytes)||revision.after.contentSha256!==tripContentHash(trip)||revision.humanReview!==null||JSON.stringify(revision.before.state)!==JSON.stringify(revision.after.state))errors.push('Revision chain/hash/state mismatch: '+trip.slug);
  if(trip.schemaVersion!==2||trip.editorial.origin.masterRefs.length||trip.photos.length||validateTripAsOf(trip,revisions.checkedAt).length)errors.push('Invalid/unreviewed draft or imported private reference: '+trip.slug);
  const report=await readFile(`docs/pr14/review/${trip.slug}.md`,'utf8'),record=sources.records.find(r=>r.slug===trip.slug),claims=ledger.find(r=>r.slug===trip.slug);
  if(!record||!claims||claims.contentSha256!==tripContentHash(trip)){errors.push('Missing research/review ledger: '+trip.slug);continue;}
  for(const text of [tripContentHash(trip),sha(bytes),trip.description,...trip.sections.flatMap(s=>s.paragraphs),...trip.locations.map(l=>l.description)])if(!report.includes(text))errors.push('Review not exact: '+trip.slug);
  const fields=[{id:'introduction',text:trip.description,sourceIds:trip.introductionSourceIds},...trip.sections.flatMap(s=>s.paragraphs.map((text,i)=>({id:`${s.id}:${i+1}`,text,sourceIds:s.sourceIds}))),...trip.locations.map(l=>({id:`location:${l.id}`,text:l.description,sourceIds:l.sourceIds}))];
  if(claims.ledger.length!==fields.length)errors.push('Incomplete paragraph/location ledger: '+trip.slug);
  for(const field of fields){const row=claims.ledger.find(r=>r.id===field.id);if(!row||row.textSha256!==sha(field.text)||JSON.stringify(row.sourceIds)!==JSON.stringify(field.sourceIds))errors.push('Stale paragraph evidence: '+trip.slug);}
  if(record.sources.length!==trip.sources.length||new Set(record.sources.map(s=>s.id)).size!==trip.sources.length)errors.push('Source assessment count mismatch: '+trip.slug);
  for(const s of trip.sources){const r=record.sources.find(r=>r.id===s.id);if(!r||r.url!==s.url||r.title!==s.title||r.checkedAt!==s.checkedAt||r.publishedAt!==s.publishedAt||!r.evidenceLocator||!r.claims?.length||!r.limits||(pilot.includes(trip.slug)&&!r.readInPr14))errors.push('Unassessed source: '+trip.slug+'/'+s.id);}
  if(privateData.test(JSON.stringify({trip,revision,record,claims,report})))errors.push('Private master data in editorial review');
 }
 if(pdfs.length!==4||new Set(pdfs.map(r=>r.slug)).size!==4||pdfs.some(r=>!pilot.includes(r.slug)))errors.push('PDF pilot scope mismatch');
 for(const row of pdfs){
  const original=oldPdfs.find(r=>r.proposedHtml==='/escapadas/'+row.slug),trip=trips.find(t=>t.slug===row.slug);
  if(row.slug==='el-palmar'?(row.pdf!==null||row.legacyGuideId!==null||row.comparisonPurpose!=='scope-boundary-only-not-a-replacement'):(JSON.stringify(row.pdf)!==JSON.stringify(original.pdf)||row.legacyGuideId!==original.legacyGuideId))errors.push('PDF identity/relation changed');
  if(row.equivalence!=='not-established'||row.scopeReview!==null||row.onePageSufficientHumanDecision!==null||row.retirementApproval!==null||row.backup.externalBackupVerified||row.backup.restorationTested||row.redirect.enabled||row.tripContentSha256!==tripContentHash(trip)||!row.topics.length)errors.push('Unsafe PDF equivalence/retirement claim');
 }
 const expectedBriefs=oldPhotos.flatMap(row=>row.photos.map((p,i)=>({legacyGuideId:row.legacyGuideId,slug:row.slug,proposalIndex:i,use:p.use,subject:p.subject})));
 if(briefs.length!==40||JSON.stringify(briefs.map(({legacyGuideId,slug,proposalIndex,use,subject})=>({legacyGuideId,slug,proposalIndex,use,subject})))!==JSON.stringify(expectedBriefs)||briefs.some(p=>p.approved||p.downloaded||p.originalImageUrl!==null||p.author!==null||p.license!==null))errors.push('PR13 photo briefs missing/rights invented');
 if(photos.length!==6||pilot.some(slug=>!photos.some(p=>p.slug===slug)))errors.push('Pilot concrete photo candidates missing');
 if(photos.some(p=>p.approved||p.downloaded||p.humanReview!==null||p.variants.length||p.reviewStatus!=='license-declared-human-review-pending'||!p.author||!p.license||!p.originalImageUrl.startsWith('https://upload.wikimedia.org/')||!p.rightsEvidenceUrl.startsWith('https://commons.wikimedia.org/wiki/File:')||!p.conditions.length))errors.push('Photo identification/rights control failed');
 for(const data of [sources,ledger,pdfs,photos,briefs])if(privateData.test(JSON.stringify(data)))errors.push('Private master data in PR14 documentation');
 return {pilot:pilot.length,priorityEnrichments:priorities.length,totalDrafts:trips.length,publishable:trips.filter(tripPublishable).length,photoCandidates:photos.length,previousPhotoBriefsReviewed:briefs.length,activePdfRedirects:0,errors};
}
if(process.argv[1]?.endsWith('/pr14/check.mjs')){const result=await checkPr14();console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=1;}
