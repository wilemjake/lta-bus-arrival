/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BusStop, ServiceArrival, LiveVehicle, UserLocation, BusAlarm } from './types/bus';
import { SINGAPORE_BUS_STOPS, SINGAPORE_LOCATIONS } from './data/singaporeBusData';
import { 
  getDistanceMeters, 
  initializeVehicles, 
  stepVehicles, 
  getArrivalsForStop, 
  tickArrivals,
  playChime
} from './services/busPredictionService';

import { TopNav } from './components/TopNav';
import { BusStopCard } from './components/BusStopCard';
import { TransitMap } from './components/TransitMap';
import { RouteExplorer } from './components/RouteExplorer';
import { NearbyRadar } from './components/NearbyRadar';
import { BackendConnectorModal } from './components/BackendConnectorModal';
import { AlarmNotificationModal } from './components/AlarmNotificationModal';

import { 
  Search, 
  Star, 
  Compass, 
  MapPin, 
  Clock, 
  Bus, 
  Layers, 
  SlidersHorizontal,
  X,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'arrivals' | 'map' | 'routes' | 'nearby'>('arrivals');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTown, setSelectedTown] = useState<string>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string>('01012'); // Default: Bugis Hotel Grand Pacific
  const [selectedServiceNo, setSelectedServiceNo] = useState<string>('');

  // User location (Singapore reference)
  const [userLocation, setUserLocation] = useState<UserLocation>(SINGAPORE_LOCATIONS[0]);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  // Favorites & Alarms (persisted in localStorage)
  const [pinnedServices, setPinnedServices] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_bus_pinned_services');
      return saved ? JSON.parse(saved) : ['01012-190', '09048-190', '03019-36'];
    } catch {
      return ['01012-190', '09048-190'];
    }
  });

  const [activeAlarms, setActiveAlarms] = useState<BusAlarm[]>(() => {
    try {
      const saved = localStorage.getItem('sg_bus_alarms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Backend Integration settings
  const [customBackendUrl, setCustomBackendUrl] = useState<string>(() => {
    return localStorage.getItem('sg_bus_backend_url') || '';
  });
  const [isCustomBackendActive, setIsCustomBackendActive] = useState<boolean>(() => {
    return localStorage.getItem('sg_bus_backend_active') === 'true';
  });
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);

  // Alarm modal state
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [alarmPrefill, setAlarmPrefill] = useState<{ serviceNo: string; stopId: string; stopName: string } | null>(null);

  // Real-time Vehicle & Arrival state
  const [vehicles, setVehicles] = useState<LiveVehicle[]>(() => initializeVehicles());
  const [arrivalsCache, setArrivalsCache] = useState<Record<string, ServiceArrival[]>>({});
  const [secondsUntilAutoRefresh, setSecondsUntilAutoRefresh] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertToast, setAlertToast] = useState<string | null>(null);

  // Ref to track triggered alarms to avoid repeating chimes continuously
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

  // Save pinned services to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sg_bus_pinned_services', JSON.stringify(pinnedServices));
    } catch {
      // Storage unavailable
    }
  }, [pinnedServices]);

  // Save alarms to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sg_bus_alarms', JSON.stringify(activeAlarms));
    } catch {
      // Storage unavailable
    }
  }, [activeAlarms]);

  // Save backend settings
  const handleSaveBackendUrl = (url: string) => {
    setCustomBackendUrl(url);
    localStorage.setItem('sg_bus_backend_url', url);
  };

  const handleToggleBackend = (active: boolean) => {
    setIsCustomBackendActive(active);
    localStorage.setItem('sg_bus_backend_active', String(active));
  };

  // Re-fetch / re-generate arrivals for a stop
  const refreshArrivals = useCallback((stopIds: string[]) => {
    setIsRefreshing(true);
    setTimeout(() => {
      setArrivalsCache(prev => {
        const next = { ...prev };
        stopIds.forEach(id => {
          const stop = SINGAPORE_BUS_STOPS.find(s => s.id === id);
          if (stop) {
            next[id] = getArrivalsForStop(stop, pinnedServices);
          }
        });
        return next;
      });
      setIsRefreshing(false);
      setSecondsUntilAutoRefresh(15);
    }, 200);
  }, [pinnedServices]);

  // Initial population of arrivals for visible stops
  useEffect(() => {
    const initialStops = SINGAPORE_BUS_STOPS.slice(0, 10).map(s => s.id);
    if (!initialStops.includes(selectedStopId)) {
      initialStops.push(selectedStopId);
    }
    refreshArrivals(initialStops);
  }, [selectedStopId, refreshArrivals]);

  // 1-second real-time tick interval
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Move vehicles along paths
      setVehicles(prev => stepVehicles(prev));

      // 2. Decrement arrival countdowns
      setArrivalsCache(prev => {
        const updated: Record<string, ServiceArrival[]> = {};
        Object.keys(prev).forEach(stopId => {
          updated[stopId] = tickArrivals(prev[stopId]);
        });
        return updated;
      });

      // 3. Decrement auto-refresh
      setSecondsUntilAutoRefresh(prev => {
        if (prev <= 1) {
          refreshArrivals([selectedStopId]);
          return 15;
        }
        return prev - 1;
      });

      // 4. Check active alarms
      activeAlarms.forEach(alarm => {
        if (!alarm.active) return;
        const arrivals = arrivalsCache[alarm.stopId];
        if (!arrivals) return;

        const svc = arrivals.find(s => s.serviceNo === alarm.serviceNo);
        if (svc && svc.nextBus) {
          const alarmKey = `${alarm.stopId}-${alarm.serviceNo}-${alarm.targetMinutes}`;
          if (svc.nextBus.minutes <= alarm.targetMinutes && !triggeredAlarmsRef.current.has(alarmKey)) {
            triggeredAlarmsRef.current.add(alarmKey);
            playChime();
            setAlertToast(`Bus ${alarm.serviceNo} is now ${svc.nextBus.minutes} min away from ${alarm.stopName}!`);
            setTimeout(() => setAlertToast(null), 7000);
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedStopId, activeAlarms, arrivalsCache, refreshArrivals]);

  // Toggle favorite pin
  const handleToggleFavorite = (serviceKey: string) => {
    setPinnedServices(prev => {
      const exists = prev.includes(serviceKey);
      if (exists) {
        return prev.filter(k => k !== serviceKey);
      } else {
        return [...prev, serviceKey];
      }
    });

    // Also update current cached arrival item
    setArrivalsCache(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(stopId => {
        updated[stopId] = updated[stopId].map(svc => {
          if (`${stopId}-${svc.serviceNo}` === serviceKey) {
            return { ...svc, isFavorite: !svc.isFavorite };
          }
          return svc;
        });
      });
      return updated;
    });
  };

  // Open Alarm modal
  const handleOpenAlarm = (serviceNo: string, stopId: string, stopName: string) => {
    setAlarmPrefill({ serviceNo, stopId, stopName });
    setIsAlarmModalOpen(true);
  };

  // Add alarm
  const handleAddAlarm = (alarm: BusAlarm) => {
    setActiveAlarms(prev => [...prev, alarm]);
  };

  // Delete alarm
  const handleDeleteAlarm = (index: number) => {
    setActiveAlarms(prev => prev.filter((_, idx) => idx !== index));
  };

  // Select on map
  const handleSelectOnMap = (stopId: string, serviceNo: string) => {
    setSelectedStopId(stopId);
    if (serviceNo) setSelectedServiceNo(serviceNo);
    setActiveTab('map');
  };

  // View Route
  const handleViewRoute = (serviceNo: string) => {
    setSelectedServiceNo(serviceNo);
    setActiveTab('routes');
  };

  // Detect Real GPS
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGPS(false);
        setUserLocation({
          name: 'Your GPS Coordinates',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isSimulated: false
        });
        setAlertToast('Location updated to your device GPS!');
        setTimeout(() => setAlertToast(null), 3000);
      },
      () => {
        setIsDetectingGPS(false);
        setAlertToast('Could not access device GPS. Defaulting to Central Singapore.');
        setTimeout(() => setAlertToast(null), 3000);
      },
      { timeout: 8000 }
    );
  };

  // Towns list for filter
  const towns = useMemo(() => {
    const set = new Set(SINGAPORE_BUS_STOPS.map(s => s.town));
    return ['All', ...Array.from(set)];
  }, []);

  // Filtered stops for the Arrival Board
  const filteredStops = useMemo(() => {
    return SINGAPORE_BUS_STOPS.filter(stop => {
      // Town filter
      if (selectedTown !== 'All' && stop.town !== selectedTown) {
        return false;
      }

      // Search query filter (matches stop id, name, road, or service numbers)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = stop.id.toLowerCase().includes(q);
        const matchesName = stop.name.toLowerCase().includes(q);
        const matchesRoad = stop.road.toLowerCase().includes(q);
        const matchesService = stop.services.some(s => s.toLowerCase() === q || s.toLowerCase().startsWith(q));

        if (!matchesId && !matchesName && !matchesRoad && !matchesService) {
          return false;
        }
      }

      // Favorites only filter
      if (showFavoritesOnly) {
        const hasFavoriteService = stop.services.some(svc => 
          pinnedServices.includes(`${stop.id}-${svc}`)
        );
        if (!hasFavoriteService) return false;
      }

      return true;
    }).map(stop => {
      const dist = getDistanceMeters(userLocation.lat, userLocation.lng, stop.lat, stop.lng);
      return { ...stop, distanceMeters: dist };
    }).sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [selectedTown, searchQuery, showFavoritesOnly, pinnedServices, userLocation]);

  // Ensure selected stop has cached arrivals
  useEffect(() => {
    if (selectedStopId && !arrivalsCache[selectedStopId]) {
      const stop = SINGAPORE_BUS_STOPS.find(s => s.id === selectedStopId);
      if (stop) {
        setArrivalsCache(prev => ({
          ...prev,
          [selectedStopId]: getArrivalsForStop(stop, pinnedServices)
        }));
      }
    }
  }, [selectedStopId, arrivalsCache, pinnedServices]);

  // Format current Singapore clock time
  const [singaporeTime, setSingaporeTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSingaporeTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar (adheres to 3-zone contract) */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => refreshArrivals([selectedStopId, ...filteredStops.slice(0, 5).map(s => s.id)])}
        isRefreshing={isRefreshing}
        secondsUntilAutoRefresh={secondsUntilAutoRefresh}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        activeAlarms={activeAlarms}
        onOpenAlarmModal={() => setIsAlarmModalOpen(true)}
      />

      {/* Real-time Alert Toast Notification */}
      {alertToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-900/95 border border-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 max-w-md">
          <Bus className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-medium">{alertToast}</span>
          <button
            onClick={() => setAlertToast(null)}
            className="text-emerald-300 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Sub-Header Context Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-850">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Singapore LTA Bus Network</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time GPS Feeds Active</span>
            </div>
            <span aria-hidden="true" className="text-slate-600 hidden sm:inline">·</span>
            <span className="text-xs text-slate-400 font-mono-tabular hidden sm:inline">
              SGT (UTC+8): {singaporeTime}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-mono-tabular">
              <strong className="text-white">{SINGAPORE_BUS_STOPS.length}</strong> Stops
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono-tabular">
              <strong className="text-white">{vehicles.length}</strong> Live Buses
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <button
              onClick={() => setActiveTab('nearby')}
              className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Ref: {userLocation.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ARRIVAL BOARD */}
        {activeTab === 'arrivals' && (
          <div className="space-y-6">
            
            {/* Search & Filter Toolbar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Primary Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by 5-digit bus stop code (e.g. 01012), stop name, road, or service (e.g. 190)..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Secondary Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
                
                {/* Town Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedTown}
                    onChange={(e) => setSelectedTown(e.target.value)}
                    className="bg-transparent text-white focus:outline-none cursor-pointer"
                  >
                    {towns.map(t => (
                      <option key={t} value={t} className="bg-slate-900 text-white">
                        {t === 'All' ? 'All Singapore Towns' : t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Favorites Filter Button */}
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    showFavoritesOnly
                      ? 'bg-amber-950/50 border-amber-500/60 text-amber-300'
                      : 'bg-slate-950 border-slate-700/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span>Starred Only</span>
                </button>

              </div>

            </div>

            {/* Bus Stops Grid or List */}
            {filteredStops.length > 0 ? (
              <div className="space-y-6">
                {filteredStops.slice(0, 8).map(stop => {
                  const arrivals = arrivalsCache[stop.id] || getArrivalsForStop(stop, pinnedServices);
                  return (
                    <BusStopCard
                      key={stop.id}
                      stop={stop}
                      arrivals={arrivals}
                      distanceMeters={stop.distanceMeters}
                      onToggleFavorite={handleToggleFavorite}
                      onOpenAlarm={handleOpenAlarm}
                      onSelectOnMap={handleSelectOnMap}
                      onViewRoute={handleViewRoute}
                      activeAlarms={activeAlarms}
                    />
                  );
                })}

                {filteredStops.length > 8 && (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
                    Showing top 8 of {filteredStops.length} bus stops matching your search. Refine your query or select a town to narrow down.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-base font-semibold text-white">No bus stops found</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  We couldn&rsquo;t find any bus stops matching &ldquo;{searchQuery}&rdquo;. Try searching for &ldquo;Bugis&rdquo;, &ldquo;Orchard&rdquo;, &ldquo;SMU&rdquo;, or service &ldquo;190&rdquo;.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedTown('All'); setShowFavoritesOnly(false); }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors mt-2"
                >
                  Reset All Filters
                </button>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: LIVE TRANSIT MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Singapore Bus Radar & Live Fleet Tracker
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time GPS vehicle positions, MRT interchange alignments, and stop arrival projections.
                </p>
              </div>

              {selectedServiceNo && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-mono-tabular">
                    Filtered Route: Bus {selectedServiceNo}
                  </span>
                  <button
                    onClick={() => setSelectedServiceNo('')}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-md"
                  >
                    Show All
                  </button>
                </div>
              )}
            </div>

            <TransitMap
              stops={SINGAPORE_BUS_STOPS}
              vehicles={vehicles}
              selectedStopId={selectedStopId}
              onSelectStop={(id) => {
                setSelectedStopId(id);
                // Also scroll or switch to arrivals if needed
              }}
              userLocation={userLocation}
              selectedServiceNo={selectedServiceNo}
              onSelectService={(svc) => setSelectedServiceNo(svc)}
            />

            {/* Quick Preview of the Selected Bus Stop on Map */}
            {selectedStopId && (
              <div className="mt-4">
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  Selected Bus Stop Arrivals:
                </span>
                {(() => {
                  const stop = SINGAPORE_BUS_STOPS.find(s => s.id === selectedStopId);
                  if (!stop) return null;
                  const arrivals = arrivalsCache[stop.id] || getArrivalsForStop(stop, pinnedServices);
                  return (
                    <BusStopCard
                      stop={stop}
                      arrivals={arrivals}
                      distanceMeters={getDistanceMeters(userLocation.lat, userLocation.lng, stop.lat, stop.lng)}
                      onToggleFavorite={handleToggleFavorite}
                      onOpenAlarm={handleOpenAlarm}
                      onSelectOnMap={handleSelectOnMap}
                      onViewRoute={handleViewRoute}
                      activeAlarms={activeAlarms}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ROUTE EXPLORER */}
        {activeTab === 'routes' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Bus Route Progression & In-Transit Radar
              </h2>
              <p className="text-xs text-slate-400">
                Explore chronological stops, distance milestones, and active buses moving along the route.
              </p>
            </div>

            <RouteExplorer
              initialServiceNo={selectedServiceNo || '190'}
              onSelectStop={(stopId) => {
                setSelectedStopId(stopId);
                setActiveTab('arrivals');
              }}
              vehicles={vehicles}
            />
          </div>
        )}

        {/* TAB 4: NEARBY RADAR */}
        {activeTab === 'nearby' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Nearby Bus Stops Radar
              </h2>
              <p className="text-xs text-slate-400">
                Calculate walking distance and time from your GPS location or teleport to key Singapore hubs.
              </p>
            </div>

            <NearbyRadar
              stops={SINGAPORE_BUS_STOPS}
              userLocation={userLocation}
              onChangeLocation={(loc) => setUserLocation(loc)}
              onDetectGPS={handleDetectGPS}
              onSelectStop={(stopId) => {
                setSelectedStopId(stopId);
                setActiveTab('arrivals');
              }}
              isDetectingGPS={isDetectingGPS}
            />
          </div>
        )}

      </main>

      {/* Backend Integration Setup Drawer / Modal */}
      <BackendConnectorModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        customBackendUrl={customBackendUrl}
        onSaveCustomBackendUrl={handleSaveBackendUrl}
        isCustomBackendActive={isCustomBackendActive}
        onToggleCustomBackend={handleToggleBackend}
      />

      {/* Bus Arrival Alarm Modal */}
      <AlarmNotificationModal
        isOpen={isAlarmModalOpen}
        onClose={() => setIsAlarmModalOpen(false)}
        activeAlarms={activeAlarms}
        onAddAlarm={handleAddAlarm}
        onDeleteAlarm={handleDeleteAlarm}
        prefill={alarmPrefill}
      />

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">SG Bus Radar</span>
            <span aria-hidden="true">·</span>
            <span>LTA DataMall v3 Transit Protocol</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Seats (SEA) · Standing (SDA) · Limited (LSD)</span>
            <span aria-hidden="true">·</span>
            <span>Single Deck (SD) · Double Deck (DD) · Bendy (BD)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
