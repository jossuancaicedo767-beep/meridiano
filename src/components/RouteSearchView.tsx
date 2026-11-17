import {
  ArrowLeftRight,
  Bike,
  Car,
  ChevronDown,
  ChevronUp,
  Leaf,
  MapPin,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AVAILABLE_CITIES, FEATURED_DESTINATIONS } from '../data/travelData';
import { LegMode, RouteOption, TransportMode, TripBooking } from '../types/travel';
import { formatCop, formatDuration, getModeLabel } from '../utils/formatters';
import { getRemainingSeats, getRoutesForCorridor } from '../utils/routeFinder';

interface RouteSearchViewProps {
  origin: string;
  destination: string;
  travelDate: string;
  passengers: number;
  bookings: TripBooking[];
  onOriginChange: (city: string) => void;
  onDestinationChange: (city: string) => void;
  onDateChange: (date: string) => void;
  onPassengersChange: (count: number) => void;
  onSelectRouteForBooking: (route: RouteOption) => void;
  onOpenArchitecture: () => void;
}

type SortCriterion = 'equilibrio' | 'rapido' | 'economico' | 'sostenible';

const MODE_TABS: { id: TransportMode; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'carro', label: 'Carro' },
  { id: 'moto', label: 'Moto' },
];

function ModeIcon({ mode, className = 'w-4 h-4' }: { mode: LegMode; className?: string }) {
  switch (mode) {
    case 'carro':
      return <Car className={className} />;
    case 'moto':
      return <Bike className={className} />;
  }
}

