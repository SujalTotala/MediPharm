import React, { useState, useEffect } from 'react';
import type { SystemConfig } from '../types';
import { Sliders, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const SystemSwitches: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/configs');
      if (res.ok) {
        setConfigs(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch configs:", err);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleToggle = async (cfg: SystemConfig) => {
    const newVal = cfg.value === 'ON' ? 'OFF' : 'ON';
    setSavingKey(cfg.key);
    try {
      const res = await fetch(`/api/configs/${cfg.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newVal })
      });
      if (res.ok) {
        setConfigs(configs.map(c => c.key === cfg.key ? { ...c, value: newVal } : c));
        setNotification(`Switch '${cfg.key}' updated to ${newVal}`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error("Failed to update config:", err);
    } finally {
      setSavingKey(null);
    }
  };

  const getLegacyMapping = (key: string) => {
    switch (key) {
      case 'GOMINUS_STOCK': return 'GOMINUS.CON';
      case 'MALL_MODE': return 'MALLTYPE.CON';
      case 'ALLOW_OVER_MRP': return 'OVRCHG.RTR';
      case 'ALWAYS_BARCODE': return 'ALWAYSBAR.CON';
      case 'MERGE_ITEM_LINES': return 'ITMERGE.CON';
      case 'PRINT_PATIENT_PHONE': return 'PRINTMOB.CON';
      case 'SCHEDULE_H1_STRICT': return 'H1STRICT.CON';
      default: return 'CONFIG.INI';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-2">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-950 border border-sky-800 text-sky-400">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Centralized System & POS Switches</h2>
            <p className="text-xs text-slate-400">
              Modernized replacement for legacy Phartail filesystem configuration files (<code className="text-sky-300">.CON</code> and <code className="text-amber-300">.RTR</code>). All switches take effect immediately without requiring app restart.
            </p>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Switches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configs.map((cfg) => {
          const isOn = cfg.value === 'ON';
          const isDanger = cfg.key === 'GOMINUS_STOCK' || cfg.key === 'ALLOW_OVER_MRP';

          return (
            <div
              key={cfg.id}
              className={`p-5 rounded-xl border transition-all ${
                isOn 
                  ? 'bg-slate-900/90 border-sky-500/50 shadow-lg shadow-sky-950/20' 
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-white">{cfg.key}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {getLegacyMapping(cfg.key)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{cfg.description}</p>
                  <span className="inline-block mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Category: {cfg.category}
                  </span>
                </div>

                <button
                  onClick={() => handleToggle(cfg)}
                  disabled={savingKey === cfg.key}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isOn ? (isDanger ? 'bg-red-500' : 'bg-sky-600') : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isOn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isDanger && isOn && (
                <div className="mt-3 p-2 bg-red-950/40 border border-red-800/40 rounded-lg text-red-300 text-[11px] flex items-center space-x-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                  <span>High-risk operational override active.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
