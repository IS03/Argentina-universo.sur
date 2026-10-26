import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectedAttractions, visitList } from '../lib/destinos/visit-plan.ts';
const pages = await Promise.all(['santa-fe-capital','alta-gracia'].map(slug => readFile('content/destinos/'+slug+'.json','utf8').then(JSON.parse)));
for (const p of pages) {
  const destination = { name:p.nombre, canonical:p.seo.proposedCanonical, attractions:p.attractions.map(a=>({id:a.id,name:a.nombre})) };
  test(p.nombre+': selection accepts only known approved attractions, deduplicates and leaves inputs unchanged', () => {
    const input=structuredClone(destination), ids=[input.attractions[2].id,'unknown',input.attractions[0].id,input.attractions[0].id];
    assert.deepEqual(selectedAttractions(input,ids),[input.attractions[0],input.attractions[2]]);
    assert.deepEqual(input,destination); assert.equal(ids.length,4);
    assert.equal(visitList(input,[]),''); assert.equal(visitList(input,['unknown']),'');
  });
  test(p.nombre+': shareable list contains exact selected names and canonical anchors without inferred itinerary', () => {
    const text=visitList(destination,[destination.attractions[2].id,destination.attractions[0].id]);
    assert.equal(text, [destination.name+' — Mi selección','',...([destination.attractions[0],destination.attractions[2]].flatMap(a=>['• '+a.name,destination.canonical+'#'+a.id,''])),'Ficha completa: '+destination.canonical,'','Lista de lugares, sin orden de visita, horarios ni disponibilidad confirmados.'].join('\n'));
    assert.ok(!text.includes(destination.attractions[1].name));
    assert.equal(text.match(/^• /gm).length,2);
  });
}
