import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { FiPhone, FiGlobe, FiShield, FiUser, FiLogOut, FiLayers, FiUsers, FiLock } from "react-icons/fi";
import { SahKaarLogo } from "./SahKaariLogo";

export default function GovHeader() {
  const { lang, setLang } = useLanguage();
  const { user, logout, isSocietyAdmin, isFederationAdmin, isAdmin, isContractor } = useAuth();
  const navigate = useNavigate();
  const [fontSizeLevel, setFontSizeLevel] = useState(0);

  const isHi = lang === "hi";

  const handleFontResize = (delta) => {
    const next = Math.max(-1, Math.min(1, fontSizeLevel + delta));
    setFontSizeLevel(next);
    if (typeof document !== "undefined") {
      if (next === 1) document.documentElement.style.fontSize = "17px";
      else if (next === -1) document.documentElement.style.fontSize = "15px";
      else document.documentElement.style.fontSize = "16px";
    }
  };

  return (
    <div className="w-full bg-[#082B42] text-white select-none border-b border-[#0B3C5D]">
      {/* National Tricolor Accent Ribbon */}
      <div className="h-[3px] w-full flex">
        <div className="w-1/3 bg-[#FF9933]"></div>
        <div className="w-1/3 bg-[#FFFFFF]"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>

      {/* Top Institutional Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-medium gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-semibold text-white">भारत सरकार</span>
          <span className="text-slate-500">|</span>
          <span>Government of India</span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:inline text-amber-300 font-semibold">
            {isHi ? "सहकारिता मंत्रालय (NCCT)" : "Ministry of Cooperation"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-300 ml-auto">
          <a
            href="tel:18001802026"
            className="hidden sm:flex items-center gap-1.5 text-amber-300 hover:text-white transition-colors"
            title="National Cooperative Helpline"
          >
            <FiPhone className="w-3 h-3" />
            <span className="font-bold">1800-180-2026</span>
          </a>

          <div className="hidden sm:inline text-slate-600">|</div>

          <div className="flex items-center gap-1 bg-[#0B3C5D] rounded px-1.5 py-0.5 border border-slate-700">
            <button
              onClick={() => handleFontResize(-1)}
              className={`px-1 text-[10px] font-bold ${
                fontSizeLevel === -1 ? "text-amber-300 font-extrabold" : "text-slate-300 hover:text-white"
              }`}
              title="Decrease Font Size"
            >
              A-
            </button>
            <button
              onClick={() => handleFontResize(0)}
              className={`px-1 text-[10px] font-bold ${
                fontSizeLevel === 0 ? "text-amber-300 font-extrabold" : "text-slate-300 hover:text-white"
              }`}
              title="Normal Font Size"
            >
              A
            </button>
            <button
              onClick={() => handleFontResize(1)}
              className={`px-1 text-[10px] font-bold ${
                fontSizeLevel === 1 ? "text-amber-300 font-extrabold" : "text-slate-300 hover:text-white"
              }`}
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          <div className="text-slate-600">|</div>

          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="flex items-center gap-1 font-bold text-white bg-[#0B3C5D] hover:bg-[#0E4A73] px-2 py-0.5 rounded border border-slate-700 transition-colors"
          >
            <FiGlobe className="w-3 h-3 text-amber-300" />
            <span>{lang === "en" ? "हिंदी" : "English"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
