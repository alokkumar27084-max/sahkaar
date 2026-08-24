import React from "react";
import { motion } from "framer-motion";

export function SahKaariLogo({
  className = "w-11 h-11",
  showText = false,
  textClassName = "text-2xl",
  animated = true,
}) {
  return (
    <span className="inline-flex items-center gap-3 select-none" aria-label="SahKaari Cooperative Marketplace Logo">
      <div className={`relative inline-flex items-center justify-center group ${className}`}>
        
        {/* Animated Glow Halo */}
        {animated && (
          <div
            className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-indigo-600 via-emerald-500 to-amber-400 opacity-30 blur-md group-hover:opacity-75 transition duration-500 group-hover:scale-110"
            style={{ animation: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
          />
        )}

        {/* Core SVG Emblem */}
        <svg
          viewBox="0 0 100 100"
          className="relative h-full w-full drop-shadow-md transition-transform duration-300 group-hover:scale-105"
          role="img"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Background Obsidian Sapphire Gradient */}
            <linearGradient id="skBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B0F19" />
              <stop offset="50%" stopColor="#111827" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>

            {/* Radiant Indigo to Emerald Ribbon Gradient */}
            <linearGradient id="skPrismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1">
                {animated && <animate attributeName="stop-color" values="#6366F1;#3B82F6;#10B981;#F59E0B;#6366F1" dur="8s" repeatCount="indefinite" />}
              </stop>
              <stop offset="50%" stopColor="#8B5CF6">
                {animated && <animate attributeName="stop-color" values="#8B5CF6;#6366F1;#3B82F6;#10B981;#8B5CF6" dur="8s" repeatCount="indefinite" />}
              </stop>
              <stop offset="100%" stopColor="#10B981">
                {animated && <animate attributeName="stop-color" values="#10B981;#F59E0B;#6366F1;#8B5CF6;#10B981" dur="8s" repeatCount="indefinite" />}
              </stop>
            </linearGradient>

            {/* Gold Accents */}
            <linearGradient id="skGoldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* Subtle Metallic Bevel */}
            <linearGradient id="skBorderBevel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
            </linearGradient>

            <filter id="skInnerShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Premium Rounded Hexagonal Base */}
          <rect
            x="6"
            y="6"
            width="88"
            height="88"
            rx="24"
            fill="url(#skBgGradient)"
            stroke="url(#skBorderBevel)"
            strokeWidth="2.5"
          />

          {/* Animated Orbital Orbit Ring */}
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke="url(#skPrismGradient)"
            strokeWidth="1.5"
            strokeDasharray="16 8"
            opacity="0.75"
          >
            {animated && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="20s"
                repeatCount="indefinite"
              />
            )}
          </circle>

          {/* Interlocking Cooperative Triangle Matrix (Federation, Society, Master) */}
          {/* Top Apex Node (Federation) */}
          <circle cx="50" cy="24" r="5.5" fill="url(#skGoldGlow)">
            {animated && <animate attributeName="r" values="5;6.5;5" dur="3s" repeatCount="indefinite" />}
          </circle>

          {/* Bottom Left Node (Society) */}
          <circle cx="27" cy="65" r="5.5" fill="url(#skPrismGradient)">
            {animated && <animate attributeName="r" values="5.5;4.5;5.5" dur="3s" repeatCount="indefinite" />}
          </circle>

          {/* Bottom Right Node (Master Worker) */}
          <circle cx="73" cy="65" r="5.5" fill="url(#skPrismGradient)">
            {animated && <animate attributeName="r" values="5.5;6.5;5.5" dur="3s" repeatCount="indefinite" />}
          </circle>

          {/* Interconnecting Cooperative Energy Lines */}
          <path
            d="M 50 24 L 27 65 M 50 24 L 73 65 M 27 65 L 73 65"
            stroke="url(#skPrismGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />

          {/* Center Heart Emblem: Pure Geometric Cooperative Crystal Knot (Zero text/letters) */}
          <g filter="url(#skInnerShadow)">
            {/* Geometric Trinity Ribbon 1 */}
            <path
              d="M 50 28 L 66 58 L 50 48 Z"
              fill="url(#skPrismGradient)"
              opacity="0.95"
            />
            {/* Geometric Trinity Ribbon 2 */}
            <path
              d="M 66 58 L 34 58 L 50 48 Z"
              fill="#FFFFFF"
              opacity="0.9"
            />
            {/* Geometric Trinity Ribbon 3 */}
            <path
              d="M 34 58 L 50 28 L 50 48 Z"
              fill="url(#skPrismGradient)"
              opacity="0.8"
            />

            {/* Inner Precision Hexagon Core Outline */}
            <polygon
              points="50,38 60,44 60,56 50,62 40,56 40,44"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>

          {/* Central Radiant Jewel Spark */}
          <polygon
            points="50,44 55,50 50,56 45,50"
            fill="url(#skGoldGlow)"
          >
            {animated && (
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1; 1.25; 1"
                keyTimes="0; 0.5; 1"
                transform-origin="50 50"
                dur="2.5s"
                repeatCount="indefinite"
              />
            )}
          </polygon>
        </svg>
      </div>

      {/* Optional Integrated Text Logo */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-slate-950 font-display ${textClassName}`}>
              Sah<span className="text-indigo-600">Kaari</span>
            </span>
          </div>
        </div>
      )}
    </span>
  );
}

export const ThekedaarLogo = SahKaariLogo;
