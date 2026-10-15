import React, { useState, useMemo } from 'react';
import { BusStop, LiveVehicle, UserLocation } from '../types/bus';
import { SINGAPORE_BUS_ROUTES, OPERATOR_CONFIG } from '../data/singaporeBusData';
import { LoadIndicator } from './BusLoadBadge';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layers, 
  Navigation, 
  Radio, 
  Eye, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface TransitMapProps {
  stops: BusStop[];
  vehicles: LiveVehicle[];
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
  userLocation: UserLocation;
  selectedServiceNo?: string;
  onSelectService: (serviceNo: string) => void;
}

// Bounding box for Singapore
const SG_BOUNDS = {
  minLat: 1.22,
  maxLat: 1.48,
  minLng: 103.60,
  maxLng: 104.05
};

export const TransitMap: React.FC<TransitMapProps> = ({
  stops,
  vehicles,
  selectedStopId,
  onSelectStop,
  userLocation,
  selectedServiceNo,
  onSelectService
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showMRT, setShowMRT] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [activeVehicle, setActiveVehicle] = useState<LiveVehicle | null>(null);

  // Map projection helpers
  const mapWidth = 1000;
  const mapHeight = 620;

  const project = (lat: number, lng: number) => {
    const x = ((lng - SG_BOUNDS.minLng) / (SG_BOUNDS.maxLng - SG_BOUNDS.minLng)) * mapWidth;
    const y = mapHeight - ((lat - SG_BOUNDS.minLat) / (SG_BOUNDS.maxLat - SG_BOUNDS.minLat)) * mapHeight;
    return { x, y };
  };

  // Filtered vehicles
  const displayedVehicles = useMemo(() => {
    if (!selectedServiceNo) return vehicles;
    return vehicles.filter(v => v.serviceNo === selectedServiceNo);
  }, [vehicles, selectedServiceNo]);

  // Handle region preset focus
  const focusRegion = (region: 'all' | 'central' | 'west' | 'east' | 'north') => {
    if (region === 'all') {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else if (region === 'central') {
      setZoom(2.4);
      setPan({ x: -130, y: 150 });
    } else if (region === 'west') {
      setZoom(2.3);
      setPan({ x: 300, y: 50 });
    } else if (region === 'east') {
      setZoom(2.2);
      setPan({ x: -550, y: -20 });
    } else if (region === 'north') {
      setZoom(2.3);
      setPan({ x: 50, y: -220 });
    }
  };

  const userPoint = project(userLocation.lat, userLocation.lng);

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl select-none">
      
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Region presets (interactive) */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-lg">
          <button
            onClick={() => focusRegion('all')}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            All SG
          </button>
          <button
            onClick={() => focusRegion('central')}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            CBD / Orchard
          </button>
          <button
            onClick={() => focusRegion('west')}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Jurong
          </button>
          <button
            onClick={() => focusRegion('east')}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Tampines
          </button>
          <button
            onClick={() => focusRegion('north')}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Woodlands
          </button>
        </div>

        {/* Right: Layer Toggles & Zoom */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-lg">
            <button
              onClick={() => setShowMRT(!showMRT)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                showMRT ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle MRT Network lines"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MRT</span>
            </button>
            <button
              onClick={() => setShowVehicles(!showVehicles)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                showVehicles ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle live moving buses"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buses</span>
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-lg">
            <button
              onClick={() => setZoom(z => Math.min(z + 0.3, 3.5))}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.3, 0.8))}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden cursor-grab active:cursor-grabbing bg-[#090d16]">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`
          }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            {/* Water gradient */}
            <radialGradient id="waterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0b1329" />
              <stop offset="100%" stopColor="#050811" />
            </radialGradient>
          </defs>

          {/* Background Water Field */}
          <rect width={mapWidth} height={mapHeight} fill="url(#waterGlow)" />
          <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

          {/* Singapore Main Island Coastline Polygon */}
          <path
            d="M 190 280 
               Q 260 210, 390 130 
               Q 450 110, 520 120 
               Q 620 140, 710 180 
               Q 810 200, 890 260 
               Q 920 300, 910 340 
               Q 880 370, 810 400 
               Q 730 430, 640 440 
               Q 560 480, 510 460 
               Q 440 460, 370 440 
               Q 300 440, 230 410 
               Q 180 380, 160 340 
               Z"
            fill="#10192e"
            stroke="rgba(16, 185, 129, 0.25)"
            strokeWidth="2"
          />

          {/* Sentosa Island */}
          <ellipse cx="480" cy="495" rx="42" ry="14" fill="#0d1527" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1.5" />
          
          {/* Jurong Island */}
          <ellipse cx="230" cy="440" rx="48" ry="24" fill="#0d1527" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1.5" />

          {/* Pulau Ubin & Tekong */}
          <ellipse cx="820" cy="180" rx="35" ry="12" fill="#0d1527" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1.5" />
          <ellipse cx="910" cy="190" rx="30" ry="18" fill="#0d1527" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1.5" />

          {/* Major Expressways Lines (PIE, CTE, AYE, ECP) */}
          <g stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" fill="none" strokeLinecap="round">
            {/* PIE */}
            <path d="M 210 320 Q 420 310, 620 330 T 860 300" />
            {/* AYE */}
            <path d="M 220 370 Q 360 390, 520 440" />
            {/* CTE */}
            <path d="M 500 140 Q 520 280, 530 440" />
            {/* ECP */}
            <path d="M 540 450 Q 700 420, 890 320" />
          </g>

          {/* Singapore MRT Lines (Schematic network overlay) */}
          {showMRT && (
            <g strokeLinecap="round" strokeLinejoin="round" fill="none">
              {/* East-West Line (Green) */}
              <path
                d="M 200 350 L 320 355 L 440 380 L 530 440 L 650 370 L 780 340 L 880 310"
                stroke="#059669"
                strokeWidth="2.5"
                opacity="0.75"
              />
              {/* North-South Line (Red) */}
              <path
                d="M 400 135 L 430 190 L 520 260 L 530 350 L 535 440"
                stroke="#dc2626"
                strokeWidth="2.5"
                opacity="0.75"
              />
              {/* Downtown Line (Blue) */}
              <path
                d="M 380 230 L 480 340 L 550 410 L 620 380 L 780 345"
                stroke="#2563eb"
                strokeWidth="2"
                opacity="0.7"
              />
              {/* Circle Line (Orange) */}
              <path
                d="M 440 380 Q 490 280, 600 330 T 550 435"
                stroke="#ea580c"
                strokeWidth="2"
                opacity="0.7"
              />
            </g>
          )}

          {/* Active Bus Route Path (if selected) */}
          {selectedServiceNo && (
            <g>
              {SINGAPORE_BUS_ROUTES.filter(r => r.serviceNo === selectedServiceNo).map(route => {
                const points = route.stops.map(s => project(s.lat, s.lng));
                const pathStr = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                return (
                  <path
                    key={route.serviceNo}
                    d={pathStr}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                );
              })}
            </g>
          )}

          {/* Bus Stops */}
          <g>
            {stops.map(stop => {
              const p = project(stop.lat, stop.lng);
              const isSelected = selectedStopId === stop.id;
              return (
                <g 
                  key={stop.id} 
                  transform={`translate(${p.x}, ${p.y})`}
                  onClick={() => onSelectStop(stop.id)}
                  className="cursor-pointer group"
                >
                  {/* Outer glow ring for selected stop */}
                  {isSelected && (
                    <circle r="12" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1.5" />
                  )}

                  {/* Stop Marker Node */}
                  <circle
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#10b981' : '#334155'}
                    stroke={isSelected ? '#ffffff' : '#64748b'}
                    strokeWidth="1.5"
                    className="group-hover:fill-emerald-400 group-hover:scale-125 transition-all"
                  />

                  {/* Stop Label on hover or selected */}
                  {(isSelected || zoom >= 2) && (
                    <text
                      y={-10}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="600"
                      className="pointer-events-none drop-shadow-md font-mono"
                    >
                      {stop.id} {zoom >= 2.2 ? `· ${stop.name.slice(0, 16)}` : ''}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* User Location Radar with pulse */}
          <g transform={`translate(${userPoint.x}, ${userPoint.y})`}>
            <circle r="22" fill="rgba(56, 189, 248, 0.12)" className="animate-ping" />
            <circle r="10" fill="rgba(56, 189, 248, 0.25)" />
            <circle r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            <text
              y={18}
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="9"
              fontWeight="bold"
              className="drop-shadow-sm font-sans"
            >
              You ({userLocation.name.split(' ')[0]})
            </text>
          </g>

          {/* Live Moving Buses */}
          {showVehicles && (
            <g>
              {displayedVehicles.map(veh => {
                const p = project(veh.lat, veh.lng);
                const op = OPERATOR_CONFIG[veh.operator] || OPERATOR_CONFIG.SBST;
                const isFocused = activeVehicle?.id === veh.id;

                return (
                  <g
                    key={veh.id}
                    transform={`translate(${p.x}, ${p.y})`}
                    onClick={() => setActiveVehicle(veh)}
                    className="cursor-pointer group"
                  >
                    {/* Bus heading directional pointer */}
                    <g transform={`rotate(${veh.heading})`}>
                      <polygon
                        points="0,-12 4,-6 -4,-6"
                        fill="#ffffff"
                        opacity="0.8"
                      />
                    </g>

                    {/* Bus Vehicle Body */}
                    <rect
                      x="-11"
                      y="-7"
                      width="22"
                      height="14"
                      rx="3"
                      fill={op.color}
                      stroke={isFocused ? '#ffffff' : 'rgba(255,255,255,0.7)'}
                      strokeWidth={isFocused ? 2 : 1}
                      className="group-hover:scale-125 transition-transform drop-shadow-md"
                    />

                    {/* Bus Service Number */}
                    <text
                      y="3.5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono"
                      className="pointer-events-none"
                    >
                      {veh.serviceNo}
                    </text>

                    {/* Load indicator dot */}
                    <circle
                      cx="8"
                      cy="-5"
                      r="2.5"
                      fill={veh.load === 'SEA' ? '#34d399' : veh.load === 'SDA' ? '#fbbf24' : '#f87171'}
                      stroke="#0f172a"
                      strokeWidth="0.5"
                    />
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Selected Bus Inspection Popover */}
        {activeVehicle && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-4 shadow-2xl z-30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono-tabular text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                  {activeVehicle.serviceNo}
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    {OPERATOR_CONFIG[activeVehicle.operator].name}
                  </h4>
                  <p className="text-[11px] font-mono-tabular text-slate-400">
                    ID: {activeVehicle.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveVehicle(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Speed</span>
                <span className="font-mono-tabular font-bold text-white">{activeVehicle.speed} km/h</span>
              </div>
              <div className="bg-slate-950/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Deck</span>
                <span className="font-mono-tabular font-bold text-white">{activeVehicle.type}</span>
              </div>
              <div className="bg-slate-950/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Crowd</span>
                <LoadIndicator load={activeVehicle.load} showLabel={false} />
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300">
              <span className="text-slate-400">Next stop:</span>
              <span className="font-mono-tabular font-medium text-emerald-400">
                Stop {activeVehicle.nextStopId}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  onSelectStop(activeVehicle.nextStopId);
                  setActiveVehicle(null);
                }}
                className="flex-1 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Jump to Next Stop</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectService(activeVehicle.serviceNo)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="Filter map to only this service"
              >
                Isolate
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Map Legend */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Seats Avail (SEA)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Standing (SDA)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span>Crowded (LSD)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>Live GPS Radar</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedServiceNo && (
            <button
              onClick={() => onSelectService('')}
              className="text-xs text-emerald-400 hover:underline"
            >
              Reset route filter ({selectedServiceNo})
            </button>
          )}
          <span className="font-mono-tabular text-slate-500">
            {displayedVehicles.length} Active SG Buses Tracked
          </span>
        </div>
      </div>

    </div>
  );
};
