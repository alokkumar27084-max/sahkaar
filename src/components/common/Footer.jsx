import React from "react";
import { Link } from "react-router-dom";
import { FiPhone, FiMail, FiMapPin, FiShield, FiCheckCircle, FiAward } from "react-icons/fi";
import { SahKaariLogo } from "./SahKaariLogo";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-14 pb-10 border-t border-slate-800 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* 4-Column Modern Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800 text-xs">
          
          {/* Col 1: Brand & Guarantee */}
          <div className="space-y-3">
            <Link to="/" className="inline-block">
              <SahKaariLogo className="w-10 h-10" showText={true} textClassName="text-xl text-white" animated={false} />
            </Link>

            <p className="text-slate-400 leading-relaxed text-xs">
              A cooperative-owned digital home services marketplace connecting certified Master artisans from registered Primary Labour Cooperatives directly with households.
            </p>

            <div className="pt-2 text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
              <FiShield className="w-4 h-4" />
              <span>100% Cooperative Verified & Insured</span>
            </div>
          </div>

          {/* Col 2: Master Trades */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
              Master Trades
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/search?category=electrical" className="hover:text-white transition-colors">Master Electricians (इलेक्ट्रीशियन)</Link></li>
              <li><Link to="/search?category=plumbing" className="hover:text-white transition-colors">Master Plumbers (प्लंबर)</Link></li>
              <li><Link to="/search?category=carpentry" className="hover:text-white transition-colors">Master Carpenters (बढ़ई / कारपेंटर)</Link></li>
              <li><Link to="/search?category=painting" className="hover:text-white transition-colors">Master Painters (पेंटर / रंगसाज)</Link></li>
              <li><Link to="/search?category=appliance_repair" className="hover:text-white transition-colors">AC & Appliance Technicians</Link></li>
              <li><Link to="/search?category=cleaning" className="hover:text-white transition-colors">Deep Cleaning & Housekeeping</Link></li>
            </ul>
          </div>

          {/* Col 3: For Masters & Partners */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
              For Masters & Societies
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/register/contractor" className="hover:text-indigo-400 font-bold transition-colors">Register as a SahKaari Master</Link></li>
              <li><Link to="/federation/dashboard" className="hover:text-white transition-colors">State Federation Verification Portal</Link></li>
              <li><Link to="/society/dashboard" className="hover:text-white transition-colors">Primary Society Admin Console</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Artisan Welfare & ₹5L Insurance</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy & Escrow Terms</Link></li>
            </ul>
          </div>

          {/* Col 4: Cooperative Support */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
              Helpdesk & Support
            </h4>
            <div className="space-y-2.5 text-slate-400 text-xs">
              <div className="flex items-center gap-2">
                <FiPhone className="text-indigo-400 shrink-0" />
                <span className="font-bold text-white">1800-180-2026 (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMail className="text-indigo-400 shrink-0" />
                <span>support@sahkaari.gov.in</span>
              </div>
              <div className="flex items-start gap-2">
                <FiMapPin className="text-indigo-400 shrink-0 mt-0.5" />
                <span>Apex Cooperative Bhawan, Central Zone, Bhopal (M.P.)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} SahKaari (सहकारी) • Cooperative Master Marketplace. All rights reserved.
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/terms" className="hover:text-slate-300">Terms of Service</Link>
            <Link to="/privacy-policy" className="hover:text-slate-300">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-slate-300">Refund Guarantee</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
