-- Empty foundation only. No source data, users or publication decisions are seeded.
begin;
create schema editorial;
revoke all on schema editorial from public, anon, authenticated;
grant usage on schema editorial to service_role;
alter default privileges in schema editorial revoke all on tables from public, anon, authenticated;
alter default privileges in schema editorial revoke execute on functions from public, anon, authenticated;

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('jurisdiction','locality','destination','attraction','activity','circuit','event','article','media')),
  slug text not null check (slug ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  body jsonb not null default '{}' check (jsonb_typeof(body) = 'object'),
  canonical_path text unique check (canonical_path ~ '^/[a-z0-9/_-]*$' and canonical_path not like '%catarmaca%'),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  document_status text not null default 'unreviewed' check (document_status in ('unreviewed','incomplete','verified','expired')),
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  publication_permitted boolean not null default false,
  content_version integer not null default 1 check (content_version > 0),
  approved_version integer,
  approved_at timestamptz,
  verified_at timestamptz,
  editorial_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id, kind), unique(kind, slug),
  check ((latitude is null) = (longitude is null)),
  check (not publication_permitted or (document_status = 'verified' and approval_status = 'approved'
    and approved_at is not null and verified_at is not null and approved_version is not null and approved_version = content_version))
);
create index entries_publication_idx on public.entries(kind, slug)
  where publication_permitted and document_status = 'verified' and approval_status = 'approved';
