/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Auth page colors (keep for Auth component)
        bg: {
          page: '#060e1a',
          panel: '#0b1729',
          card: '#0f1e33',
          input: '#091525',
        },
        border: {
          dim: '#1a3050',
          focus: '#8b5cf6',
        },
        text: {
          primary: '#f0f6ff',
          muted: '#5a7a9d',
          hint: '#3d5a7a',
        },
        accent: {
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          sky: '#38bdf8',
        },
        error: {
          bg: '#1a0a0a',
          border: '#ef4444',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        // Dashboard pro-dark SaaS colors
        'saas-base': '#0A0F1E',
        'saas-surface': '#0F1629',
        'saas-elevated': '#141D35',
        'saas-overlay': '#1A2540',
        'saas-border-subtle': '#1E2D4A',
        'saas-border-focus': '#3B82F6',
        'saas-text-primary': '#F1F5F9',
        'saas-text-secondary': '#64748B',
        'saas-text-muted': '#334155',
        'saas-accent-blue': '#3B82F6',
        'saas-accent-emerald': '#10B981',
        'saas-accent-amber': '#F59E0B',
        'saas-accent-red': '#EF4444',
      },
      backgroundImage: {
        'grad-cta': 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
        'grad-page': 'radial-gradient(ellipse 80% 60% at 20% 50%, #0d1f3c 0%, #060e1a 60%)',
        'grad-primary': 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
        'grad-surface': 'linear-gradient(160deg, #0F1629 0%, #0A0F1E 100%)',
      },
      boxShadow: {
        'glow': '0 0 0 3px rgba(139,92,246,0.18)',
        'elevation': '0 1px 3px rgba(0,0,0,0.4)',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        'dm-sans': ['DM Sans', 'sans-serif'],
        geist: ['Geist', 'Inter', '-apple-system', 'sans-serif'],
        inter: ['Inter', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}