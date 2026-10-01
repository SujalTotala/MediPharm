import React, { useState, useEffect } from 'react';
import type { Item, Batch } from '../types';
import { 
  Search, Plus, AlertTriangle, 
  Calendar, RefreshCw, CheckCircle2
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNearExpiry, setFilterNearExpiry] = useState(false);
  const [filterLowStock, setFilterLowStock] = useState(false);
  
  // Add Batch Modal
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [mrp, setMrp] = useState('');
  const [purchaseRate, setPurchaseRate] = useState('');
  const [saleRate, setSaleRate] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [gstRate, setGstRate] = useState('12');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Collect all batches flattened with parent item info
  const allBatches: (Batch & { item: Item })[] = [];
  items.forEach(itm => {
    itm.batches.forEach(b => {
      allBatches.push({ ...b, item: itm });
    });
  });

  const filteredBatches = allBatches.filter(b => {
    const matchesSearch = 
      b.item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.batch_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.item.generic_name && b.item.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filterNearExpiry && (b.days_to_expiry === undefined || b.days_to_expiry > 60)) {
      return false;
    }

    if (filterLowStock && b.stock_qty > b.item.min_stock_level) {
      return false;
    }

    return true;
  });

  // Calculate inventory valuation
  const totalStockUnits = allBatches.reduce((sum, b) => sum + b.stock_qty, 0);
  const totalStockValueMRP = allBatches.reduce((sum, b) => sum + (b.stock_qty * b.mrp), 0);
  const totalStockCost = allBatches.reduce((sum, b) => sum + (b.stock_qty * b.purchase_rate), 0);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !batchNo || !expiryDate || !mrp || !saleRate) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: Number(selectedItemId),
          batch_no: batchNo,
          expiry_date: expiryDate,
          mrp: parseFloat(mrp),
          purchase_rate: parseFloat(purchaseRate) || 0,
          sale_rate: parseFloat(saleRate),
          stock_qty: parseFloat(stockQty) || 0,
          gst_rate: parseFloat(gstRate) || 12,
          is_held: false,
          is_active: true
        })
      });

      if (res.ok) {
        setSuccessMsg(`Batch ${batchNo} added successfully!`);
        setShowAddBatch(false);
        setBatchNo('');
        setExpiryDate('');
        setMrp('');
        setPurchaseRate('');
        setSaleRate('');
        setStockQty('');
        fetchInventory();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Failed to create batch:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Valuation & Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-slate-400 text-xs block font-medium">Total Stocked Medicines</span>
          <span className="text-2xl font-black text-white mt-1 block">{items.length} Products</span>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{allBatches.length} Active Batches</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-slate-400 text-xs block font-medium">Total Available Units</span>
          <span className="text-2xl font-black text-sky-400 mt-1 block tabular-nums">{totalStockUnits.toLocaleString()}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Across all shelves & cold store</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-slate-400 text-xs block font-medium">Inventory Value (MRP)</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block tabular-nums">
            ₹{totalStockValueMRP.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Retail realization potential</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-slate-400 text-xs block font-medium">Inventory Cost Base</span>
          <span className="text-2xl font-black text-slate-200 mt-1 block tabular-nums">
            ₹{totalStockCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Purchase acquisition valuation</span>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter batches by brand name, batch no, or salt..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <button
            onClick={fetchInventory}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title="Refresh Inventory"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center space-x-2 text-xs">
          <button
            onClick={() => setFilterNearExpiry(!filterNearExpiry)}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
              filterNearExpiry
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-amber-400 border border-amber-900/60 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Near Expiry (&lt;60d)</span>
          </button>

          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors ${
              filterLowStock
                ? 'bg-red-600 text-white font-bold'
                : 'bg-slate-950 text-red-400 border border-red-900/60 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low Stock</span>
          </button>

          <button
            onClick={() => setShowAddBatch(true)}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold flex items-center space-x-1 shadow-md shadow-sky-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Inward Batch</span>
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Medicine / Salt</th>
                <th className="py-3 px-3">Batch No</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-right">Available Stock</th>
                <th className="py-3 px-3 text-right">MRP</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Sale Rate</th>
                <th className="py-3 px-3 text-center">GST%</th>
                <th className="py-3 px-3 text-center">Status / Regulatory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No batches match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <span>{b.item.item_name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {b.item.preparation}
                        </span>
                      </div>
                      {b.item.generic_name && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">{b.item.generic_name}</p>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">HSN: {b.item.hsn_code}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-sky-400">{b.batch_no}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-mono text-slate-200">{b.expiry_date}</span>
                      </div>
                      {b.days_to_expiry !== undefined && (
                        <span className={`text-[10px] block font-medium ${
                          b.is_expired ? 'text-red-400' : b.days_to_expiry < 60 ? 'text-amber-400' : 'text-slate-500'
                        }`}>
                          {b.is_expired ? 'Expired' : `${b.days_to_expiry} days left`}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-black text-sm tabular-nums ${
                        b.stock_qty <= b.item.min_stock_level ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {b.stock_qty} {b.item.unit_name}s
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">₹{b.mrp.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-400">₹{b.purchase_rate.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-white">₹{b.sale_rate.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{b.gst_rate}%</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        {b.item.is_schedule_h1 && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800">
                            Schedule H1 Reg
                          </span>
                        )}
                        {b.item.is_schedule_h && !b.item.is_schedule_h1 && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                            Schedule H
                          </span>
                        )}
                        {b.is_held ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                            Under Hold
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Active Stock
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Inward Batch Modal */}
      {showAddBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateBatch} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Add New Batch (Purchase Inward)</h3>
              <button type="button" onClick={() => setShowAddBatch(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Select Medicine *</label>
              <select
                required
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-sky-500"
              >
                <option value="">-- Choose Product --</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.item_name} ({i.preparation})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value.toUpperCase())}
                  placeholder="e.g. AUG24C03"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">MRP (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="220.00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Purchase Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchaseRate}
                  onChange={(e) => setPurchaseRate(e.target.value)}
                  placeholder="160.00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Sale Rate (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={saleRate}
                  onChange={(e) => setSaleRate(e.target.value)}
                  placeholder="198.00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Opening Quantity *</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">GST Tax Rate</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="0">0% Exempted</option>
                  <option value="5">5% Life Saving</option>
                  <option value="12">12% Pharma Standard</option>
                  <option value="18">18% Supplements</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddBatch(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                {isSubmitting ? 'Saving...' : 'Save Inward Batch'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
