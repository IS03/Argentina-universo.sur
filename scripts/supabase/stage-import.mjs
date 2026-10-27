// Explicit operator command. Default is a server-side dry-run, never a write.
import { readPrivateJson } from '../editorial/private-io.mjs';
import { importClient, stageIntegralPlan, resumeIntegralJournal } from './import-transport.mjs';
const args=process.argv.slice(2),value=name=>args.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
try {
  if(args.some(a=>!/^--(?:target|plan|journal|resume)=.+$|^--commit$/.test(a)) || new Set(args.map(a=>a.split('=')[0])).size!==args.length ||
    !value('target') || !!value('plan')===!!value('resume') || value('resume')&&!args.includes('--commit'))throw Error('USAGE');
  const target=await readPrivateJson(value('target')),dryRun=!args.includes('--commit');
  const client=await importClient(target,{write:!dryRun});
  const options={client,journalPath:value('journal')??'.artifacts/pr24/private/staging-journal.json',dryRun,targetIdentity:target.mode==='local'?target.projectName:target.projectRef};
  const result=value('resume')?await resumeIntegralJournal(await readPrivateJson(value('resume')),options):await stageIntegralPlan(await readPrivateJson(value('plan')),options);
  console.log(JSON.stringify({mode:result.mode,units:result.units.length,publicWrites:0}));
} catch { console.error('PRIVATE_STAGING_FAILED: inspect the private journal; no credentials or payload logged.');process.exitCode=1; }
