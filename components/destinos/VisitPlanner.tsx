"use client";

import { useRef, useState, useSyncExternalStore } from 'react';
import Icono from '@/components/ui/Icono';
import { selectedAttractions, visitList, type VisitPlanDestination } from '@/lib/destinos/visit-plan';
const subscribe = () => () => {};
const hydrated = () => true;
const serverSnapshot = () => false;

// One small enhancement island. No network, cookies, storage, location access or user-entered data.
export default function VisitPlanner({ destination }: { destination: VisitPlanDestination }) {
  const ready = useSyncExternalStore(subscribe, hydrated, serverSnapshot);
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const output = useRef<HTMLTextAreaElement>(null);
  const items = selectedAttractions(destination, selected);
  const text = visitList(destination, selected);

  async function copy(value: string) {
    try {
      if (!navigator.clipboard?.writeText) throw Error('CLIPBOARD_UNAVAILABLE');
      await navigator.clipboard.writeText(value);
      setStatus(value === destination.canonical ? 'Enlace de la ficha copiado.' : 'Lista copiada. Podés pegarla en un mensaje o documento.');
    } catch {
      if (value === text) { output.current?.focus(); output.current?.select(); }
      setStatus(value === destination.canonical ? `Copiá el enlace de la ficha: ${destination.canonical}` : 'El navegador no pudo copiar. Seleccioná y copiá el texto de tu lista.');
    }
  }
  async function share(selection: boolean) {
    const value = selection ? text : destination.canonical;
    if (typeof navigator.share !== 'function') { await copy(value); return; }
    try {
      await navigator.share({ title: destination.name, text: selection ? text : destination.name, url: destination.canonical });
      setStatus('Solicitud de compartir completada.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') setStatus('Se canceló la acción de compartir.');
      else await copy(value);
    }
  }
  return (
    <div className="destination-planner">
      <fieldset className="destination-plan-choices">
        <legend>Elegí los atractivos que te interesan</legend>
        {destination.attractions.map((item, index) => <label key={item.id}>
          <input type="checkbox" checked={selected.includes(item.id)} onChange={event => {
            const checked = event.currentTarget.checked;
            setSelected(previous => checked ? [...previous, item.id] : previous.filter(id => id !== item.id));
            setStatus('');
          }} />
          <span className="destination-plan-number" aria-hidden="true">0{index + 1}</span><span>{item.name}</span>
        </label>)}
      </fieldset>
      <div className="destination-plan-result">
        <p className="destination-label">Tu selección</p>
        <p className="destination-plan-count" role="status" aria-live="polite">{items.length ? `${items.length} de ${destination.attractions.length} lugares seleccionados` : 'Todavía no elegiste lugares'}</p>
        <p className="destination-plan-help">La lista queda solo en esta pestaña. No establece un itinerario ni confirma horarios o disponibilidad.</p>
        <div className="destination-plan-output" hidden={!items.length}>
          <label htmlFor="lista-de-visita">Texto para copiar o compartir</label>
          <textarea ref={output} id="lista-de-visita" value={text} readOnly rows={7} />
          <pre className="destination-print-list">{text}</pre>
        </div>
        <div className="destination-plan-actions">
          <button type="button" disabled={!ready || !items.length} onClick={() => copy(text)}><Icono nombre="documento" />Copiar lista</button>
          <button type="button" disabled={!ready || !items.length} onClick={() => share(true)}><Icono nombre="externo" />Compartir lista</button>
          <button type="button" disabled={!ready || !items.length} onClick={() => { setSelected([]); setStatus('Selección vaciada.'); }}>Vaciar selección</button>
        </div>
        <div className="destination-page-actions">
          <button type="button" disabled={!ready} onClick={() => share(false)}>Compartir ficha<Icono nombre="externo" /></button>
          <button type="button" disabled={!ready} onClick={() => window.print()}>Imprimir ficha<Icono nombre="documento" /></button>
        </div>
        <p className="destination-plan-status" role="status" aria-live="polite">{status}</p>
        <noscript><p>Para copiar o compartir la selección necesitás JavaScript. Todo el contenido y sus enlaces están disponibles; podés imprimir la ficha desde el menú de tu navegador.</p></noscript>
      </div>
    </div>
  );
}
