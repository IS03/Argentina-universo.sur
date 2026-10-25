import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tripContentHash} from '../../lib/pages/trips.ts';
export const baseCommit='aeac1d1d99506373cf95ef262e3fad6383817588';
export const pilot=['caba','puerto-iguazu','talampaya-e-ischigualasto','el-palmar'];
export const priorities=['jujuy','san-luis','entre-rios','rio-gallegos'];
export const scope=[...pilot,...priorities];
export const sha=value=>createHash('sha256').update(value).digest('hex');
export const readJson=async path=>JSON.parse(await readFile(path,'utf8'));
export const beforeBytes=slug=>execFileSync('git',['show',`${baseCommit}:content/escapadas/${slug}.json`]);
export async function createManifest(){
 const records=[];
 for(const slug of scope){
  const previousBytes=beforeBytes(slug),previous=JSON.parse(previousBytes),bytes=await readFile(`content/escapadas/${slug}.json`),trip=JSON.parse(bytes);
  const state=t=>({status:t.status,publicationAuthorized:t.publicationAuthorized,review:t.review});
  records.push({slug,id:trip.id,group:pilot.includes(slug)?'pilot':'priority-gap',before:{fileSha256:sha(previousBytes),contentSha256:tripContentHash(previous),state:state(previous)},after:{fileSha256:sha(bytes),contentSha256:tripContentHash(trip),state:state(trip)},legacyGuideIds:trip.editorial.origin.legacyGuideIds,masterRefs:trip.editorial.origin.masterRefs,changedSections:trip.sections.filter(s=>JSON.stringify(previous.sections.find(old=>(old.id??old.title)===(s.id??s.title)))!==JSON.stringify(s)).map(s=>s.id),humanReview:null});
 }
 await mkdir('docs/pr14',{recursive:true});
 const baseline={};
 for(const file of await readdir('content/escapadas')){
  if(!file.endsWith('.json'))continue;
  const slug=file.slice(0,-5),bytes=beforeBytes(slug),trip=JSON.parse(bytes);
  baseline[slug]={fileSha256:sha(bytes),id:trip.id,legacyGuideIds:trip.editorial?.origin.legacyGuideIds??[],status:trip.status,publicationAuthorized:trip.publicationAuthorized,review:trip.review,authorizationSha256:sha(JSON.stringify(trip.authorization??null))};
 }
 const historicalFiles={};
 const historicalPaths=execFileSync('git',['ls-tree','-r','--name-only',baseCommit,'--','docs/pr13']).toString().trim().split('\n');
 for(const path of historicalPaths)historicalFiles[path]=sha(execFileSync('git',['show',`${baseCommit}:${path}`]));
 await writeFile('docs/pr14/revisions.json',JSON.stringify({schemaVersion:1,baseCommit,checkedAt:'2026-10-25',baseline,historicalFiles,records},null,2)+'\n');
 return records;
}
if(process.argv[1]?.endsWith('/pr14/manifest.mjs'))await createManifest();
