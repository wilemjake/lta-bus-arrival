import React from 'react';
import { BusLoad, BusType } from '../types/bus';
import { Accessibility, Layers, ShieldCheck } from 'lucide-react';

interface LoadIndicatorProps {
  load: BusLoad;
  showLabel?: boolean;
}

export const LoadIndicator: React.FC<LoadIndicatorProps> = ({ load, showLabel = true }) => {
  if (load === 'SEA') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400" title="Seats Available (LTA DataMall: SEA)">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        {showLabel && <span className="font-medium">Seats Avail</span>}
      </div>
    );
  }
  if (load === 'SDA') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-400" title="Standing Available (LTA DataMall: SDA)">
        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
        {showLabel && <span className="font-medium">Standing</span>}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-rose-400" title="Limited Standing / Crowded (LTA DataMall: LSD)">
      <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
      {showLabel && <span className="font-medium">Crowded</span>}
    </div>
  );
};

interface DeckBadgeProps {
  type: BusType;
}

export const DeckBadge: React.FC<DeckBadgeProps> = ({ type }) => {
  const label = type === 'DD' ? 'Double Deck' : type === 'BD' ? 'Bendy Bus' : 'Single Deck';
  return (
    <span 
      className="inline-flex items-center gap-1 text-[11px] font-mono-tabular text-slate-400" 
      title={label}
    >
      <Layers className="w-3 h-3 text-slate-500" />
      <span>{type}</span>
    </span>
  );
};

interface AccessibilityBadgeProps {
  feature: 'WAB' | 'NORM';
}

export const AccessibilityBadge: React.FC<AccessibilityBadgeProps> = ({ feature }) => {
  if (feature === 'WAB') {
    return (
      <span 
        className="inline-flex items-center text-slate-400 hover:text-emerald-400 transition-colors"
        title="Wheelchair Accessible Bus (WAB)"
      >
        <Accessibility className="w-3.5 h-3.5" />
      </span>
    );
  }
  return (
    <span 
      className="inline-flex items-center text-slate-600"
      title="Standard Non-WAB Bus"
    >
      <ShieldCheck className="w-3.5 h-3.5" />
    </span>
  );
};
