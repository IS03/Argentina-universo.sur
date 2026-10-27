// Private, reproducible reconciliation; never writes research into docs/public artifacts.
import assert from 'node:assert/strict';
import { readPrivateJson, writePrivateJson } from '../editorial/private-io.mjs';
import { planIntegralImport, repositorySource } from '../editorial/integral-import.mjs';
import { inventory } from '../media-inventory.mjs';
const path=process.argv[2];if(!path)throw Error('PRIVATE_SNAPSHOT_REQUIRED');
const snapshot=await readPrivateJson(path),repository=await repositorySource();
const plan=planIntegralImport(snapshot,{repository});assert.equal(plan.canStage,true);
const states=Object.fromEntries(plan.bundles.map(b=>[b.origin,{rows:b.rows}]));
const repeat=planIntegralImport(snapshot,{repository,states});
assert.equal(repeat.counts.operations.unchanged,plan.counts.operations.insert);
const changed=structuredClone(snapshot);changed.tables.Destinos[0].perfil+='\nSynthetic reconciliation-only edit';
const update=planIntegralImport(changed,{repository,states});assert.equal(update.counts.operations.update,1);
const media=await inventory(process.cwd(),{includeAdvertising:true});
const files=media.files.filter(f=>f.originalPath.startsWith('public/')||f.category==='source-workbooks'||f.category==='advertising');
const hashes=new Map();for(const f of files)hashes.set(f.sha256,[...(hashes.get(f.sha256)??[]),f]);
const groups={};for(const f of files){groups[f.category]??={files:0,bytes:0};groups[f.category].files++;groups[f.category].bytes+=f.bytes;}
const report={schemaVersion:1,sourceRevision:snapshot.source.revision,counts:plan.counts,
 repositoryBySheet:Object.fromEntries([...new Set(repository.records.map(r=>r.sheet))].map(s=>[s,repository.records.filter(r=>r.sheet===s).length])),
 proposalsByVersion:Object.fromEntries([...new Set(snapshot.tables.Exportacion_piloto.map(r=>r.version_propuesta||'historical-unspecified'))].map(v=>[v,snapshot.tables.Exportacion_piloto.filter(r=>(r.version_propuesta||'historical-unspecified')===v).length])),
 reconciliationChecks:{identical:repeat.counts.operations,oneEdited:update.counts.operations},
 media:{groups,files:files.length,totalBytes:files.reduce((n,f)=>n+f.bytes,0),uniqueBytes:[...hashes.values()].reduce((n,g)=>n+g[0].bytes,0),duplicateGroups:[...hashes.values()].filter(g=>g.length>1).length,overBucketLimit:files.filter(f=>!f.proposedStorage.fitsProposedLimit).map(f=>({path:f.originalPath,bytes:f.bytes})),files},
 publicWrites:0,remoteWrites:0};
await writePrivateJson('.artifacts/pr24/private/reconciliation.json',report);
console.log(JSON.stringify({...report,media:{...report.media,files:report.media.files.length}}));
