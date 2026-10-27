begin;
-- Public build snapshots mirror ALREADY published repository projections, never research rows.
create table public.web_build_releases (
 id uuid primary key default gen_random_uuid(),
 version integer not null unique check(version>0),
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 canonical_payload text not null,
 payload_sha256 text not null check(payload_sha256 ~ '^[a-f0-9]{64}$'),
 authorization_digest text not null check(authorization_digest='d4f9b5c80e83c58aa352484c897e59dc11c080005134051df44144b93863a671'),
 source_git_revision text not null check(source_git_revision ~ '^[a-f0-9]{40}$'),
 publication_permitted boolean not null default false,
 active boolean not null default false,
 created_at timestamptz not null default now(),
 check(not active or publication_permitted),
 check(canonical_payload::jsonb=payload),
 check(encode(sha256(convert_to(canonical_payload,'UTF8')),'hex')=payload_sha256)
);
create unique index web_build_releases_one_active on public.web_build_releases(active) where active;
alter table public.web_build_releases enable row level security;
revoke all on public.web_build_releases from public,anon,authenticated;
grant select on public.web_build_releases to anon,authenticated;
grant select,insert on public.web_build_releases to service_role;
grant update(active,publication_permitted) on public.web_build_releases to service_role;
create policy approved_web_release_read on public.web_build_releases for select to anon,authenticated using(active and publication_permitted);
create trigger web_build_releases_audit after insert or update or delete on public.web_build_releases for each row execute function editorial.audit_change();
notify pgrst,'reload schema';
commit;
