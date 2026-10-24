import { writeFile, readFile } from 'node:fs/promises';
import { createSlug } from '../lib/catalog.ts';
import { readCatalog } from './validate-data.mjs';
import { stableId, fingerprint } from './editorial-import.mjs';
export async function catalogMapping() {
  const c=await readCatalog(),origin='git:IS03/Argentina-universo.sur';
  const provinceByName=new Map(c.provincias.map(p=>[createSlug(p.PROVINCIA),p.SLUG]));
  return {origin,sourceHashes:Object.fromEntries(await Promise.all(['provincias','actividades','escapadas'].map(async name=>[name,fingerprint(JSON.parse(await readFile(`public/data/${name}.json`,'utf8')))]))),
    entries:[...c.provincias.map(p=>({id:stableId(origin,'provincias',p.SLUG),sourceId:p.SLUG,kind:'jurisdiction',slug:p.SLUG,region:p.ZONA,canonicalPath:'/provincias/'+p.SLUG,media:[p.FOTO_1,p.FOTO_2,p.FOTO_3]})),
      ...c.actividades.map(a=>({id:stableId(origin,'actividades',createSlug(a.ACTIVIDAD)),sourceId:createSlug(a.ACTIVIDAD),kind:'activity',slug:createSlug(a.ACTIVIDAD),jurisdictionSlug:a.SLUG,canonicalPath:'/actividades/'+createSlug(a.ACTIVIDAD),media:[a.FOTO_1,a.FOTO_2,a.FOTO_3]})),
      ...c.escapadas.map(e=>({id:stableId(origin,'escapadas',e.ID),sourceId:e.ID,kind:'circuit',slug:e.ID,canonicalPath:null,jurisdictionSlugs:e.PROVINCIAS.split(/[,;]/).map(n=>provinceByName.get(createSlug(n))),pdf:e.PDF}))],
    aliases:[{from:'/provincias/catarmaca',to:'/provincias/catamarca',status:308}],publicationPermitted:false};
}
if(process.argv[1]?.endsWith('/catalog-migration-map.mjs')) {
  await writeFile('docs/supabase/legacy-catalog-map.json',JSON.stringify(await catalogMapping(),null,2)+'\n');
  console.log('Legacy mapping written; no content imported or approved.');
}
