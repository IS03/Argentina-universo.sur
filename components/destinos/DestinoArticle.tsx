import type { Destino } from '@/lib/destinos/modelo';
import FotoConCredito from '@/components/destinos/FotoConCredito';
import { ListaFuentes } from '@/components/destinos/Fuentes';
import { Localidades, TarjetaAtractivo, InfoPractica, Ubicaciones } from '@/components/destinos/Lugares';

// Presentation only. The caller supplies a projection; never serialize the private master references.
// PR17 renders this component offline with synthetic data. No public route imports it.
export type DestinoPresentation = Omit<Destino, 'referenciasMaestro'>;
const SIZES_FOTO = '(min-width: 832px) 768px, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)';

export default function DestinoArticle({ destino }: { destino: DestinoPresentation }) {
  return (
    <article className="contenedor py-12">
      <header className="max-w-3xl">
        <h1 className="font-display text-titulo text-tinta-900">{destino.nombre}</h1>
        <p className="mt-4 text-lg text-tinta-700">{destino.resumen}</p>
        {destino.localidades.length > 0 && (
          <div className="mt-4"><Localidades localidades={destino.localidades} /></div>
        )}
      </header>
      {destino.fotos.map((foto, i) => (
        <FotoConCredito key={foto.src} foto={foto} sizes={SIZES_FOTO} prioridad={i === 0} className="mt-8 max-w-3xl" />
      ))}
      {destino.atractivos.length > 0 && (
        <section className="mt-10" aria-labelledby="destino-atractivos">
          <h2 id="destino-atractivos" className="font-display text-seccion">Qué conocer</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {destino.atractivos.map(atractivo => (
              <TarjetaAtractivo key={atractivo.id} atractivo={atractivo} localidad={destino.localidades.find(l => l.id === atractivo.localidadId)} fuentes={destino.fuentes} />
            ))}
          </div>
        </section>
      )}
      {destino.practicos.length > 0 && (
        <section className="mt-10" aria-labelledby="destino-practicos">
          <h2 id="destino-practicos" className="mb-4 font-display text-seccion">Organizar la visita</h2>
          <InfoPractica datos={destino.practicos} fuentes={destino.fuentes} />
        </section>
      )}
      {destino.ubicaciones.length > 0 && (
        <section className="mt-10" aria-labelledby="destino-mapas">
          <h2 id="destino-mapas" className="mb-4 font-display text-seccion">Ubicación</h2>
          <Ubicaciones ubicaciones={destino.ubicaciones} fuentes={destino.fuentes} />
        </section>
      )}
      <section className="mt-10" aria-labelledby="destino-fuentes">
        <h2 id="destino-fuentes" className="mb-4 font-display text-seccion">Fuentes</h2>
        <ListaFuentes fuentes={destino.fuentes} />
      </section>
    </article>
  );
}
