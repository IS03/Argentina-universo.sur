begin;
create index activities_destination_jurisdiction_idx on public.activities(destination_id,jurisdiction_id);
create index destinations_locality_jurisdiction_idx on public.destinations(locality_id,jurisdiction_id);
create index events_attraction_destination_idx on public.events(attraction_id,destination_id);
-- The remaining entry_id/entry_kind FK advisor notices are covered by a UNIQUE entry_id PK.
-- An additional composite index cannot reduce the one-row lookup; avoid redundant indexes.
commit;
