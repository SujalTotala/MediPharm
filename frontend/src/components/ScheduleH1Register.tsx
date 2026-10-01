import React, { useState, useEffect } from 'react';
import type { ScheduleH1Record } from '../types';
import { ShieldAlert, Download, Printer, RefreshCw, Database, CheckCircle2 } from 'lucide-react';

export const ScheduleH1Register: React.FC = () => {
  const [records, setRecords] = useState<ScheduleH1Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  const fetchRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/schedule-h1');
      if (res.ok) {
        setRecords(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch Schedule H1 register:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegister();
  }, []);

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = [
      "Invoice No", "Date", "Patient Name", "Patient Phone", "Patient Address",
      "Doctor Name", "Doctor Reg No", "Medicine Name", "Batch No", "Expiry Date", "Qty Dispensed", "Pharmacist Signature"
    ];
    const rows = records.map(r => [
      r.invoice_no,
      r.date,
      `"${r.patient_name}"`,
      r.patient_phone,
      `"${r.patient_address}"`,
      `"${r.doctor_name}"`,
      `"${r.doctor_reg_no}"`,
      `"${r.medicine_name}"`,
      r.batch_no,
      r.expiry_date,
      r.quantity_dispensed,
      `"${r.pharmacist_sign}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Schedule_H1_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBackup = () => {
    window.open('/api/system/backup', '_blank');
    setBackupSuccess("Database backup archive generated and downloaded!");
    setTimeout(() => setBackupSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Statutory Schedule H1 Drug Register</h2>
            <p className="text-xs text-slate-400">
              Mandatory record under Drugs and Cosmetics Rules (Rule 65): Retained for 3 years for drug inspector audit.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchRegister}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            title="Refresh Register"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md"
          >
            <Printer className="h-4 w-4" />
            <span>Print Register</span>
          </button>
          <button
            onClick={handleDownloadBackup}
            className="px-3.5 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md"
            title="Create and download complete database backup"
          >
            <Database className="h-4 w-4" />
            <span>DB Backup</span>
          </button>
        </div>
      </div>

      {backupSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{backupSuccess}</span>
        </div>
      )}

      {/* Schedule H1 Register Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Invoice No</th>
                <th className="py-3 px-4">Patient Name & Address</th>
                <th className="py-3 px-4">Prescribing Doctor & Reg No</th>
                <th className="py-3 px-4">Drug / Salt Name</th>
                <th className="py-3 px-3">Batch No</th>
                <th className="py-3 px-2 text-right">Qty</th>
                <th className="py-3 px-3 text-center">Pharmacist Sign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No Schedule H1 drugs dispensed yet. Any dispensed Schedule H1 drugs will automatically appear in this statutory register.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 font-sans">
                    <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">{r.date}</td>
                    <td className="py-3 px-3 font-mono font-bold text-sky-400">{r.invoice_no}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{r.patient_name}</span>
                      <span className="text-[10px] text-slate-400">{r.patient_address} (Ph: {r.patient_phone})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-teal-300 block">{r.doctor_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">Reg: {r.doctor_reg_no}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-red-300">{r.medicine_name}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-200">{r.batch_no}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-white">{r.quantity_dispensed}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{r.pharmacist_sign}</td>
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
