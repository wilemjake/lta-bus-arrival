import React from 'react';
import { Radio, RefreshCw, Terminal, Bell } from 'lucide-react';
import { BusAlarm } from '../types/bus';

interface TopNavProps {
  activeTab: 'arrivals' | 'map' | 'routes' | 'nearby';
  setActiveTab: (tab: 'arrivals' | 'map' | 'routes' | 'nearby') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  secondsUntilAutoRefresh: number;
  onOpenBackendModal: () => void;
  activeAlarms: BusAlarm[];
  onOpenAlarmModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  secondsUntilAutoRefresh,
  onOpenBackendModal,
  activeAlarms,
  onOpenAlarmModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <a 
              href="#top" 
              onClick={(e) => { e.preventDefault(); setActiveTab('arrivals'); }}
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-emerald-400 transition-colors"
            >
              SG Bus Radar
            </a>
          </div>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('arrivals')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                activeTab === 'arrivals'
                  ? 'border-emerald-400 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Arrival Board
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                activeTab === 'map'
                  ? 'border-emerald-400 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Radar Map
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                activeTab === 'routes'
                  ? 'border-emerald-400 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Route Explorer
            </button>
            <button
              onClick={() => setActiveTab('nearby')}
              className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                activeTab === 'nearby'
                  ? 'border-emerald-400 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Nearby Hubs
            </button>
          </nav>

          {/* Zone 3: 1 primary action & status triggers */}
          <div className="flex items-center gap-2.5 shrink-0">
            {activeAlarms.filter(a => a.active).length > 0 && (
              <button
                onClick={onOpenAlarmModal}
                className="relative px-2.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 border border-amber-600/40 rounded-lg hover:bg-amber-900/60 transition-colors flex items-center gap-1.5"
                title="View active bus arrival alarms"
              >
                <Bell className="w-3.5 h-3.5 fill-amber-400" />
                <span className="font-mono-tabular">{activeAlarms.filter(a => a.active).length}</span>
              </button>
            )}

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
              title="Manual sync with simulated LTA feeds"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="font-mono-tabular hidden sm:inline text-slate-400">{secondsUntilAutoRefresh}s</span>
              <span className="hidden lg:inline text-slate-400">Sync</span>
            </button>

            <button
              onClick={onOpenBackendModal}
              className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-emerald-950"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-100" />
              <span>Backend API</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
