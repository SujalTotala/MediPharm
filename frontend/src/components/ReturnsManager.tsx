import React, { useState, useEffect } from 'react';
import type { SalesReturn, Invoice } from '../types';
import { RotateCcw, Plus, CheckCircle2 } from 'lucide-react';

export const ReturnsManager: React.FC = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Return creation form
  const [invoiceLookup, setInvoiceLookup] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [returnItems, setReturnItems] = useState<Array<{
    item_id: number;
    batch_id: number;
    item_name: string;
    batch_no: string;
    sold_qty: number;
    return_qty: number;
    unit_rate: number;
    gst_rate: number;
  }>>([]);
  const [reason, setReason] = useState('Customer returned unopened product');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [rRes, iRes] = await Promise.all([
        fetch('/api/returns'),
        fetch('/api/invoices')
      ]);
      if (rRes.ok) setReturns(await rRes.json());
      if (iRes.ok) setInvoices(await iRes.json());
    } catch (err) {
      console.error("Failed to load returns:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLookupInvoice = () => {
    const found = invoices.find(i => i.invoice_no.toLowerCase() === invoiceLookup.trim().toLowerCase());
    if (found) {
      setSelectedInvoice(found);
      setReturnItems(found.items.map(item => ({
        item_id: item.item_id,
        batch_id: item.batch_id,
        item_name: item.item_name,
        batch_no: item.batch_no,
        sold_qty: item.quantity,
        return_qty: 0,
        unit_rate: item.unit_rate,
        gst_rate: item.gst_rate
      })));
    }
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const itemsToReturn = returnItems.filter(i => i.return_qty > 0);
    if (itemsToReturn.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_invoice_no: selectedInvoice.invoice_no,
          customer_name: selectedInvoice.customer_name,
          refund_mode: 'CASH',
          reason: reason,
          items: itemsToReturn.map(i => ({
            item_id: i.item_id,
            batch_id: i.batch_id,
            quantity: i.return_qty,
            unit_rate: i.unit_rate,
            gst_rate: i.gst_rate,
            restore_to_stock: true
          }))
        })
      });

      if (res.ok) {
        const ret: SalesReturn = await res.json();
        setSuccessMsg(`Credit Note #${ret.return_no} generated! ₹${ret.total_refund_amount.toFixed(2)} refunded & stock restored.`);
        setShowModal(false);
        setSelectedInvoice(null);
        setReturnItems([]);
        loadData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-amber-400" />
            <span>Sales Returns & Credit Notes (Reimbursements)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Process item returns against previous tax invoices with automatic stock restocking and GST reversal.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>New Sales Return / Credit Note</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Returns Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Credit Note No</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-4">Against Invoice</th>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Return Reason</th>
              <th className="py-3 px-3 text-center">Refund Mode</th>
              <th className="py-3 px-4 text-right">Total Refunded (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No sales returns or credit notes recorded yet.
                </td>
              </tr>
            ) : (
              returns.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-amber-400">{r.return_no}</td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                    {new Date(r.return_date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-sky-400">{r.original_invoice_no}</td>
                  <td className="py-3 px-4 font-bold text-white">{r.customer_name}</td>
                  <td className="py-3 px-4 text-slate-300 italic">{r.reason || '—'}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">{r.refund_mode}</td>
                  <td className="py-3 px-4 text-right font-black text-amber-400 font-mono text-sm tabular-nums">
                    ₹{r.total_refund_amount.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Return Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleProcessReturn} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Issue Sales Return & Restock Medicines</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Step 1: Look up invoice */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={invoiceLookup}
                onChange={(e) => setInvoiceLookup(e.target.value)}
                placeholder="Enter Invoice No (e.g. INV261001-0001)..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono uppercase"
              />
              <button
                type="button"
                onClick={handleLookupInvoice}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold"
              >
                Find Invoice
              </button>
            </div>

            {selectedInvoice && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between">
                  <div>
                    <p><span className="text-slate-400">Customer:</span> <strong className="text-white">{selectedInvoice.customer_name}</strong></p>
                    <p><span className="text-slate-400">Invoice Date:</span> <span className="font-mono text-slate-300">{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</span></p>
                  </div>
                  <div className="text-right">
                    <p><span className="text-slate-400">Original Total:</span> <strong className="text-emerald-400 font-mono">₹{selectedInvoice.net_amount.toFixed(2)}</strong></p>
                  </div>
                </div>

                {/* Items to return table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold">
                      <tr>
                        <th className="p-2">Medicine</th>
                        <th className="p-2">Batch</th>
                        <th className="p-2 text-right">Sold Qty</th>
                        <th className="p-2 text-center">Return Qty</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2 text-right">Refund</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {returnItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-white">{item.item_name}</td>
                          <td className="p-2 font-mono text-sky-400">{item.batch_no}</td>
                          <td className="p-2 text-right font-mono">{item.sold_qty}</td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max={item.sold_qty}
                              value={item.return_qty}
                              onChange={(e) => {
                                const val = Math.min(item.sold_qty, Math.max(0, parseFloat(e.target.value) || 0));
                                const updated = [...returnItems];
                                updated[idx].return_qty = val;
                                setReturnItems(updated);
                              }}
                              className="w-16 px-1.5 py-1 text-center bg-slate-900 border border-slate-700 rounded text-amber-300 font-bold font-mono"
                            />
                          </td>
                          <td className="p-2 text-right font-mono">₹{item.unit_rate.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono font-bold text-amber-400">
                            ₹{(item.return_qty * item.unit_rate).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Return Reason</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || returnItems.every(i => i.return_qty === 0)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"
                  >
                    Process Return & Restock
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
