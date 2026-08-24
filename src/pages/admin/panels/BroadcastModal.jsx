import React, { useState } from "react";
import { adminAPI } from "../../../services/api";
import toast from "react-hot-toast";
import { FiRadio, FiSend, FiX, FiAlertCircle } from "react-icons/fi";

export default function BroadcastModal({ isOpen, onClose }) {
  const [message, setMessage] = useState("");
  const [targetState, setTargetState] = useState("");
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error("Please enter a broadcast message");

    setSending(true);
    try {
      const res = await adminAPI.sendBroadcast({
        message,
        target_state: targetState || undefined,
      });
      toast.success(
        `Broadcast sent successfully to ${res.data?.recipient_count || "all"} active users nationwide!`
      );
      setMessage("");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch broadcast");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600">
              <FiRadio className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Nationwide Emergency Broadcast
              </h3>
              <p className="text-[11px] text-slate-500">
                Pushes real-time audio chime + banner alert to all active users and artisans.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Geographic Filter (Optional)
            </label>
            <select
              value={targetState}
              onChange={(e) => setTargetState(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              <option value="">All India (Nationwide Broadcast)</option>
              <option value="Madhya Pradesh">Madhya Pradesh Only</option>
              <option value="Maharashtra">Maharashtra Only</option>
              <option value="Delhi">Delhi-NCR Only</option>
              <option value="Rajasthan">Rajasthan Only</option>
              <option value="Karnataka">Karnataka Only</option>
              <option value="Uttar Pradesh">Uttar Pradesh Only</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Announcement Message *
            </label>
            <textarea
              rows={4}
              required
              placeholder="e.g. SahKaari Cooperative Alert: Verification drives are live in Bhopal and Indore. Please keep your Aadhaar cards updated."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:border-red-500 outline-none"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 flex items-start gap-2 text-amber-800 dark:text-amber-300 text-[11px]">
            <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This will instantly broadcast to all open browser windows and mobile apps on the platform in real-time.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <FiSend className="w-4 h-4" />
              <span>{sending ? "Broadcasting..." : "Dispatch Broadcast"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
