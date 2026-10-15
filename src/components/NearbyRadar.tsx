import React from 'react';
import { BusStop, UserLocation } from '../types/bus';
import { SINGAPORE_LOCATIONS } from '../data/singaporeBusData';
import { getDistanceMeters, formatDistance } from '../services/busPredictionService';
import { Navigation, MapPin, Compass, LocateFixed, ArrowRight } from 'lucide-react';

interface NearbyRadarProps {
  stops: BusStop[];
  userLocation: UserLocation;
  onChangeLocation: (location: UserLocation) => void;
  onDetectGPS: () => void;
  onSelectStop: (stopId: string) => void;
  isDetectingGPS: boolean;
}

export const NearbyRadar: React.FC<NearbyRadarProps> = ({
  stops,
  userLocation,
  onChangeLocation,
  onDetectGPS,
  onSelectStop,
  isDetectingGPS
}) => {
  // Sort stops by distance to userLocation
  const sortedStops = [...stops].map(stop => {
    const dist = getDistanceMeters(userLocation.lat, userLocation.lng, stop.lat, stop.lng);
    const walkMinutes = Math.max(1, Math.round(dist / 80)); // ~80m per minute walking
    return { ...stop, distanceMeters: dist, walkMinutes };
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);

  return (
    <div className="space-y-6">
      
      {/* Current Location & Preset Hub Switcher */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Current Reference Origin</span>
                {userLocation.isSimulated && (
                  <span className="text-[10px] font-mono-tabular bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                    Simulated Hub
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {userLocation.name}
              </h3>
              <p className="text-xs font-mono-tabular text-slate-500 mt-0.5">
                Lat {userLocation.lat.toFixed(4)}° N, Lng {userLocation.lng.toFixed(4)}° E
              </p>
            </div>
          </div>

          <button
            onClick={onDetectGPS}
            disabled={isDetectingGPS}
            className="px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <LocateFixed className={`w-4 h-4 ${isDetectingGPS ? 'animate-spin' : ''}`} />
            <span>{isDetectingGPS ? 'Detecting GPS...' : 'Use My Real Location'}</span>
          </button>

        </div>

        {/* Quick Hub Teleport Chips */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 block mb-2 font-medium">
            Teleport reference location across Singapore:
          </span>
          <div className="flex flex-wrap gap-2">
            {SINGAPORE_LOCATIONS.map(loc => (
              <button
                key={loc.name}
                onClick={() => onChangeLocation(loc)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors border ${
                  userLocation.name === loc.name
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-semibold'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Sorted Bus Stops List */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">
              Nearby LTA Bus Stops ({sortedStops.length})
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Sorted by proximity
          </span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {sortedStops.map((stop, idx) => (
            <div
              key={stop.id}
              onClick={() => onSelectStop(stop.id)}
              className="p-4 hover:bg-slate-800/40 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono-tabular font-bold text-slate-500 w-5 pt-1">
                  #{idx + 1}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono-tabular font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {stop.id}
                    </span>
                    <h5 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {stop.name}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>{stop.road}</span>
                    <span aria-hidden="true">·</span>
                    <span>{stop.town}</span>
                  </div>

                  {/* Services chip strip */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-slate-500">Services:</span>
                    {stop.services.slice(0, 8).map(svc => (
                      <span
                        key={svc}
                        className="text-[11px] font-mono-tabular text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded"
                      >
                        {svc}
                      </span>
                    ))}
                    {stop.services.length > 8 && (
                      <span className="text-[11px] text-slate-500">
                        +{stop.services.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Distance & Walking ETA */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 pl-8 sm:pl-0">
                <span className="text-sm font-bold font-mono-tabular text-emerald-400">
                  {formatDistance(stop.distanceMeters)}
                </span>
                <span className="text-xs text-slate-400">
                  ~{stop.walkMinutes} min walk
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStop(stop.id);
                  }}
                  className="mt-2 hidden sm:flex items-center gap-1 text-xs text-slate-300 group-hover:text-emerald-400 transition-colors"
                >
                  <span>View live arrivals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
