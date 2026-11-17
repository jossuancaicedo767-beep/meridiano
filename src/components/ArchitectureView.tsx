import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { ARCHITECTURE_LAYERS } from '../data/travelData';

interface ArchitectureViewProps {
  onGoToExplorer: () => void;
}

export function ArchitectureView({ onGoToExplorer }: ArchitectureViewProps) {
  const [activeLayerId, setActiveLayerId] = useState(ARCHITECTURE_LAYERS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeLayer =
    ARCHITECTURE_LAYERS.find((layer) => layer.id === activeLayerId) ??
    ARCHITECTURE_LAYERS[0];

  const handleCopyTree = async () => {
    try {
      await navigator.clipboard.writeText(activeLayer.folderTree);
      setCopiedId(activeLayer.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Silenciar si el navegador bloquea portapapeles
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-blue-700">
            Plano técnico del sistema
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Estructura de una app de viajes en el Valle del Cauca
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
            Arquitectura modular diseñada para corredores en carro y moto entre Cali, Buga, Tuluá, Palmira, Cartago y Buenaventura con tarifas en COP.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToExplorer}
          className="self-start md:self-end px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Probar buscador carro y moto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-2">
          {ARCHITECTURE_LAYERS.map((layer) => {
            const isSelected = layer.id === activeLayer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => setActiveLayerId(layer.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white border-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-mono font-semibold text-blue-700">
                  {layer.number}.
                </div>
                <h2 className="font-display text-sm font-semibold text-slate-900 mt-0.5">
                  {layer.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {layer.summary}
                </p>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <span className="font-mono text-xs font-semibold text-blue-700">
              {activeLayer.number}. Módulo arquitectónico
            </span>
            <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
              {activeLayer.title}
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              {activeLayer.summary}
            </p>
          </div>

          <div className="p-6 border-b border-slate-200 bg-slate-950 text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">
                Estructura y flujo de archivos
              </span>
              <button
                type="button"
                onClick={handleCopyTree}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
              >
                {copiedId === activeLayer.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar esquema
                  </>
                )}
              </button>
            </div>
            <pre className="font-mono text-xs leading-relaxed overflow-x-auto text-slate-200">
              {activeLayer.folderTree}
            </pre>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 mb-3">
                Responsabilidades clave
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-600">
                {activeLayer.responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="font-mono text-xs text-blue-700 font-semibold mt-0.5">
                      0{idx + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900 mb-2.5">
                  Modelos de datos principales
                </h3>
                <div className="space-y-2.5">
                  {activeLayer.entities.map((entity) => (
                    <div
                      key={entity.name}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {entity.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 mt-1">
                        {entity.fields.join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900 mb-2">
                  APIs e integraciones recomendadas
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {activeLayer.integrations.map((intItem, idx) => (
                    <li key={idx}>• {intItem}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