create table public.regions (id text primary key, name text unique not null);
create table public.jurisdictions (
  entry_id uuid primary key,
  entry_kind text generated always as ('jurisdiction'::text) stored,
  region_id text not null references public.regions(id), capital_name text, capital_latitude double precision check (capital_latitude between -90 and 90), capital_longitude double precision check (capital_longitude between -180 and 180), check ((capital_latitude is null) = (capital_longitude is null)),
  foreign key (entry_id, entry_kind) references public.entries(id, kind)
);
create table public.localities (
  entry_id uuid primary key,
  entry_kind text generated always as ('locality'::text) stored,
  jurisdiction_id uuid not null references public.jurisdictions(entry_id), unique(entry_id, jurisdiction_id),
  foreign key (entry_id, entry_kind) references public.entries(id, kind)
);
create table public.destinations (
  entry_id uuid primary key,
  entry_kind text generated always as ('destination'::text) stored,
  jurisdiction_id uuid not null references public.jurisdictions(entry_id), locality_id uuid, foreign key (locality_id, jurisdiction_id) references public.localities(entry_id, jurisdiction_id), unique(entry_id, jurisdiction_id),
  foreign key (entry_id, entry_kind) references public.entries(id, kind)
);
create table public.attractions (
  entry_id uuid primary key,
  entry_kind text generated always as ('attraction'::text) stored,
  destination_id uuid not null references public.destinations(entry_id), category text, unique(entry_id,destination_id),
  foreign key (entry_id, entry_kind) references public.entries(id, kind)
);
create table public.activities (
  entry_id uuid primary key,
  entry_kind text generated always as ('activity'::text) stored,
  jurisdiction_id uuid not null references public.jurisdictions(entry_id), destination_id uuid, foreign key (destination_id, jurisdiction_id) references public.destinations(entry_id, jurisdiction_id), location_text text,
  foreign key (entry_id, entry_kind) references public.entries(id, kind)
);
create table public.circuits (
  entry_id uuid primary key,
  entry_kind text generated always as ('circuit'::text) stored,
  duration_text text, legacy_pdf_path text check (legacy_pdf_path like '/pdf/%'),
  foreign key (entry_id, entry_kind) references public.entries(id, kind)
);
create table public.events (
  entry_id uuid primary key,
  entry_kind text generated always as ('event'::text) stored,
  destination_id uuid references public.destinations(entry_id), attraction_id uuid references public.attractions(entry_id), starts_at timestamptz, ends_at timestamptz, date_source_text text, venue_text text, foreign key (attraction_id,destination_id) references public.attractions(entry_id,destination_id), check (ends_at is null or starts_at is null or ends_at >= starts_at),
  foreign key (entry_id, entry_kind) references public.entries(id, kind)
);
create table public.media_assets (
  entry_id uuid primary key,
  entry_kind text generated always as ('media'::text) stored,
  original_path text not null unique, bucket_id text not null check(bucket_id in ('tourism-published','editorial-private','advertising-private')), object_key text not null check (object_key !~ '(^/|(^|/)\.\.(/|$))'), mime_type text not null, bytes bigint not null check(bytes >= 0), sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'), width integer check(width > 0), height integer check(height > 0), rights_status text not null default 'unverified' check(rights_status in ('unverified','cleared','restricted')), unique(bucket_id, object_key),
  foreign key (entry_id, entry_kind) references public.entries(id, kind)
);
create table public.circuit_stops (
  circuit_id uuid not null references public.circuits(entry_id),
  position integer not null check(position > 0),
  destination_id uuid references public.destinations(entry_id),
  attraction_id uuid references public.attractions(entry_id),
  jurisdiction_id uuid references public.jurisdictions(entry_id),
  primary key(circuit_id, position),
  check(num_nonnulls(destination_id, attraction_id, jurisdiction_id) = 1)
);
create table public.entry_media (
  entry_id uuid not null references public.entries(id),
  media_id uuid not null references public.media_assets(entry_id),
  role text not null check(role in ('cover','gallery','document')),
  position integer not null default 1 check(position > 0),
  alt_text text,
  primary key(entry_id, role, position), unique(entry_id, media_id, role)
);
create table public.route_aliases (
  legacy_path text primary key check(legacy_path ~ '^/[a-z0-9/_-]+$'),
  entry_id uuid not null references public.entries(id),
  status_code integer not null default 308 check(status_code in (301,308))
);
create table editorial.members (
  user_id uuid primary key references auth.users(id),
  role text not null check(role in ('researcher','editor','reviewer','publisher'))
);
create table editorial.human_reviews (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id),
  content_version integer not null check(content_version > 0),
  decision text not null check(decision in ('approved','rejected')),
  approved_fields text[] not null check(cardinality(approved_fields) > 0),
  reviewer_id uuid not null references auth.users(id),
  reviewed_at timestamptz not null,
  notes text,
  unique(entry_id, content_version)
);
create table editorial.sources (
  id text primary key,
  url text not null check(url ~ '^https?://'),
  title text not null, institution text, accessed_at date, limitations text,
  original_payload jsonb not null default '{}'
);
create table editorial.evidence (
  id text primary key,
  entry_id uuid not null references public.entries(id),
  source_id text not null references editorial.sources(id),
  field_key text not null, finding text not null, locator text,
  verified_at date, document_status text not null default 'unreviewed',
  original_payload jsonb not null default '{}'
);
create table editorial.variable_facts (
  id text primary key,
  entry_id uuid not null references public.entries(id),
  source_id text not null references editorial.sources(id),
  field_key text not null, value_text text not null, amount numeric, currency text,
  valid_from date, valid_until date, verified_at date,
  approval_status text not null default 'pending' check(approval_status in ('pending','approved','rejected')),
  publication_permitted boolean not null default false check(not publication_permitted),
  original_payload jsonb not null default '{}',
  check(valid_until is null or valid_from is null or valid_until >= valid_from)
);
-- Variable components remain private even if a base entry is approved.
create table editorial.fact_evidence (
  fact_id text not null references editorial.variable_facts(id),
  evidence_id text not null references editorial.evidence(id),
  primary key(fact_id,evidence_id)
);
create table editorial.import_batches (
  id uuid primary key default gen_random_uuid(),
  origin text not null, source_revision text not null, checksum text not null,
  status text not null check(status in ('staged','validated','failed','committed','reverted')),
  created_at timestamptz not null default now(),
  unique(origin, source_revision, checksum)
);
create table editorial.import_rows (
  origin text not null, sheet text not null, original_id text not null,
  entry_id uuid references public.entries(id),
  batch_id uuid not null references editorial.import_batches(id),
  source_hash text not null check(source_hash ~ '^[a-f0-9]{64}$'),
  original_payload jsonb not null,
  primary key(origin,sheet,original_id)
);
create index import_rows_entry_idx on editorial.import_rows(entry_id);
create index import_rows_batch_idx on editorial.import_rows(batch_id);
create table editorial.revisions (
  id bigint generated always as identity primary key,
  table_name text not null, operation text not null,
  actor_role text not null, actor_id uuid,
  changed_at timestamptz not null default now(),
  batch_id uuid references editorial.import_batches(id),
  before_row jsonb, after_row jsonb
);
-- Invoker functions only: no bypass of RLS or private-schema permissions.
create index revisions_batch_idx on editorial.revisions(batch_id);
create function editorial.audit_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  insert into editorial.revisions(table_name,operation,actor_role,actor_id,batch_id,before_row,after_row)
  values (tg_table_schema || '.' || tg_table_name,tg_op,current_user,auth.uid(),nullif(current_setting('aus.import_batch_id',true),'')::uuid,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new,old);
