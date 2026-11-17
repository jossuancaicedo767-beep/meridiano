import { CheckCircle2, Clock, Map, QrCode, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { RouteOption, TripBooking } from '../types/travel';
import { buildQrMatrix, formatCop, formatDuration, getModeLabel } from '../utils/formatters';

interface TripsViewProps {
  bookings: TripBooking[];
  onToggleCheckIn: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
  onDeleteBooking: (bookingId: string) => void;
  onExploreRoutes: () => void;
  onTrackOnMap: (route: RouteOption) => void;
}

function QrCodeSvg({ value }: { value: string }) {
  const matrix = useMemo(() => buildQrMatrix(value, 13), [value]);
  return (
    <svg
      viewBox="0 0 13 13"
      shapeRendering="crispEdges"
      className="w-24 h-24 bg-white p-1.5 border border-slate-200 rounded-lg shrink-0"
      role="img"
      aria-label={`Código QR de abordaje ${value}`}
    >
      {matrix.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width={1}
              height={1}
              fill="#0F172A"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

export function TripsView({
  bookings,
  onToggleCheckIn,
  onCancelBooking,
  onDeleteBooking,
  onExploreRoutes,
  onTrackOnMap,
}: TripsViewProps) {
  const [selectedId, setSelectedId] = useState<string>(bookings[0]?.id ?? '');
  const [statusFilter, setStatusFilter] = useState<'activos' | 'todos'>('activos');

  const visibleBookings = useMemo(() => {
    if (statusFilter === 'todos') return bookings;
    return bookings.filter((b) => b.status !== 'Cancelado');
  }, [bookings, statusFilter]);

  useEffect(() => {
    if (visibleBookings.length > 0 && !visibleBookings.some((b) => b.id === selectedId)) {
      setSelectedId(visibleBookings[0].id);
    }
  }, [visibleBookings, selectedId]);

  const activeBooking =
    visibleBookings.find((b) => b.id === selectedId) ?? visibleBookings[0] ?? null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Mis viajes por el Valle del Cauca
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pases QR para el conductor, placa verificada y punto exacto de recogida
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setStatusFilter('activos')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              statusFilter === 'activos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Activos ({bookings.filter((b) => b.status !== 'Cancelado').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              statusFilter === 'todos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Historial ({bookings.length})
          </button>
        </div>
      </div>

      {visibleBookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <QrCode className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="font-display text-lg font-semibold text-slate-900 mt-3">
            No tienes viajes activos en esta vista
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Busca una ruta en carro o moto por el Valle del Cauca para confirmar tu cupo y generar el pase QR.
          </p>
          <button
            type="button"
            onClick={onExploreRoutes}
            className="mt-5 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
          >
            Buscar viajes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lista izquierda de reservas */}
          <div className="lg:col-span-5 divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden">
            {visibleBookings.map((booking) => {
              const isSelected = activeBooking?.id === booking.id;
              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => setSelectedId(booking.id)}
                  className={`w-full text-left p-5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-700">
                      {booking.locator}
                    </span>
                    <span className="tabular-nums">{booking.travelDate}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 mt-1.5">
                    <span className="font-display text-base font-semibold text-slate-900">
                      {booking.route.origin} → {booking.route.destination}
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                      {formatCop(booking.totalPaidCop)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                    <span>{getModeLabel(booking.route.primaryMode)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {booking.route.departureTime}–{booking.route.arrivalTime}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        booking.status === 'Cancelado'
                          ? 'text-red-700 font-medium'
                          : booking.checkedIn
                            ? 'text-emerald-700 font-medium'
                            : 'text-slate-700 font-medium'
                      }
                    >
                      {booking.status === 'Cancelado'
                        ? 'Cancelado'
                        : booking.checkedIn
                          ? 'Listo para salir'
                          : booking.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalle y pase digital para conductor */}
          {activeBooking && (
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Localizador{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {activeBooking.locator}
                    </span>{' '}
                    · {activeBooking.passengerName}
                  </p>
                  <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
                    {activeBooking.route.origin} → {activeBooking.route.destination}
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium">
                  {activeBooking.status === 'Cancelado' ? (
                    <span className="text-red-700">Reserva cancelada</span>
                  ) : activeBooking.checkedIn ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmado en punto de recogida
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-700">
                      <Clock className="w-4 h-4" />
                      Pendiente confirmar asistencia
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center border-b border-slate-200">
                <div className="sm:col-span-8 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Recogida</p>
                      <p className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                        {activeBooking.route.departureTime}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {activeBooking.route.segments[0]?.originTerminal}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Llegada estimada</p>
                      <p className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                        {activeBooking.route.arrivalTime}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {
                          activeBooking.route.segments[
                            activeBooking.route.segments.length - 1
                          ]?.destinationTerminal
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 block">Vehículo y placa</span>
                      <span className="font-medium text-slate-900 mt-0.5 block">
                        {activeBooking.seatAssignment}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Equipaje y total</span>
                      <span className="font-medium text-slate-900 mt-0.5 block">
                        {activeBooking.baggage} · {formatCop(activeBooking.totalPaidCop)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-4 flex flex-col items-center sm:items-end gap-2">
                  <QrCodeSvg value={`${activeBooking.locator}-${activeBooking.travelDate}`} />
                  <span className="font-mono text-[11px] text-slate-500">
                    {activeBooking.locator}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-3 bg-slate-50/70">
                <h3 className="text-xs font-semibold text-slate-700">
                  Detalle del trayecto ({formatDuration(activeBooking.route.totalDurationMinutes)} ·{' '}
                  {activeBooking.route.totalDistanceKm} km)
                </h3>
                {activeBooking.route.segments.map((seg, i) => (
                  <div
                    key={seg.id}
                    className="flex items-center justify-between text-xs py-2 border-b last:border-b-0 border-slate-200"
                  >
                    <div>
                      <span className="font-mono font-semibold text-slate-700 mr-2">
                        0{i + 1}.
                      </span>
                      <span className="font-medium text-slate-900">
                        {getModeLabel(seg.mode)} · {seg.operator} · {seg.vehicleModel} ({seg.plateNumber})
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        {seg.originCity} → {seg.destinationCity}
                      </p>
                    </div>
                    <span className="font-mono text-slate-700 tabular-nums">
                      {seg.departureTime} – {seg.arrivalTime}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {activeBooking.status !== 'Cancelado' && (
                    <button
                      type="button"
                      onClick={() => onToggleCheckIn(activeBooking.id)}
                      className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
                    >
                      {activeBooking.checkedIn
                        ? 'Anular confirmación'
                        : 'Confirmar asistencia'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onTrackOnMap(activeBooking.route)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Map className="w-3.5 h-3.5" />
                    Ver en mapa del Valle
                  </button>
                </div>

                {activeBooking.status !== 'Cancelado' ? (
                  <button
                    type="button"
                    onClick={() => onCancelBooking(activeBooking.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancelar reserva
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDeleteBooking(activeBooking.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar del historial
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
