import React from "react";

export function ThekedaarLogo({ className = "h-12 w-12" }) {
  return (
    <span className={`inline-flex ${className}`} aria-label="Thekedaar logo">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        role="img"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="tkRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8">
              <animate attributeName="stop-color" values="#818CF8;#06B6D4;#818CF8" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#06B6D4">
              <animate attributeName="stop-color" values="#06B6D4;#818CF8;#06B6D4" dur="4s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="tkBgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="tkIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <filter id="tkGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="tkInnerGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill="url(#tkBgGrad)" />

        {/* Animated gradient ring */}
        <circle
          cx="50" cy="50" r="46"
          fill="none"
          stroke="url(#tkRingGrad)"
          strokeWidth="2"
          filter="url(#tkGlow)"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="20s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Outer glow ring */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(129,140,248,0.12)" strokeWidth="1" />

        {/* Hardhat / building / helmet shape (construction motif above T) */}
        {/* Roof / beam — a horizontal bar with triangular top */}
        <polygon
          points="30,38 50,24 70,38"
          fill="none"
          stroke="url(#tkIconGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#tkInnerGlow)"
          opacity="0.9"
        />

        {/* Left pillar */}
        <line x1="35" y1="38" x2="35" y2="52" stroke="url(#tkIconGrad)" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
        {/* Right pillar */}
        <line x1="65" y1="38" x2="65" y2="52" stroke="url(#tkIconGrad)" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />

        {/* "T" lettermark — bold, modern, centered below the building motif */}
        <text
          x="50" y="68"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Space Grotesk', 'Inter', sans-serif"
          fontWeight="800"
          fontSize="30"
          fill="#F8FAFC"
          letterSpacing="-0.5"
        >
          T
        </text>

        {/* Subtle "thekedaar" text under T */}
        <text
          x="50" y="82"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Space Grotesk', 'Inter', sans-serif"
          fontWeight="600"
          fontSize="6"
          fill="#818CF8"
          letterSpacing="2.5"
          opacity="0.7"
        >
          THEKEDAAR
        </text>

        {/* Accent dot — top right, pulsing */}
        <circle cx="70" cy="24" r="3" fill="#06B6D4" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Secondary accent dot — bottom left */}
        <circle cx="30" cy="76" r="2" fill="#818CF8" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </span>
  );
}
