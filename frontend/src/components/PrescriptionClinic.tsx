import React, { useState, useEffect } from 'react';
import type { Prescription, Doctor, Patient, Item } from '../types';
import { Stethoscope, Plus, CheckCircle2 } from 'lucide-react';

interface PrescriptionClinicProps {
  onDispenseRx?: (rx: Prescription) => void;
}

export const PrescriptionClinic: React.FC<PrescriptionClinicProps> = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
  const [diagnosis, setDiagnosis] = useState('');
  const [vitals, setVitals] = useState('BP: 120/80 mmHg, Pulse: 72 bpm');
  const [notes, setNotes] = useState('');

  // Medicines list
  const [rxLines, setRxLines] = useState<Array<{
    item_id: number;
    dosage: string;
    duration_days: number;
    total_qty: number;
    timing: string;
    instructions: string;
  }>>([]);

  const [currentLine, setCurrentLine] = useState<{
    item_id: number | '';
    dosage: string;
    duration_days: string;
    total_qty: string;
    timing: string;
    instructions: string;
  }>({
    item_id: '',
    dosage: '1-0-1',
    duration_days: '5',
    total_qty: '10',
    timing: 'AFTER_MEAL',
    instructions: 'Take with warm water'
  });

  const loadData = async () => {
    try {
      const [rRes, dRes, pRes, iRes] = await Promise.all([
        fetch('/api/prescriptions'),
        fetch('/api/doctors'),
        fetch('/api/patients'),
        fetch('/api/items')
      ]);
      if (rRes.ok) setPrescriptions(await rRes.json());
      if (dRes.ok) setDoctors(await dRes.json());
      if (pRes.ok) setPatients(await pRes.json());
      if (iRes.ok) setItems(await iRes.json());
    } catch (err) {
      console.error("Failed to load prescriptions data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLine = () => {
    if (!currentLine.item_id) return;
    setRxLines([...rxLines, {
      item_id: Number(currentLine.item_id),
      dosage: currentLine.dosage,
      duration_days: parseInt(currentLine.duration_days) || 5,
      total_qty: parseFloat(currentLine.total_qty) || 10,
      timing: currentLine.timing,
      instructions: currentLine.instructions
    }]);
    setCurrentLine({
      item_id: '',
      dosage: '1-0-1',
      duration_days: '5',
      total_qty: '10',
      timing: 'AFTER_MEAL',
      instructions: ''
    });
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedDoctorId || rxLines.length === 0) return;

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: Number(selectedPatientId),
          doctor_id: Number(selectedDoctorId),
          diagnosis: diagnosis,
          vitals: vitals,
          notes: notes,
          items: rxLines
        })
      });

      if (res.ok) {
        const created: Prescription = await res.json();
        setSuccessMsg(`Prescription #${created.prescription_no} issued successfully!`);
        setShowAddModal(false);
        setRxLines([]);
        setDiagnosis('');
        setNotes('');
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
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Stethoscope className="h-5 w-5 text-teal-400" />
            <span>Digital Prescription & Clinic Records</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Prescription header, dosage schedules (1-0-1), duration, and 1-click dispensing bridge.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-teal-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Write New Prescription</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Prescription Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prescriptions.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
            No digital prescriptions recorded yet. Click "Write New Prescription" to begin.
          </div>
        ) : (
          prescriptions.map(rx => (
            <div key={rx.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-teal-400 text-sm">{rx.prescription_no}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {rx.prescription_date}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base mt-1">{rx.patient_name || 'Patient'}</h3>
                  <p className="text-xs text-slate-400">Prescribing: {rx.doctor_name || 'Doctor'}</p>
                </div>
                {rx.vitals && (
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    {rx.vitals}
                  </span>
                )}
              </div>

              {rx.diagnosis && (
                <p className="text-xs text-slate-300 italic">
                  <span className="font-semibold text-slate-400">Diagnosis:</span> {rx.diagnosis}
                </p>
              )}

              {/* Prescribed Medicines List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Prescribed Medicines ({rx.items.length})</span>
                {rx.items.map((item, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{item.item_name || 'Medicine'}</span>
                      <span className="text-[11px] text-teal-300 ml-2 font-mono font-semibold">({item.dosage})</span>
                      <span className="text-[10px] text-slate-400 block">{item.timing} • {item.duration_days} days ({item.instructions || 'As advised'})</span>
                    </div>
                    <span className="font-bold text-sky-400 font-mono">{item.total_qty} Units</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Write Prescription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleCreatePrescription} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Write Electronic Prescription (e-Rx)</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Select Patient *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.patient_name} ({p.phone || 'No phone'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Prescribing Doctor *</label>
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.doctor_name} ({d.specialization})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Diagnosis / Symptoms</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Bronchitis, Fever"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Patient Vitals</label>
                <input
                  type="text"
                  value={vitals}
                  onChange={(e) => setVitals(e.target.value)}
                  placeholder="BP: 120/80, SpO2: 99%"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            {/* Medicine Prescription Sub-form */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">Add Medicine & Dosage</span>
              <div className="grid grid-cols-5 gap-2 items-end">
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Medicine *</label>
                  <select
                    value={currentLine.item_id}
                    onChange={(e) => setCurrentLine({ ...currentLine, item_id: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="">-- Select Product --</option>
                    {items.map(i => (
                      <option key={i.id} value={i.id}>{i.item_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Dosage</label>
                  <select
                    value={currentLine.dosage}
                    onChange={(e) => setCurrentLine({ ...currentLine, dosage: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="1-0-1">1-0-1 (M-N-N)</option>
                    <option value="1-0-0">1-0-0 (Morning)</option>
                    <option value="0-0-1">0-0-1 (Night)</option>
                    <option value="1-1-1">1-1-1 (TID)</option>
                    <option value="SOS">SOS (When needed)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Duration</label>
                  <input
                    type="number"
                    value={currentLine.duration_days}
                    onChange={(e) => setCurrentLine({ ...currentLine, duration_days: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-bold"
                  >
                    + Add Drug
                  </button>
                </div>
              </div>
            </div>

            {/* Prescribed Items Table */}
            {rxLines.length > 0 && (
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold">
                    <tr>
                      <th className="p-2">Medicine</th>
                      <th className="p-2">Dosage</th>
                      <th className="p-2">Duration</th>
                      <th className="p-2">Total Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {rxLines.map((line, idx) => {
                      const itm = items.find(i => i.id === line.item_id);
                      return (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-white">{itm?.item_name}</td>
                          <td className="p-2 font-mono text-teal-400">{line.dosage}</td>
                          <td className="p-2 text-slate-300">{line.duration_days} Days</td>
                          <td className="p-2 font-mono font-bold text-sky-400">{line.total_qty}</td>
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
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rxLines.length === 0}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold"
              >
                Save Electronic Prescription
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
