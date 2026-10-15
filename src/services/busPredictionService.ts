import { 
  BusStop, 
  ServiceArrival, 
  BusArrivalInfo, 
  LiveVehicle, 
  BusLoad, 
  BusType, 
  BusOperator, 
  BusRoute,
  BusRouteStop 
} from '../types/bus';
import { SINGAPORE_BUS_STOPS, SINGAPORE_BUS_ROUTES } from '../data/singaporeBusData';

// Helper to extract stop ID from either BusRouteStop or BusStop
function getStopId(stop: BusRouteStop | BusStop): string {
  if ('stopId' in stop) {
    return stop.stopId;
  }
  return stop.id;
}

// Haversine distance in meters
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Format meters to human readable distance (e.g. "120m" or "1.4 km")
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Generate operator based on bus service number (authentic SG assignments)
export function getOperatorForService(serviceNo: string): BusOperator {
  const s = serviceNo.toUpperCase();
  if (['36', '858', '110', '43', '68'].includes(s)) return 'GAS';
  if (['106', '77', '189', '941', '945', '947'].includes(s)) return 'TTS';
  if (['190', '960', '857', '171', '167', '961', '970', '851'].includes(s)) return 'SMRT';
  return 'SBST'; // Default SBS Transit
}

// Deterministic seed helper so each bus service has stable realistic initial timings
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Initialize live vehicles moving on Singapore roads
export function initializeVehicles(): LiveVehicle[] {
  const vehicles: LiveVehicle[] = [];
  const services = ['190', '65', '36', '106', '14', '960', '502', '7', '12', '147'];

  services.forEach((serviceNo, sIdx) => {
    const route = SINGAPORE_BUS_ROUTES.find(r => r.serviceNo === serviceNo);
    const stops = route ? route.stops : SINGAPORE_BUS_STOPS.slice(0, 8);
    const count = 3; // 3 active buses per route

    for (let i = 0; i < count; i++) {
      const stopIdx = (i * 2 + sIdx) % stops.length;
      const nextStopIdx = (stopIdx + 1) % stops.length;
      const currentStop = stops[stopIdx];
      const nextStop = stops[nextStopIdx];

      const progress = (i * 0.33 + (sIdx * 0.1)) % 1;
      const lat = currentStop.lat + (nextStop.lat - currentStop.lat) * progress;
      const lng = currentStop.lng + (nextStop.lng - currentStop.lng) * progress;
      
      const deltaY = nextStop.lat - currentStop.lat;
      const deltaX = (nextStop.lng - currentStop.lng) * Math.cos((currentStop.lat * Math.PI) / 180);
      let heading = (Math.atan2(deltaX, deltaY) * 180) / Math.PI;
      if (heading < 0) heading += 360;

      const loads: BusLoad[] = ['SEA', 'SEA', 'SDA', 'LSD', 'SEA'];
      const types: BusType[] = ['DD', 'SD', 'DD', 'BD'];

      const currentStopId = getStopId(currentStop);
      const nextStopId = getStopId(nextStop);

      vehicles.push({
        id: `SG-${serviceNo}-${1000 + i * 24 + sIdx}`,
        serviceNo,
        operator: getOperatorForService(serviceNo),
        lat,
        lng,
        heading: Math.round(heading),
        speed: Math.round(22 + (sIdx % 4) * 5),
        load: loads[(sIdx + i) % loads.length],
        type: types[(sIdx + i) % types.length],
        currentStopId,
        nextStopId,
        targetStopId: nextStopId,
        progress
      });
    }
  });

  return vehicles;
}

