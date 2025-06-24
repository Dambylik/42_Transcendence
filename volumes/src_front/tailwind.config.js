/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,cjs,mjs,ts,cts,mts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'neon-pong': "url('../src/assets/neon_pong_table.png')",
        'grid-overlay': "linear-gradient(transparent 0%, transparent calc(100% - 1px), rgba(5, 217, 232, 0.2) 100%), linear-gradient(90deg, transparent 0%, transparent calc(100% - 1px), rgba(255, 42, 109, 0.2) 100%)",
      },
      fontFamily: {
        'big-shoulders': ['"Big Shoulders Display"', 'sans-serif'],
        'cyber': ['"Big Shoulders Display"', 'sans-serif'],
        'tech': ['monospace', 'sans-serif'],
      },
      colors: {
        'ft-red': '#E84A4A',
        'cyber-dark': '#0a0a16',
        'cyber-darker': '#050510',
        'navy-dark': '#0a0a25',
        'neon-pink': '#ff2a6d',
        'neon-cyan': '#05d9e8',
      },
      fontWeight: {
        'ultra': '900',
      },
      boxShadow: {
        'sidebar-glow': '0 0 32px 8px #05d9e8, 0 0 64px 16px #ff2a6d',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
        'pulse-slower': 'pulseSlow 6s ease-in-out infinite alternate',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { textShadow: '0 0 5px rgba(255, 42, 109, 0.7), 0 0 10px rgba(255, 42, 109, 0.5)' },
          '50%': { textShadow: '0 0 15px rgba(255, 42, 109, 0.8), 0 0 25px rgba(255, 42, 109, 0.6), 0 0 35px rgba(255, 42, 109, 0.4)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.4', boxShadow: '0 0 5px currentColor' },
          '50%': { opacity: '0.8', boxShadow: '0 0 15px currentColor' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}

