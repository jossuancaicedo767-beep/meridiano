import { ROUTE_CATALOG } from '../data/travelData';
import { RouteOption, TripBooking } from '../types/travel';

interface CityMeta {
  code: string;
  terminal: string;
  kmFromCali: number; // Eje aproximado sur-norte o oeste para estimar distancia real
  isWestCoast?: boolean;
  isMountainEast?: boolean;
}

const CITY_META: Record<string, CityMeta> = {
  Jamundí: {
    code: 'JAM-PAR',
    terminal: 'Parque Principal de Jamundí',
    kmFromCali: -22,
  },
  Cali: {
    code: 'CLO-SAM',
    terminal: 'Sameco / Chipichape Norte',
    kmFromCali: 0,
  },
  Palmira: {
    code: 'PAL-LLN',
    terminal: 'Llanogrande Plaza · Palmira',
    kmFromCali: 27,
  },
  Buga: {
    code: 'BUG-BAS',
    terminal: 'Basílica / Parque Cabal · Buga',
    kmFromCali: 72,
  },
  Tuluá: {
    code: 'TUL-HER',
    terminal: 'C.C. Herradura / Parque Boyacá',
    kmFromCali: 102,
  },
  Zarzal: {
    code: 'ZAR-CTR',
    terminal: 'Parque Santander · Zarzal',
    kmFromCali: 142,
  },
  Sevilla: {
    code: 'SEV-CON',
    terminal: 'Plaza de la Concordia · Sevilla',
    kmFromCali: 158,
    isMountainEast: true,
  },
  Cartago: {
    code: 'CTG-BOL',
    terminal: 'Parque de Bolívar · Cartago',
    kmFromCali: 188,
  },
  Buenaventura: {
    code: 'BUN-MAL',
    terminal: 'Malecón Bahía de la Cruz',
    kmFromCali: 120,
    isWestCoast: true,
  },
};

function estimateRoadDistanceKm(origin: string, destination: string): number {
  const a = CITY_META[origin];
  const b = CITY_META[destination];
  if (!a || !b) return 80;

  // Si uno es Buenaventura (costa oeste), el acceso principal pasa por Cali/Loboguerrero o Buga/Media Canoa
  if (a.isWestCoast || b.isWestCoast) {
    const other = a.isWestCoast ? b : a;
    if (other.kmFromCali <= 27) return 120 + Math.abs(other.kmFromCali);
    return Math.round(115 + Math.abs(other.kmFromCali - 72) * 0.95);
  }

  // Sevilla se conecta con la troncal del Valle en La Uribe (km 122) + 34 km de ascenso
  if (a.isMountainEast || b.isMountainEast) {
    const other = a.isMountainEast ? b : a;
    return Math.max(34, Math.abs(other.kmFromCali - 122) + 34);
  }

  return Math.max(20, Math.abs(b.kmFromCali - a.kmFromCali));
}