// Advance live vehicles along their path
export function stepVehicles(vehicles: LiveVehicle[]): LiveVehicle[] {
  return vehicles.map(v => {
    const route = SINGAPORE_BUS_ROUTES.find(r => r.serviceNo === v.serviceNo);
    const stops = route ? route.stops : SINGAPORE_BUS_STOPS.slice(0, 8);
    
    // Increment progress
    let newProgress = v.progress + 0.008; // smooth increment
    let currentIdx = stops.findIndex(s => getStopId(s) === v.currentStopId);
    if (currentIdx === -1) currentIdx = 0;
    let nextIdx = (currentIdx + 1) % stops.length;

    if (newProgress >= 1) {
      newProgress = 0;
      currentIdx = nextIdx;
      nextIdx = (nextIdx + 1) % stops.length;
    }

    const currentStop = stops[currentIdx];
    const nextStop = stops[nextIdx];

    const lat = currentStop.lat + (nextStop.lat - currentStop.lat) * newProgress;
    const lng = currentStop.lng + (nextStop.lng - currentStop.lng) * newProgress;

    const deltaY = nextStop.lat - currentStop.lat;
    const deltaX = (nextStop.lng - currentStop.lng) * Math.cos((currentStop.lat * Math.PI) / 180);
    let heading = (Math.atan2(deltaX, deltaY) * 180) / Math.PI;
    if (heading < 0) heading += 360;

    return {
      ...v,
      lat,
      lng,
      heading: Math.round(heading),
      currentStopId: getStopId(currentStop),
      nextStopId: getStopId(nextStop),
      progress: newProgress
    };
  });
}

// Generate realistic live arrival data for a stop
export function getArrivalsForStop(
  stop: BusStop, 
  pinnedServices: string[] = []
): ServiceArrival[] {
  const now = Date.now();
  const stopSeed = parseInt(stop.id, 10) || 1000;

  return stop.services.map((serviceNo, idx) => {
    const operator = getOperatorForService(serviceNo);
    const sSeed = stopSeed + (idx + 1) * 37 + (serviceNo.charCodeAt(0) || 50);

    // Headway in seconds
    const firstBusSecs = Math.max(15, Math.floor((pseudoRandom(sSeed + 1) * 600) + 20));
    const secondBusSecs = firstBusSecs + Math.floor((pseudoRandom(sSeed + 2) * 500) + 360);
    const thirdBusSecs = secondBusSecs + Math.floor((pseudoRandom(sSeed + 3) * 600) + 480);

    const loads: BusLoad[] = ['SEA', 'SEA', 'SDA', 'LSD', 'SEA', 'SDA'];
    const types: BusType[] = ['DD', 'SD', 'DD', 'BD', 'DD'];

    const load1 = loads[Math.floor(pseudoRandom(sSeed + 4) * loads.length)];
    const load2 = loads[Math.floor(pseudoRandom(sSeed + 5) * loads.length)];
    const load3 = loads[Math.floor(pseudoRandom(sSeed + 6) * loads.length)];

    const type1 = types[Math.floor(pseudoRandom(sSeed + 7) * types.length)];
    const type2 = types[Math.floor(pseudoRandom(sSeed + 8) * types.length)];
    const type3 = types[Math.floor(pseudoRandom(sSeed + 9) * types.length)];

    const firstArrivalDate = new Date(now + firstBusSecs * 1000);
    const secondArrivalDate = new Date(now + secondBusSecs * 1000);
    const thirdArrivalDate = new Date(now + thirdBusSecs * 1000);

    const stopsAway1 = Math.max(0, Math.floor(firstBusSecs / 120));
    const stopsAway2 = Math.max(1, Math.floor(secondBusSecs / 120));
    const stopsAway3 = Math.max(2, Math.floor(thirdBusSecs / 120));

    const nextBus: BusArrivalInfo = {
      estimatedArrival: firstArrivalDate.toISOString(),
      secondsRemaining: firstBusSecs,
      minutes: Math.floor(firstBusSecs / 60),
      load: load1,
      type: type1,
      feature: pseudoRandom(sSeed + 10) > 0.15 ? 'WAB' : 'NORM',
      latitude: stop.lat + (pseudoRandom(sSeed + 11) - 0.5) * 0.008,
      longitude: stop.lng + (pseudoRandom(sSeed + 12) - 0.5) * 0.008,
      speedKmH: Math.round(18 + pseudoRandom(sSeed + 13) * 22),
      occupancyPercent: load1 === 'SEA' ? 38 : load1 === 'SDA' ? 72 : 92,
      stopsAway: stopsAway1,
      busPlate: `SBS ${1000 + (sSeed % 8999)} ${String.fromCharCode(65 + (sSeed % 26))}`
    };

    const nextBus2: BusArrivalInfo = {
      estimatedArrival: secondArrivalDate.toISOString(),
      secondsRemaining: secondBusSecs,
      minutes: Math.floor(secondBusSecs / 60),
      load: load2,
      type: type2,
      feature: 'WAB',
      latitude: stop.lat + (pseudoRandom(sSeed + 14) - 0.5) * 0.015,
      longitude: stop.lng + (pseudoRandom(sSeed + 15) - 0.5) * 0.015,
      speedKmH: Math.round(24 + pseudoRandom(sSeed + 16) * 15),
      occupancyPercent: load2 === 'SEA' ? 32 : load2 === 'SDA' ? 68 : 88,
      stopsAway: stopsAway2,
      busPlate: `SG ${2000 + ((sSeed * 2) % 7999)} ${String.fromCharCode(65 + ((sSeed + 2) % 26))}`
    };

    const nextBus3: BusArrivalInfo = {
      estimatedArrival: thirdArrivalDate.toISOString(),
      secondsRemaining: thirdBusSecs,
      minutes: Math.floor(thirdBusSecs / 60),
      load: load3,
      type: type3,
      feature: 'WAB',
      latitude: stop.lat + (pseudoRandom(sSeed + 17) - 0.5) * 0.025,
      longitude: stop.lng + (pseudoRandom(sSeed + 18) - 0.5) * 0.025,
      speedKmH: Math.round(20 + pseudoRandom(sSeed + 19) * 20),
      occupancyPercent: load3 === 'SEA' ? 25 : load3 === 'SDA' ? 64 : 85,
      stopsAway: stopsAway3
    };

    const route = SINGAPORE_BUS_ROUTES.find(r => r.serviceNo === serviceNo);
    const destinationName = route ? route.destinationName : 'Loop / Terminal';
    const destinationCode = route ? route.destinationCode : '00000';

    return {
      serviceNo,
      operator,
      destinationCode,
      destinationName,
      frequencyRange: `${Math.round(6 + (idx % 4) * 2)} - ${Math.round(10 + (idx % 5) * 2)} mins`,
      isFavorite: pinnedServices.includes(`${stop.id}-${serviceNo}`),
      nextBus,
      nextBus2,
      nextBus3
    };
  }).sort((a, b) => {
    // Pinned first, then sorted by service number
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.serviceNo.localeCompare(b.serviceNo, undefined, { numeric: true });
  });
}

