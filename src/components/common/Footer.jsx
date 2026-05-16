import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiStar, FiArrowRight, FiMail, FiPhone, FiMapPin, FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const SITE_NAME = "Thekedaar";

export default function Footer() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <footer id="contact" className="border-t border-[var(--color-border)] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0C0F1D, #13151D)' }}>
      {/* Background large text */}
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 font-display font-extrabold uppercase text-white/[0.02] whitespace-nowrap pointer-events-none leading-none tracking-[-0.04em]" style={{ fontSize: 'clamp(6rem, 15vw, 14rem)' }}>
        {SITE_NAME}
      </div>

      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 grid md:grid-cols-2 lg:grid-cols-5 gap-12 relative z-10">
        {/* Brand */}
        <div>
          <p className="font-display text-2xl font-black text-white mb-4 tracking-tight">{SITE_NAME}</p>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            India's premier contractor discovery and booking platform. We bring transparency, quality, and trust to every project through milestone-based escrow payments.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <p className="font-display font-bold text-[11px] text-slate-500 mb-6 uppercase tracking-[0.2em]">Explore</p>
          <div className="grid gap-3.5 text-sm">
            <Link to="/" className="text-slate-400 hover:text-indigo-400 transition-colors">Home</Link>
            <Link to="/macro-services" className="text-slate-400 hover:text-indigo-400 transition-colors">Thekedaar Services</Link>
            <Link to="/search" className="text-slate-400 hover:text-indigo-400 transition-colors">Find Contractors</Link>
            <Link to="/register/contractor" className="text-slate-400 hover:text-indigo-400 transition-colors">Join as Contractor</Link>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <p className="font-display font-bold text-[11px] text-slate-500 mb-6 uppercase tracking-[0.2em]">Support</p>
          <div className="grid gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-3">
              <FiMail className="text-indigo-500" />
              <span>apkathekedaar@gmail.com</span>
            </div>
            <div className="flex items-center gap-3">
              <FiPhone className="text-indigo-500" />
              <span>+91 8303959728</span>
            </div>
            <div className="flex items-start gap-3">
              <FiMapPin className="text-indigo-500 mt-0.5" />
              <span>Manit Bhopal, Madhya Pradesh<br />462003, India</span>
            </div>
          </div>
        </div>

        {/* Legal & Social */}
        <div>
          <p className="font-display font-bold text-[11px] text-slate-500 mb-6 uppercase tracking-[0.2em]">Legal</p>
          <div className="grid gap-3.5 text-sm mb-6">
            <Link to="/terms" className="text-slate-400 hover:text-indigo-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy-policy" className="text-slate-400 hover:text-indigo-400 transition-colors">Privacy Policy</Link>
            <Link to="/refund-policy" className="text-slate-400 hover:text-indigo-400 transition-colors">Refund & Cancellation</Link>
          </div>
          
          <div className="flex gap-3">
            {["LinkedIn", "X", "Instagram"].map((s) => (
              <a 
                key={s} 
                href={`https://${s.toLowerCase()}.com`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl border border-white/[0.08] flex items-center justify-center text-slate-500 hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all"
                title={s}
              >
                <span className="text-[10px] font-bold">{s[0]}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Account Control (Only for logged in users) */}
        {user && (
          <div>
            <p className="font-display font-bold text-[11px] text-slate-500 mb-6 uppercase tracking-[0.2em]">Account Control</p>
            <div className="space-y-6">
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/profile')}>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-lg">
                  <FiUser size={18} />
                </div>
                <div>
                  <p className="text-[12px] font-black text-white tracking-tight leading-tight">{user.name || 'User Profile'}</p>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Manage Account</p>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full group flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-rose-500/10 hover:border-rose-500/30 transition-all duration-500"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-rose-500 transition-colors">
                    <FiLogOut size={16} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white">Secure Logout</span>
                </div>
                <FiArrowRight size={14} className="text-slate-700 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.04] relative z-10">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-6 text-[11px] flex flex-wrap items-center justify-between gap-4">
          <p className="text-slate-600 font-medium">© {new Date().getFullYear()} {SITE_NAME}. Made with pride in India.</p>
          <div className="flex items-center gap-6">
            <Link to="/login?admin=1" className="text-slate-600 hover:text-indigo-400 transition-colors">Admin Dashboard</Link>
            <span className="text-slate-800">|</span>
            <span className="text-slate-600">v1.0.0-production</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
