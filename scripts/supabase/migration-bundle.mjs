// Bootstrap an EMPTY verified project atomically, preserving canonical CLI migration versions.
// The caller must verify organization/ref with the Management API immediately before execution.
import { readFile,readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export async function institutionalMigrationBundle(){
 const files=(await readdir('supabase/migrations')).filter(n=>/^\d{14}_.*\.sql$/.test(n)).sort();
 const migrations=await Promise.all(files.map(async file=>{const sql=await readFile('supabase/migrations/'+file,'utf8');return{file,version:file.slice(0,14),name:file.slice(15,-4),sha256:createHash('sha256').update(sql).digest('hex'),sql};}));
 const quote=s=>"'"+s.replaceAll("'","''")+"'";
 const guard=`do $$ begin if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','editorial') and c.relkind in ('r','v','m')) or exists(select 1 from storage.buckets) or exists(select 1 from storage.objects) then raise exception 'EMPTY_INSTITUTIONAL_PROJECT_REQUIRED'; end if; end $$;`;
 const bodies=migrations.map(m=>m.sql.replace(/^begin;\s*/im,'').replace(/commit;\s*$/i,''));
 const history=`create schema if not exists supabase_migrations; revoke all on schema supabase_migrations from public,anon,authenticated;
 create table if not exists supabase_migrations.schema_migrations(version text primary key,statements text[],name text);
 ${migrations.map(m=>`insert into supabase_migrations.schema_migrations(version,name,statements) values(${quote(m.version)},${quote(m.name)},array[${quote(m.sql)}]);`).join('\n')}`;
 return {query:'begin;\nset local statement_timeout=\'120s\';\n'+guard+'\n'+bodies.join('\n')+'\n'+history+"\ncommit;\nselect version,name from supabase_migrations.schema_migrations order by version;",migrations:migrations.map(m=>({file:m.file,version:m.version,name:m.name,sha256:m.sha256}))};
}