// Decrement seconds in active arrivals state
export function tickArrivals(arrivals: ServiceArrival[]): ServiceArrival[] {
  return arrivals.map(svc => {
    if (!svc.nextBus) return svc;

    let updatedNext = { ...svc.nextBus };
    let updatedNext2 = svc.nextBus2 ? { ...svc.nextBus2 } : null;
    let updatedNext3 = svc.nextBus3 ? { ...svc.nextBus3 } : null;

    if (updatedNext.secondsRemaining > 0) {
      updatedNext.secondsRemaining -= 1;
      updatedNext.minutes = Math.floor(updatedNext.secondsRemaining / 60);
    } else {
      // Reached 0 (Arr) - After 15s, cycle next bus
      if (updatedNext2) {
        updatedNext = { ...updatedNext2, stopsAway: 0 };
        updatedNext2 = updatedNext3 ? { ...updatedNext3, stopsAway: 1 } : null;
        if (updatedNext3) {
          const extraSecs = updatedNext3.secondsRemaining + 600;
          updatedNext3 = {
            ...updatedNext3,
            secondsRemaining: extraSecs,
            minutes: Math.floor(extraSecs / 60),
            stopsAway: 3
          };
        }
      } else {
        updatedNext.secondsRemaining = 420;
        updatedNext.minutes = 7;
      }
    }

    if (updatedNext2 && updatedNext2.secondsRemaining > 0) {
      updatedNext2.secondsRemaining -= 1;
      updatedNext2.minutes = Math.floor(updatedNext2.secondsRemaining / 60);
    }

    if (updatedNext3 && updatedNext3.secondsRemaining > 0) {
      updatedNext3.secondsRemaining -= 1;
      updatedNext3.minutes = Math.floor(updatedNext3.secondsRemaining / 60);
    }

    return {
      ...svc,
      nextBus: updatedNext,
      nextBus2: updatedNext2,
      nextBus3: updatedNext3
    };
  });
}

// Audio chime using Web Audio API for arrival alerts
export function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.24); // D6

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio context may require user interaction
  }
}
