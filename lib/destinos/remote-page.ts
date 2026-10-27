import type { EditorialDestinationPage } from './editorial-page.ts';
const record=(x: unknown): x is Record<string, unknown> => !!x && typeof x==='object' && !Array.isArray(x);
const text=(x: unknown): x is string => typeof x==='string' && x.trim().length>0;
const optionalText=(x: unknown): boolean => x===undefined || typeof x==='string';
const date=(x: unknown): boolean => text(x)&&/^\d{4}-\d\d-\d\d$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const key=(x: unknown): x is string => text(x) && /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(x);
const https=(x: unknown): boolean => { try { const u=new URL(String(x));return u.protocol==='https:'&&!u.username&&!u.password; } catch { return false; } };
const local=(x: unknown): boolean => text(x)&&/^\/media\/[a-zA-Z0-9/_.,-]+$/.test(x)&&!x.includes('..');
const shape=(x: unknown,required: string[],optional: string[]=[]): x is Record<string, unknown> => record(x)&&required.every(k=>k in x)&&Object.keys(x).every(k=>required.includes(k)||optional.includes(k));
function ensure(ok: unknown): asserts ok { if(!ok)throw Error('UNSAFE_PUBLIC_DESTINATION'); }
// Generic public DTO gate for future versions approved through public.entries RLS/human_reviews.
// Does not infer approvals, routes or fields from research, and does not change the two PR19 pins.
export function validateRemotePage(value: unknown): EditorialDestinationPage {
 ensure(shape(value,['id','slug','nombre','title','provinceLabel','provinceSlugs','resumen','leadSourceIds','introduction','sections','attractions','practical','locations','photos','sources','related','checkedAt','seo']));
 const p=value;ensure(key(p.slug)&&key(p.id));
 for(const k of ['nombre','title','provinceLabel','resumen','checkedAt'])ensure(text(p[k]));
 ensure(date(p.checkedAt));
 ensure(Array.isArray(p.provinceSlugs)&&p.provinceSlugs.length>0&&p.provinceSlugs.every(key));
 ensure(shape(p.seo,['title','description','proposedCanonical'])&&p.seo.title===p.title&&text(p.seo.description)&&p.seo.proposedCanonical==='https://www.argentinauniversosur.com/destinos/'+p.slug);
 ensure(Array.isArray(p.sources)&&p.sources.length>0);
 const ids=new Set<string>();
 for(const s of p.sources){ensure(shape(s,['id','titulo','url','consultadaEl'],['organismo','publicadaEl'])&&key(s.id)&&!ids.has(s.id)&&text(s.titulo)&&https(s.url)&&date(s.consultadaEl)&&optionalText(s.organismo)&&(s.publicadaEl===undefined||date(s.publicadaEl)));ids.add(s.id);}
 const refs=(v: unknown)=>Array.isArray(v)&&v.length>0&&v.every(x=>typeof x==='string'&&ids.has(x));
 const paragraph=(v: unknown)=>shape(v,['text','sourceIds'])&&text(v.text)&&refs(v.sourceIds);
 ensure(refs(p.leadSourceIds)&&Array.isArray(p.introduction)&&p.introduction.length>0&&p.introduction.every(paragraph));
 const anchors=new Set(['atractivos','practicos','ubicaciones','mi-visita','fuentes']);
 const anchor=(v: unknown)=>{ensure(key(v)&&!anchors.has(v));anchors.add(v);};
 for(const field of ['sections','attractions','practical','locations','photos','related'])ensure(Array.isArray(p[field]));
 ensure((p.sections as unknown[]).length>0&&(p.photos as unknown[]).length>0);
 for(const s of p.sections as unknown[]){ensure(shape(s,['id','title','paragraphs'])&&text(s.title)&&Array.isArray(s.paragraphs)&&s.paragraphs.every(paragraph));anchor(s.id);}
 for(const a of p.attractions as unknown[]){ensure(shape(a,['id','nombre','tipo','paragraphs'])&&text(a.nombre)&&['naturaleza','cultura','patrimonio','actividad','gastronomia'].includes(String(a.tipo))&&Array.isArray(a.paragraphs)&&a.paragraphs.every(paragraph));anchor(a.id);}
 for(const d of p.practical as unknown[]){ensure(shape(d,['id','etiqueta','valor','fuenteIds'],['verificadoEl'])&&text(d.etiqueta)&&text(d.valor)&&refs(d.fuenteIds)&&(d.verificadoEl===undefined||date(d.verificadoEl)));anchor(d.id);}
 for(const l of p.locations as unknown[]){ensure(shape(l,['id','etiqueta','descripcion','mapaUrl','fuenteIds'])&&text(l.etiqueta)&&text(l.descripcion)&&https(l.mapaUrl)&&refs(l.fuenteIds));anchor(l.id);}
 for(const photo of p.photos as unknown[]){
  ensure(shape(photo,['foto','originalTitle','sourcePage','modifications'])&&text(photo.originalTitle)&&https(photo.sourcePage)&&text(photo.modifications));
  const f=photo.foto;ensure(shape(f,['src','alt','ancho','alto','variantes','credito'],['leyenda'])&&local(f.src)&&text(f.alt)&&optionalText(f.leyenda)&&typeof f.ancho==='number'&&f.ancho>0&&typeof f.alto==='number'&&f.alto>0&&Array.isArray(f.variantes)&&f.variantes.length>0);
  ensure(f.variantes.every(v=>shape(v,['src','ancho'])&&local(v.src)&&typeof v.ancho==='number'&&v.ancho>0));
  ensure(shape(f.credito,['titular','licencia','urlLicencia'])&&text(f.credito.titular)&&text(f.credito.licencia)&&https(f.credito.urlLicencia));
 }
 for(const l of p.related as unknown[]){ensure(shape(l,['href','label'])&&text(l.label)&&text(l.href)&&/^\/[a-z0-9/_-]*(?:\?provincia=[a-z0-9_-]+)?(?:#[a-z0-9_-]+)?$/.test(l.href));}
 return value as unknown as EditorialDestinationPage;
}
