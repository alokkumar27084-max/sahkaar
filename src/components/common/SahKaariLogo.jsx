import React from "react";

export function SahKaariLogo({ className = "h-10 w-10", showText = false, textClassName = "text-xl" }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="SahKaari Cooperative Marketplace logo">
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full drop-shadow-sm"
          role="img"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="skTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F5C5C" />
              <stop offset="100%" stopColor="#0A3C3C" />
            </linearGradient>
            <linearGradient id="skGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#E08E0B" />
            </linearGradient>
            <linearGradient id="skRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5A623" />
              <stop offset="50%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#F5A623" />
            </linearGradient>
          </defs>

          {/* Hexagonal / Rounded Cooperative Shield */}
          <rect x="6" y="6" width="88" height="88" rx="24" fill="url(#skTealGrad)" stroke="url(#skRimGrad)" strokeWidth="2.5" />

          {/* Central Cooperative Symbol: Three Interlocking Nodes of Federation, Society & Worker */}
          {/* Top Apex Node (Federation) */}
          <circle cx="50" cy="30" r="8" fill="url(#skGoldGrad)" />
          
          {/* Bottom Left Node (Society) */}
          <circle cx="32" cy="62" r="8" fill="url(#skGoldGrad)" />

          {/* Bottom Right Node (Worker) */}
          <circle cx="68" cy="62" r="8" fill="url(#skGoldGrad)" />

          {/* Interconnecting Cooperative Solidarity Bridges */}
          <path
            d="M 50 30 L 32 62 M 50 30 L 68 62 M 32 62 L 68 62"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          {/* Center Emblem Core */}
          <circle cx="50" cy="51" r="5" fill="#FFFFFF" />
          <circle cx="50" cy="51" r="2.5" fill="#0F5C5C" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight text-heading ${textClassName}`}>
            Sah<span className="text-primary">Kaari</span>
          </span>
          <span className="text-[10px] font-semibold text-muted tracking-wider uppercase">
            सहकारी श्रम बाज़ार
          </span>
        </div>
      )}
    </span>
  );
}

export const ThekedaarLogo = SahKaariLogo;
