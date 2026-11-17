import { useState } from 'react';
import { ArchitectureView } from './components/ArchitectureView';
import { BookingModal } from './components/BookingModal';
import { LiveMapView } from './components/LiveMapView';
import { RouteSearchView } from './components/RouteSearchView';
import { TopBar } from './components/TopBar';
import { TripsView } from './components/TripsView';
import { INITIAL_BOOKINGS, ROUTE_CATALOG } from './data/travelData';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AppSection, RouteOption, TripBooking } from './types/travel';
import {
  getRemainingSeats,
  getRoutesForCorridor,
  matchCorridorIdForRoute,
} from './utils/routeFinder';

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('explorar');
  const [origin, setOrigin] = useState('Cali');
  const [destination, setDestination] = useState('Buga');
  const [travelDate, setTravelDate] = useState('2026-11-21');
  const [passengers, setPassengers] = useState(1);
  const [mapCorridorId, setMapCorridorId] = useState<string | undefined>(undefined);

  const [bookings, setBookings] = useLocalStorage<TripBooking[]>(
    'meridiano_valle_v4',
    INITIAL_BOOKINGS,
  );
  const [routeForModal, setRouteForModal] = useState<RouteOption | null>(null);

  const handleConfirmBooking = (newBooking: TripBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
    setRouteForModal(null);
    setActiveSection('viajes');
  };

  const handleToggleCheckIn = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              checkedIn: !b.checkedIn,
              status: !b.checkedIn ? 'Listo para salir' : 'Confirmado',
            }
          : b,
      ),
    );
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'Cancelado', checkedIn: false }
          : b,
      ),
    );
  };

  const handleDeleteBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const handleQuickReserve = () => {
    let targetOrigin = origin;
    let targetDest = destination;
    if (targetOrigin.toLowerCase() === targetDest.toLowerCase()) {
      targetDest = targetOrigin === 'Buga' ? 'Cali' : 'Buga';
      setDestination(targetDest);
    }

    const corridorRoutes = getRoutesForCorridor(targetOrigin, targetDest);
    const preferred =
      corridorRoutes.find((r) => getRemainingSeats(r, bookings, travelDate) >= passengers) ??
      corridorRoutes.find((r) => getRemainingSeats(r, bookings, travelDate) > 0) ??
      ROUTE_CATALOG.find((r) => getRemainingSeats(r, bookings, travelDate) > 0) ??
      ROUTE_CATALOG[0];
    setRouteForModal(preferred);
  };

  const handleTrackRouteOnMap = (route: RouteOption) => {
    setMapCorridorId(matchCorridorIdForRoute(route));
    setActiveSection('mapa');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onQuickReserve={handleQuickReserve}
      />

      <main className="flex-1">
        {activeSection === 'explorar' && (
          <RouteSearchView
            origin={origin}
            destination={destination}
            travelDate={travelDate}
            passengers={passengers}
            bookings={bookings}
            onOriginChange={setOrigin}
            onDestinationChange={setDestination}
            onDateChange={setTravelDate}
            onPassengersChange={setPassengers}
            onSelectRouteForBooking={setRouteForModal}
            onOpenArchitecture={() => setActiveSection('estructura')}
          />
        )}

        {activeSection === 'viajes' && (
          <TripsView
            bookings={bookings}
            onToggleCheckIn={handleToggleCheckIn}
            onCancelBooking={handleCancelBooking}
            onDeleteBooking={handleDeleteBooking}
            onExploreRoutes={() => setActiveSection('explorar')}
            onTrackOnMap={handleTrackRouteOnMap}
          />
        )}

        {activeSection === 'mapa' && <LiveMapView initialCorridorId={mapCorridorId} />}

        {activeSection === 'estructura' && (
          <ArchitectureView onGoToExplorer={() => setActiveSection('explorar')} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-slate-900">
              Meridiano · Valle del Cauca
            </span>
            <span aria-hidden="true">·</span>
            <span>Viajes en carro y moto · Cali, Buga, Tuluá y municipios vecinos</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveSection('explorar')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Buscar carro o moto
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('viajes')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Pases de abordaje
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('mapa')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Mapa Valle del Cauca
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('estructura')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Estructura del sistema
            </button>
          </div>
        </div>
      </footer>

      {routeForModal && (
        <BookingModal
          route={routeForModal}
          travelDate={travelDate}
          passengersCount={passengers}
          availableSeats={getRemainingSeats(routeForModal, bookings, travelDate)}
          onClose={() => setRouteForModal(null)}
          onConfirm={handleConfirmBooking}
        />
      )}
    </div>
  );
}