end; $$;
create function editorial.guard_entry() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if row(new.kind,new.slug,new.name,new.body,new.canonical_path,new.latitude,new.longitude,new.content_version)
       is distinct from row(old.kind,old.slug,old.name,old.body,old.canonical_path,old.latitude,old.longitude,old.content_version) then
      new.content_version := old.content_version + 1;
      new.approval_status := 'pending'; new.publication_permitted := false;
      new.approved_version := null; new.approved_at := null;
    end if;
    new.editorial_updated_at := now();
  end if;
  if new.publication_permitted and not exists (
    select 1 from editorial.human_reviews r join editorial.members m on m.user_id = r.reviewer_id
    where m.role in ('reviewer','publisher') and r.entry_id = new.id
      and r.content_version = new.content_version and r.decision = 'approved'
      and r.reviewed_at = new.approved_at
      and r.approved_fields @> array['name','slug']::text[]
      and (new.kind = 'article' or 'details' = any(r.approved_fields))
      and (new.canonical_path is null or 'canonical_path' = any(r.approved_fields))
      and (new.latitude is null or r.approved_fields @> array['latitude','longitude']::text[])
      and not exists(select 1 from jsonb_object_keys(new.body) k where not ('body.' || k = any(r.approved_fields)))
  ) then raise exception 'A human review of this exact version is required'; end if;
  return new;
end; $$;
create trigger entries_guard before insert or update on public.entries
for each row execute function editorial.guard_entry();
create function editorial.invalidate_entry() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare target_id uuid;
begin
  if tg_op <> 'DELETE' then
    target_id := coalesce((to_jsonb(new)->>'entry_id')::uuid,(to_jsonb(new)->>'circuit_id')::uuid);
    update public.entries set content_version = content_version + 1 where id = target_id;
  end if;
  if tg_op <> 'INSERT' then
    target_id := coalesce((to_jsonb(old)->>'entry_id')::uuid,(to_jsonb(old)->>'circuit_id')::uuid);
    if tg_op = 'DELETE' or target_id is distinct from coalesce((to_jsonb(new)->>'entry_id')::uuid,(to_jsonb(new)->>'circuit_id')::uuid) then
      update public.entries set content_version = content_version + 1 where id = target_id;
    end if;
  end if;
  return coalesce(new,old);
