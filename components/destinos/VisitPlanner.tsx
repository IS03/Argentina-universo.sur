"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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
  const [manualCopy, setManualCopy] = useState<{ value: string; label: string } | null>(null);
  const output = useRef<HTMLTextAreaElement>(null);
  const items = selectedAttractions(destination, selected);
  const text = visitList(destination, selected);

  useEffect(() => {
    if (manualCopy) { output.current?.focus(); output.current?.select(); }
  }, [manualCopy]);

  async function copy(value: string) {
    setManualCopy(null);
    try {
      if (!navigator.clipboard?.writeText) throw Error('CLIPBOARD_UNAVAILABLE');
      await navigator.clipboard.writeText(value);
      setStatus(value === destination.canonical ? 'Enlace de la ficha copiado.' : 'Lista copiada. Podés pegarla en un mensaje o documento.');
    } catch {
      setManualCopy({ value, label: value === destination.canonical ? 'Enlace para copiar manualmente' : 'Lista para copiar manualmente' });
      setStatus('El navegador no pudo copiar. Seleccioná y copiá el texto del campo de copia manual.');
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
            setManualCopy(null);
            setStatus('');
          }} />
          <span className="destination-plan-number" aria-hidden="true">0{index + 1}</span><span>{item.name}</span>
        </label>)}
      </fieldset>
      <div className="destination-plan-result">
        <p className="destination-label">Tu selección</p>
        <p className="destination-plan-count" role="status" aria-live="polite">{items.length ? `${items.length} de ${destination.attractions.length} lugares seleccionados` : 'Todavía no elegiste lugares'}</p>
        <p className="destination-plan-help">{items.length ? 'La lista queda solo en esta pestaña. No establece un itinerario ni confirma horarios o disponibilidad.' : 'Marcá los lugares que te interesan para reunirlos acá y preparar una lista de consulta.'}</p>
        {items.length > 0 && <>
          <ul id="lista-de-visita" className="destination-selected-list" aria-label="Lugares seleccionados">
            {items.map(item => <li key={item.id}><a href={'#' + item.id}><Icono nombre="pin" /><span>{item.name}</span><Icono nombre="flecha" /></a></li>)}
          </ul>
          <div className="destination-plan-actions">
            <button type="button" onClick={() => copy(text)}><Icono nombre="documento" />Copiar lista</button>
            <button type="button" onClick={() => share(true)}><Icono nombre="externo" />Compartir lista</button>
            <button type="button" onClick={() => { setSelected([]); setManualCopy(null); setStatus('Selección vaciada.'); }}>Vaciar selección</button>
          </div>
        </>}
        {manualCopy && <div className="destination-manual-copy">
          <label htmlFor="copia-manual-visita">{manualCopy.label}</label>
          <textarea ref={output} id="copia-manual-visita" value={manualCopy.value} readOnly rows={5} />
        </div>}
        {ready && <div className="destination-page-actions">
          <button type="button" onClick={() => share(false)}>Compartir ficha<Icono nombre="externo" /></button>
          <button type="button" onClick={() => window.print()}>Imprimir ficha<Icono nombre="documento" /></button>
        </div>}
        <p className="destination-plan-status" role="status" aria-live="polite">{status}</p>
        <noscript><p>Para copiar o compartir la selección necesitás JavaScript. Todo el contenido y sus enlaces están disponibles; podés imprimir la ficha desde el menú de tu navegador.</p></noscript>
      </div>
    </div>
  );
}
