// Only already published repository projections. This never reads the private master/staging.
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { CATALOG_PATHS } from '../../lib/supabase/catalog-pins.ts';
import { validateWebPayload } from '../../lib/supabase/web-contract.ts';
import { AUTHORIZATION_DIGEST } from '../../lib/destinos/authorized.ts';
import { canonicalJSON,publicationHash } from '../../lib/destinos/publication-contract.ts';
import { readPublication } from '../editorial/publication.mjs';
import { writePrivateJson } from '../editorial/private-io.mjs';
const {release,pages}=await readPublication();
const catalogs=Object.fromEntries(await Promise.all(Object.entries(CATALOG_PATHS).map(async([key,path])=>[key,JSON.parse(await readFile(path,'utf8'))])));
const payload=validateWebPayload({schemaVersion:1,catalogs,release,destinations:pages}),canonical=canonicalJSON(payload),hash=publicationHash(payload);
const git=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),quote=s=>"'"+s.replaceAll("'","''")+"'";
const query=`set local role service_role; insert into public.web_build_releases(version,payload,canonical_payload,payload_sha256,authorization_digest,source_git_revision,publication_permitted,active) values(1,${quote(canonical)}::jsonb,${quote(canonical)},'${hash}','${AUTHORIZATION_DIGEST}','${git}',true,true) on conflict(version) do nothing returning version,payload_sha256;`;
await writePrivateJson('.artifacts/institucional/private/public-release.json',{query,hash,sourceGit:git,catalogs:Object.keys(catalogs).length,destinations:pages.length});
console.log(JSON.stringify({prepared:true,publicCatalogs:Object.keys(catalogs).length,authorizedDestinations:pages.length,hash,sqlBytes:Buffer.byteLength(query),privateInputs:0}));
