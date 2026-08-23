import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPrinter, FiCheckCircle, FiShield, FiFileText, FiDownload } from "react-icons/fi";
import { cooperativeAPI } from "../../services/api";
import { SahKaariLogo } from "./SahKaariLogo";
import LoadingSpinner from "./LoadingSpinner";
import toast from "react-hot-toast";

export default function CooperativeInvoiceModal({ bookingId, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    if (!isOpen || !bookingId) return;
    async function loadInvoice() {
      setLoading(true);
      try {
        const res = await cooperativeAPI.getInvoice(bookingId);
        if (res.data?.ok) {
          setInvoice(res.data.invoice);
        }
      } catch (err) {
        console.error("Invoice load error:", err);
        toast.error("Failed to load official invoice");
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        >
          {/* Top Actions Ribbon (Hidden in Print) */}
          <div className="print:hidden bg-[#082B42] text-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <FiFileText className="text-amber-400 w-4 h-4" />
              <span>Official Cooperative Tax Invoice & Receipt</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-[#0B3C5D] hover:bg-[#0E4A73] text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-600 transition-colors"
              >
                <FiPrinter size={13} />
                <span>Print / PDF</span>
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-slate-500 font-semibold mt-3">Generating certified cooperative receipt...</p>
            </div>
          ) : !invoice ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Invoice details unavailable.
            </div>
          ) : (
            <div className="p-8 space-y-6 text-slate-800 text-xs">
              
              {/* Header: Cooperative Federation & Government Stamp */}
              <div className="flex items-start justify-between border-b-2 border-[#0B3C5D] pb-5">
                <div className="flex items-center gap-3">
                  <SahKaariLogo className="w-12 h-12" />
                  <div>
                    <div className="text-base font-extrabold text-[#0B3C5D]">
                      {invoice.society.name}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600">
                      Affiliated to: {invoice.society.federation}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      Society Reg No: <span className="font-bold text-slate-800">{invoice.society.registrationNo}</span> | District: {invoice.society.district}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-md mb-1">
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    <span>TAX INVOICE</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-900 font-bold">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Date: {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Billed To & Service Provider Info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                    Customer / Citizen (Billed To)
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{invoice.customer.name}</div>
                  <div className="text-slate-600 mt-0.5">{invoice.customer.address}</div>
                  {invoice.customer.phone && (
                    <div className="text-slate-500 mt-0.5">Phone: {invoice.customer.phone}</div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                    Certified Cooperative Artisan
                  </div>
                  <div className="font-bold text-[#0B3C5D] text-sm">{invoice.worker.name}</div>
                  <div className="text-slate-600 capitalize font-medium">{invoice.worker.trade} Specialist</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    NCCT Member ID: <span className="font-semibold text-slate-800">{invoice.worker.memberRegNo}</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                    <FiShield className="w-3 h-3" /> PM Suraksha Bima Cover Active
                  </div>
                </div>
              </div>

              {/* Itemized Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#EDF4F9] text-[#0B3C5D] font-extrabold text-[11px]">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.lineItems.map((item, idx) => (
                      <tr key={idx} className={idx === 1 ? "bg-amber-50/50" : ""}>
                        <td className="p-3 font-medium text-slate-800">
                          {item.description}
                          {idx === 1 && (
                            <span className="block text-[10px] text-amber-800 font-normal mt-0.5">
                              • Direct contribution to primary society welfare corpus (Artisan pensions & tool grants)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ₹{Number(item.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Service Value</span>
                    <span className="font-mono">₹{invoice.summary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>Welfare Pool Contribution</span>
                    <span className="font-mono">₹{invoice.summary.welfareCorpusFund.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (CGST + SGST @ 18%)</span>
                    <span className="font-mono">₹{invoice.summary.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-[#0B3C5D] pt-2 border-t-2 border-[#0B3C5D]">
                    <span>Total Amount Paid</span>
                    <span className="font-mono">₹{invoice.summary.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Escrow Seal & Institutional Declaration */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-[11px] text-emerald-900">
                <div className="flex items-center gap-2">
                  <FiShield className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                  <div>
                    <div className="font-bold">Government Cooperative Escrow Guaranteed</div>
                    <div className="text-[10px] text-emerald-700">
                      Payment secured under Cooperative Digital Settlement Rules 2026.
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-[10px] text-emerald-800 font-semibold">
                  STATUS: {invoice.paymentStatus}
                </div>
              </div>

            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
