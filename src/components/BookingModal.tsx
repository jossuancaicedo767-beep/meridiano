import { Check, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { RouteOption, TripBooking } from '../types/travel';
import { formatCop, formatDuration, generateLocator, getModeLabel } from '../utils/formatters';

interface BookingModalProps {
  route: RouteOption;
  travelDate: string;
  passengersCount: number;
  availableSeats: number;
  onClose: () => void;
  onConfirm: (booking: TripBooking) => void;
}

export function BookingModal({
  route,
  travelDate,
  passengersCount,
  availableSeats,
  onClose,
  onConfirm,
}: BookingModalProps) {
  const [passengerName, setPassengerName] = useState('Jossúan Caicedo');
  const [carSeatPref, setCarSeatPref] = useState<'Copiloto' | 'Trasero ventana'>('Copiloto');
  const [helmetSize, setHelmetSize] = useState<'Casco M' | 'Casco L'>('Casco M');
  const [baggageOption, setBaggageOption] = useState<'ligero' | 'extra'>('ligero');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isMoto = route.primaryMode === 'moto';
  const primarySeg = route.segments[0];
  const effectivePassengers = isMoto
    ? 1
    : Math.max(1, Math.min(passengersCount, availableSeats));
  const extraBaggagePrice =
    baggageOption === 'extra' ? (isMoto ? 8000 : 15000 * effectivePassengers) : 0;
  const totalPrice = route.priceCop * effectivePassengers + extraBaggagePrice;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanedName = passengerName.trim() || 'Viajero Valle del Cauca';
    const seatCode = isMoto
      ? `Acompañante · ${helmetSize} (${primarySeg?.vehicleModel})`
      : `${carSeatPref} · ${primarySeg?.vehicleModel} (${primarySeg?.plateNumber})`;

    const baggageText = isMoto
      ? baggageOption === 'extra'
        ? 'Mochila 20L + alforja / top case'
        : 'Mochila compacta 15L'
      : baggageOption === 'extra'
        ? 'Maleta grande en baúl + morral'
        : 'Morral o equipaje de mano';

    const newBooking: TripBooking = {
      id: `bk-${Date.now()}`,
      locator: generateLocator(`${route.id}-${Date.now()}-${cleanedName}`),
      passengerName: cleanedName,
      passengersCount: effectivePassengers,
      travelDate,
      status: 'Confirmado',
      seatAssignment:
        effectivePassengers > 1 ? `${seatCode} (+${effectivePassengers - 1})` : seatCode,
      baggage: baggageText,
      totalPaidCop: totalPrice,
      route,
      checkedIn: false,
      createdAt: new Date().toISOString(),
    };

    onConfirm(newBooking);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {getModeLabel(route.primaryMode)} · {primarySeg?.vehicleModel} · Placa {primarySeg?.plateNumber}
            </p>
            <h2
              id="booking-modal-title"
              className="font-display text-lg font-semibold text-slate-900 mt-0.5"
            >
              Reservar cupo: {route.origin} → {route.destination}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center justify-between text-sm py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {route.departureTime} – {route.arrivalTime}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                {travelDate} · {formatDuration(route.totalDurationMinutes)} · {route.totalDistanceKm} km ·{' '}
                {effectivePassengers} {effectivePassengers === 1 ? 'cupo' : 'cupos'}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-base font-semibold text-slate-900 tabular-nums">
                {formatCop(totalPrice)}
              </span>
              <p className="text-xs text-slate-500">
                {route.tollsIncluded ? 'Peajes incluidos' : 'Tarifa directa'}
              </p>
            </div>
          </div>

          {availableSeats <= 0 ? (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              No quedan cupos disponibles en este vehículo para la fecha seleccionada.
            </p>
          ) : (
            isMoto &&
            passengersCount > 1 && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5">
                En moto viaja 1 acompañante por vehículo; la reserva se ajustó a 1 cupo.
              </p>
            )
          )}

          <div>
            <label
              htmlFor="passenger-name"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Nombre del pasajero
            </label>
            <input
              id="passenger-name"
              type="text"
              required
              minLength={2}
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              placeholder="Nombre completo del viajero"
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isMoto ? (
              <div>
                <span className="block text-sm font-medium text-slate-700 mb-1.5">
                  Talla de casco incluida
                </span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['Casco M', 'Casco L'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setHelmetSize(opt)}
                      className={`py-2 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        helmetSize === opt
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <span className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ubicación en el carro
                </span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['Copiloto', 'Trasero ventana'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCarSeatPref(opt)}
                      className={`py-2 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        carSeatPref === opt
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="block text-sm font-medium text-slate-700 mb-1.5">
                Equipaje
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setBaggageOption('ligero')}
                  className={`py-2 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    baggageOption === 'ligero'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isMoto ? 'Morral ($ 0)' : 'Mano ($ 0)'}
                </button>
                <button
                  type="button"
                  onClick={() => setBaggageOption('extra')}
                  className={`py-2 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    baggageOption === 'extra'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isMoto
                    ? 'Alforja (+$8k)'
                    : `Baúl (+$${15 * effectivePassengers}k)`}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={availableSeats <= 0}
              className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                availableSeats > 0
                  ? 'text-white bg-blue-700 hover:bg-blue-800 cursor-pointer'
                  : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              Confirmar reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
