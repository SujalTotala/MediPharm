import React, { useState, useEffect, useRef } from 'react';
import type { 
  Item, Batch, Doctor, Patient, InvoiceItem, Invoice 
} from '../types';
import { 
  Search, Trash2, User, UserPlus, Stethoscope, 
  CreditCard, Banknote, QrCode, AlertTriangle, ShieldCheck, 
  Sparkles, Check, RefreshCw
} from 'lucide-react';

interface PosCounterProps {
  onInvoiceCreated: (inv: Invoice) => void;
  onRefreshStats: () => void;
}

export const PosCounter: React.FC<PosCounterProps> = ({ onInvoiceCreated, onRefreshStats }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Search & Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [selectedItemForBatch, setSelectedItemForBatch] = useState<Item | null>(null);
  
  // Cart Items
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  
  // Customer & Doctor
  const [customerName, setCustomerName] = useState('Cash Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [doctorNameInput, setDoctorNameInput] = useState('');
  const [prescriptionRef, setPrescriptionRef] = useState('');
  
  // Payment
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT_DUE'>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [salesmanName] = useState('Counter Cashier 1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Patient Add Modal
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial masters
  const loadMasters = async () => {
    try {
      const [itemRes, docRes, patRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/doctors'),
        fetch('/api/patients')
      ]);
      if (itemRes.ok) setItems(await itemRes.json());
      if (docRes.ok) setDoctors(await docRes.json());
      if (patRes.ok) setPatients(await patRes.json());
    } catch (err) {
      console.error("Failed to load POS masters:", err);
    }
  };

  useEffect(() => {
    loadMasters();
  }, []);

  // Search autocomplete
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = items.filter(i => 
      i.item_name.toLowerCase().includes(term) ||
      (i.generic_name && i.generic_name.toLowerCase().includes(term)) ||
      (i.barcode && i.barcode.includes(term)) ||
      i.item_code.toLowerCase().includes(term)
    );
    setSearchResults(filtered.slice(0, 10));
  }, [searchTerm, items]);

  // Handle medicine select -> open batch modal or auto-select first active batch
  const handleItemSelect = (item: Item) => {
    const validBatches = item.batches.filter(b => b.is_active && !b.is_expired && !b.is_held && b.stock_qty > 0);
    if (validBatches.length === 0) {
      setErrorMessage(`No saleable stock available for ${item.item_name}.`);
      return;
    }
    if (validBatches.length === 1) {
      addBatchToCart(item, validBatches[0]);
      setSearchTerm('');
      setSearchResults([]);
    } else {
      setSelectedItemForBatch(item);
    }
  };

  const addBatchToCart = (item: Item, batch: Batch) => {
    // Check if line already in cart
    const existingIndex = cartItems.findIndex(ci => ci.batch_id === batch.id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      const newQty = updated[existingIndex].quantity + 1;
      if (newQty > batch.stock_qty) {
        setErrorMessage(`Cannot exceed available stock of ${batch.stock_qty} for batch ${batch.batch_no}.`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      recalculateLine(updated[existingIndex]);
      setCartItems(updated);
    } else {
      const newLine: InvoiceItem = {
        item_id: item.id,
        batch_id: batch.id,
        item_name: item.item_name,
        batch_no: batch.batch_no,
        expiry_date: batch.expiry_date,
        hsn_code: item.hsn_code,
        quantity: 1,
        free_qty: 0,
        unit_mrp: batch.mrp,
        unit_rate: batch.sale_rate,
        discount_percent: 0,
        discount_amount: 0,
        taxable_amount: 0,
        gst_rate: batch.gst_rate || 12,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        net_line_total: 0,
        is_schedule_h1: item.is_schedule_h1,
        unit_packing: item.unit_packing,
        unit_name: item.unit_name
      };
      recalculateLine(newLine);
      setCartItems([...cartItems, newLine]);
    }
    setSelectedItemForBatch(null);
    setSearchTerm('');
    setSearchResults([]);
    setErrorMessage(null);
  };

  const recalculateLine = (line: InvoiceItem) => {
    const gross = line.quantity * line.unit_rate;
    const disc = gross * (line.discount_percent / 100);
    const taxable = gross - disc;
    const gstHalf = (line.gst_rate / 2) / 100;
    const cgst = taxable * gstHalf;
    const sgst = taxable * gstHalf;
    line.discount_amount = Number(disc.toFixed(2));
    line.taxable_amount = Number(taxable.toFixed(2));
    line.cgst_amount = Number(cgst.toFixed(2));
    line.sgst_amount = Number(sgst.toFixed(2));
    line.net_line_total = Number((taxable + cgst + sgst).toFixed(2));
  };

  const updateLineQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeLine(index);
      return;
    }
    const updated = [...cartItems];
    updated[index].quantity = newQty;
    recalculateLine(updated[index]);
    setCartItems(updated);
  };

  const updateLineFreeQty = (index: number, freeQty: number) => {
    const updated = [...cartItems];
    updated[index].free_qty = Math.max(0, freeQty);
    setCartItems(updated);
  };

  const updateLineDiscount = (index: number, disc: number) => {
    const updated = [...cartItems];
    updated[index].discount_percent = Math.min(100, Math.max(0, disc));
    recalculateLine(updated[index]);
    setCartItems(updated);
  };

  const updateLineRate = (index: number, rate: number) => {
    const updated = [...cartItems];
    updated[index].unit_rate = rate;
    recalculateLine(updated[index]);
    setCartItems(updated);
  };

  const removeLine = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Calculations
  const grossTotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_rate), 0);
  const totalDiscount = cartItems.reduce((sum, item) => sum + item.discount_amount, 0);
  const taxableTotal = cartItems.reduce((sum, item) => sum + item.taxable_amount, 0);
  const totalCGST = cartItems.reduce((sum, item) => sum + item.cgst_amount, 0);
  const totalSGST = cartItems.reduce((sum, item) => sum + item.sgst_amount, 0);
  const totalGST = totalCGST + totalSGST;
  const rawNet = taxableTotal + totalGST;
  const netPayable = Math.round(rawNet);
  const roundOff = Number((netPayable - rawNet).toFixed(2));

  const tenderedVal = parseFloat(cashTendered) || 0;
  const changeReturned = paymentMode === 'CASH' && tenderedVal > netPayable ? tenderedVal - netPayable : 0;
  const balanceDue = paymentMode === 'CASH' && tenderedVal > 0 && tenderedVal < netPayable ? netPayable - tenderedVal : 0;

  const hasScheduleH1 = cartItems.some(i => i.is_schedule_h1);

  // Quick Patient Add
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_code: `PAT${Date.now().toString().slice(-4)}`,
          patient_name: newPatientName,
          phone: newPatientPhone,
          age: parseInt(newPatientAge) || undefined
        })
      });
      if (res.ok) {
        const pat: Patient = await res.json();
        setPatients([...patients, pat]);
        setSelectedPatientId(pat.id);
        setCustomerName(pat.patient_name);
        setCustomerPhone(pat.phone || '');
        setShowAddPatient(false);
        setNewPatientName('');
        setNewPatientPhone('');
        setNewPatientAge('');
      }
    } catch (err) {
      console.error("Failed to create patient:", err);
    }
  };

  // Checkout submission
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setErrorMessage("Please add items to cart before checkout.");
      return;
    }

    if (hasScheduleH1 && !selectedDoctorId && !doctorNameInput.trim()) {
      setErrorMessage("Schedule H1 Drug Alert: You must select or enter the prescribing Doctor's name for regulatory compliance.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone || undefined,
      patient_id: selectedPatientId || undefined,
      doctor_id: selectedDoctorId || undefined,
      doctor_name: doctorNameInput || undefined,
      prescription_ref: prescriptionRef || undefined,
      payment_mode: paymentMode,
      cash_received: paymentMode === 'CASH' ? (tenderedVal || netPayable) : netPayable,
      salesman_name: salesmanName,
      items: cartItems.map(i => ({
        item_id: i.item_id,
        batch_id: i.batch_id,
        quantity: i.quantity,
        free_qty: i.free_qty,
        unit_rate: i.unit_rate,
        discount_percent: i.discount_percent
      }))
    };

    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Checkout failed");
      }

      const invoice: Invoice = await res.json();
      
      // Reset cart
      setCartItems([]);
      setCashTendered('');
      setCustomerName('Cash Customer');
      setCustomerPhone('');
      setSelectedPatientId(null);
      setSelectedDoctorId(null);
      setDoctorNameInput('');
      setPrescriptionRef('');
      
      onInvoiceCreated(invoice);
      onRefreshStats();
      loadMasters(); // refresh stock counts
    } catch (err: any) {
      setErrorMessage(err.message || "Checkout error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Product Lookup & Billing Table (8 Cols) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Top Search & Item Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="h-5 w-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Scan Barcode or Search Medicine by Brand Name, Generic salt, or Code (Press F9)..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-medium"
              />
            </div>
            <button
              onClick={loadMasters}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title="Refresh inventory items"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-16 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 bg-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Matching Catalog Items</span>
                <span>Active Stock</span>
              </div>
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className="px-4 py-2.5 hover:bg-sky-950/60 border-b border-slate-800/60 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white group-hover:text-sky-400">{item.item_name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{item.preparation}</span>
                      {item.is_schedule_h1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                          Schedule H1
                        </span>
                      )}
                      {item.is_schedule_h && !item.is_schedule_h1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                          Schedule H
                        </span>
                      )}
                    </div>
                    {item.generic_name && (
                      <p className="text-xs text-slate-400 italic mt-0.5">{item.generic_name}</p>
                    )}
                    <div className="flex space-x-3 text-[11px] text-slate-500 mt-1">
                      <span>Mfr: {item.company_name || 'N/A'}</span>
                      <span>•</span>
                      <span>HSN: {item.hsn_code}</span>
                      <span>•</span>
                      <span>Pack: {item.unit_packing} {item.unit_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-black tabular-nums ${item.total_stock > item.min_stock_level ? 'text-emerald-400' : item.total_stock > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                      {item.total_stock} {item.unit_name}s
                    </span>
                    <span className="block text-[10px] text-slate-500">{item.batches.length} Batch(es)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error / Alert Banner */}
        {errorMessage && (
          <div className="p-3 bg-red-950/80 border border-red-700 rounded-xl text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}

        {/* Schedule H1 Drug Active Notice */}
        {hasScheduleH1 && (
          <div className="p-3 bg-red-900/30 border border-red-600/50 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-red-400 shrink-0" />
            <span>
              <strong>Schedule H1 Drug Included:</strong> Doctor Name & Prescribing details are required by Indian Drug & Cosmetics Act.
            </span>
          </div>
        )}

        {/* Cart Line Items Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">Invoice Line Items</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-950 text-sky-400 border border-sky-800">
                {cartItems.length} Products
              </span>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={() => setCartItems([])}
                className="text-xs text-red-400 hover:text-red-300 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="overflow-x-auto min-h-[260px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Item / Salt</th>
                  <th className="py-2.5 px-2">Batch</th>
                  <th className="py-2.5 px-2">Exp</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-center">Free</th>
                  <th className="py-2.5 px-2 text-right">MRP</th>
                  <th className="py-2.5 px-2 text-right">Rate</th>
                  <th className="py-2.5 px-2 text-center">Disc%</th>
                  <th className="py-2.5 px-2 text-center">GST</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  <th className="py-2.5 px-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cartItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-500">
                      <div className="max-w-xs mx-auto text-center space-y-2">
                        <Sparkles className="h-8 w-8 mx-auto text-slate-600 opacity-60" />
                        <p className="font-semibold text-slate-400">Cart is empty</p>
                        <p className="text-[11px] text-slate-500">Scan product barcode or search brand/generic above to begin billing.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cartItems.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white flex items-center space-x-1">
                          <span>{line.item_name}</span>
                          {line.is_schedule_h1 && (
                            <span className="text-[9px] font-bold px-1 bg-red-950 text-red-400 border border-red-800 rounded">H1</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">HSN: {line.hsn_code}</span>
                      </td>
                      <td className="py-2.5 px-2 font-mono font-semibold text-sky-400">{line.batch_no}</td>
                      <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">{line.expiry_date}</td>
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLineQty(idx, parseFloat(e.target.value) || 0)}
                          className="w-14 px-1.5 py-1 text-center bg-slate-950 border border-slate-700 rounded text-white font-bold focus:ring-1 focus:ring-sky-500"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={line.free_qty}
                          onChange={(e) => updateLineFreeQty(idx, parseFloat(e.target.value) || 0)}
                          className="w-12 px-1 py-1 text-center bg-slate-950 border border-slate-800 rounded text-emerald-400 font-medium focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-slate-400">₹{line.unit_mrp.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={line.unit_rate}
                          onChange={(e) => updateLineRate(idx, parseFloat(e.target.value) || 0)}
                          className="w-16 px-1 py-1 text-right bg-slate-950 border border-slate-700 rounded text-white tabular-nums font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={line.discount_percent}
                          onChange={(e) => updateLineDiscount(idx, parseFloat(e.target.value) || 0)}
                          className="w-12 px-1 py-1 text-center bg-slate-950 border border-slate-700 rounded text-amber-300 font-medium"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-400">{line.gst_rate}%</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-400 tabular-nums">
                        ₹{line.net_line_total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => removeLine(idx)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete line item"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Right: Patient, Doctor, Settlement & Checkout Panel (4 Cols) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Patient & Doctor Context */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center">
              <User className="h-3.5 w-3.5 mr-1.5 text-sky-400" />
              Patient & Doctor Info
            </span>
            <button
              onClick={() => setShowAddPatient(true)}
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center space-x-1"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>New Patient</span>
            </button>
          </div>

          {/* Patient Selector */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Customer / Patient Name</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Cash Customer"
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <select
                onChange={(e) => {
                  const pat = patients.find(p => p.id === parseInt(e.target.value));
                  if (pat) {
                    setSelectedPatientId(pat.id);
                    setCustomerName(pat.patient_name);
                    setCustomerPhone(pat.phone || '');
                  }
                }}
                className="w-20 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300"
              >
                <option value="">Select</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.patient_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Mobile */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Mobile / WhatsApp Number</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9810012345"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Prescribing Doctor */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1 flex items-center">
              <Stethoscope className="h-3 w-3 mr-1 text-teal-400" />
              Prescribing Doctor {hasScheduleH1 && <span className="text-red-400 ml-1 font-bold">*</span>}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={doctorNameInput}
                onChange={(e) => setDoctorNameInput(e.target.value)}
                placeholder="Dr. Name / Reg No..."
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <select
                onChange={(e) => {
                  const doc = doctors.find(d => d.id === parseInt(e.target.value));
                  if (doc) {
                    setSelectedDoctorId(doc.id);
                    setDoctorNameInput(doc.doctor_name);
                  }
                }}
                className="w-20 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300"
              >
                <option value="">Select</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.doctor_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GST Billing Summary & Payment Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
          <div className="pb-2 border-b border-slate-800">
            <span className="font-bold text-white text-xs uppercase tracking-wider">Settlement & Tax Summary</span>
          </div>

          {/* Math Breakdown */}
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Gross Items Total:</span>
              <span className="font-mono tabular-nums text-white">₹{grossTotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount Applied:</span>
                <span className="font-mono tabular-nums">-₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Taxable Value:</span>
              <span className="font-mono tabular-nums text-slate-200">₹{taxableTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sky-400">
              <span>CGST + SGST (GST):</span>
              <span className="font-mono tabular-nums">+₹{totalGST.toFixed(2)}</span>
            </div>
            {roundOff !== 0 && (
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Round Off:</span>
                <span className="font-mono tabular-nums">{roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">NET PAYABLE:</span>
              <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
                ₹{netPayable.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Mode Selection */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1.5">Payment Method</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { mode: 'CASH', label: 'Cash', icon: Banknote },
                { mode: 'UPI', label: 'UPI / QR', icon: QrCode },
                { mode: 'CARD', label: 'Card', icon: CreditCard },
                { mode: 'CREDIT_DUE', label: 'Due', icon: User }
              ].map(p => {
                const Icon = p.icon;
                const isSel = paymentMode === p.mode;
                return (
                  <button
                    key={p.mode}
                    type="button"
                    onClick={() => setPaymentMode(p.mode as any)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                      isSel 
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400' 
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tender Amount for Cash */}
          {paymentMode === 'CASH' && (
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">Cash Received (₹):</span>
                <input
                  type="number"
                  placeholder={netPayable.toString()}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-28 px-2 py-1 text-right bg-slate-900 border border-slate-700 rounded text-sm text-white font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              {changeReturned > 0 && (
                <div className="flex justify-between text-xs text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                  <span>Change to Return:</span>
                  <span className="font-mono">₹{changeReturned.toFixed(2)}</span>
                </div>
              )}
              {balanceDue > 0 && (
                <div className="flex justify-between text-xs text-amber-400 font-semibold pt-1 border-t border-slate-800">
                  <span>Balance Due:</span>
                  <span className="font-mono">₹{balanceDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Big Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={isSubmitting || cartItems.length === 0}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center space-x-2 transition-all ${
              cartItems.length > 0 && !isSubmitting
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span>Generating GST Invoice...</span>
            ) : (
              <>
                <Check className="h-5 w-5" />
                <span>SAVE & PRINT BILL (₹{netPayable.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Batch Selection Modal when multiple batches exist */}
      {selectedItemForBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">{selectedItemForBatch.item_name}</h3>
                <p className="text-xs text-slate-400">Select stock batch to dispense</p>
              </div>
              <button
                onClick={() => setSelectedItemForBatch(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {selectedItemForBatch.batches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => !b.is_expired && !b.is_held && b.stock_qty > 0 && addBatchToCart(selectedItemForBatch, b)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    b.is_expired || b.is_held || b.stock_qty <= 0
                      ? 'bg-slate-950/50 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-950 border-slate-700 hover:border-sky-500 hover:bg-sky-950/30 cursor-pointer text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-white">{b.batch_no}</span>
                      {b.days_to_expiry !== undefined && b.days_to_expiry < 60 && !b.is_expired && (
                        <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.2 rounded">
                          Near Exp ({b.days_to_expiry}d)
                        </span>
                      )}
                      {b.is_expired && (
                        <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.2 rounded">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Exp: {b.expiry_date} | MRP: ₹{b.mrp.toFixed(2)} | Sale Rate: ₹{b.sale_rate.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 text-sm tabular-nums">{b.stock_qty}</span>
                    <span className="block text-[10px] text-slate-500">In Stock</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Patient Modal */}
      {showAddPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCreatePatient} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Quick Add Patient</h3>
              <button type="button" onClick={() => setShowAddPatient(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Phone / Mobile</label>
                <input
                  type="text"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={newPatientAge}
                  onChange={(e) => setNewPatientAge(e.target.value)}
                  placeholder="42"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddPatient(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
              >
                Save Patient
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
