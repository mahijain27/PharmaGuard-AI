/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060D1A',
          900: '#0B1120',
          800: '#111827',
          700: '#1E2D45',
          600: '#243552',
        },
        teal: {
          400: '#2DD4BF',
          500: '#14B8A6',
          glow: '#00D4B4',
        },
        slate: {
          750: '#2A3A52',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'verdict-in': 'verdictIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        verdictIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'teal-glow': '0 0 20px rgba(0, 212, 180, 0.15)',
        'teal-glow-md': '0 0 40px rgba(0, 212, 180, 0.2)',
        'danger-glow': '0 0 30px rgba(244, 63, 94, 0.2)',
        'safe-glow': '0 0 30px rgba(0, 212, 180, 0.2)',
      },
    },
  },
  plugins: [],
}
