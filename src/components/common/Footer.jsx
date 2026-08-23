import React from "react";
import { Link } from "react-router-dom";
import { SahKaariLogo } from "./SahKaariLogo";
import { FiPhone, FiMail, FiMapPin, FiShield, FiCheckCircle } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="bg-[#082B42] text-slate-300 pt-12 pb-8 border-t-4 border-[#0B3C5D] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* 4-Column Government Portal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-700/60 text-xs">
          
          {/* Col 1: Institutional Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <SahKaariLogo className="h-10 w-10" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-lg text-white font-display leading-none">
                    सह<span className="text-[#FF9933]">कारी</span>
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="font-bold text-sm text-slate-200 font-display leading-none">
                    SahKaari
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#138808] mt-0.5">
                  राष्ट्रीय श्रम सहकारी सेवा मंच
                </span>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed text-[11px]">
              A cooperative-owned digital service marketplace connecting skilled workers from Labour Cooperative Federations and Societies with households and institutions across Bharat.
            </p>

            <div className="pt-2 text-[10px] text-amber-300 font-semibold flex items-center gap-1.5">
              <FiShield className="w-3.5 h-3.5" />
              <span>National Council for Cooperative Training (NCCT) Certified</span>
            </div>
          </div>

          {/* Col 2: Certified Trades */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider border-b border-slate-700 pb-1 text-[#FF9933]">
              Accredited Trades
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/search?category=electrical" className="hover:text-white transition-colors">Electricians (इलेक्ट्रीशियन)</Link></li>
              <li><Link to="/search?category=plumbing" className="hover:text-white transition-colors">Plumbers (प्लंबर)</Link></li>
              <li><Link to="/search?category=carpentry" className="hover:text-white transition-colors">Carpenters (बढ़ई / कारपेंटर)</Link></li>
              <li><Link to="/search?category=painting" className="hover:text-white transition-colors">Painters (पेंटर / रंगसाज)</Link></li>
              <li><Link to="/search?category=domestic_help" className="hover:text-white transition-colors">Domestic Helpers (घरेलू सहायिका)</Link></li>
              <li><Link to="/search?category=appliance_repair" className="hover:text-white transition-colors">Appliance Technicians (तकनीशियन)</Link></li>
            </ul>
          </div>

          {/* Col 3: Institutional Portals */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider border-b border-slate-700 pb-1 text-[#FF9933]">
              Administrative Portals
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/federation/dashboard" className="hover:text-amber-300 transition-colors">State Federation Apex Portal</Link></li>
              <li><Link to="/society/dashboard" className="hover:text-amber-300 transition-colors">District Society Admin Console</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Official Authority Login</Link></li>
              <li><Link to="/register/contractor" className="hover:text-white transition-colors">Artisan Society Onboarding</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Cooperative Citizen Charter</Link></li>
            </ul>
          </div>

          {/* Col 4: Helpdesk & Grievance */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider border-b border-slate-700 pb-1 text-[#FF9933]">
              Cooperative Helpdesk
            </h4>
            <div className="space-y-2 text-slate-400 text-[11px]">
              <div className="flex items-center gap-2">
                <FiPhone className="text-amber-400 shrink-0" />
                <span className="font-bold text-white">1800-180-2026 (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMail className="text-amber-400 shrink-0" />
                <span>support@sahkaari.gov.in</span>
              </div>
              <div className="flex items-start gap-2">
                <FiMapPin className="text-amber-400 shrink-0 mt-0.5" />
                <span>Apex Cooperative Bhawan, Central Zone, Bhopal (M.P.)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Tricolor Strip */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} SahKaari (सहकारी) • National Labour Cooperative Marketplace Portal.
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span>Accessibility Compliant (WCAG 2.1)</span>
            <span>•</span>
            <span>Digital India Aligned</span>
          </div>
        </div>

      </div>

      {/* Bottom Tricolor Accent Ribbon */}
      <div className="h-[4px] w-full flex mt-6">
        <div className="w-1/3 bg-[#FF9933]"></div>
        <div className="w-1/3 bg-[#FFFFFF]"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>
    </footer>
  );
}
