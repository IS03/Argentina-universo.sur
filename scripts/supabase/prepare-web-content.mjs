// Build-only approved-content reader. No privileged credentials, browser SDK or research queries.
import { readFile,writeFile,mkdir,rm,rename } from 'node:fs/promises';
import { resolve,join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createOptionalSupabaseClient } from '../../lib/supabase/client-core.ts';
import { INSTITUTIONAL_PROJECT_REF } from '../../lib/supabase/identity.ts';
import { validateWebPayload } from '../../lib/supabase/web-contract.ts';
import { publicationHash } from '../../lib/destinos/publication-contract.ts';
import { publishedCandidate } from '../../lib/supabase/published-contract.ts';
import { validateRemotePage } from '../../lib/destinos/remote-page.ts';
const unavailable=()=>Error('PUBLIC_SOURCE_UNAVAILABLE');
async function read(query){
 let r;try{r=await query;}catch{throw unavailable();}
 if(r.error){if(!r.status||r.status>=500)throw unavailable();throw Error('PUBLIC_SOURCE_READ_DENIED');}
 return r.data;
}
async function verifyAssets(page,assets,root){
 if(!Array.isArray(assets))throw Error('PUBLIC_ASSETS_REQUIRED');
 const used=new Set(page.photos.flatMap(p=>[p.foto.src,...p.foto.variantes.map(v=>v.src)]));
 if(assets.length!==used.size||new Set(assets.map(a=>a.path)).size!==used.size)throw Error('PUBLIC_ASSET_SET_MISMATCH');
 for(const a of assets){
  if(!used.has(a.path)||!/^\/media\/[a-zA-Z0-9/_.,-]+$/.test(a.path)||a.path.includes('..')||!Number.isSafeInteger(a.bytes)||!/^[a-f0-9]{64}$/.test(a.sha256))throw Error('PUBLIC_ASSET_INVALID');
  const bytes=await readFile(join(root,'public',a.path));
  if(bytes.length!==a.bytes||createHash('sha256').update(bytes).digest('hex')!==a.sha256)throw Error('PUBLIC_ASSET_CHANGED');
 }
}
export async function prepareWebContent({env=process.env,root=process.cwd(),fetcher=fetch}={}){
 const path=join(root,'content/supabase/build-cache.json');
 // Replace only after validation; failed builds clear the previous generated candidate.
 const mode=env.AUS_CONTENT_SOURCE??'static';
 if(!['static','supabase'].includes(mode))throw Error('CONTENT_SOURCE_INVALID');
 if(mode==='static'){await rm(path,{force:true});return{source:'static',remoteReads:0};}
 const client=createOptionalSupabaseClient(env,fetcher);if(!client)throw Error('INSTITUTIONAL_CONFIG_REQUIRED');
 try{
  const row=await read(client.from('web_build_releases').select('payload,payload_sha256,version,source_git_revision').eq('active',true).eq('publication_permitted',true).maybeSingle());
  if(!row)throw unavailable();
  const payload=validateWebPayload(row.payload);
  if(publicationHash(payload)!==row.payload_sha256)throw Error('PUBLIC_RELEASE_HASH_MISMATCH');
  const extraDestinations=[];const seen=new Map(payload.destinations.map(p=>[p.slug,publicationHash(p)]));let after;
  for(let page=0;page<100;page++){
   let q=client.from('entries').select('*').eq('kind','destination').eq('publication_permitted',true).eq('document_status','verified').eq('approval_status','approved').order('id').limit(200);
   if(after)q=q.gt('id',after);const entries=await read(q);
   for(const entry of entries){
    const c=publishedCandidate(entry),body=c.body;
    if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).sort().join()!=='assets,page')throw Error('PUBLIC_DESTINATION_BODY_SHAPE');
    const p=validateRemotePage(body.page);
    if(p.slug!==c.slug||c.canonical_path!=='/destinos/'+p.slug)throw Error('PUBLIC_DESTINATION_ROUTE_MISMATCH');
    await verifyAssets(p,body.assets,root);
    if(seen.has(p.slug)){if(seen.get(p.slug)!==publicationHash(p))throw Error('PUBLIC_DESTINATION_COLLISION');continue;}
    seen.set(p.slug,publicationHash(p));extraDestinations.push(p);
   }
   if(entries.length<200)break;if(page===99)throw Error('PUBLIC_READ_LIMIT');after=entries.at(-1).id;
  }
  // Historical assets still pass the original PR19 file contract before npm build/Pages.
  for(const entry of payload.release.entries)await verifyAssets(payload.destinations.find(p=>p.slug===entry.slug),entry.assets,root);
  const cache={schemaVersion:1,projectRef:INSTITUTIONAL_PROJECT_REF,payload,payloadHash:row.payload_sha256,extraDestinations};
  await mkdir(join(root,'content/supabase'),{recursive:true});await writeFile(path+'.tmp',JSON.stringify(cache)+'\n');await rename(path+'.tmp',path);
  return{source:'supabase',projectRef:INSTITUTIONAL_PROJECT_REF,releaseVersion:row.version,catalogs:Object.keys(payload.catalogs).length,destinations:payload.destinations.length+extraDestinations.length,payloadHash:row.payload_sha256};
 }catch(error){
  await rm(path,{force:true});await rm(path+'.tmp',{force:true});
  if(error.message==='PUBLIC_SOURCE_UNAVAILABLE'&&env.AUS_CONTENT_FALLBACK!=='deny')return{source:'static-fallback',reason:'source-unavailable',remoteReads:1};
  throw error;
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await prepareWebContent()));
