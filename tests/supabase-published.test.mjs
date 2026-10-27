import test from 'node:test';
import assert from 'node:assert/strict';
import { publishedCandidate } from '../lib/supabase/published-contract.ts';
const approved={id:'fixture',kind:'destination',slug:'fixture',name:'Synthetic',body:{approved:'text'},canonical_path:'/destinos/fixture',latitude:null,longitude:null,content_version:3,approved_version:3,approved_at:'2026-10-26',verified_at:'2026-10-26',publication_permitted:true,document_status:'verified',approval_status:'approved'};
test('build candidate rejects stale approval, drafts and missing routes; DTO omits review state',()=>{
  const dto=publishedCandidate(approved);assert.equal(dto.canonical_path,approved.canonical_path);assert.equal('approved_at' in dto,false);
  for(const patch of [{approved_version:2},{publication_permitted:false},{document_status:'unreviewed'},{approval_status:'pending'},{approved_at:null},{verified_at:null},{canonical_path:null},{canonical_path:'https://invented.example'}])assert.throws(()=>publishedCandidate({...approved,...patch}),/UNAPPROVED/);
});
