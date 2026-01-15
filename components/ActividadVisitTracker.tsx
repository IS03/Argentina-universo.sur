"use client";

import { useEffect } from "react";

interface ActividadVisitTrackerProps {
  slug: string;
}

export default function ActividadVisitTracker({ slug }: ActividadVisitTrackerProps) {
  useEffect(() => {
    // Guardar la actividad visitada en localStorage
    try {
      const visitadasData = localStorage.getItem("actividadesVisitadas");
      let slugsVisitados: Array<{ slug: string; timestamp: number; type: string }> = [];
      
      if (visitadasData) {
        try {
          const parsed = JSON.parse(visitadasData);
          // Compatibilidad con formato antiguo (array de strings)
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (typeof parsed[0] === 'string') {
              slugsVisitados = parsed.map((s: string) => ({ slug: s, timestamp: Date.now(), type: 'actividad' }));
            } else {
              slugsVisitados = parsed;
            }
          }
        } catch (e) {
          console.error("Error al parsear actividades visitadas:", e);
        }
      }

      // Remover el slug si ya existe (para evitar duplicados)
      slugsVisitados = slugsVisitados.filter(s => s.slug !== slug);
      
      // Agregar al final (más reciente) con timestamp
      slugsVisitados.push({ slug, timestamp: Date.now(), type: 'actividad' });

      // Mantener solo las últimas 20 visitas
      if (slugsVisitados.length > 20) {
        slugsVisitados = slugsVisitados.slice(-20);
      }

      localStorage.setItem("actividadesVisitadas", JSON.stringify(slugsVisitados));
    } catch (error) {
      console.error("Error al guardar actividad visitada:", error);
    }
  }, [slug]);

  return null; // Componente invisible
}