export function RouteSearchView({
  origin,
  destination,
  travelDate,
  passengers,
  bookings,
  onOriginChange,
  onDestinationChange,
  onDateChange,
  onPassengersChange,
  onSelectRouteForBooking,
  onOpenArchitecture,
}: RouteSearchViewProps) {
  const [modeFilter, setModeFilter] = useState<TransportMode>('todos');
  const [sortBy, setSortBy] = useState<SortCriterion>('equilibrio');
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [failedDestImages, setFailedDestImages] = useState<Record<string, boolean>>({});

  const isSameCity = origin.toLowerCase() === destination.toLowerCase();

  const handleSwapCities = () => {
    const prevOrigin = origin;
    onOriginChange(destination);
    onDestinationChange(prevOrigin);
    setExpandedRouteId(null);
  };

  const filteredRoutes = useMemo(() => {
    const allForCorridor = getRoutesForCorridor(origin, destination);
    const matches = allForCorridor.filter(
      (route) =>
        modeFilter === 'todos' ||
        route.primaryMode === modeFilter ||
        route.segments.some((seg) => seg.mode === modeFilter),
    );

    const list = [...matches];
    list.sort((a, b) => {
      if (sortBy === 'rapido') return a.totalDurationMinutes - b.totalDurationMinutes;
      if (sortBy === 'economico') return a.priceCop - b.priceCop;
      if (sortBy === 'sostenible') return a.co2Kg - b.co2Kg;
      return a.priceCop / 1000 + a.totalDurationMinutes * 0.2 - (b.priceCop / 1000 + b.totalDurationMinutes * 0.2);
    });
    return list;
  }, [origin, destination, modeFilter, sortBy]);

  const handleSelectDestinationCard = (corridorOrigin: string, city: string) => {
    onOriginChange(corridorOrigin);
    onDestinationChange(city);
    setModeFilter('todos');
    const resultsEl = document.getElementById('resultados-rutas');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner de carreteras del Valle del Cauca */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="relative h-[300px] sm:h-[340px] w-full">
          {!heroImgFailed ? (
            <img
              src="/src/assets/images/hero_colombia_car_moto_1794919637646.jpg"
              alt="Carro y moto circulando por carretera andina entre montañas cafeteras en Colombia"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center">
              <MapPin className="w-10 h-10 text-slate-500" />
            </div>
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/25"
          />

          <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-8 flex flex-col justify-end pb-10 sm:pb-12">
            <p className="text-xs sm:text-sm font-medium text-blue-200 tracking-wide mb-2">
              Valle del Cauca · Viajes en carro y moto entre Cali, Buga, Tuluá y municipios vecinos
            </p>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold text-white leading-tight max-w-2xl text-balance">
                Muévete por el Valle del Cauca en carro o moto con tarifas en pesos
              </h1>
              <button
                type="button"
                onClick={onOpenArchitecture}
                className="self-start lg:self-end text-xs sm:text-sm font-medium text-slate-200 hover:text-white underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
              >
                Ver estructura técnica de la app
              </button>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda entre municipios del Valle del Cauca */}
        <div className="relative bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-3">
                <label htmlFor="search-origin" className="block text-xs font-medium text-slate-500 mb-1">
                  Ciudad de salida
                </label>
                <select
                  id="search-origin"
                  value={origin}
                  onChange={(e) => onOriginChange(e.target.value)}
                  className="w-full h-11 px-3 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700 focus:bg-white"
                >
                  {AVAILABLE_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleSwapCities}
                  title="Intercambiar salida y destino"
                  aria-label="Intercambiar salida y destino"
                  className="h-11 w-full md:w-11 inline-flex items-center justify-center border border-slate-300 rounded-lg text-slate-600 hover:text-blue-700 hover:border-blue-700 bg-white transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              <div className="md:col-span-3">
                <label htmlFor="search-destination" className="block text-xs font-medium text-slate-500 mb-1">
                  Ciudad de destino
                </label>
                <select
                  id="search-destination"
                  value={destination}
                  onChange={(e) => onDestinationChange(e.target.value)}
                  className="w-full h-11 px-3 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700 focus:bg-white"
                >
                  {AVAILABLE_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="search-date" className="block text-xs font-medium text-slate-500 mb-1">
                  Fecha de viaje
                </label>
                <input
                  id="search-date"
                  type="date"
                  min="2026-11-17"
                  value={travelDate}
                  onChange={(e) => onDateChange(e.target.value || '2026-11-21')}
                  className="w-full h-11 px-3 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700 focus:bg-white tabular-nums"
                />
              </div>

              <div className="md:col-span-1">
                <label htmlFor="search-passengers" className="block text-xs font-medium text-slate-500 mb-1">
                  Cupos
                </label>
                <select
                  id="search-passengers"
                  value={passengers}
                  onChange={(e) => onPassengersChange(Number(e.target.value))}
                  className="w-full h-11 px-2.5 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700 focus:bg-white tabular-nums"
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('resultados-rutas');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="h-11 w-full inline-flex items-center justify-center gap-2 px-4 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Buscar viajes
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resultados disponibles */}
      <section
        id="resultados-rutas"
        className="max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-28 md:scroll-mt-20"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {origin} → {destination}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 tabular-nums">
              {isSameCity
                ? 'Selecciona dos municipios distintos para comparar rutas'
                : `${filteredRoutes.length} ${
                    filteredRoutes.length === 1 ? 'vehículo disponible' : 'vehículos disponibles'
                  } · ${travelDate} · ${passengers} ${passengers === 1 ? 'cupo' : 'cupos'}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Filtrar por carro o moto"
              className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto"
            >
              {MODE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModeFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    modeFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              aria-label="Ordenar viajes"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortCriterion)}
              className="h-9 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700 cursor-pointer"
            >
              <option value="equilibrio">Orden: Mejor equilibrio</option>
              <option value="rapido">Orden: Más rápido</option>
              <option value="economico">Orden: Menor precio COP</option>
              <option value="sostenible">Orden: Menor CO₂</option>
            </select>
          </div>
        </div>

        {isSameCity ? (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl p-10 text-center">
            <h3 className="font-display text-base font-semibold text-slate-900">
              La ciudad de salida y destino son iguales ({origin})
            </h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
              Elige un destino diferente en el Valle del Cauca o carga directamente una ruta frecuente.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onOriginChange('Cali');
                  onDestinationChange(origin === 'Buga' ? 'Tuluá' : 'Buga');
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Ver Cali → {origin === 'Buga' ? 'Tuluá' : 'Buga'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden">
            {filteredRoutes.map((route) => {
              const isExpanded = expandedRouteId === route.id;
              const remainingSeats = getRemainingSeats(route, bookings, travelDate);
              const totalPrice = route.priceCop * passengers;
              const primarySeg = route.segments[0];
              const seatsEnough = remainingSeats >= passengers;
              return (
                <div key={route.id} className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                        <ModeIcon mode={route.primaryMode} className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-800">
                            {getModeLabel(route.primaryMode)} · {primarySeg?.vehicleModel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{primarySeg?.plateNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {route.transfers === 0
                              ? 'Directo'
                              : `${route.transfers} relevo en ruta`}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{route.tollsIncluded ? 'Peajes incluidos' : 'Sin peajes'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <Leaf className="w-3.5 h-3.5" />
                            <span className="tabular-nums">{route.co2Kg} kg CO₂</span>
                          </span>
                        </div>

                        <div className="flex items-baseline gap-4 mt-1.5">
                          <span className="font-mono text-xl font-semibold text-slate-900 tabular-nums">
                            {route.departureTime}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="h-px w-8 bg-slate-300" />
                            <span className="font-mono tabular-nums">
                              {formatDuration(route.totalDurationMinutes)} · {route.totalDistanceKm} km
                            </span>
                            <span className="h-px w-8 bg-slate-300" />
                          </div>
                          <span className="font-mono text-xl font-semibold text-slate-900 tabular-nums">
                            {route.arrivalTime}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          {primarySeg?.originTerminal} →{' '}
                          {route.segments[route.segments.length - 1]?.destinationTerminal}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="lg:text-right">
                        <div className="font-mono text-lg sm:text-xl font-semibold text-slate-900 tabular-nums">
                          {formatCop(totalPrice)}
                        </div>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {remainingSeats}{' '}
                          {remainingSeats === 1 ? 'cupo libre' : 'cupos libres'} ·{' '}
                          {route.punctualityRate}% puntualidad
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRouteId(isExpanded ? null : route.id)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Detalles
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={!seatsEnough}
                          onClick={() => onSelectRouteForBooking(route)}
                          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                            seatsEnough
                              ? 'text-white bg-blue-700 hover:bg-blue-800 cursor-pointer'
                              : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          {seatsEnough
                            ? 'Reservar'
                            : remainingSeats === 0
                              ? 'Agotado'
                              : `Máx ${remainingSeats}`}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 pt-4 border-t border-slate-200 space-y-3">
                      {route.segments.map((seg, index) => (
                        <div
                          key={seg.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-2.5 px-3.5 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-semibold text-slate-500">
                              0{index + 1}
                            </span>
                            <ModeIcon mode={seg.mode} className="w-4 h-4 text-slate-700" />
                            <div>
                              <span className="font-medium text-slate-900">
                                {getModeLabel(seg.mode)} · {seg.operator} · {seg.vehicleModel} ({seg.plateNumber})
                              </span>
                              <p className="text-slate-500 mt-0.5">
                                {seg.originCity} ({seg.departureTime}) → {seg.destinationCity} ({seg.arrivalTime}) ·{' '}
                                {formatDuration(seg.durationMinutes)} · {seg.distanceKm} km
                              </p>
                            </div>
                          </div>
                          <div className="text-slate-500">
                            {seg.amenities.join(' · ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Corredores destacados del Valle del Cauca */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              Corredores destacados del Valle del Cauca
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Rutas frecuentes en carro y moto entre Cali, Buga, Tuluá y municipios vecinos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_DESTINATIONS.map((spot) => {
            const imgFailed = failedDestImages[spot.id];
            return (
              <article
                key={spot.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                    {!imgFailed ? (
                      <img
                        src={spot.imageUrl}
                        alt={spot.imageAlt}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedDestImages((prev) => ({ ...prev, [spot.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500">
                        <MapPin className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-slate-500">
                      Desde {spot.corridorOrigin} · {spot.recommendedMode} · {spot.fastestDuration}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-slate-900 mt-1">
                      {spot.city}, {spot.department}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                      {spot.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Desde </span>
                    <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {formatCop(spot.startingPriceCop)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectDestinationCard(spot.corridorOrigin, spot.city)
                    }
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
                  >
                    Ver salidas →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
