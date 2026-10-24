// A real PostgreSQL WASM engine, NOT a running Supabase service.
// Minimal auth/storage metadata stand-ins let us exercise our DDL and RLS only.
import { PGlite } from '@electric-sql/pglite';
import { readdir, readFile } from 'node:fs/promises';
export async function createTestDatabase() {
  const db=new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    grant usage on schema auth to service_role;
    grant execute on function auth.uid() to service_role;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role;
    grant all on storage.objects to anon,authenticated,service_role;
    grant all on storage.buckets to service_role;
  `);
  for(const file of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile('supabase/migrations/'+file,'utf8'));
  return db;
}
