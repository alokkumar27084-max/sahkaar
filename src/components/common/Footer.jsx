import React from "react";
import { Link } from "react-router-dom";
import { FiLinkedin, FiInstagram, FiTwitter, FiGlobe } from "react-icons/fi";
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
              <ThekedaarLogo className="h-8 w-8" />
              <span className="font-bold text-base tracking-wider text-[var(--color-heading)] uppercase font-display">
                THEKEDAAR
              </span>
            </Link>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed max-w-xs">
              India's trusted marketplace for verified contractors and home services. Providing quality and transparency.
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

          {/* Column 2: Company */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a href="#about" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#careers" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#blog" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#press" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Press
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: For Customers */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider mb-4">
              For Customers
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a href="#how-it-works" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <Link to="/select-service" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Service Categories
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Trust & Safety
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: For Partners */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider mb-4">
              For Partners
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link to="/register/contractor" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Register as Partner
                </Link>
              </li>
              <li>
                <a href="#partner-resources" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Partner Resources
                </a>
              </li>
              <li>
                <a href="#success-stories" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] transition-colors">
                  Success Stories
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-[var(--color-border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Side: Copyright */}
          <div className="text-xs text-[var(--color-muted)] flex items-center gap-1">
            <span>© {new Date().getFullYear()} Thekedaar.</span>
            <span>Made with pride in India.</span>
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
