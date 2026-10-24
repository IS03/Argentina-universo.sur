import { writeFile, readFile } from 'node:fs/promises';
import { createTestDatabase } from './test-db.mjs';
const db=await createTestDatabase();
try {
  const {rows}=await db.query(`select table_name,column_name,udt_name,is_nullable,column_default,is_generated from information_schema.columns where table_schema='public' order by table_name,ordinal_position`);
  const tables=Object.groupBy(rows,r=>r.table_name);
  const types={uuid:'string',text:'string',jsonb:'Json',int4:'number',int8:'number',float8:'number',numeric:'number',bool:'boolean',timestamptz:'string',date:'string',_text:'string[]'};
  let text='// Generated from the versioned migrations using PostgreSQL/PGlite. Do not edit.\n// After remote validation also compare with: supabase gen types typescript --local\nexport type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\nexport type Database = { public: { Tables: {\n';
  for(const [table,cols] of Object.entries(tables)) {
    const fields=(mode)=>cols.filter(c=>mode==='Row'||c.is_generated==='NEVER').map(c=>{
      if(!types[c.udt_name])throw new Error('Unknown PG type '+c.udt_name);
      return `${c.column_name}${mode==='Update'||mode==='Insert'&&(c.column_default!==null||c.is_nullable==='YES')?'?':''}: ${types[c.udt_name]}${c.is_nullable==='YES'?' | null':''};`;
    }).join('\n');
    const {rows:fks}=await db.query(`select c.conname, ft.relname as foreign_table,
      exists(select 1 from pg_index i where i.indrelid=c.conrelid and i.indisunique and i.indpred is null and i.indexprs is null and i.indkey::smallint[] <@ c.conkey) as one_to_one,
      array(select a.attname from unnest(c.conkey) with ordinality k(n,i) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.n order by k.i) as columns,
      array(select a.attname from unnest(c.confkey) with ordinality k(n,i) join pg_attribute a on a.attrelid=c.confrelid and a.attnum=k.n order by k.i) as foreign_columns
      from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace ns on ns.oid=t.relnamespace join pg_class ft on ft.oid=c.confrelid join pg_namespace fns on fns.oid=ft.relnamespace
      where c.contype='f' and ns.nspname='public' and fns.nspname='public' and t.relname=$1 order by c.conname`,[table]);
    const relationships=fks.map(f=>`{ foreignKeyName: ${JSON.stringify(f.conname)}; columns: ${JSON.stringify(f.columns)}; isOneToOne: ${f.one_to_one}; referencedRelation: ${JSON.stringify(f.foreign_table)}; referencedColumns: ${JSON.stringify(f.foreign_columns)} }`).join(',\n');
    text+=`${table}: { Row: {${fields('Row')}}; Insert: {${fields('Insert')}}; Update: {${fields('Update')}}; Relationships: [${relationships}] };\n`;
  }
  text+='}; Views: { [_ in never]: never }; Functions: { [_ in never]: never }; Enums: { [_ in never]: never }; CompositeTypes: { [_ in never]: never }; } };\n';
  const path='lib/supabase/database.types.ts';
  if(process.argv.includes('--check')) {if(await readFile(path,'utf8')!==text)throw new Error('Generated DB types are stale. Run npm run db:types');}
  else await writeFile(path,text);
  console.log('Database types match migrations.');
} finally {await db.close();}
