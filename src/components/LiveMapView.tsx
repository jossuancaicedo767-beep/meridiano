import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { LIVE_CORRIDORS, NETWORK_STATIONS } from '../data/travelData';
import { NetworkStation } from '../types/travel';
import { formatDuration, getModeLabel } from '../utils/formatters';

interface LiveMapViewProps {
  initialCorridorId?: string;
}

function interpolatePolyline(points: { x: number; y: number }[], t: number) {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  const segments: { len: number; from: { x: number; y: number }; to: { x: number; y: number } }[] = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.hypot(dx, dy);
    segments.push({ len, from: points[i], to: points[i + 1] });
    totalLength += len;
  }

  if (totalLength === 0) return points[0];
  let target = Math.max(0, Math.min(1, t)) * totalLength;

  for (const seg of segments) {
    if (target <= seg.len) {
      const ratio = seg.len === 0 ? 0 : target / seg.len;
      return {
        x: seg.from.x + (seg.to.x - seg.from.x) * ratio,
        y: seg.from.y + (seg.to.y - seg.from.y) * ratio,
      };
    }
    target -= seg.len;
  }

  return points[points.length - 1];
}

export function LiveMapView({ initialCorridorId }: LiveMapViewProps) {
  const [selectedCorridorId, setSelectedCorridorId] = useState(
    initialCorridorId ?? LIVE_CORRIDORS[0].id,
  );
  const [selectedStationId, setSelectedStationId] = useState<string>('BUG');
  const [progress, setProgress] = useState(0.45);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (initialCorridorId) {
      setSelectedCorridorId(initialCorridorId);
      const next = LIVE_CORRIDORS.find((c) => c.id === initialCorridorId);
      if (next && next.stationIds.length > 0) {
        setSelectedStationId(next.stationIds[next.stationIds.length - 1]);
      }
      setProgress(0.35);
    }
  }, [initialCorridorId]);

  const corridor =
    LIVE_CORRIDORS.find((c) => c.id === selectedCorridorId) ?? LIVE_CORRIDORS[0];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setProgress((prev) => (prev >= 1 ? 0 : Number((prev + 0.008).toFixed(3))));
    }, 120);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  const stationById = useMemo(() => {
    const map = new Map<string, NetworkStation>();
    NETWORK_STATIONS.forEach((st) => map.set(st.id, st));
    return map;
  }, []);

  const corridorStations = useMemo(
    () =>
      corridor.stationIds
        .map((id) => stationById.get(id))
        .filter((s): s is NetworkStation => Boolean(s)),
    [corridor, stationById],
  );

  const vehiclePos = useMemo(
    () => interpolatePolyline(corridorStations, progress),
    [corridorStations, progress],
  );

  const inspectedStation =
    stationById.get(selectedStationId) ?? corridorStations[0] ?? NETWORK_STATIONS[0];

  const remainingMinutes = Math.max(
    0,
    Math.round(corridor.totalMinutes * (1 - progress)),
  );
  const coveredKm = Math.round(corridor.distanceKm * progress);

  const handleCorridorChange = (id: string) => {
    const next = LIVE_CORRIDORS.find((c) => c.id === id);
    setSelectedCorridorId(id);
    setProgress(0.25);
    if (next && next.stationIds.length > 0) {
      setSelectedStationId(next.stationIds[next.stationIds.length - 1]);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Mapa vial del Valle del Cauca en carro y moto
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Seguimiento sobre la Doble Calzada, Troncal del Cauca y Vía al Mar; pulsa cualquier municipio para inspeccionar conexiones
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pausar recorrido' : 'Reanudar recorrido'}
          </button>
          <button
            type="button"
            onClick={() => setProgress(0)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Mapa SVG del Valle del Cauca */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{corridor.title}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span className="font-mono">{corridor.highway}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>{getModeLabel(corridor.mode)}</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600">
              <label htmlFor="route-scrubber" className="sr-only">
                Progreso del trayecto
              </label>
              <input
                id="route-scrubber"
                type="range"
                min={0}
                max={100}
                value={Math.round(progress * 100)}
                onChange={(e) => setProgress(Number(e.target.value) / 100)}
                className="w-28 accent-blue-700 cursor-pointer"
              />
              <span className="font-mono font-semibold text-slate-900 tabular-nums w-9 text-right">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>

          <div className="relative bg-slate-50 flex-1 min-h-[420px]">
            <svg
              viewBox="0 0 500 470"
              className="w-full h-full max-h-[520px]"
              role="img"
              aria-label="Mapa vial del departamento del Valle del Cauca con Cali, Buga, Tuluá y municipios aledaños"
            >
              <defs>
                <pattern
                  id="valle-grid"
                  width="36"
                  height="36"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 36 0 L 0 0 0 36"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="0.7"
                  />
                </pattern>
              </defs>
              <rect width="500" height="470" fill="url(#valle-grid)" />

              {/* Etiquetas geográficas del Valle del Cauca sin solapamiento */}
              <text x="24" y="132" className="text-[11px] fill-slate-400 tracking-wide select-none">
                Océano Pacífico
              </text>
              <text x="24" y="147" className="text-[10px] fill-slate-400 select-none">
                (Bahía Buenaventura)
              </text>
              <text x="366" y="302" className="text-[10px] fill-slate-400 select-none">
                Cordillera Central
              </text>

              {/* Contorno del departamento del Valle del Cauca */}
              <path
                d="M 358 38 L 392 52 L 388 94 L 372 122 L 424 148 L 418 192 L 382 222 L 360 270 L 348 332 L 306 392 L 245 432 L 185 435 L 154 398 L 165 344 L 138 320 L 82 318 L 62 282 L 74 242 L 122 224 L 168 202 L 195 162 L 228 118 L 278 86 L 325 56 Z"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />

              {/* Río Cauca atravesando el valle de sur a norte */}
              <path
                d="M 218 424 C 228 375, 236 335, 256 292 C 272 252, 288 212, 304 172 C 318 134, 336 96, 350 60"
                fill="none"
                stroke="#BAE6FD"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Red de carreteras del Valle del Cauca */}
              {LIVE_CORRIDORS.map((c) => {
                const pts = c.stationIds
                  .map((id) => stationById.get(id))
                  .filter((s): s is NetworkStation => Boolean(s));
                if (pts.length < 2) return null;
                const d = pts
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                  .join(' ');
                const isSelected = c.id === corridor.id;
                return (
                  <path
                    key={c.id}
                    d={d}
                    fill="none"
                    stroke={isSelected ? '#1D4ED8' : '#CBD5E1'}
                    strokeWidth={isSelected ? 4 : 2}
                    strokeDasharray={c.mode === 'moto' && isSelected ? '8 4' : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}

              {/* Municipios interactivos */}
              {NETWORK_STATIONS.map((station) => {
                const inActive = corridor.stationIds.includes(station.id);
                const isInspected = inspectedStation.id === station.id;
                const isBottom = station.id === 'BUN';
                const labelLeft =
                  station.id === 'CLO' ||
                  station.id === 'JAM' ||
                  station.id === 'BUG';
                const dx = isBottom ? 0 : labelLeft ? -12 : 12;
                const dyCode = isBottom ? 20 : -5;
                const dyCity = isBottom ? 32 : 8;
                const anchor = isBottom ? 'middle' : labelLeft ? 'end' : 'start';
                return (
                  <g
                    key={station.id}
                    transform={`translate(${station.x}, ${station.y})`}
                    onClick={() => setSelectedStationId(station.id)}
                    className="cursor-pointer"
                  >
                    {isInspected && (
                      <circle
                        r="14"
                        fill="none"
                        stroke="#1D4ED8"
                        strokeWidth="1.5"
                        strokeOpacity="0.45"
                      />
                    )}
                    <circle
                      r={station.type === 'hub' ? 7 : 5}
                      fill={inActive ? '#1D4ED8' : '#FFFFFF'}
                      stroke={inActive ? '#1E3A8A' : '#64748B'}
                      strokeWidth="2"
                    />
                    <text
                      x={dx}
                      y={dyCode}
                      textAnchor={anchor}
                      className="text-[10px] font-mono font-semibold fill-slate-900 select-none"
                    >
                      {station.code}
                    </text>
                    <text
                      x={dx}
                      y={dyCity}
                      textAnchor={anchor}
                      className="text-[10px] fill-slate-500 select-none"
                    >
                      {station.city}
                    </text>
                  </g>
                );
              })}

              {/* Vehículo en movimiento */}
              <g transform={`translate(${vehiclePos.x}, ${vehiclePos.y})`}>
                <circle r="11" fill="#1D4ED8" fillOpacity="0.16" />
                <circle
                  r="6"
                  fill="#0F172A"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </g>
            </svg>
          </div>
        </div>

        {/* Panel derecho de rutas del Valle del Cauca */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Corredores del Valle del Cauca
            </h2>
            <div className="space-y-2">
              {LIVE_CORRIDORS.map((c) => {
                const active = c.id === corridor.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCorridorChange(c.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-blue-50/70 border-blue-700'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-900">
                        {getModeLabel(c.mode)} · {c.serviceCode}
                      </span>
                      <span className="text-slate-500">{c.operator}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mt-1">{c.title}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <p className="text-xs text-slate-500">{corridor.highway}</p>
              <h3 className="font-display text-base font-semibold text-slate-900 mt-0.5">
                {corridor.vehicleModel}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Conductor: {corridor.operator}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Restante</span>
                <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {formatDuration(remainingMinutes)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Recorrido</span>
                <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {coveredKm} / {corridor.distanceKm} km
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Velocidad</span>
                <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {corridor.speedKmh} km/h
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1.5">
              <p className="text-slate-700">
                <span className="font-medium text-slate-900">Próximo punto:</span>{' '}
                {corridor.nextStop}
              </p>
              <p className="text-slate-600">{corridor.weatherNote}</p>
            </div>

            <div className="pt-3 border-t border-slate-200 text-xs">
              <p className="text-slate-500">Municipio seleccionado en mapa</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {inspectedStation.name} ({inspectedStation.code})
              </p>
              <p className="text-slate-600 mt-0.5">{inspectedStation.platformNote}</p>
              <p className="font-mono text-[11px] text-slate-500 mt-1">
                Rutas activas: {inspectedStation.activeLines.join(' · ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
