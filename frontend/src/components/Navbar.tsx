import React from 'react';
import { 
  ShoppingBag, 
  Package, 
  Layers, 
  Users, 
  Receipt, 
  Sliders, 
  Activity,
  ShieldAlert,
  Truck,
  Stethoscope,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import type { DashboardStats } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: DashboardStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, stats }) => {
  const navItems = [
    { id: 'pos', label: 'Counter POS', icon: ShoppingBag, shortcut: 'F2' },
    { id: 'inventory', label: 'Inventory', icon: Package, shortcut: 'F4', badge: stats?.expiring_batches_count },
    { id: 'catalog', label: 'Catalog', icon: Layers, shortcut: '' },
    { id: 'purchasing', label: 'Purchases', icon: Truck, shortcut: '' },
    { id: 'prescriptions', label: 'e-Prescription', icon: Stethoscope, shortcut: '' },
    { id: 'returns', label: 'Returns', icon: RotateCcw, shortcut: '' },
    { id: 'daybook', label: 'Day Book & 2A', icon: BookOpen, shortcut: '' },
    { id: 'doctors_patients', label: 'Dr & Patient', icon: Users, shortcut: '' },
    { id: 'invoices', label: 'Invoices & GST', icon: Receipt, shortcut: 'F6' },
    { id: 'h1_register', label: 'Schedule H1', icon: ShieldAlert, shortcut: '' },
    { id: 'switches', label: 'Controls (.CON)', icon: Sliders, shortcut: '' },
  ];

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-2.5 cursor-pointer shrink-0" onClick={() => setActiveTab('pos')}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-400 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-2 ring-sky-400/30">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-black tracking-tight text-white font-sans">
                  MEDI<span className="text-sky-400">PHARM</span>
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  PRO
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Metrics */}
          <div className="hidden xl:flex items-center space-x-3 pl-3 border-l border-slate-800 text-xs shrink-0">
            <div className="text-right">
              <span className="text-slate-400 block text-[9px]">Today's Sales</span>
              <span className="text-emerald-400 font-bold tabular-nums text-xs">
                ₹{stats ? stats.today_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
