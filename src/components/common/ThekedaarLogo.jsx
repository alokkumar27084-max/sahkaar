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
          <linearGradient id="tkBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8">
              <animate attributeName="stop-color" values="#818CF8;#06B6D4;#818CF8" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#06B6D4">
              <animate attributeName="stop-color" values="#06B6D4;#818CF8;#06B6D4" dur="4s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="tkBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="tkLetterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C7D2FE" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#A5F3FC" />
          </linearGradient>
          <filter id="tkGlow2">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Rounded square background */}
        <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#tkBg)" />

        {/* Animated gradient border */}
        <rect
          x="4" y="4" width="92" height="92" rx="22"
          fill="none"
          stroke="url(#tkBorderGrad)"
          strokeWidth="2.5"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="25s"
            repeatCount="indefinite"
          />
        </rect>

        {/* Subtle inner glow ring */}
        <rect x="4" y="4" width="92" height="92" rx="22" fill="none" stroke="rgba(129,140,248,0.08)" strokeWidth="1" />

        {/* Bold "T" monogram — centered, large, clean */}
        <text
          x="50" y="58"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Space Grotesk', 'Inter', system-ui, sans-serif"
          fontWeight="800"
          fontSize="52"
          fill="url(#tkLetterGrad)"
          filter="url(#tkGlow2)"
          letterSpacing="-1"
        >
          T
        </text>

        {/* Accent line under the T */}
        <line x1="32" y1="78" x2="68" y2="78" stroke="url(#tkBorderGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />

        {/* Subtle corner accent — top right */}
        <circle cx="82" cy="18" r="2.5" fill="#06B6D4" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.25;0.7" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Subtle corner accent — bottom left */}
        <circle cx="18" cy="82" r="2" fill="#818CF8" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </span>
  );
}
