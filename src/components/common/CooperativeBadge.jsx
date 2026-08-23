import React from "react";
import { FiShield, FiCheckCircle, FiAward, FiHeart } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";

export default function CooperativeBadge({
  societyName = "Bhopal Shramik & Karigar Sahakari Samiti",
  federationName = "MP State Labour Cooperative Federation",
  size = "md",
  variant = "full", // 'compact', 'inline', 'full', 'card'
  showWelfare = false,
  className = "",
}) {
  const { lang } = useLanguage();
  const isHi = lang === "hi";

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs ${className}`}
        title={`Verified by ${societyName}`}
      >
        <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="truncate max-w-[170px]">
          {isHi ? "सहकारी सत्यापित" : "Co-op Verified"}
        </span>
      </span>
    );
  }

  if (variant === "card") {
    return (
      <div className={`p-2.5 rounded-xl bg-teal-50/80 border border-teal-200/70 text-xs text-teal-950 flex items-center justify-between gap-2 ${className}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
            <FiShield className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="font-bold text-primary flex items-center gap-1 text-[11px]">
              <span>{isHi ? "सहकारी समिति द्वारा सत्यापित" : "Cooperative Verified"}</span>
              <FiCheckCircle className="w-3 h-3 text-emerald-600 inline" />
            </div>
            <div className="text-[11px] text-teal-800 font-medium truncate">
              {societyName || "Labour Cooperative Society"}
            </div>
          </div>
        </div>
        {showWelfare && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md shrink-0">
            <FiHeart className="w-3 h-3 text-amber-600" />
            {isHi ? "कल्याण सुरक्षा" : "Welfare Active"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-3.5 bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white shadow-md border border-teal-700/40 relative overflow-hidden ${className}`}>
      {/* Background seal watermarks */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full border-4 border-white/5 pointer-events-none" />
      <div className="absolute right-4 top-3 text-teal-400/20 pointer-events-none">
        <FiAward className="w-16 h-16" />
      </div>

      <div className="relative z-10 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-sm">
          <FiShield className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold tracking-wider uppercase text-amber-400">
              {isHi ? "आधिकारिक सहकारी मान्यता" : "Official Cooperative Affiliation"}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
              <FiCheckCircle className="w-3 h-3" />
              {isHi ? "सत्यापित सदस्य" : "Verified Member"}
            </span>
          </div>

          <div className="text-sm font-bold text-white mt-1 leading-snug">
            {societyName}
          </div>
          <div className="text-xs text-teal-200/90 mt-0.5">
            {federationName}
          </div>

          {showWelfare && (
            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center gap-4 text-xs text-teal-100 flex-wrap">
              <span className="flex items-center gap-1.5">
                <FiHeart className="w-3.5 h-3.5 text-amber-400" />
                {isHi ? "कल्याण कोष: सक्रिय अंशदान" : "Welfare Fund: Active Contributor"}
              </span>
              <span className="flex items-center gap-1.5">
                <FiShield className="w-3.5 h-3.5 text-emerald-400" />
                {isHi ? "प्रधानमंत्री सुरक्षा बीमा: ₹5,00,000" : "Accidental Insurance: ₹5,00,000"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
