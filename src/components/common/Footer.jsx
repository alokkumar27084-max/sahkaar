import React from "react";
import { Link } from "react-router-dom";
import { FiLinkedin, FiInstagram, FiTwitter } from "react-icons/fi";
import { ThekedaarLogo } from "./ThekedaarLogo";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-bg-elevated)] border-t border-[var(--color-border)] pt-16 pb-12 px-6 md:px-12">
      <div className="max-w-[var(--max-width)] mx-auto">
        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Brand Info */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <ThekedaarLogo className="h-9 w-9" />
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-[var(--color-heading)] leading-none font-display">
                  Sah<span className="text-primary">Kaari</span>
                </span>
                <span className="text-[9px] font-bold text-amber-600 tracking-wider uppercase">
                  सहकारी श्रम मंच
                </span>
              </div>
            </Link>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed max-w-xs">
              Bharat's cooperative-owned digital marketplace connecting verified workers from Labour Cooperative Federations and Societies with households and enterprises.
            </p>
            <div className="flex gap-3 mt-2">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:border-[var(--color-heading)] transition-all"
                title="LinkedIn"
              >
                <FiLinkedin size={15} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:border-[var(--color-heading)] transition-all"
                title="Instagram"
              >
                <FiInstagram size={15} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:border-[var(--color-heading)] transition-all"
                title="Twitter"
              >
                <FiTwitter size={15} />
              </a>
            </div>
          </div>

          {/* Column 2: Cooperative Governance */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider mb-4">
              Cooperative System
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link to="/federation-dashboard" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  State Federations
                </Link>
              </li>
              <li>
                <Link to="/society-dashboard" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Primary Societies Roster
                </Link>
              </li>
              <li>
                <a href="#welfare" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Welfare Corpus Fund
                </a>
              </li>
              <li>
                <a href="#insurance" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Pradhan Mantri Suraksha Bima
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: For Households & Institutions */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider mb-4">
              For Households & Institutions
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link to="/search" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Book Verified Worker
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Cooperative Trades
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Escrow Guarantee
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: For Workers */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider mb-4">
              For Cooperative Workers
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link to="/register/contractor" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Register with Society
                </Link>
              </li>
              <li>
                <a href="#training" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  NCCT Skill Certification
                </a>
              </li>
              <li>
                <a href="#welfare-claims" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Social Security Benefits
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-[var(--color-border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Side: Copyright */}
          <div className="text-xs text-[var(--color-muted)] flex items-center gap-1">
            <span>© {new Date().getFullYear()} SahKaari Cooperative Marketplace.</span>
            <span>Made with pride in India for Bharat.</span>
          </div>

          {/* Right Side: Legal Links */}
          <div className="flex items-center gap-4 text-xs">
            <Link to="/terms" className="text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
              Terms of Service
            </Link>
            <span className="text-[var(--color-border)]">•</span>
            <Link to="/privacy-policy" className="text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-[var(--color-border)]">•</span>
            <Link to="/refund-policy" className="text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
              Refund & Cancellation
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
