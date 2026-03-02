/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy:    { DEFAULT: "#0A192F", light: "#112240", dark: "#061020" },
        cyan:    { DEFAULT: "#00B4D8", light: "#90E0EF", dark: "#0077A8" },
        amber:   { DEFAULT: "#E9A63A", light: "#F5C97A" },
        slate:   { DEFAULT: "#334155", light: "#64748B" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      animation: {
        "fade-in":    "fadeIn 0.4s ease-in-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "spin-slow":  "spin 3s linear infinite",
        "pulse-cyan": "pulseCyan 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp:   { "0%": { opacity: 0, transform: "translateY(20px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        pulseCyan: { "0%,100%": { boxShadow: "0 0 0 0 rgba(0,180,216,0.4)" }, "50%": { boxShadow: "0 0 0 8px rgba(0,180,216,0)" } },
      },
    },
  },
  plugins: [],
};
