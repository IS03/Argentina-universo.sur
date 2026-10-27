// Reads only source manifests; writes a private planning input, never a public artifact.
import { MASTER_ID } from '../editorial/import-core.mjs';
import { readPrivateJson, writePrivateJson } from '../editorial/private-io.mjs';
import { importClient, readImportStates } from './import-transport.mjs';
const args=process.argv.slice(2),value=n=>args.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
try {
 if(args.length!==2||new Set(args.map(a=>a.split('=')[0])).size!==2||!value('target')||!value('output'))throw Error('USAGE');
 const client=await importClient(await readPrivateJson(value('target')));
 const state=await readImportStates(client,[MASTER_ID,'git:IS03/Argentina-universo.sur']);
 await writePrivateJson(value('output'),state);
 console.log(JSON.stringify({origins:Object.keys(state).length,rows:Object.values(state).reduce((n,s)=>n+s.rows.length,0),publicWrites:0}));
} catch {console.error('PRIVATE_IMPORT_STATE_FAILED');process.exitCode=1;}
