import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PosCounter } from './components/PosCounter';
import { InventoryManager } from './components/InventoryManager';
import { CatalogMaster } from './components/CatalogMaster';
import { PurchasingManager } from './components/PurchasingManager';
import { PrescriptionClinic } from './components/PrescriptionClinic';
import { ReturnsManager } from './components/ReturnsManager';
import { DayBookAccounting } from './components/DayBookAccounting';
import { DoctorPatientManager } from './components/DoctorPatientManager';
import { InvoicesExplorer } from './components/InvoicesExplorer';
import { ScheduleH1Register } from './components/ScheduleH1Register';
import { SystemSwitches } from './components/SystemSwitches';
import { PrintInvoiceModal } from './components/PrintInvoiceModal';
import type { DashboardStats, Invoice } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currentPrintedInvoice, setCurrentPrintedInvoice] = useState<Invoice | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Keyboard Shortcuts (F2: POS, F4: Inventory, F6: Invoices)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveTab('invoices');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInvoiceCreated = (invoice: Invoice) => {
    setCurrentPrintedInvoice(invoice);
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'pos' && (
          <PosCounter
            onInvoiceCreated={handleInvoiceCreated}
            onRefreshStats={fetchStats}
          />
        )}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'catalog' && <CatalogMaster />}
        {activeTab === 'purchasing' && <PurchasingManager />}
        {activeTab === 'prescriptions' && <PrescriptionClinic />}
        {activeTab === 'returns' && <ReturnsManager />}
        {activeTab === 'daybook' && <DayBookAccounting />}
        {activeTab === 'doctors_patients' && <DoctorPatientManager />}
        {activeTab === 'invoices' && (
          <InvoicesExplorer onViewInvoice={(inv) => setCurrentPrintedInvoice(inv)} />
        )}
        {activeTab === 'h1_register' && <ScheduleH1Register />}
        {activeTab === 'switches' && <SystemSwitches />}
      </main>

      {/* Printable Invoice Modal */}
      <PrintInvoiceModal
        invoice={currentPrintedInvoice}
        onClose={() => setCurrentPrintedInvoice(null)}
      />
    </div>
  );
}

export default App;
