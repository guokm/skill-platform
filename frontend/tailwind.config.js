/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        atlas: {
          // Dark theme tokens
          bg:      '#070d16',
          surface: '#0c1521',
          s2:      '#111e2e',
          s3:      '#162638',
          ink:     '#c8d8e8',
          strong:  '#e8f0f8',
          muted:   '#4a6480',
          // Accents
          teal:    '#06b6d4',
          blue:    '#3b82f6',
          green:   '#10b981',
          coral:   '#f97316',
          gold:    '#eab308',
          // Borders
          line:    'rgba(6,182,212,0.12)',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 16px rgba(6,182,212,0.2)',
        'glow':    '0 0 32px rgba(6,182,212,0.25)',
        'glow-lg': '0 0 56px rgba(6,182,212,0.3)',
      },
      backgroundImage: {
        'grid-cyan': `linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
    },
  },
  plugins: [],
}
