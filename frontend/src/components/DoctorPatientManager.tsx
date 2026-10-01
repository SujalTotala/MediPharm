import React, { useState, useEffect } from 'react';
import type { Doctor, Patient } from '../types';
import { Stethoscope, Users, Plus, Search, CheckCircle2 } from 'lucide-react';

export const DoctorPatientManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'doctors' | 'patients'>('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showDocModal, setShowDocModal] = useState(false);
  const [showPatModal, setShowPatModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Doctor Form
  const [docCode, setDocCode] = useState('');
  const [docName, setDocName] = useState('');
  const [docSpecialization, setDocSpecialization] = useState('General Physician');
  const [docRegNo, setDocRegNo] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docClinic, setDocClinic] = useState('');

  // Patient Form
  const [patCode, setPatCode] = useState('');
  const [patName, setPatName] = useState('');
  const [patPhone, setPatPhone] = useState('');
  const [patAge, setPatAge] = useState('');
  const [patGender, setPatGender] = useState('Male');
  const [patBloodGroup, setPatBloodGroup] = useState('O+');
  const [patAddress, setPatAddress] = useState('');

  const loadData = async () => {
    try {
      const [dRes, pRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/patients')
      ]);
      if (dRes.ok) setDoctors(await dRes.json());
      if (pRes.ok) setPatients(await pRes.json());
    } catch (err) {
      console.error("Failed to load doctors & patients:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docCode || !docName) return;

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_code: docCode.toUpperCase(),
          doctor_name: docName,
          specialization: docSpecialization,
          reg_no: docRegNo,
          phone: docPhone,
          clinic_address: docClinic,
          is_active: true
        })
      });

      if (res.ok) {
        setSuccessMsg(`Doctor ${docName} registered successfully!`);
        setShowDocModal(false);
        setDocCode('');
        setDocName('');
        setDocRegNo('');
        setDocPhone('');
        setDocClinic('');
        loadData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patCode || !patName) return;

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_code: patCode.toUpperCase(),
          patient_name: patName,
          phone: patPhone,
          whatsapp: patPhone,
          age: parseInt(patAge) || undefined,
          gender: patGender,
          blood_group: patBloodGroup,
          address: patAddress
        })
      });

      if (res.ok) {
        setSuccessMsg(`Patient ${patName} registered successfully!`);
        setShowPatModal(false);
        setPatCode('');
        setPatName('');
        setPatPhone('');
        setPatAge('');
        setPatAddress('');
        loadData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDoctors = doctors.filter(d => 
    d.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.reg_no && d.reg_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (d.specialization && d.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPatients = patients.filter(p => 
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.phone && p.phone.includes(searchTerm)) ||
    p.patient_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('doctors')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'doctors'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            <span>Doctors Directory ({doctors.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('patients')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'patients'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Patients Master ({patients.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeSubTab}...`}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          {activeSubTab === 'doctors' ? (
            <button
              onClick={() => {
                setDocCode(`DOC${(doctors.length + 1).toString().padStart(3, '0')}`);
                setShowDocModal(true);
              }}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Register Doctor</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setPatCode(`PAT${(patients.length + 1).toString().padStart(3, '0')}`);
                setShowPatModal(true);
              }}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Register Patient</span>
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

      {/* Table Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {activeSubTab === 'doctors' ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Doctor Name</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Medical Reg No (MCI)</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">Clinic / Hospital</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDoctors.map(d => (
                <tr key={d.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">{d.doctor_code}</td>
                  <td className="py-3 px-4 font-bold text-white text-sm">{d.doctor_name}</td>
                  <td className="py-3 px-4 text-slate-300">{d.specialization}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-teal-400">{d.reg_no || '—'}</td>
                  <td className="py-3 px-4 text-slate-300">{d.phone || '—'}</td>
                  <td className="py-3 px-4 text-slate-400">{d.clinic_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Patient Code</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Mobile / WhatsApp</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Residential Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">{p.patient_code}</td>
                  <td className="py-3 px-4 font-bold text-white text-sm">{p.patient_name}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">{p.phone || '—'}</td>
                  <td className="py-3 px-4 text-slate-300">{p.age ? `${p.age} yrs` : '—'} / {p.gender || '—'}</td>
                  <td className="py-3 px-4 font-semibold text-red-400">{p.blood_group || '—'}</td>
                  <td className="py-3 px-4 text-slate-400">{p.address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Register Doctor Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateDoctor} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Register Doctor</h3>
              <button type="button" onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Doctor Code *</label>
                <input
                  type="text"
                  required
                  value={docCode}
                  onChange={(e) => setDocCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Medical Reg No (MCI/State) *</label>
                <input
                  type="text"
                  required
                  value={docRegNo}
                  onChange={(e) => setDocRegNo(e.target.value)}
                  placeholder="MCI-184920"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Full Doctor Name with Degrees *</label>
              <input
                type="text"
                required
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Dr. Rajesh Varma, MD"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Specialization</label>
                <input
                  type="text"
                  value={docSpecialization}
                  onChange={(e) => setDocSpecialization(e.target.value)}
                  placeholder="General Physician"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Phone</label>
                <input
                  type="text"
                  value={docPhone}
                  onChange={(e) => setDocPhone(e.target.value)}
                  placeholder="9822011223"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Hospital / Clinic Address</label>
              <input
                type="text"
                value={docClinic}
                onChange={(e) => setDocClinic(e.target.value)}
                placeholder="Apollo Clinic, Sector 14"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold"
              >
                Save Doctor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Register Patient Modal */}
      {showPatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCreatePatient} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Register Patient</h3>
              <button type="button" onClick={() => setShowPatModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Patient Code *</label>
                <input
                  type="text"
                  required
                  value={patCode}
                  onChange={(e) => setPatCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Mobile / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={patPhone}
                  onChange={(e) => setPatPhone(e.target.value)}
                  placeholder="9810012345"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={patName}
                onChange={(e) => setPatName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Age</label>
                <input
                  type="number"
                  value={patAge}
                  onChange={(e) => setPatAge(e.target.value)}
                  placeholder="45"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Gender</label>
                <select
                  value={patGender}
                  onChange={(e) => setPatGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Blood Group</label>
                <select
                  value={patBloodGroup}
                  onChange={(e) => setPatBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Residential Address</label>
              <input
                type="text"
                value={patAddress}
                onChange={(e) => setPatAddress(e.target.value)}
                placeholder="Apartment / Colony address..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowPatModal(false)}
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
