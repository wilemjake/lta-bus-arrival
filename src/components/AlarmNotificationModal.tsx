import React, { useState } from 'react';
import { BusAlarm } from '../types/bus';
import { playChime } from '../services/busPredictionService';
import { Bell, X, Trash2, Volume2, Plus, CheckCircle2 } from 'lucide-react';

interface AlarmNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAlarms: BusAlarm[];
  onAddAlarm: (alarm: BusAlarm) => void;
  onDeleteAlarm: (index: number) => void;
  prefill?: { serviceNo: string; stopId: string; stopName: string } | null;
}

export const AlarmNotificationModal: React.FC<AlarmNotificationModalProps> = ({
  isOpen,
  onClose,
  activeAlarms,
  onAddAlarm,
  onDeleteAlarm,
  prefill
}) => {
  const [serviceNo, setServiceNo] = useState(prefill?.serviceNo || '190');
  const [stopId, setStopId] = useState(prefill?.stopId || '01012');
  const [stopName, setStopName] = useState(prefill?.stopName || 'Hotel Grand Pacific');
  const [targetMinutes, setTargetMinutes] = useState(2);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceNo.trim()) return;

    onAddAlarm({
      serviceNo: serviceNo.trim().toUpperCase(),
      stopId,
      stopName,
      targetMinutes,
      active: true,
      createdTime: Date.now()
    });

    playChime();
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Bus Arrival Alarms
              </h3>
              <p className="text-xs text-slate-400">
                Receive sound alerts when your bus is approaching
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          
          <form onSubmit={handleCreate} className="space-y-4 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Set New Arrival Reminder
              </span>
              <button
                type="button"
                onClick={playChime}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                title="Test sound tone"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Chime</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Bus Service</label>
                <input
                  type="text"
                  value={serviceNo}
                  onChange={(e) => setServiceNo(e.target.value)}
                  placeholder="e.g. 190"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono-tabular font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Alert When ETA is</label>
                <select
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>1 min away (&le; 60s)</option>
                  <option value={2}>2 mins away</option>
                  <option value={3}>3 mins away</option>
                  <option value={5}>5 mins away</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="text-slate-400 block mb-1">Bus Stop</label>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 flex items-center justify-between">
                <span>{stopName}</span>
                <span className="font-mono-tabular text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded text-[11px]">
                  {stopId}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Arm Arrival Alarm</span>
            </button>

            {addedNotice && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Alarm set! You will be alerted when Bus {serviceNo} is {targetMinutes}m away.</span>
              </div>
            )}
          </form>

          {/* Active Alarms List */}
          <div>
            <span className="text-xs font-semibold text-white block mb-2">
              Active Alarms ({activeAlarms.length})
            </span>

            {activeAlarms.length > 0 ? (
              <div className="space-y-2">
                {activeAlarms.map((alarm, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-8 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center font-mono-tabular font-bold text-amber-300">
                        {alarm.serviceNo}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          Alert at &le; {alarm.targetMinutes} mins away
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {alarm.stopName} ({alarm.stopId})
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteAlarm(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Remove alarm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
                No active alarms right now. Set an alarm above or click the bell on any bus service!
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
