import React, { useState, useEffect } from 'react';
import type { Supplier, PurchaseInvoice, Item } from '../types';
import { Truck, Plus, CheckCircle2, PackageCheck } from 'lucide-react';

export const PurchasingManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  
  // Modals
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Supplier Form
  const [supCode, setSupCode] = useState('');
  const [supName, setSupName] = useState('');
  const [supGstin, setSupGstin] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Purchase Bill Inward Form
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [supplierBillNo, setSupplierBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Line items for inward
  const [inwardLines, setInwardLines] = useState<Array<{
    item_id: number;
    batch_no: string;
    expiry_date: string;
    quantity: number;
    free_qty: number;
    purchase_rate: number;
    mrp: number;
    sale_rate: number;
    gst_rate: number;
  }>>([]);

  const [currentLineItem, setCurrentLineItem] = useState<{
    item_id: number | '';
    batch_no: string;
    expiry_date: string;
    quantity: string;
    free_qty: string;
    purchase_rate: string;
    mrp: string;
    sale_rate: string;
    gst_rate: string;
  }>({
    item_id: '',
    batch_no: '',
    expiry_date: '',
    quantity: '10',
    free_qty: '0',
    purchase_rate: '',
    mrp: '',
    sale_rate: '',
    gst_rate: '12'
  });

  const loadData = async () => {
    try {
      const [pRes, sRes, iRes] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/suppliers'),
        fetch('/api/items')
      ]);
      if (pRes.ok) setPurchases(await pRes.json());
      if (sRes.ok) setSuppliers(await sRes.json());
      if (iRes.ok) setItems(await iRes.json());
    } catch (err) {
      console.error("Failed to load purchasing data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLine = () => {
    if (!currentLineItem.item_id || !currentLineItem.batch_no || !currentLineItem.expiry_date || !currentLineItem.purchase_rate) {
      return;
    }

    setInwardLines([...inwardLines, {
      item_id: Number(currentLineItem.item_id),
      batch_no: currentLineItem.batch_no.toUpperCase(),
      expiry_date: currentLineItem.expiry_date,
      quantity: parseFloat(currentLineItem.quantity) || 1,
      free_qty: parseFloat(currentLineItem.free_qty) || 0,
      purchase_rate: parseFloat(currentLineItem.purchase_rate) || 0,
      mrp: parseFloat(currentLineItem.mrp) || parseFloat(currentLineItem.purchase_rate) * 1.3,
      sale_rate: parseFloat(currentLineItem.sale_rate) || parseFloat(currentLineItem.purchase_rate) * 1.2,
      gst_rate: parseFloat(currentLineItem.gst_rate) || 12
    }]);

    setCurrentLineItem({
      item_id: '',
      batch_no: '',
      expiry_date: '',
      quantity: '10',
      free_qty: '0',
      purchase_rate: '',
      mrp: '',
      sale_rate: '',
      gst_rate: '12'
    });
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !supplierBillNo || inwardLines.length === 0) return;

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: Number(selectedSupplierId),
          supplier_bill_no: supplierBillNo,
          bill_date: billDate,
          items: inwardLines
        })
      });

      if (res.ok) {
        setSuccessMsg(`Supplier Bill #${supplierBillNo} inwarded and stock credited!`);
        setShowInwardModal(false);
        setInwardLines([]);
        setSupplierBillNo('');
        setSelectedSupplierId('');
        loadData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supCode || !supName) return;

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_code: supCode.toUpperCase(),
          name: supName,
          gstin: supGstin,
          phone: supPhone,
          address: supAddress,
          credit_days: 30
        })
      });

      if (res.ok) {
        setSuccessMsg(`Supplier ${supName} registered!`);
        setShowSupplierModal(false);
        setSupCode('');
        setSupName('');
        setSupGstin('');
        setSupPhone('');
        setSupAddress('');
        loadData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('purchases')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'purchases'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <PackageCheck className="h-4 w-4" />
            <span>Inward Purchase Bills ({purchases.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'suppliers'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Suppliers & Wholesalers ({suppliers.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {activeSubTab === 'purchases' ? (
            <button
              onClick={() => setShowInwardModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Record Purchase Bill</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSupCode(`SUP${(suppliers.length + 1).toString().padStart(3, '0')}`);
                setShowSupplierModal(true);
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {activeSubTab === 'purchases' ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Purchase Ref</th>
                <th className="py-3 px-3">Bill Date</th>
                <th className="py-3 px-4">Supplier / Wholesaler</th>
                <th className="py-3 px-3">Supplier Bill No</th>
                <th className="py-3 px-3 text-right">Taxable (₹)</th>
                <th className="py-3 px-3 text-right">GST (₹)</th>
                <th className="py-3 px-4 text-right">Net Payable (₹)</th>
                <th className="py-3 px-3 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No supplier purchase bills recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">{p.purchase_no}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{p.bill_date}</td>
                    <td className="py-3 px-4 font-bold text-white">{p.supplier_name || 'Supplier'}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-300">{p.supplier_bill_no}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">₹{p.total_taxable.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-sky-400">₹{p.total_gst.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm tabular-nums">
                      ₹{p.net_payable.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        {p.payment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Supplier / Firm Name</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">Credit Terms</th>
                <th className="py-3 px-4">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">{s.supplier_code}</td>
                  <td className="py-3 px-4 font-bold text-white text-sm">{s.name}</td>
                  <td className="py-3 px-4 font-mono text-teal-400">{s.gstin || '—'}</td>
                  <td className="py-3 px-4 text-slate-300">{s.phone || '—'}</td>
                  <td className="py-3 px-4 text-slate-400">{s.credit_days} Days Net</td>
                  <td className="py-3 px-4 text-slate-400">{s.address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Inward Purchase Bill Modal */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleCreatePurchase} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Record Purchase Bill & Stock Inward</h3>
              <button type="button" onClick={() => setShowInwardModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Select Supplier *</label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Supplier Bill No *</label>
                <input
                  type="text"
                  required
                  value={supplierBillNo}
                  onChange={(e) => setSupplierBillNo(e.target.value)}
                  placeholder="e.g. MM-2026-981"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Bill Date</label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Inward Line Entry Area */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">Add Product Line to Inward Bill</span>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Medicine *</label>
                  <select
                    value={currentLineItem.item_id}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, item_id: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="">-- Select Product --</option>
                    {items.map(i => (
                      <option key={i.id} value={i.id}>{i.item_name} ({i.preparation})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Batch No *</label>
                  <input
                    type="text"
                    value={currentLineItem.batch_no}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, batch_no: e.target.value })}
                    placeholder="BATCH123"
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Expiry Date *</label>
                  <input
                    type="date"
                    value={currentLineItem.expiry_date}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, expiry_date: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 items-end">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Billed Qty</label>
                  <input
                    type="number"
                    value={currentLineItem.quantity}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, quantity: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Free Qty</label>
                  <input
                    type="number"
                    value={currentLineItem.free_qty}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, free_qty: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Cost Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentLineItem.purchase_rate}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, purchase_rate: e.target.value })}
                    placeholder="120.00"
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentLineItem.mrp}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, mrp: e.target.value })}
                    placeholder="180.00"
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold"
                  >
                    + Add Line
                  </button>
                </div>
              </div>
            </div>

            {/* Inward Lines Table */}
            {inwardLines.length > 0 && (
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Batch</th>
                      <th className="p-2">Exp</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Cost Rate</th>
                      <th className="p-2 text-right">MRP</th>
                      <th className="p-2 text-right">Line Taxable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {inwardLines.map((line, idx) => {
                      const itm = items.find(i => i.id === line.item_id);
                      return (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-white">{itm?.item_name || 'Item'}</td>
                          <td className="p-2 font-mono text-sky-400">{line.batch_no}</td>
                          <td className="p-2 text-slate-400">{line.expiry_date}</td>
                          <td className="p-2 text-right font-bold">{line.quantity}{line.free_qty > 0 && ` +${line.free_qty}F`}</td>
                          <td className="p-2 text-right font-mono">₹{line.purchase_rate.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono">₹{line.mrp.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-400">
                            ₹{(line.quantity * line.purchase_rate).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inwardLines.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Post Inward Bill to Stock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateSupplier} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Add Supplier / Distributor</h3>
              <button type="button" onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Supplier Code *</label>
              <input
                type="text"
                required
                value={supCode}
                onChange={(e) => setSupCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Supplier / Firm Name *</label>
              <input
                type="text"
                required
                value={supName}
                onChange={(e) => setSupName(e.target.value)}
                placeholder="e.g. Mahaveer Medico Distributors"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">GSTIN</label>
                <input
                  type="text"
                  value={supGstin}
                  onChange={(e) => setSupGstin(e.target.value)}
                  placeholder="27AAACM1234F1Z1"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Phone</label>
                <input
                  type="text"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="9823011223"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Office / Warehouse Address</label>
              <input
                type="text"
                value={supAddress}
                onChange={(e) => setSupAddress(e.target.value)}
                placeholder="B-12, Wholesale Drug Market"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