end; $$;
create trigger jurisdictions_invalidate after insert or update or delete on public.jurisdictions for each row execute function editorial.invalidate_entry();
create trigger localities_invalidate after insert or update or delete on public.localities for each row execute function editorial.invalidate_entry();
create trigger destinations_invalidate after insert or update or delete on public.destinations for each row execute function editorial.invalidate_entry();
create trigger attractions_invalidate after insert or update or delete on public.attractions for each row execute function editorial.invalidate_entry();
create trigger activities_invalidate after insert or update or delete on public.activities for each row execute function editorial.invalidate_entry();
create trigger circuits_invalidate after insert or update or delete on public.circuits for each row execute function editorial.invalidate_entry();
create trigger events_invalidate after insert or update or delete on public.events for each row execute function editorial.invalidate_entry();
create trigger media_assets_invalidate after insert or update or delete on public.media_assets for each row execute function editorial.invalidate_entry();
create trigger circuit_stops_invalidate after insert or update or delete on public.circuit_stops for each row execute function editorial.invalidate_entry();
create trigger entry_media_invalidate after insert or update or delete on public.entry_media for each row execute function editorial.invalidate_entry();
create index jurisdictions_region_id_idx on public.jurisdictions(region_id);
create index localities_jurisdiction_id_idx on public.localities(jurisdiction_id);
create index destinations_jurisdiction_id_idx on public.destinations(jurisdiction_id);
create index destinations_locality_id_idx on public.destinations(locality_id);
create index attractions_destination_id_idx on public.attractions(destination_id);
create index activities_jurisdiction_id_idx on public.activities(jurisdiction_id);
create index activities_destination_id_idx on public.activities(destination_id);
create index events_destination_id_idx on public.events(destination_id);
create index events_attraction_id_idx on public.events(attraction_id);
create index circuit_stops_destination_id_idx on public.circuit_stops(destination_id);
create index circuit_stops_attraction_id_idx on public.circuit_stops(attraction_id);
create index circuit_stops_jurisdiction_id_idx on public.circuit_stops(jurisdiction_id);
create index entry_media_media_id_idx on public.entry_media(media_id);
create index route_aliases_entry_id_idx on public.route_aliases(entry_id);
create index human_reviews_reviewer_id_idx on editorial.human_reviews(reviewer_id);
create index evidence_entry_id_idx on editorial.evidence(entry_id);
create index evidence_source_id_idx on editorial.evidence(source_id);
create index variable_facts_entry_id_idx on editorial.variable_facts(entry_id);
create index variable_facts_source_id_idx on editorial.variable_facts(source_id);
create index fact_evidence_evidence_id_idx on editorial.fact_evidence(evidence_id);
alter table public.entries enable row level security;
revoke all on public.entries from public, anon, authenticated;
grant all on public.entries to service_role;
create trigger entries_audit after insert or update or delete on public.entries for each row execute function editorial.audit_change();
alter table public.regions enable row level security;
revoke all on public.regions from public, anon, authenticated;
grant all on public.regions to service_role;
create trigger regions_audit after insert or update or delete on public.regions for each row execute function editorial.audit_change();
alter table public.jurisdictions enable row level security;
revoke all on public.jurisdictions from public, anon, authenticated;
grant all on public.jurisdictions to service_role;
create trigger jurisdictions_audit after insert or update or delete on public.jurisdictions for each row execute function editorial.audit_change();
alter table public.localities enable row level security;
revoke all on public.localities from public, anon, authenticated;
grant all on public.localities to service_role;
create trigger localities_audit after insert or update or delete on public.localities for each row execute function editorial.audit_change();
alter table public.destinations enable row level security;
revoke all on public.destinations from public, anon, authenticated;
grant all on public.destinations to service_role;
create trigger destinations_audit after insert or update or delete on public.destinations for each row execute function editorial.audit_change();
alter table public.attractions enable row level security;
revoke all on public.attractions from public, anon, authenticated;
grant all on public.attractions to service_role;
create trigger attractions_audit after insert or update or delete on public.attractions for each row execute function editorial.audit_change();
alter table public.activities enable row level security;
revoke all on public.activities from public, anon, authenticated;
grant all on public.activities to service_role;
create trigger activities_audit after insert or update or delete on public.activities for each row execute function editorial.audit_change();
alter table public.circuits enable row level security;
revoke all on public.circuits from public, anon, authenticated;
grant all on public.circuits to service_role;
create trigger circuits_audit after insert or update or delete on public.circuits for each row execute function editorial.audit_change();
alter table public.events enable row level security;
revoke all on public.events from public, anon, authenticated;
grant all on public.events to service_role;
create trigger events_audit after insert or update or delete on public.events for each row execute function editorial.audit_change();
alter table public.media_assets enable row level security;
revoke all on public.media_assets from public, anon, authenticated;
grant all on public.media_assets to service_role;
create trigger media_assets_audit after insert or update or delete on public.media_assets for each row execute function editorial.audit_change();
alter table public.circuit_stops enable row level security;
revoke all on public.circuit_stops from public, anon, authenticated;
grant all on public.circuit_stops to service_role;
create trigger circuit_stops_audit after insert or update or delete on public.circuit_stops for each row execute function editorial.audit_change();
alter table public.entry_media enable row level security;
revoke all on public.entry_media from public, anon, authenticated;
grant all on public.entry_media to service_role;
create trigger entry_media_audit after insert or update or delete on public.entry_media for each row execute function editorial.audit_change();
alter table public.route_aliases enable row level security;
revoke all on public.route_aliases from public, anon, authenticated;
grant all on public.route_aliases to service_role;
create trigger route_aliases_audit after insert or update or delete on public.route_aliases for each row execute function editorial.audit_change();
alter table editorial.members enable row level security;
revoke all on editorial.members from public, anon, authenticated;
grant all on editorial.members to service_role;
create trigger members_audit after insert or update or delete on editorial.members for each row execute function editorial.audit_change();
alter table editorial.human_reviews enable row level security;
revoke all on editorial.human_reviews from public, anon, authenticated;
grant all on editorial.human_reviews to service_role;
create trigger human_reviews_audit after insert or update or delete on editorial.human_reviews for each row execute function editorial.audit_change();
alter table editorial.sources enable row level security;
revoke all on editorial.sources from public, anon, authenticated;
grant all on editorial.sources to service_role;
create trigger sources_audit after insert or update or delete on editorial.sources for each row execute function editorial.audit_change();
alter table editorial.evidence enable row level security;
revoke all on editorial.evidence from public, anon, authenticated;
grant all on editorial.evidence to service_role;
create trigger evidence_audit after insert or update or delete on editorial.evidence for each row execute function editorial.audit_change();
alter table editorial.variable_facts enable row level security;
revoke all on editorial.variable_facts from public, anon, authenticated;
grant all on editorial.variable_facts to service_role;
create trigger variable_facts_audit after insert or update or delete on editorial.variable_facts for each row execute function editorial.audit_change();
alter table editorial.fact_evidence enable row level security;
revoke all on editorial.fact_evidence from public, anon, authenticated;
grant all on editorial.fact_evidence to service_role;
create trigger fact_evidence_audit after insert or update or delete on editorial.fact_evidence for each row execute function editorial.audit_change();
alter table editorial.import_batches enable row level security;
revoke all on editorial.import_batches from public, anon, authenticated;
grant all on editorial.import_batches to service_role;
create trigger import_batches_audit after insert or update or delete on editorial.import_batches for each row execute function editorial.audit_change();
alter table editorial.import_rows enable row level security;
revoke all on editorial.import_rows from public, anon, authenticated;
grant all on editorial.import_rows to service_role;
create trigger import_rows_audit after insert or update or delete on editorial.import_rows for each row execute function editorial.audit_change();
alter table editorial.revisions enable row level security;
revoke all on editorial.revisions from public, anon, authenticated;
grant all on editorial.revisions to service_role;
grant usage, select on all sequences in schema editorial to service_role;
revoke update, delete, truncate on editorial.revisions from service_role;
revoke update, delete, truncate on editorial.human_reviews from service_role;
revoke execute on all functions in schema editorial from public, anon, authenticated;
grant execute on all functions in schema editorial to service_role;
grant select on public.entries to anon, authenticated;
grant select on public.regions to anon, authenticated;
grant select on public.jurisdictions to anon, authenticated;
grant select on public.localities to anon, authenticated;
grant select on public.destinations to anon, authenticated;
grant select on public.attractions to anon, authenticated;
grant select on public.activities to anon, authenticated;
grant select on public.circuits to anon, authenticated;
grant select on public.events to anon, authenticated;
grant select on public.media_assets to anon, authenticated;
grant select on public.circuit_stops to anon, authenticated;
grant select on public.entry_media to anon, authenticated;
grant select on public.route_aliases to anon, authenticated;
create policy entries_published on public.entries for select to anon, authenticated
using (publication_permitted and document_status = 'verified' and approval_status = 'approved'
  and approved_version = content_version and approved_at is not null and verified_at is not null);
