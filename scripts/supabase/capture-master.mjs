// Transforms the fresh connector read already saved privately; never fetches or edits Sheets itself.
import assert from 'node:assert/strict';
import{readPrivateJson,writePrivateJson}from'../editorial/private-io.mjs';
import{MASTER_ID,SHEETS,rowKey,fingerprint}from'../editorial/import-core.mjs';
import{planWorkImport}from'../editorial/work-import.mjs';
const input=process.argv[2],previousPath=process.argv[3],output=process.argv[4];
if(!input||!previousPath||!output)throw Error('PRIVATE_PATHS_REQUIRED');
const raw=await readPrivateJson(input),previous=await readPrivateJson(previousPath);
assert.equal(raw.before.id,MASTER_ID);assert.equal(raw.before.modified_time,raw.after.modified_time);
const tables={},dateCells={},cellMetadata={};let noted=0,formulas=0;
for(const sheet of SHEETS){
 const read=raw.reads[sheet];assert.ok(read);const values=read.values;const headers=values[0];
 assert.ok(values.length<Number(read.range.match(/(\d+)$/)[1]),'BOUNDARY_REACHED');
 const data=raw.cells[sheet].sheets[0].data[0];assert.equal(data.startRow??0,0);assert.equal(data.startColumn??0,0);
 tables[sheet]=values.slice(1).filter(row=>row.some(v=>v!==''&&v!==null)).map((row,i)=>{
  const payload=Object.fromEntries(headers.map((h,c)=>[h,row[c]??'']));
  const key=rowKey(sheet,payload,i),metadata={sheetId:raw.cells[sheet].sheets[0].properties.sheetId,rowNumber:i+2,cells:{}};
  headers.forEach((field,c)=>{
   const cell=data.rowData?.[i+1]?.values?.[c]??{},format=cell.effectiveFormat?.numberFormat;
   const extra={};if(format)extra.numberFormat=format;
   if(cell.note){extra.note=cell.note;noted++;}
   if(cell.hyperlink)extra.hyperlink=cell.hyperlink;
   if(cell.dataValidation)extra.dataValidation=cell.dataValidation;
   if(cell.userEnteredValue?.formulaValue){extra.formula=cell.userEnteredValue.formulaValue;formulas++;}
   if(cell.formattedValue!==undefined&&cell.formattedValue!==String(payload[field]))extra.formattedValue=cell.formattedValue;
   if(Object.keys(extra).length)metadata.cells[field]=extra;
   if(typeof payload[field]==='number'&&['DATE','DATE_TIME'].includes(format?.type))dateCells[sheet+'/'+(payload.id??String(i))+'/'+field]={type:format.type,display:cell.formattedValue,serial:payload[field]};
  });
  cellMetadata[sheet+'/'+key]=metadata;return payload;
 });
}
const selection=['Destinos','Atractivos'].flatMap(sheet=>tables[sheet].map(r=>({sheet,id:r.id})));
const versions=[...new Set(tables.Exportacion_piloto.map(r=>r.version_propuesta).filter(Boolean))];assert.equal(versions.length,1,'PROPOSAL_VERSION_REVIEW_REQUIRED');
const snapshot={schemaVersion:1,source:{spreadsheetId:MASTER_ID,revision:raw.after.modified_time,kind:'work',proposalVersion:versions[0],capturedAt:new Date().toISOString(),modifiedBefore:raw.before.modified_time,modifiedAfter:raw.after.modified_time},tables,selection,dateCells,cellMetadata};
const work=planWorkImport(snapshot,previous);assert.equal(work.canStage,true,'WORK_CONTRACT_BLOCKED');
const old=new Map(Object.entries(previous.tables).flatMap(([s,rows])=>rows.map((r,i)=>[s+'/'+rowKey(s,r,i),r])));
let changed=0,added=0,identical=0;for(const[s,rows]of Object.entries(tables))rows.forEach((r,i)=>{const k=s+'/'+rowKey(s,r,i),was=old.get(k);if(!was)added++;else if(fingerprint(was)!==fingerprint(r))changed++;else identical++;old.delete(k);});
await writePrivateJson(output,snapshot);
const summary={sheets:SHEETS.length,rows:Object.values(tables).reduce((n,r)=>n+r.length,0),main:selection.length,added,changed,identical,missing:old.size,dateCells:Object.keys(dateCells).length,notedCells:noted,formulaCells:formulas,canStage:work.canStage};
await writePrivateJson('.artifacts/institucional/private/source-reconciliation.json',summary);console.log(JSON.stringify(summary));
