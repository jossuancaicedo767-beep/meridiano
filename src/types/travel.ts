export type AppSection = 'explorar' | 'viajes' | 'mapa' | 'estructura';

export type TransportMode = 'todos' | 'carro' | 'moto';

export type LegMode = Exclude<TransportMode, 'todos'>;

export interface RouteSegment {
  id: string;
  mode: LegMode;
  operator: string;
  vehicleModel: string;
  plateNumber: string;
  serviceCode: string;
  originCity: string;
  originCode: string;
  originTerminal: string;
  destinationCity: string;
  destinationCode: string;
  destinationTerminal: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  distanceKm: number;
  amenities: string[];
}

export interface RouteOption {
  id: string;
  origin: string;
  destination: string;
  primaryMode: LegMode;
  departureTime: string;
  arrivalTime: string;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  transfers: number;
  tollsIncluded: boolean;
  priceCop: number;
  co2Kg: number;
  seatsAvailable: number;
  punctualityRate: number;
  segments: RouteSegment[];
}

export type BookingStatus = 'Confirmado' | 'Listo para salir' | 'En ruta' | 'Cancelado';

export interface TripBooking {
  id: string;
  locator: string;
  passengerName: string;
  passengersCount: number;
  travelDate: string;
  status: BookingStatus;
  seatAssignment: string;
  baggage: string;
  totalPaidCop: number;
  route: RouteOption;
  checkedIn: boolean;
  createdAt: string;
}

export interface DestinationSpot {
  id: string;
  city: string;
  department: string;
  corridorOrigin: string;
  headline: string;
  description: string;
  startingPriceCop: number;
  fastestDuration: string;
  recommendedMode: string;
  imageUrl: string;
  imageAlt: string;
}

export interface NetworkStation {
  id: string;
  code: string;
  name: string;
  city: string;
  x: number;
  y: number;
  type: 'hub' | 'service_area' | 'meeting_point';
  activeLines: string[];
  platformNote: string;
}

export interface LiveCorridor {
  id: string;
  title: string;
  highway: string;
  serviceCode: string;
  operator: string;
  vehicleModel: string;
  mode: LegMode;
  stationIds: string[];
  totalMinutes: number;
  distanceKm: number;
  nextStop: string;
  weatherNote: string;
  speedKmh: number;
}

export interface ArchitectureLayer {
  id: string;
  number: string;
  title: string;
  summary: string;
  folderTree: string;
  responsibilities: string[];
  entities: {
    name: string;
    fields: string[];
  }[];
  integrations: string[];
}