create policy regions_read on public.regions for select to anon, authenticated using (true);
create policy jurisdictions_published on public.jurisdictions for select to anon, authenticated using (exists(select 1 from public.entries e where e.id = jurisdictions.entry_id));
create policy localities_published on public.localities for select to anon, authenticated using (exists(select 1 from public.entries e where e.id = localities.entry_id) and exists(select 1 from public.jurisdictions p where p.entry_id = localities.jurisdiction_id));
create policy destinations_published on public.destinations for select to anon, authenticated using (exists(select 1 from public.entries e where e.id = destinations.entry_id) and exists(select 1 from public.jurisdictions p where p.entry_id = destinations.jurisdiction_id));
create policy attractions_published on public.attractions for select to anon, authenticated using (exists(select 1 from public.entries e where e.id = attractions.entry_id) and exists(select 1 from public.destinations p where p.entry_id = attractions.destination_id));
create policy activities_published on public.activities for select to anon, authenticated using (exists(select 1 from public.entries e where e.id = activities.entry_id) and exists(select 1 from public.jurisdictions p where p.entry_id = activities.jurisdiction_id));
create policy circuits_published on public.circuits for select to anon, authenticated using (exists(select 1 from public.entries e where e.id = circuits.entry_id));
create policy events_published on public.events for select to anon, authenticated using (exists(select 1 from public.entries e where e.id = events.entry_id) and (starts_at is not null and ends_at is not null));
create policy media_assets_published on public.media_assets for select to anon, authenticated using (exists(select 1 from public.entries e where e.id = media_assets.entry_id) and rights_status = 'cleared' and bucket_id = 'tourism-published');
create policy circuit_stops_published on public.circuit_stops for select to anon, authenticated using (
  exists(select 1 from public.circuits c where c.entry_id = circuit_stops.circuit_id)
  and (destination_id is null or exists(select 1 from public.destinations d where d.entry_id = circuit_stops.destination_id))
  and (attraction_id is null or exists(select 1 from public.attractions a where a.entry_id = circuit_stops.attraction_id))
  and (jurisdiction_id is null or exists(select 1 from public.jurisdictions j where j.entry_id = circuit_stops.jurisdiction_id))
);
create policy entry_media_published on public.entry_media for select to anon, authenticated using (
  exists(select 1 from public.entries e where e.id = entry_media.entry_id)
  and exists(select 1 from public.media_assets m where m.entry_id = entry_media.media_id)
);
create policy route_aliases_published on public.route_aliases for select to anon, authenticated using (
  exists(select 1 from public.entries e where e.id = route_aliases.entry_id and e.canonical_path is not null and e.canonical_path <> route_aliases.legacy_path)
);
-- Multiple legacy URLs can point to one content-addressed object without deleting originals.
create table public.media_paths (
  legacy_path text primary key check (legacy_path like '/%' and legacy_path not like '//%' and legacy_path not like '%..%'),
  entry_id uuid not null references public.media_assets(entry_id)
);
create index media_paths_entry_idx on public.media_paths(entry_id);
alter table public.media_paths enable row level security;
revoke all on public.media_paths from public, anon, authenticated;
grant all on public.media_paths to service_role;
grant select on public.media_paths to anon, authenticated;
create policy media_paths_published on public.media_paths for select to anon, authenticated using (
  exists(select 1 from public.media_assets m where m.entry_id = media_paths.entry_id)
);
create trigger media_paths_invalidate after insert or update or delete on public.media_paths for each row execute function editorial.invalidate_entry();
create trigger media_paths_audit after insert or update or delete on public.media_paths for each row execute function editorial.audit_change();
commit;
