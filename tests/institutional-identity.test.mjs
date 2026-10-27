import test from 'node:test';
import assert from 'node:assert/strict';
import{assertInstitutionalIdentity,INSTITUTIONAL_PROJECT_REF,INSTITUTIONAL_ORGANIZATION_ID,INSTITUTIONAL_URL}from'../lib/supabase/identity.ts';
import{readSupabaseConfig}from'../lib/supabase/config.ts';
const project={id:INSTITUTIONAL_PROJECT_REF,organization_id:INSTITUTIONAL_ORGANIZATION_ID,region:'us-east-1',status:'ACTIVE_HEALTHY'};
test('identity pins organization/ref/region/status while display names are irrelevant',()=>{
 assert.doesNotThrow(()=>assertInstitutionalIdentity({...project,name:'Any display name'}));
 for(const patch of [{id:'a'.repeat(20)},{organization_id:'personal-org'},{region:'other-region'},{status:'INACTIVE'}])assert.throws(()=>assertInstitutionalIdentity({...project,...patch}),/MISMATCH/);
});
test('public reader never falls back to a personal project or partial configuration',()=>{
 assert.equal(readSupabaseConfig({}),null);
 const env={SUPABASE_PROJECT_REF:INSTITUTIONAL_PROJECT_REF,SUPABASE_URL:INSTITUTIONAL_URL,SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic'};
 assert.ok(readSupabaseConfig(env));
 for(const patch of [{SUPABASE_PROJECT_REF:'a'.repeat(20)},{SUPABASE_URL:'https://personal.supabase.co'},{SUPABASE_URL:''},{SUPABASE_PUBLISHABLE_KEY:'sb_secret_synthetic'}])assert.throws(()=>readSupabaseConfig({...env,...patch}));
});
