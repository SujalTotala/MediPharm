import React from 'react';
import type { Invoice } from '../types';
import { Printer, X, CheckCircle } from 'lucide-react';

interface PrintInvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const hasH1 = invoice.items.some(i => i.is_schedule_h1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Controls (Not printed) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold text-white">Invoice Generated Successfully</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium shadow-md transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 bg-white text-slate-900 overflow-y-auto font-sans leading-relaxed text-xs printable-invoice">
          {/* Pharmacy Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
            <h1 className="text-xl font-black tracking-wider uppercase text-slate-950">
              MEDIPHARM HEALTHCARE & PHARMACY
            </h1>
            <p className="text-slate-600 font-medium">
              104, Central Market, Medical Square, City Center - 400001
            </p>
            <div className="flex justify-center space-x-6 text-[11px] font-semibold text-slate-700 mt-1">
              <span>DL No: 20B/21B-MH-492019</span>
              <span>•</span>
              <span>GSTIN: 27AAAAA0000A1Z5</span>
              <span>•</span>
              <span>Ph: +91 98765 43210</span>
            </div>
            <div className="mt-2 inline-block px-3 py-0.5 bg-slate-100 border border-slate-300 font-bold uppercase text-[10px] tracking-wider text-slate-800">
              TAX INVOICE / CASH MEMO (RETAIL)
            </div>
          </div>

          {/* Invoice & Patient Meta */}
          <div className="grid grid-cols-2 gap-4 mb-4 border border-slate-200 p-3 rounded bg-slate-50">
            <div>
              <p><span className="font-semibold text-slate-600">Invoice No:</span> <span className="font-bold text-slate-900">{invoice.invoice_no}</span></p>
              <p><span className="font-semibold text-slate-600">Date & Time:</span> {new Date(invoice.invoice_date).toLocaleString('en-IN')}</p>
              <p><span className="font-semibold text-slate-600">Payment Mode:</span> <span className="font-bold">{invoice.payment_mode}</span></p>
              <p><span className="font-semibold text-slate-600">Billed By:</span> {invoice.salesman_name}</p>
            </div>
            <div>
              <p><span className="font-semibold text-slate-600">Patient / Customer:</span> <span className="font-bold text-slate-900">{invoice.customer_name}</span></p>
              {invoice.customer_phone && (
                <p><span className="font-semibold text-slate-600">Mobile:</span> {invoice.customer_phone}</p>
              )}
              <p><span className="font-semibold text-slate-600">Doctor:</span> {invoice.doctor_name || 'Self / OTC'}</p>
              {invoice.prescription_ref && (
                <p><span className="font-semibold text-slate-600">Rx Ref:</span> {invoice.prescription_ref}</p>
              )}
            </div>
          </div>

          {/* Schedule H1 Warning Notice if applicable */}
          {hasH1 && (
            <div className="mb-3 p-2 bg-red-50 border border-red-300 rounded text-red-800 text-[10px] font-semibold flex items-center justify-between">
              <span>⚠️ SCHEDULE H1 DRUG INVOICE — Prescribed by Registered Medical Practitioner. Mandatory register maintained.</span>
            </div>
          )}

          {/* Itemized Table */}
          <table className="w-full border-collapse mb-4 text-left">
            <thead>
              <tr className="border-y-2 border-slate-900 bg-slate-100 font-bold text-[11px]">
                <th className="py-1.5 px-1 w-6">#</th>
                <th className="py-1.5 px-1">Description of Medicine</th>
                <th className="py-1.5 px-1">HSN</th>
                <th className="py-1.5 px-1">Batch</th>
                <th className="py-1.5 px-1">Exp</th>
                <th className="py-1.5 px-1 text-right">Qty</th>
                <th className="py-1.5 px-1 text-right">MRP</th>
                <th className="py-1.5 px-1 text-right">Rate</th>
                <th className="py-1.5 px-1 text-right">Disc%</th>
                <th className="py-1.5 px-1 text-right">GST%</th>
                <th className="py-1.5 px-1 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-1 px-1 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-1 px-1 font-medium">
                    {item.item_name}
                    {item.is_schedule_h1 && <span className="ml-1 text-[9px] font-bold text-red-600 bg-red-100 px-1 rounded">H1</span>}
                  </td>
                  <td className="py-1 px-1 text-slate-600">{item.hsn_code}</td>
                  <td className="py-1 px-1 font-mono font-semibold">{item.batch_no}</td>
                  <td className="py-1 px-1 text-slate-600">{item.expiry_date}</td>
                  <td className="py-1 px-1 text-right font-bold">{item.quantity}{item.free_qty > 0 && <span className="text-emerald-600 font-normal"> +{item.free_qty}F</span>}</td>
                  <td className="py-1 px-1 text-right tabular-nums">{item.unit_mrp.toFixed(2)}</td>
                  <td className="py-1 px-1 text-right tabular-nums">{item.unit_rate.toFixed(2)}</td>
                  <td className="py-1 px-1 text-right tabular-nums">{item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}</td>
                  <td className="py-1 px-1 text-right tabular-nums">{item.gst_rate}%</td>
                  <td className="py-1 px-1 text-right font-bold tabular-nums">{item.net_line_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Summary & Net Total Grid */}
          <div className="grid grid-cols-2 gap-6 border-t-2 border-slate-900 pt-3">
            <div>
              <h4 className="font-bold text-[10px] text-slate-600 uppercase mb-1">GST Tax Breakdown</h4>
              <table className="w-full text-[10px] border border-slate-200">
                <thead className="bg-slate-100 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-1">Taxable</th>
                    <th className="p-1 text-right">CGST</th>
                    <th className="p-1 text-right">SGST</th>
                    <th className="p-1 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-1 font-mono">₹{invoice.taxable_amount.toFixed(2)}</td>
                    <td className="p-1 text-right font-mono">₹{invoice.cgst_amount.toFixed(2)}</td>
                    <td className="p-1 text-right font-mono">₹{invoice.sgst_amount.toFixed(2)}</td>
                    <td className="p-1 text-right font-bold font-mono">₹{(invoice.cgst_amount + invoice.sgst_amount).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[9px] text-slate-500 mt-2 italic">
                * Goods once sold will not be taken back without original bill. Please store medicines below 25°C.
              </p>
            </div>

            <div className="space-y-1 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Gross Total:</span>
                <span className="font-mono">₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Total Discount:</span>
                  <span className="font-mono">-₹{invoice.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Total GST:</span>
                <span className="font-mono">₹{(invoice.cgst_amount + invoice.sgst_amount + invoice.igst_amount).toFixed(2)}</span>
              </div>
              {invoice.round_off !== 0 && (
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Round Off:</span>
                  <span className="font-mono">{invoice.round_off > 0 ? `+₹${invoice.round_off.toFixed(2)}` : `-₹${Math.abs(invoice.round_off).toFixed(2)}`}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm border-t border-slate-900 pt-1 text-slate-950">
                <span>NET PAYABLE:</span>
                <span className="font-mono">₹{invoice.net_amount.toFixed(2)}</span>
              </div>
              {invoice.cash_received > 0 && (
                <div className="text-[10px] text-slate-600 pt-1">
                  <span>Tendered: ₹{invoice.cash_received.toFixed(2)} | Change: ₹{invoice.change_returned.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Signature */}
          <div className="mt-8 pt-6 border-t border-dashed border-slate-300 flex justify-between items-end text-[10px] text-slate-600">
            <div>
              <p>Thank you for choosing MediPharm Healthcare!</p>
              <p className="font-mono text-[9px] text-slate-400">Generated via MediPharm POS</p>
            </div>
            <div className="text-center">
              <div className="h-8 border-b border-slate-400 w-36 mb-1"></div>
              <p className="font-semibold text-slate-800">Authorized Pharmacist</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
