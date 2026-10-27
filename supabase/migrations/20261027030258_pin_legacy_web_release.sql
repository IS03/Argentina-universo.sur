begin;
-- Freeze the transitional snapshot to the exact already-public PR19/catalog projection.
-- Future destinations use approved public.entries versions, not this legacy bridge.
alter table public.web_build_releases add constraint web_build_release_inherited_authorization
 check(payload_sha256='a06a9ee8beb348cb8116202756d26f87229bc0feee6529dbb455715c0963c841');
commit;
