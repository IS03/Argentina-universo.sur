import { readdir, readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { sourceAssetReferences } from './validate-data.mjs';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
const MIME = {'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.pdf':'application/pdf','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.xls':'application/vnd.ms-excel','.txt':'text/plain','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.ico':'image/x-icon','.woff2':'font/woff2','.json':'application/json'};
export function normalizeAssetPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  try { const decoded = decodeURIComponent(value.split(/[?#]/)[0]); return decoded.includes('..') ? null : decoded; } catch { return null; }
}
export async function walk(dir) {
  const result=[];
  try { for (const d of await readdir(dir,{withFileTypes:true})) {
    // Never follow symlinks outside the intended inventory roots.
    if(d.isDirectory()) result.push(...await walk(join(dir,d.name)));
    else if(d.isFile() && d.name!=='.DS_Store') result.push(join(dir,d.name));
  }} catch(e) { if(e.code!=='ENOENT')throw e; }
  return result.sort();
}
export async function inventory(root=ROOT,{includeAdvertising=false}={}) {
  const refs=new Map();
  const add=(url,where)=>{ const p=normalizeAssetPath(url); if(p)refs.set(p,[...(refs.get(p)||[]),where]); };
  const inspect=(v,where)=>{
    if(typeof v==='string')add(v,where);
    else if(v && typeof v==='object')for(const [k,item] of Object.entries(v))inspect(item,`${where}.${k}`);
  };
  for(const f of (await walk(join(root,'public'))).filter(f=>f.endsWith('.json')))inspect(JSON.parse(await readFile(f,'utf8')),relative(root,f));
  for(const dir of ['app','components','lib']) for(const f of await walk(join(root,dir))) {
    if(!/\.[cm]?[jt]sx?$/.test(f))continue;
    for(const url of sourceAssetReferences(await readFile(f,'utf8'),f))add(url,relative(root,f));
  }
  // Public documents plus tracked documents outside public; never include .env or arbitrary work files.
  const tracked = execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
  const paths=new Set((await walk(join(root,'public'))).filter(f=>!f.endsWith('.json')));
  for(const p of tracked)if(/\.(pdf|xlsx?|mp4|webm|mp3|woff2|ico|png|jpe?g|svg|gif|avif|webp)$/i.test(p))paths.add(join(root,p));
  if(includeAdvertising)for(const f of await walk(join(root,'publicidad')))paths.add(f);
  const files=[];
  for(const f of [...paths].sort()) {
    const originalPath=relative(root,f).split('\\').join('/');
    const ext=extname(f).toLowerCase(); let mime=MIME[ext]||'application/octet-stream';
    const bytes=(await stat(f)).size, hash=createHash('sha256').update(await readFile(f)).digest('hex');
    let dimensions=null,dimensionError=null;
    if(mime.startsWith('image/') && ext!=='.ico') {
      try { const m=await sharp(f).metadata(); mime=MIME['.'+m.format]||mime; dimensions={width:m.width,height:m.height,pages:m.pages||1}; }
      catch(e) { dimensionError=e.message; }
    }
    const url=originalPath.startsWith('public/')?'/'+originalPath.slice(7):null;
    const references=url?[...new Set(refs.get(url)||[])].sort():[];
    const category=originalPath.startsWith('publicidad/')?'advertising':originalPath.startsWith('public/img/')?'tourism-images':originalPath.startsWith('public/pdf/')?'tourism-pdf':originalPath.startsWith('public/santa-fe/')?'santa-fe':/\.xlsx?$/i.test(f)?'source-workbooks':'other';
    const bucket=category==='advertising'?'advertising-private':category==='source-workbooks'||!url?'editorial-private':'tourism-published';
    files.push({originalPath,url,mime,bytes,dimensions,dimensionError,sha256:hash,references,category,possiblyUnreferenced:references.length===0,referenceCaveat:'Static scan only; external links and runtime paths require human review.',proposedStorage:{bucket,key:`sha256/${hash.slice(0,2)}/${hash}${ext}`,fitsProposedLimit:bytes<=(category==='advertising'?10485760:50000000),requiresRightsReview:true}});
  }
  const totals={};const hashes=new Map();
  for(const f of files){totals[f.category]??={files:0,bytes:0};totals[f.category].files++;totals[f.category].bytes+=f.bytes;hashes.set(f.sha256,[...(hashes.get(f.sha256)||[]),f.originalPath]);}
  return {schemaVersion:1,totals,totalBytes:files.reduce((n,f)=>n+f.bytes,0),uniqueBytes:[...hashes.keys()].reduce((n,h)=>n+files.find(f=>f.sha256===h).bytes,0),duplicates:[...hashes].filter(([,paths])=>paths.length>1).map(([sha256,paths])=>({sha256,paths})),files};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),advertising=args.includes('--include-advertising');
  const target=args.find(a=>a.startsWith('--output='))?.slice(9)||'.artifacts/media-inventory.json';
  const report=await inventory(ROOT,{includeAdvertising:advertising});
  await mkdir(resolve(target,'..'),{recursive:true});await writeFile(target,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({output:target,totalBytes:report.totalBytes,uniqueBytes:report.uniqueBytes,totals:report.totals,duplicateGroups:report.duplicates.length},null,2));
}
