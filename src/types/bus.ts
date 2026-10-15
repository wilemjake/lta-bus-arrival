export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available (Green), Standing Available (Amber), Limited Standing (Red)
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

export interface BusArrivalInfo {
  estimatedArrival: string; // ISO string timestamp
  secondsRemaining: number;
  minutes: number;
  load: BusLoad;
  type: BusType;
  feature: 'WAB' | 'NORM';
  latitude: number;
  longitude: number;
  speedKmH: number;
  occupancyPercent: number; // 0 - 100
  stopsAway: number;
  busPlate?: string;
}

export interface ServiceArrival {
  serviceNo: string;
  operator: BusOperator;
  destinationCode: string;
  destinationName: string;
  frequencyRange: string;
  isFavorite?: boolean;
  nextBus: BusArrivalInfo | null;
  nextBus2: BusArrivalInfo | null;
  nextBus3: BusArrivalInfo | null;
}

export interface BusStop {
  id: string; // 5-digit code e.g. "01012"
  name: string;
  road: string;
  lat: number;
  lng: number;
  mrtNearby?: string[];
  town: string;
  services: string[];
}

export interface LiveVehicle {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  lat: number;
  lng: number;
  heading: number; // 0 - 360 degrees
  speed: number; // km/h
  load: BusLoad;
  type: BusType;
  currentStopId: string;
  nextStopId: string;
  targetStopId: string;
  progress: number; // 0 to 1 between stops
}

export interface BusRouteStop {
  stopId: string;
  stopName: string;
  road: string;
  sequence: number;
  distanceKm: number;
  lat: number;
  lng: number;
}

export interface BusRoute {
  serviceNo: string;
  operator: BusOperator;
  direction: 1 | 2;
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  stops: BusRouteStop[];
}

export interface UserLocation {
  lat: number;
  lng: number;
  name: string;
  isSimulated: boolean;
}

export interface BusAlarm {
  serviceNo: string;
  stopId: string;
  stopName: string;
  targetMinutes: number;
  active: boolean;
  createdTime: number;
}
