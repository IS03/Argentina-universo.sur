import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { inventory } from '../scripts/media-inventory.mjs';
test('inventory measures original bytes/dimensions, links JSON/components and reports duplicates without changing files',async()=>{
  const root=await mkdtemp(join(tmpdir(),'aus-inventory-'));
  try {
    execFileSync('git',['init','--quiet'],{cwd:root});
    for(const dir of ['public/img','public/data','lib','publicidad'])await mkdir(join(root,dir),{recursive:true});
    const image=await sharp({create:{width:3,height:2,channels:3,background:'#123456'}}).png().toBuffer();
    for(const name of ['one.png','two.png','orphan.png'])await writeFile(join(root,'public/img',name),image);
    await writeFile(join(root,'publicidad','banner.png'),image);
    await writeFile(join(root,'public/data','fixture.json'),JSON.stringify({FOTO_1:'/img/one.png?v=3'}));
    await writeFile(join(root,'lib','fixture.ts'),"export const image='/img/two.png';");
    const result=await inventory(root);
    assert.equal(result.files.length,3);assert.equal(result.totalBytes,image.length*3);assert.equal(result.uniqueBytes,image.length);assert.equal(result.duplicates.length,1);
    const one=result.files.find(f=>f.originalPath.endsWith('/one.png'));
    assert.deepEqual(one.dimensions,{width:3,height:2,pages:1});assert.equal(one.mime,'image/png');assert.equal(one.references.length,1);
    assert.equal(result.files.find(f=>f.originalPath.endsWith('/two.png')).references.length,1);
    assert.equal(result.files.find(f=>f.originalPath.endsWith('/orphan.png')).possiblyUnreferenced,true);
    assert.equal((await inventory(root,{includeAdvertising:true})).totals.advertising.files,1);
    assert.equal((await inventory(root)).totalBytes,result.totalBytes);
  } finally {await rm(root,{recursive:true,force:true});}
});
