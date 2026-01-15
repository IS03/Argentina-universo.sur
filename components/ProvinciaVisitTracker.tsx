"use client";

import { useEffect } from "react";

interface ProvinciaVisitTrackerProps {
  slug: string;
}

export default function ProvinciaVisitTracker({ slug }: ProvinciaVisitTrackerProps) {
  useEffect(() => {
    // Guardar la provincia visitada en localStorage
    try {
      const visitadasData = localStorage.getItem("provinciasVisitadas");
      let slugsVisitados: Array<{ slug: string; timestamp: number; type: string }> = [];
      
      if (visitadasData) {
        try {
          const parsed = JSON.parse(visitadasData);
          // Compatibilidad con formato antiguo (array de strings)
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (typeof parsed[0] === 'string') {
              slugsVisitados = parsed.map((s: string) => ({ slug: s, timestamp: Date.now(), type: 'provincia' }));
            } else {
              slugsVisitados = parsed;
            }
          }
        } catch (e) {
          console.error("Error al parsear provincias visitadas:", e);
        }
      }

      // Remover el slug si ya existe (para evitar duplicados)
      slugsVisitados = slugsVisitados.filter(s => s.slug !== slug);
      
      // Agregar al final (más reciente) con timestamp
      slugsVisitados.push({ slug, timestamp: Date.now(), type: 'provincia' });

      // Mantener solo las últimas 20 visitas
      if (slugsVisitados.length > 20) {
        slugsVisitados = slugsVisitados.slice(-20);
      }

      localStorage.setItem("provinciasVisitadas", JSON.stringify(slugsVisitados));
    } catch (error) {
      console.error("Error al guardar provincia visitada:", error);
    }
  }, [slug]);

  return null; // Componente invisible
}
