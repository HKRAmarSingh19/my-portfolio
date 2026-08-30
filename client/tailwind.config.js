/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // One family, used at different weights. `display` exists so heading
        // sites stay tagged and a display face can be swapped in later without
        // touching every component.
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: {
          light: '#FAFAFA',
          dark: '#0A0A0A',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#121212',
        },
        // The accent is Tailwind's own `indigo`, used by name throughout the app
        // rather than remapped here — so `text-indigo-600` really is indigo.
        // To re-tint the site, sweep `indigo-` to another Tailwind hue across
        // src/ and update the four hard-coded spots that can't use a class:
        // the `glow` shadows below, `.text-gradient` in index.css, the PALETTE
        // constants in components/three/HeroScene.jsx, and Spotlight.jsx.
        //
        // Real green stays reserved for status semantics — availability and
        // success confirmations use `green-*` directly.
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quint': 'cubic-bezier(0.83, 0, 0.17, 1)',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(99, 102, 241, 0.45)',
        'glow-lg': '0 0 80px -12px rgba(99, 102, 241, 0.5)',
        lift: '0 24px 48px -20px rgba(0, 0, 0, 0.22)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'float 11s ease-in-out infinite',
        drift: 'drift 22s ease-in-out infinite',
        'drift-reverse': 'driftReverse 26s ease-in-out infinite',
        marquee: 'marquee 38s linear infinite',
        'spin-slow': 'spin 24s linear infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'pulse-ring': 'pulseRing 2.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-pan': 'gradientPan 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(34px, -26px) scale(1.08)' },
          '66%': { transform: 'translate(-22px, 20px) scale(0.94)' },
        },
        driftReverse: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-30px, 24px) scale(1.06)' },
          '66%': { transform: 'translate(26px, -18px) scale(0.95)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%, 100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        gradientPan: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
