import React, { useState } from 'react';
import { SINGAPORE_BUS_ROUTES, OPERATOR_CONFIG } from '../data/singaporeBusData';
import { LiveVehicle } from '../types/bus';
import { GitCommit, ArrowRight, Bus, MapPin, Navigation } from 'lucide-react';
import { LoadIndicator, DeckBadge } from './BusLoadBadge';

interface RouteExplorerProps {
  initialServiceNo?: string;
  onSelectStop: (stopId: string) => void;
  vehicles: LiveVehicle[];
}

export const RouteExplorer: React.FC<RouteExplorerProps> = ({
  initialServiceNo = '190',
  onSelectStop,
  vehicles
}) => {
  const [selectedService, setSelectedService] = useState<string>(initialServiceNo || '190');

  const currentRoute = SINGAPORE_BUS_ROUTES.find(r => r.serviceNo === selectedService) || SINGAPORE_BUS_ROUTES[0];
  const opInfo = OPERATOR_CONFIG[currentRoute.operator] || OPERATOR_CONFIG.SBST;

  // Active buses on this route
  const activeBusesOnRoute = vehicles.filter(v => v.serviceNo === currentRoute.serviceNo);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      
      {/* Route Selector Header */}
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs text-slate-400">
              <span>Bus Route Progression</span>
              <span aria-hidden="true">·</span>
              <span className={opInfo.text}>{opInfo.name}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono-tabular text-white tracking-tight">
                Bus {currentRoute.serviceNo}
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-300">
                <span className="font-medium">{currentRoute.originName}</span>
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium text-emerald-400">{currentRoute.destinationName}</span>
              </div>
            </div>
          </div>

          {/* Service Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {SINGAPORE_BUS_ROUTES.map(r => (
              <button
                key={r.serviceNo}
                onClick={() => setSelectedService(r.serviceNo)}
                className={`px-3 py-1.5 text-xs font-mono-tabular font-bold rounded-lg transition-colors whitespace-nowrap ${
                  selectedService === r.serviceNo
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {r.serviceNo}
              </button>
            ))}
          </div>

        </div>

        {/* Active Bus telemetry ticker on this route */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Bus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200">{activeBusesOnRoute.length} Buses</span>
            <span>active in transit</span>
          </div>
          <span aria-hidden="true">·</span>
          <span>{currentRoute.stops.length} Featured Interchange & Trunk Stops</span>
        </div>
      </div>

      {/* Sequential Stop List progression */}
      <div className="p-4 sm:p-6">
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          
          {currentRoute.stops.map((stop, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === currentRoute.stops.length - 1;
            
            // Check if any active bus is currently approaching this stop
            const busApproaching = activeBusesOnRoute.find(v => v.nextStopId === stop.stopId);

            return (
              <div key={stop.stopId} className="relative group">
                
                {/* Node circle on the vertical route line */}
                <div className={`absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  busApproaching
                    ? 'bg-emerald-500 border-white shadow-lg shadow-emerald-500/30 scale-110'
                    : isFirst || isLast
                    ? 'bg-slate-900 border-emerald-400'
                    : 'bg-slate-950 border-slate-700 group-hover:border-slate-500'
                }`}>
                  {busApproaching ? (
                    <Bus className="w-3 h-3 text-slate-950" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  )}
                </div>

                {/* Stop Card */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 sm:p-4 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono-tabular font-bold text-slate-500 w-6 pt-0.5">
                      #{stop.sequence}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {stop.stopName}
                        </span>
                        <span className="text-xs font-mono-tabular text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {stop.stopId}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{stop.road}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{stop.distanceKm.toFixed(1)} km from origin</span>
                      </div>
                    </div>
                  </div>

                  {/* Active bus approaching alert pill if at this stop */}
                  <div className="flex items-center gap-3">
                    {busApproaching && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-xs text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold">Bus Approaching</span>
                        <DeckBadge type={busApproaching.type} />
                        <LoadIndicator load={busApproaching.load} showLabel={false} />
                      </div>
                    )}

                    <button
                      onClick={() => onSelectStop(stop.stopId)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View Stop</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
};
