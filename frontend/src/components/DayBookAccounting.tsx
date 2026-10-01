import React, { useState, useEffect } from 'react';
import type { LostSale } from '../types';
import { 
  BookOpen, Banknote, QrCode, CreditCard, 
  CheckCircle2, RefreshCw,
  FileSpreadsheet, Plus, TrendingDown
} from 'lucide-react';

export const DayBookAccounting: React.FC = () => {
  const [dayBook, setDayBook] = useState<any>(null);
  const [gstr2aRows, setGstr2aRows] = useState<any[]>([]);
  const [lostSales, setLostSales] = useState<LostSale[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Lost Sale form
  const [showLostSaleModal, setShowLostSaleModal] = useState(false);
  const [lsItemName, setLsItemName] = useState('');
  const [lsGenericName, setLsGenericName] = useState('');
  const [lsQty, setLsQty] = useState('1');
  const [lsPhone, setLsPhone] = useState('');
  const [lsNotes, setLsNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dbRes, gstrRes, lsRes] = await Promise.all([
        fetch('/api/reports/daybook'),
        fetch('/api/reports/gstr2a'),
        fetch('/api/reports/lost-sales')
      ]);
      if (dbRes.ok) setDayBook(await dbRes.json());
      if (gstrRes.ok) setGstr2aRows(await gstrRes.json());
      if (lsRes.ok) setLostSales(await lsRes.json());
    } catch (err) {
      console.error("Failed to load accounting daybook:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordLostSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lsItemName) return;

    try {
      const res = await fetch('/api/pos/lost-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: lsItemName,
          generic_name: lsGenericName || undefined,
          requested_qty: parseFloat(lsQty) || 1,
          customer_phone: lsPhone || undefined,
          notes: lsNotes || undefined
        })
      });

      if (res.ok) {
        setSuccessMsg(`Lost sale for '${lsItemName}' recorded for purchasing review!`);
        setShowLostSaleModal(false);
        setLsItemName('');
        setLsGenericName('');
        setLsPhone('');
        setLsNotes('');
        loadData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-sky-400" />
            <span>Day Book, Shift Cash Settlement & GSTR-2A Matching</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time daily payment split, cash float reconciliation, and statutory GSTR-2A purchase tax reconciliation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title="Refresh Accounting"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowLostSaleModal(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Log Lost Sale Demand</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Day Book Settlement Cards */}
      {dayBook && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Cash in Drawer</span>
              <Banknote className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-black text-emerald-400 mt-1 block tabular-nums">
              ₹{dayBook.net_cash_in_drawer.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              ₹1,000 Float + ₹{dayBook.payment_summary.cash.toFixed(2)} Sales - ₹{dayBook.returns_refunded.toFixed(2)} Refunds
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Digital UPI / QR Collections</span>
              <QrCode className="h-4 w-4 text-sky-400" />
            </div>
            <span className="text-2xl font-black text-sky-400 mt-1 block tabular-nums">
              ₹{dayBook.payment_summary.upi.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Direct bank settled</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Card POS Swipes</span>
              <CreditCard className="h-4 w-4 text-teal-400" />
            </div>
            <span className="text-2xl font-black text-teal-400 mt-1 block tabular-nums">
              ₹{dayBook.payment_summary.card.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Credit/Debit POS Terminal</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Day Turnover</span>
              <FileSpreadsheet className="h-4 w-4 text-white" />
            </div>
            <span className="text-2xl font-black text-white mt-1 block tabular-nums">
              ₹{dayBook.gross_sales.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Across {dayBook.total_invoices} Counter Invoices</span>
          </div>
        </div>
      )}

      {/* Two Columns: GSTR-2A Reconciliation on Left, Lost Sales Demand on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GSTR-2A Inward Match (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>GSTR-2A Supplier Purchase Reconciliation</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {gstr2aRows.length} Bills Matched
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Bill No</th>
                  <th className="p-2 text-right">Taxable (₹)</th>
                  <th className="p-2 text-right">GST (₹)</th>
                  <th className="p-2 text-center">GSTR-2A Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {gstr2aRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No supplier purchases to reconcile.
                    </td>
                  </tr>
                ) : (
                  gstr2aRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-2">
                        <span className="font-bold text-white block">{row.supplier_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{row.gstin}</span>
                      </td>
                      <td className="p-2 font-mono text-slate-300">{row.invoice_number}</td>
                      <td className="p-2 text-right font-mono tabular-nums">₹{row.taxable_value.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono tabular-nums text-sky-400">₹{row.tax_amount.toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          MATCHED 2A
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lost Sales Demand Tracker (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingDown className="h-4 w-4 text-amber-400" />
              <span>Lost Sales (Unmet Patient Demand)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              {lostSales.length} Requests
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {lostSales.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                No lost sales logged. When a medicine is out-of-stock, click "Log Lost Sale Demand" to track reorder priorities.
              </p>
            ) : (
              lostSales.map(ls => (
                <div key={ls.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white block">{ls.item_name}</span>
                    {ls.generic_name && (
                      <span className="text-[10px] text-slate-400 italic block">{ls.generic_name}</span>
                    )}
                    {ls.customer_phone && (
                      <span className="text-[10px] text-sky-400 font-mono">📱 {ls.customer_phone}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-400 font-mono block">{ls.requested_qty} Qty Req</span>
                    <span className="text-[9px] text-slate-500">{new Date(ls.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Log Lost Sale Modal */}
      {showLostSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleRecordLostSale} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Log Out-of-Stock Medicine Request</h3>
              <button type="button" onClick={() => setShowLostSaleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Requested Medicine Name *</label>
              <input
                type="text"
                required
                value={lsItemName}
                onChange={(e) => setLsItemName(e.target.value)}
                placeholder="e.g. Forxiga 10mg Tablet"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Generic Salt / Composition</label>
              <input
                type="text"
                value={lsGenericName}
                onChange={(e) => setLsGenericName(e.target.value)}
                placeholder="Dapagliflozin"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Quantity Requested</label>
                <input
                  type="number"
                  value={lsQty}
                  onChange={(e) => setLsQty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Customer Phone</label>
                <input
                  type="text"
                  value={lsPhone}
                  onChange={(e) => setLsPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowLostSaleModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"
              >
                Save Lost Sale
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
