// Copies versioned inputs to a separate local stack. Does not start Docker, reset or contact a remote.
import { readFile, cp, mkdir, writeFile, lstat } from 'node:fs/promises';
import { privatePath, writePrivateJson } from '../editorial/private-io.mjs';
const root='.artifacts/pr24/local';
await privatePath(root+'/supabase/config.toml',{createParents:true});
if(await lstat(root+'/supabase/.temp/project-ref').catch(()=>null))throw Error('LINKED_WORKSPACE_REFUSED');
const config=(await readFile('supabase/config.toml','utf8')).replace('project_id = "argentina-universo-sur"','project_id = "argentina-universo-sur-pr24"').replace('port = 54321','port = 59421').replace('port = 54322','port = 59422').replace('shadow_port = 54320','shadow_port = 59420');
await mkdir(root+'/supabase',{recursive:true,mode:0o700});
await writeFile(root+'/supabase/config.toml',config,{mode:0o600});
for(const dir of ['migrations','tests'])await cp('supabase/'+dir,root+'/supabase/'+dir,{recursive:true});
await writePrivateJson('.artifacts/pr24/private/local-target.json',{mode:'local',projectName:'argentina-universo-sur-pr24',url:'http://127.0.0.1:59421',credentialsPath:'.artifacts/pr24/private/local-credentials.json',authorization:{staging:true}});
console.log(JSON.stringify({workspace:root,project:'argentina-universo-sur-pr24',apiPort:59421,databasePort:59422,remoteWrites:0}));
