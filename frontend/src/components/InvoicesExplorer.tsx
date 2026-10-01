import React, { useState, useEffect } from 'react';
import type { Invoice } from '../types';
import { Search, Printer, RefreshCw } from 'lucide-react';

interface InvoicesExplorerProps {
  onViewInvoice: (inv: Invoice) => void;
}

export const InvoicesExplorer: React.FC<InvoicesExplorerProps> = ({ onViewInvoice }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(i => 
    i.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.customer_phone && i.customer_phone.includes(searchTerm)) ||
    (i.doctor_name && i.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Totals
  const totalTurnover = invoices.reduce((sum, i) => sum + i.net_amount, 0);
  const totalCGST = invoices.reduce((sum, i) => sum + i.cgst_amount, 0);
  const totalSGST = invoices.reduce((sum, i) => sum + i.sgst_amount, 0);
  const totalTax = totalCGST + totalSGST;

  return (
    <div className="space-y-6">
      {/* GST Sales Register Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-slate-400 text-xs block font-medium">Total Invoices Issued</span>
          <span className="text-2xl font-black text-white mt-1 block">{invoices.length} Bills</span>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">Retail B2C / Counter</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-slate-400 text-xs block font-medium">Gross Retail Turnover</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block tabular-nums">
            ₹{totalTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Net settled realization</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-slate-400 text-xs block font-medium">Total Output GST (CGST+SGST)</span>
          <span className="text-2xl font-black text-sky-400 mt-1 block tabular-nums">
            ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">GSTR-1 Tax liability</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-slate-400 text-xs block font-medium">Intra-State GST Split</span>
          <span className="text-sm font-bold text-slate-200 mt-1.5 block font-mono">
            CGST: ₹{totalCGST.toFixed(2)} | SGST: ₹{totalSGST.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">50/50 Central & State Share</span>
        </div>
      </div>

      {/* Search Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Invoice No, Customer Name, or Mobile..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <button
            onClick={fetchInvoices}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title="Refresh Invoices"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-4">Customer / Patient</th>
                <th className="py-3 px-3">Doctor</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-right">Taxable (₹)</th>
                <th className="py-3 px-3 text-right">GST (₹)</th>
                <th className="py-3 px-4 text-right">Net Amount (₹)</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No sales invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">
                      {inv.invoice_no}
                      {inv.items.some(i => i.is_schedule_h1) && (
                        <span className="ml-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">
                          H1
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(inv.invoice_date).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{inv.customer_name}</span>
                      {inv.customer_phone && (
                        <span className="text-[10px] text-slate-500 font-mono">📱 {inv.customer_phone}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {inv.doctor_name || 'Self / OTC'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                        {inv.payment_mode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                      ₹{inv.taxable_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-sky-400">
                      ₹{(inv.cgst_amount + inv.sgst_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-400 font-mono text-sm tabular-nums">
                      ₹{inv.net_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="p-1.5 bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                        title="View & Reprint Invoice"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
