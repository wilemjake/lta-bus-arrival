import React, { useState } from 'react';
import { BusStop, ServiceArrival, BusAlarm } from '../types/bus';
import { BusArrivalItem } from './BusArrivalItem';
import { MapPin, Navigation, Train, Search } from 'lucide-react';
import { formatDistance } from '../services/busPredictionService';

interface BusStopCardProps {
  stop: BusStop;
  arrivals: ServiceArrival[];
  distanceMeters?: number;
  onToggleFavorite: (serviceKey: string) => void;
  onOpenAlarm: (serviceNo: string, stopId: string, stopName: string) => void;
  onSelectOnMap: (stopId: string, serviceNo: string) => void;
  onViewRoute: (serviceNo: string) => void;
  activeAlarms: BusAlarm[];
}

export const BusStopCard: React.FC<BusStopCardProps> = ({
  stop,
  arrivals,
  distanceMeters,
  onToggleFavorite,
  onOpenAlarm,
  onSelectOnMap,
  onViewRoute,
  activeAlarms
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredArrivals = arrivals.filter(svc => 
    svc.serviceNo.toLowerCase().includes(filterQuery.toLowerCase()) ||
    svc.destinationName.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-slate-700/80 transition-colors">
      
      {/* Bus Stop Header Strip */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-start gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono-tabular px-2.5 py-1 rounded-lg text-sm font-bold tracking-wider shrink-0 mt-0.5">
              {stop.id}
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {stop.name}
              </h3>
              
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                <span className="text-slate-300 font-medium">{stop.road}</span>
                <span aria-hidden="true">·</span>
                <span>{stop.town}</span>
                
                {distanceMeters !== undefined && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-mono-tabular">
                      <Navigation className="w-3 h-3" />
                      {formatDistance(distanceMeters)} away
                    </span>
                  </>
                )}
              </div>

              {stop.mrtNearby && stop.mrtNearby.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <Train className="w-3.5 h-3.5 text-slate-500" />
                  {stop.mrtNearby.map((mrt, idx) => (
                    <span 
                      key={idx}
                      className="text-[11px] font-mono-tabular text-slate-400 bg-slate-800/70 border border-slate-700/60 px-2 py-0.5 rounded-md"
                    >
                      {mrt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick search filter within this stop */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[130px] sm:min-w-[170px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter service..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>

            <button
              onClick={() => onSelectOnMap(stop.id, '')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              title="Pin this bus stop on map"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>

        </div>
      </div>

      {/* Services Arrival List */}
      <div className="p-2 sm:p-4 divide-y divide-slate-800/50">
        {filteredArrivals.length > 0 ? (
          filteredArrivals.map(svc => {
            const hasAlarm = activeAlarms.some(a => a.active && a.stopId === stop.id && a.serviceNo === svc.serviceNo);
            return (
              <BusArrivalItem
                key={`${stop.id}-${svc.serviceNo}`}
                service={svc}
                stop={stop}
                onToggleFavorite={onToggleFavorite}
                onOpenAlarm={onOpenAlarm}
                onSelectOnMap={onSelectOnMap}
                onViewRoute={onViewRoute}
                isAlarmSet={hasAlarm}
              />
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No bus services found matching &ldquo;{filterQuery}&rdquo; at this stop.
          </div>
        )}
      </div>

    </div>
  );
};
