import React, { useState, useEffect } from 'react';
import type { Item } from '../types';
import { Plus, Search, CheckCircle2, Lock } from 'lucide-react';

export const CatalogMaster: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Form fields
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [hsnCode, setHsnCode] = useState('3004');
  const [preparation, setPreparation] = useState('TAB');
  const [unitPacking, setUnitPacking] = useState('10');
  const [unitName, setUnitName] = useState('Strip');
  const [isScheduleH, setIsScheduleH] = useState(false);
  const [isScheduleH1, setIsScheduleH1] = useState(false);
  const [isDiscountLocked, setIsDiscountLocked] = useState(false);
  const [minStockLevel, setMinStockLevel] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error("Failed to fetch items:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter(i => 
    i.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.generic_name && i.generic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    i.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.barcode && i.barcode.includes(searchTerm))
  );

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode || !itemName) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_code: itemCode.toUpperCase(),
          item_name: itemName,
          generic_name: genericName || undefined,
          barcode: barcode || undefined,
          hsn_code: hsnCode,
          preparation: preparation,
          unit_packing: parseInt(unitPacking) || 10,
          unit_name: unitName,
          is_schedule_h: isScheduleH || isScheduleH1,
          is_schedule_h1: isScheduleH1,
          is_discount_locked: isDiscountLocked,
          min_stock_level: parseFloat(minStockLevel) || 5,
          is_active: true
        })
      });

      if (res.ok) {
        setSuccessMsg(`Medicine ${itemName} added to catalog!`);
        setShowAddModal(false);
        setItemCode('');
        setItemName('');
        setGenericName('');
        setBarcode('');
        setIsScheduleH(false);
        setIsScheduleH1(false);
        setIsDiscountLocked(false);
        fetchItems();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Failed to create item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center space-x-3 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product master by brand, salt, HSN, or code..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-sky-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Medicine Master</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Code / Barcode</th>
                <th className="py-3 px-4">Brand / Trade Name</th>
                <th className="py-3 px-4">Generic Composition (Salt)</th>
                <th className="py-3 px-3">HSN Code</th>
                <th className="py-3 px-3">Packaging Unit</th>
                <th className="py-3 px-3 text-center">Regulatory Status</th>
                <th className="py-3 px-3 text-right">Min Stock</th>
                <th className="py-3 px-3 text-right">Total Batches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-sky-400 block">{item.item_code}</span>
                    {item.barcode && <span className="text-[10px] text-slate-500 font-mono">UPC: {item.barcode}</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-white text-sm block">{item.item_name}</span>
                    <span className="text-[10px] text-slate-500">Mfr: {item.company_name || 'Generic / Multiple'}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 italic text-[11px]">
                    {item.generic_name || '—'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">{item.hsn_code}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-200">{item.unit_packing} {item.unit_name}s</span>
                    <span className="text-[10px] block text-slate-500 font-mono">{item.preparation}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center space-y-1">
                      {item.is_schedule_h1 && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                          Schedule H1 (Rx)
                        </span>
                      )}
                      {item.is_schedule_h && !item.is_schedule_h1 && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          Schedule H
                        </span>
                      )}
                      {item.is_discount_locked && (
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 flex items-center">
                          <Lock className="h-2.5 w-2.5 mr-1" /> Disc Locked
                        </span>
                      )}
                      {!item.is_schedule_h && !item.is_schedule_h1 && (
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">
                          General / OTC
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">{item.min_stock_level}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-sky-400">{item.batches.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleCreateItem} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Add New Medicine to Product Master</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Item Code *</label>
                <input
                  type="text"
                  required
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CALC500"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Barcode / UPC</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="890123456009"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Brand / Trade Name *</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Shelcal 500mg Tablet"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Generic Salt / Composition</label>
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g. Calcium Carbonate (500mg) + Vitamin D3 (250IU)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Preparation</label>
                <select
                  value={preparation}
                  onChange={(e) => setPreparation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="TAB">Tablet (TAB)</option>
                  <option value="CAP">Capsule (CAP)</option>
                  <option value="SYRUP">Syrup / Suspension</option>
                  <option value="INJ">Injection (INJ)</option>
                  <option value="OINTMENT">Ointment / Gel</option>
                  <option value="DROPS">Drops</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Pack Size</label>
                <input
                  type="number"
                  value={unitPacking}
                  onChange={(e) => setUnitPacking(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Unit Name</label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="Strip"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">HSN Code</label>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="3004"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Min Reorder Level</label>
                <input
                  type="number"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Drug Regulatory Compliance Flags */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Compliance Flags</span>
              <div className="space-y-1.5 text-xs text-slate-300">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isScheduleH}
                    onChange={(e) => setIsScheduleH(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0"
                  />
                  <span>Schedule H Prescription Medicine</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-red-300">
                  <input
                    type="checkbox"
                    checked={isScheduleH1}
                    onChange={(e) => {
                      setIsScheduleH1(e.target.checked);
                      if (e.target.checked) setIsScheduleH(true);
                    }}
                    className="rounded bg-slate-900 border-slate-700 text-red-600 focus:ring-0"
                  />
                  <span className="font-semibold">Schedule H1 (Mandatory Doctor Reg & Separate Register)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDiscountLocked}
                    onChange={(e) => setIsDiscountLocked(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Lock Discount (Prohibit counter discounts)</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                {isSubmitting ? 'Saving...' : 'Save Medicine'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
