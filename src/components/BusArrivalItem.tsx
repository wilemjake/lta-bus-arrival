import React from 'react';
import { ServiceArrival, BusStop } from '../types/bus';
import { LoadIndicator, DeckBadge, AccessibilityBadge } from './BusLoadBadge';
import { OPERATOR_CONFIG } from '../data/singaporeBusData';
import { Star, Bell, MapPin, GitCommit } from 'lucide-react';

interface BusArrivalItemProps {
  service: ServiceArrival;
  stop: BusStop;
  onToggleFavorite: (serviceKey: string) => void;
  onOpenAlarm: (serviceNo: string, stopId: string, stopName: string) => void;
  onSelectOnMap: (stopId: string, serviceNo: string) => void;
  onViewRoute: (serviceNo: string) => void;
  isAlarmSet?: boolean;
}

export const BusArrivalItem: React.FC<BusArrivalItemProps> = ({
  service,
  stop,
  onToggleFavorite,
  onOpenAlarm,
  onSelectOnMap,
  onViewRoute,
  isAlarmSet = false
}) => {
  const serviceKey = `${stop.id}-${service.serviceNo}`;
  const opInfo = OPERATOR_CONFIG[service.operator] || OPERATOR_CONFIG.SBST;

  const next1 = service.nextBus;
  const next2 = service.nextBus2;
  const next3 = service.nextBus3;

  // Format arrival display string
  const formatTimeDisplay = (minutes: number, seconds: number) => {
    if (seconds <= 30) return { primary: 'Arr', isArriving: true };
    if (minutes === 0) return { primary: '< 1 min', isArriving: true };
    return { primary: `${minutes} min`, isArriving: false };
  };

  const next1Display = next1 ? formatTimeDisplay(next1.minutes, next1.secondsRemaining) : null;
  const next2Display = next2 ? formatTimeDisplay(next2.minutes, next2.secondsRemaining) : null;
  const next3Display = next3 ? formatTimeDisplay(next3.minutes, next3.secondsRemaining) : null;

  // Format local clock time (e.g. "11:42 PM")
  const formatClockTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="py-4 border-b border-slate-800/80 hover:bg-slate-900/40 transition-colors px-3 sm:px-4 rounded-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Service Number, Operator, Destination */}
        <div className="flex items-start gap-3 min-w-[200px]">
          <div className="relative shrink-0">
            <button
              onClick={() => onViewRoute(service.serviceNo)}
              className="w-14 h-12 bg-slate-900 border border-slate-700/80 rounded-xl flex flex-col items-center justify-center hover:border-emerald-500/60 transition-colors shadow-sm group"
              title="Click to view full route progression"
            >
              <span className="text-xl font-bold font-mono-tabular tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                {service.serviceNo}
              </span>
              <span className={`text-[10px] font-semibold tracking-wider uppercase ${opInfo.text}`}>
                {opInfo.short}
              </span>
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 truncate">
                To <span className="text-slate-200 font-medium">{service.destinationName}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
              <span className="font-mono-tabular">Freq: {service.frequencyRange}</span>
              <span aria-hidden="true">·</span>
              <button 
                onClick={() => onViewRoute(service.serviceNo)}
                className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <GitCommit className="w-3 h-3" />
                <span>View Route</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center / Right: 3-Tier LTA Bus Arrivals */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 flex-1 max-w-xl">
          
          {/* 1st Next Bus */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-1">
              <span>Next Bus</span>
              {next1 && <AccessibilityBadge feature={next1.feature} />}
            </div>

            {next1 && next1Display ? (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-lg font-bold font-mono-tabular ${
                    next1Display.isArriving ? 'text-emerald-400 animate-pulse' : 'text-white'
                  }`}>
                    {next1Display.primary}
                  </span>
                  <span className="text-[10px] font-mono-tabular text-slate-500">
                    {formatClockTime(next1.estimatedArrival)}
                  </span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  <LoadIndicator load={next1.load} showLabel={false} />
                  <DeckBadge type={next1.type} />
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500 py-2">No Est.</span>
            )}
          </div>

          {/* 2nd Bus */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-1">
              <span>2nd Bus</span>
              {next2 && <AccessibilityBadge feature={next2.feature} />}
            </div>

            {next2 && next2Display ? (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-semibold font-mono-tabular text-slate-200">
                    {next2Display.primary}
                  </span>
                  <span className="text-[10px] font-mono-tabular text-slate-500">
                    {formatClockTime(next2.estimatedArrival)}
                  </span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  <LoadIndicator load={next2.load} showLabel={false} />
                  <DeckBadge type={next2.type} />
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500 py-2">--</span>
            )}
          </div>

          {/* 3rd Bus */}
          <div className="bg-slate-900/30 border border-slate-800/40 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-1">
              <span>3rd Bus</span>
              {next3 && <AccessibilityBadge feature={next3.feature} />}
            </div>

            {next3 && next3Display ? (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-medium font-mono-tabular text-slate-400">
                    {next3Display.primary}
                  </span>
                  <span className="text-[10px] font-mono-tabular text-slate-500">
                    {formatClockTime(next3.estimatedArrival)}
                  </span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  <LoadIndicator load={next3.load} showLabel={false} />
                  <DeckBadge type={next3.type} />
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500 py-2">--</span>
            )}
          </div>

        </div>

        {/* Far Right: Interactive Actions */}
        <div className="flex items-center lg:flex-col justify-end gap-1.5 shrink-0 pt-2 lg:pt-0">
          <button
            onClick={() => onToggleFavorite(serviceKey)}
            className={`p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors ${
              service.isFavorite ? 'text-amber-400 bg-amber-950/30' : ''
            }`}
            title={service.isFavorite ? 'Remove bookmark' : 'Bookmark this bus service at this stop'}
          >
            <Star className={`w-4 h-4 ${service.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => onOpenAlarm(service.serviceNo, stop.id, stop.name)}
            className={`p-2 rounded-lg transition-colors ${
              isAlarmSet 
                ? 'text-amber-300 bg-amber-950/40 border border-amber-600/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Set arrival alarm notification"
          >
            <Bell className={`w-4 h-4 ${isAlarmSet ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => onSelectOnMap(stop.id, service.serviceNo)}
            className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
            title="Track live bus positions on Map"
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
