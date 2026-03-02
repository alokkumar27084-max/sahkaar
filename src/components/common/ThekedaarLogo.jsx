import React from "react";
import thekedaarBrandLogo from "../../assets/thekedaar-brand-logo-optimized.png";

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
          <clipPath id="tkLogoClip">
            <circle cx="50" cy="50" r="44" />
          </clipPath>
          <linearGradient id="tkLogoRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="47" fill="#02090f" />
        <g clipPath="url(#tkLogoClip)">
          <image
            href={thekedaarBrandLogo}
            x="-2"
            y="-9"
            width="104"
            height="126"
            preserveAspectRatio="xMidYMin slice"
          />
        </g>
        <circle cx="50" cy="50" r="45.5" fill="none" stroke="url(#tkLogoRing)" strokeWidth="1.8" />
        <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
      </svg>
    </span>
  );
}