function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutesToAdd;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function getRoutesForCorridor(
  origin: string,
  destination: string,
): RouteOption[] {
  if (!origin || !destination || origin.toLowerCase() === destination.toLowerCase()) {
    return [];
  }

  const direct = ROUTE_CATALOG.filter(
    (r) =>
      r.origin.toLowerCase() === origin.toLowerCase() &&
      r.destination.toLowerCase() === destination.toLowerCase(),
  );

  if (direct.length >= 2) {
    return direct;
  }

  const origMeta = CITY_META[origin];
  const destMeta = CITY_META[destination];
  if (!origMeta || !destMeta) return direct;

  const distKm = estimateRoadDistanceKm(origin, destination);
  const isMountain =
    origMeta.isWestCoast ||
    destMeta.isWestCoast ||
    origMeta.isMountainEast ||
    destMeta.isMountainEast;

  const carDuration = Math.max(28, Math.round((distKm / (isMountain ? 52 : 66)) * 60));
  const motoDuration = Math.max(24, Math.round((distKm / (isMountain ? 56 : 74)) * 60));

  const carPrice = Math.max(10000, Math.round((7500 + distKm * 210) / 1000) * 1000);
  const motoPrice = Math.max(8000, Math.round((6000 + distKm * 170) / 1000) * 1000);

  const syntheticRoutes: RouteOption[] = [];
  const hasCar = direct.some((r) => r.primaryMode === 'carro');
  const hasMoto = direct.some((r) => r.primaryMode === 'moto');

  if (!hasCar) {
    const dep = '07:30';
    syntheticRoutes.push({
      id: `rt-dyn-${origMeta.code}-${destMeta.code}-car`,
      origin,
      destination,
      primaryMode: 'carro',
      departureTime: dep,
      arrivalTime: addMinutesToTime(dep, carDuration),
      totalDurationMinutes: carDuration,
      totalDistanceKm: distKm,
      transfers: 0,
      tollsIncluded: distKm >= 30,
      priceCop: carPrice,
      co2Kg: Number((distKm * 0.04).toFixed(1)),
      seatsAvailable: 3,
      punctualityRate: 96,
      segments: [
        {
          id: `seg-dyn-car-${origMeta.code}-${destMeta.code}`,
          mode: 'carro',
          operator: 'Carlos Alberto Vélez · Carro compartido',
          vehicleModel: 'Mazda CX-30 / Sedán',
          plateNumber: 'VCU 518',
          serviceCode: `CAR-${destMeta.code.slice(0, 3)}`,
          originCity: origin,
          originCode: origMeta.code,
          originTerminal: origMeta.terminal,
          destinationCity: destination,
          destinationCode: destMeta.code,
          destinationTerminal: destMeta.terminal,
          departureTime: dep,
          arrivalTime: addMinutesToTime(dep, carDuration),
          durationMinutes: carDuration,
          distanceKm: distKm,
          amenities: [
            distKm >= 30 ? 'Peajes regionales incluidos' : 'Trayecto directo',
            'Aire acondicionado',
            'Espacio en baúl',
          ],
        },
      ],
    });
  }

  if (!hasMoto) {
    const dep = '08:15';
    syntheticRoutes.push({
      id: `rt-dyn-${origMeta.code}-${destMeta.code}-moto`,
      origin,
      destination,
      primaryMode: 'moto',
      departureTime: dep,
      arrivalTime: addMinutesToTime(dep, motoDuration),
      totalDurationMinutes: motoDuration,
      totalDistanceKm: distKm,
      transfers: 0,
      tollsIncluded: distKm >= 30,
      priceCop: motoPrice,
      co2Kg: Number((distKm * 0.02).toFixed(1)),
      seatsAvailable: 1,
      punctualityRate: 98,
      segments: [
        {
          id: `seg-dyn-moto-${origMeta.code}-${destMeta.code}`,
          mode: 'moto',
          operator: 'Diana Marcela Ortiz · Moto Valle',
          vehicleModel: 'Yamaha Tracer / V-Strom 650',
          plateNumber: 'VLM 42G',
          serviceCode: `MOTO-${destMeta.code.slice(0, 3)}`,
          originCity: origin,
          originCode: origMeta.code,
          originTerminal: origMeta.terminal,
          destinationCity: destination,
          destinationCode: destMeta.code,
          destinationTerminal: destMeta.terminal,
          departureTime: dep,
          arrivalTime: addMinutesToTime(dep, motoDuration),
          durationMinutes: motoDuration,
          distanceKm: distKm,
          amenities: ['Casco certificado ECE', 'Guantes e impermeable', 'Mochila hasta 15L'],
        },
      ],
    });
  }

  return [...direct, ...syntheticRoutes];
}

export function getRemainingSeats(
  route: RouteOption,
  bookings: TripBooking[],
  travelDate: string,
): number {
  const bookedSeats = bookings
    .filter(
      (b) =>
        b.status !== 'Cancelado' &&
        b.route.id === route.id &&
        b.travelDate === travelDate,
    )
    .reduce((sum, b) => sum + b.passengersCount, 0);
  return Math.max(0, route.seatsAvailable - bookedSeats);
}

export function matchCorridorIdForRoute(route: RouteOption): string {
  const cities = new Set([
    route.origin.toLowerCase(),
    route.destination.toLowerCase(),
  ]);
  if (cities.has('buenaventura')) return 'corridor-clo-bun-car';
  if (cities.has('sevilla')) return 'corridor-tul-sev-moto';
  if (cities.has('cartago') || cities.has('zarzal')) return 'corridor-clo-zar-ctg-moto';
  return 'corridor-clo-bug-tul';
}
