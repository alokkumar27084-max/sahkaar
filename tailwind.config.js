/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Indian Government Portal Theme Tokens
        govNavy: {
          50: "#EDF4F9",
          100: "#D6E6F0",
          500: "#0B3C5D", // Official Ashoka Navy Blue
          600: "#082B42",
          700: "#061F30",
        },
        govSaffron: {
          50: "#FEF7EE",
          100: "#FDEDD7",
          500: "#E67E22", // Bharat Saffron
          600: "#D35400",
          700: "#A04000",
        },
        govGreen: {
          50: "#EAF5EA",
          100: "#CAE6CA",
          500: "#138808", // India Green (National flag)
          600: "#0E6806",
          700: "#094A04",
        },
        primary: {
          DEFAULT: "#0B3C5D", // Ashoka Navy
          hover: "#082B42",
          light: "#EDF4F9",
          dark: "#061F30",
        },
        accent: {
          DEFAULT: "#E67E22", // Bharat Saffron
          hover: "#D35400",
          light: "#FEF7EE",
        },
        success: {
          DEFAULT: "#138808", // National Green
          light: "#EAF5EA",
        },
        surface: "var(--color-surface)",
        background: "var(--color-bg)",
        border: "var(--color-border)",
        heading: "var(--color-heading)",
        body: "var(--color-body)",
        muted: "var(--color-muted)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Noto Sans Devanagari'", "Inter", "-apple-system", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "'Noto Sans Devanagari'", "sans-serif"],
        devanagari: ["'Noto Sans Devanagari'", "sans-serif"],
        mono: ['"JetBrains Mono"', 'monospace'],
        script: ['"Caveat"', 'cursive'],
      },
      fontSize: {
        'hero': ['clamp(3rem, 5vw + 1rem, 5.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        'hero-sub': ['clamp(1.1rem, 1.5vw, 1.35rem)', { lineHeight: '1.6' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'counter': 'counter 2s ease-out',
        'glow-ring': 'glowRing 3s ease-in-out infinite',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' }, '50%': { boxShadow: '0 0 20px 4px rgba(99, 102, 241, 0.15)' } },
        gradientShift: { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        float: { '0%, 100%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(-20px) rotate(3deg)' } },
        shimmer: { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
        glowRing: { '0%, 100%': { opacity: '0.5', transform: 'scale(1)' }, '50%': { opacity: '1', transform: 'scale(1.05)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 30px rgba(99, 102, 241, 0.15)',
        'glow-accent': '0 0 30px rgba(6, 182, 212, 0.2)',
        'card': '0 4px 24px -2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 50px -10px rgba(99, 102, 241, 0.15)',
        'btn': '0 4px 14px rgba(99, 102, 241, 0.35)',
        'btn-hover': '0 8px 25px rgba(99, 102, 241, 0.3)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};
