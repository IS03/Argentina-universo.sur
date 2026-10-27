// Anonymous HTTP checks against ONLY the pinned institutional project. No privileged key.
import assert from 'node:assert/strict';
import{createClient}from'@supabase/supabase-js';
import{readFile}from'node:fs/promises';
import{readSupabaseConfig}from'../../lib/supabase/config.ts';
import{writePrivateJson}from'../editorial/private-io.mjs';
const env=Object.fromEntries((await readFile('.artifacts/institucional/private/web-preview.env','utf8')).split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const config=readSupabaseConfig(env);assert.ok(config);
const client=createClient(config.url,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}}),checks=[];
const check=async(name,fn)=>{await fn();checks.push({name,passed:true});};
await check('editorial schema not exposed by real REST',async()=>assert.ok((await client.schema('editorial').from('import_rows').select('*')).error));
await check('private RPC denied by real REST',async()=>assert.ok((await client.rpc('aus_import_state',{p_origin:'synthetic'})).error));
await check('public entries readable but research absent',async()=>{const r=await client.from('entries').select('id');assert.equal(r.error,null);assert.equal(r.data.length,0);});
await check('private Storage upload denied',async()=>assert.ok((await client.storage.from('editorial-private').upload('synthetic-forbidden.txt',Buffer.from('synthetic'),{contentType:'text/plain'})).error));
await check('no bucket listing for anonymous caller',async()=>{const r=await client.storage.listBuckets();assert.equal(r.data?.length??0,0);});
await writePrivateJson('.artifacts/institucional/private/anonymous-http.json',{projectRef:env.SUPABASE_PROJECT_REF,checks,privilegedKeys:0});console.log(JSON.stringify({remote:true,checks:checks.length,failed:0}));
