// Trusted Node/CLI only. Never import this module from app/, components/ or lib/.
import { createClient } from '@supabase/supabase-js';
import { lstat } from 'node:fs/promises';
import { privatePath } from '../editorial/private-io.mjs';
import { readPrivateJson, writePrivateJson } from '../editorial/private-io.mjs';

export async function verifiedImportTarget(target,{env=process.env,fetcher=fetch,write=false}={}) {
  if(!target || !['local','remote'].includes(target.mode))throw Error('IMPORT_TARGET_REQUIRED');
  if(write && target.authorization?.staging!==true)throw Error('STAGING_AUTHORIZATION_REQUIRED');
  if(target.mode==='local') {
    if(target.projectName!=='argentina-universo-sur-pr24' || target.url!=='http://127.0.0.1:59421')throw Error('LOCAL_PROJECT_MISMATCH');
    return target;
  }
  if(target.projectName!=='argentina-universo-sur' || !/^[a-z]{20}$/.test(target.projectRef??'') || !target.organizationId ||
    target.url!==`https://${target.projectRef}.supabase.co`)throw Error('DEDICATED_PROJECT_REQUIRED');
  if(!target.authorization?.verifiedAt || !env.SUPABASE_ACCESS_TOKEN)throw Error('REMOTE_VERIFICATION_REQUIRED');
  const response=await fetcher(`https://api.supabase.com/v1/projects/${target.projectRef}`,{headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('REMOTE_IDENTITY_CHECK_FAILED');
  const project=await response.json();
  if(project.id!==target.projectRef || project.name!==target.projectName || project.organization_id!==target.organizationId || project.status!=='ACTIVE_HEALTHY')throw Error('REMOTE_PROJECT_MISMATCH');
  return target;
}
export async function importClient(target,options={}) {
  await verifiedImportTarget(target,options);
  const credentials=target.mode==='local'?await readPrivateJson(target.credentialsPath):null;
  const key=credentials?.SERVICE_ROLE_KEY ?? options.env?.AUS_SUPABASE_IMPORT_KEY ?? process.env.AUS_SUPABASE_IMPORT_KEY;
  if(!key || target.mode==='remote' && !/^(?:sb_secret_|eyJ)/.test(key))throw Error('SERVER_IMPORT_CREDENTIAL_REQUIRED');
  return createClient(target.url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(60000)})}});
}
export async function readImportStates(client,origins) {
  const states={};
  for(const origin of origins) {
    const {data,error}=await client.rpc('aus_import_state',{p_origin:origin});
    if(error || !Array.isArray(data?.rows))throw Error('IMPORT_STATE_UNAVAILABLE');
    states[origin]=data;
  }
  return states;
}
export async function stageIntegralPlan(plan,{client,journalPath,dryRun=true,targetIdentity,previousJournal=null}) {
  if(!plan?.canStage || plan.publicWrites!==0 || !Array.isArray(plan.bundles))throw Error('VALIDATED_INTEGRAL_PLAN_REQUIRED');
  if(!dryRun && !journalPath)throw Error('PRIVATE_JOURNAL_REQUIRED');
  if(journalPath && !previousJournal && await lstat(await privatePath(journalPath,{createParents:true})).catch(e=>{if(e.code==='ENOENT')return null;throw e;}))throw Error('EXISTING_JOURNAL_RESUME_OR_NEW_PATH');
  const journal=previousJournal??{schemaVersion:1,target:targetIdentity,mode:dryRun?'server-dry-run':'private-staging',publicWrites:0,
    units:plan.bundles.map(bundle=>({origin:bundle.origin,checksum:bundle.checksum,status:'prepared',bundle}))};
  if(journalPath)await writePrivateJson(journalPath,journal);
  for(const unit of journal.units) {
    if(unit.status==='committed')continue;
    const bundle=unit.bundle;
    unit.status='prepared';
    // Save before sending: a timeout must never be interpreted as evidence of rollback.
    if(journalPath)await writePrivateJson(journalPath,journal);
    try {
      const {data,error}=await client.rpc('aus_stage_import',{p_batch:bundle,p_dry_run:dryRun});
      if(error) {
        unit.status=/^(?:[0-9A-Z]{5}|PGRST[0-9]+)$/.test(error.code??'')?'rejected':'unknown';
        unit.errorCode=/^[0-9A-Z]+$/.test(error.code??'')?error.code:'TRANSPORT_ERROR';
        throw Error('PRIVATE_STAGING_REJECTED');
      }
      if(data?.publicWrites!==0 || data.dryRun!==dryRun)throw Error('UNEXPECTED_STAGING_RESPONSE');
      unit.status=dryRun?'validated':'committed';unit.result=data;
    } catch(error) {
      if(unit.status==='prepared')unit.status='unknown';
      if(journalPath)await writePrivateJson(journalPath,journal);
      throw Error(unit.status==='unknown'?'IMPORT_OUTCOME_UNKNOWN_RESUME_SAME_BUNDLE':'IMPORT_REJECTED_REVIEW_PRIVATE_JOURNAL',{cause:error});
    }
    if(journalPath)await writePrivateJson(journalPath,journal);
  }
  return {mode:journal.mode,units:journal.units.map(({origin,status,result})=>({origin,status,result})),publicWrites:0};
}
export async function resumeIntegralJournal(journal,{client,journalPath,targetIdentity}) {
  if(journal?.target!==targetIdentity || journal?.mode!=='private-staging')throw Error('RESUME_TARGET_MISMATCH');
  return stageIntegralPlan({canStage:true,publicWrites:0,bundles:journal.units.map(u=>u.bundle)},{client,journalPath,dryRun:false,targetIdentity,previousJournal:journal});
}
