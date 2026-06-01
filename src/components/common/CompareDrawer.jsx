import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowUpRight, FiCheck, FiChevronDown, FiChevronUp, FiMessageCircle } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import { getAvatarUrl } from "../../utils/imageUtils";

function formatPrice(value) {
  if (!value) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function formatDistance(value) {
  if (value == null) return "—";
  return `${Number(value).toFixed(1)} km`;
}

export default function CompareDrawer({ contractors, onRemove, onClear }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const compareRows = useMemo(
    () => [
      {
        label: lang === "hi" ? "रेटिंग" : "Rating",
        value: (c) => (
          <div className="flex items-center gap-1.5 font-black text-amber-400">
            {Number(c.rating || 0).toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">/ 5</span>
          </div>
        ),
      },
      {
        label: lang === "hi" ? "रिव्यू" : "Reviews",
        value: (c) => <span className="font-bold text-white">{c.review_count ?? c.reviews_count ?? 0}</span>,
      },
      {
        label: lang === "hi" ? "दैनिक दर" : "Daily Rate",
        value: (c) => <span className="font-bold text-emerald-400">{formatPrice(c.daily_rate)}</span>,
      },
      {
        label: lang === "hi" ? "अनुभव" : "Experience",
        value: (c) => <span className="font-bold text-white">{c.experience_years ? `${c.experience_years}y` : "—"}</span>,
      },
      {
        label: lang === "hi" ? "दूरी" : "Distance",
        value: (c) => <span className="text-cyan-400 font-bold">{formatDistance(c.distance_km)}</span>,
      },
      {
        label: lang === "hi" ? "वेरिफाइड" : "Verified",
        value: (c) => (c.is_verified ? <FiCheck className="text-emerald-500" size={18} /> : <span className="text-slate-600">—</span>),
      },
    ],
    [lang]
  );

  if (!contractors.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-[250] px-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0D1021]/90 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-10 duration-500">

        {/* Compact Header */}
        <div className="flex flex-col gap-4 px-8 py-5 md:flex-row md:items-center md:justify-between border-b border-white/5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex -space-x-3">
              {contractors.map(c => (
                <div key={c.id} className="w-10 h-10 rounded-full border-4 border-[#0D1021] bg-slate-800 overflow-hidden ring-1 ring-white/10">
                  <img src={getAvatarUrl(c.photo_url)} alt="Pro" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="ml-2">
              <span className="text-sm font-black text-white uppercase tracking-widest">
                Compare Pros <span className="text-indigo-400 ml-1">({contractors.length}/3)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              {expanded ? "Close Table" : "Compare Now"}
              {expanded ? <FiChevronDown /> : <FiChevronUp />}
            </button>
          </div>
        </div>

        {/* Expanded Comparison Table */}
        {expanded && (
          <div className="max-h-[60vh] overflow-auto p-8 custom-scrollbar">
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Metric</th>
                    {contractors.map((c) => (
                      <th key={c.id} className="px-6 py-5 text-left border-l border-white/5">
                        <div className="text-sm font-black text-white truncate max-w-[150px]">{c.name || c.business_name}</div>
                        <div className="mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">{(c.category || "General").replace("_", " ")}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {compareRows.map((row) => (
                    <tr key={row.label} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">{row.label}</td>
                      {contractors.map((c) => (
                        <td key={`${c.id}-${row.label}`} className="px-6 py-4 border-l border-white/5">
                          {row.value(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-white/[0.01]">
                    <td className="px-6 py-6 text-xs font-bold text-slate-400">Actions</td>
                    {contractors.map((c) => (
                      <td key={`${c.id}-actions`} className="px-6 py-6 border-l border-white/5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate("/chat", { state: { initChatWith: c.id } })}
                            className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            <FiMessageCircle size={16} />
                          </button>
                          <Link
                            to={`/contractor/${c.id}`}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white border border-white/10 hover:border-white/30 transition-all"
                          >
                            Profile <FiArrowUpRight size={14} />
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
