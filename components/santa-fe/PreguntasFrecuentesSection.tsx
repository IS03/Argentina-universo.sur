"use client";

import { useState } from 'react';
import { PreguntaFrecuente } from "@/lib/data";

interface PreguntasFrecuentesSectionProps {
  preguntas: PreguntaFrecuente[];
}

export default function PreguntasFrecuentesSection({ preguntas }: PreguntasFrecuentesSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null); // Todas cerradas por defecto

  return (
    <section id="preguntas-frecuentes" className="mb-16 scroll-mt-24">
      <h2 className="text-3xl md:text-4xl font-semibold uppercase tracking-widest mb-8 text-center text-tinta-900">
        Preguntas Frecuentes
      </h2>
      <div className="space-y-4 max-w-4xl mx-auto">
        {preguntas.map((pregunta, index) => {
          const isOpen = openIndex === index;
          
          return (
            <div
              key={index}
              className="border border-arena-300/50 rounded-lg overflow-hidden bg-arena-200/80 backdrop-blur-sm hover:border-lago-600/70 transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-6 py-4 text-left bg-lago-600/10 hover:bg-lago-600/20 transition-colors flex justify-between items-center gap-4"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-tinta-900 text-lg pr-4 flex-1">
                  {pregunta.Pregunta}
                </span>
                <span className="text-lago-600 flex-shrink-0 flex items-center justify-center w-6 h-6 relative">
                  <svg 
                    className="w-5 h-5 transition-transform duration-300"
                    style={{ transform: isOpen ? 'rotate(-45deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 4v16m8-8H4" 
                    />
                  </svg>
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 py-4 bg-white/50">
                  <p className="text-tinta-700 leading-relaxed whitespace-pre-line">
                    {pregunta.Respuesta}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
