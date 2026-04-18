/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: '#09090B',
          900: '#0F0F11',
          800: '#18181B',
          700: '#27272A',
          600: '#3F3F46',
          500: '#52525B',
          400: '#71717A',
          300: '#A1A1AA',
          200: '#D4D4D8',
          100: '#F4F4F5',
        },
        // Acento dinámico — controlado por variables CSS (ver global.css)
        // Usa rgb(var(--acento-X) / <alpha-value>) para soportar /20, /40...
        violeta: {
          50:  'rgb(var(--acento-50)  / <alpha-value>)',
          100: 'rgb(var(--acento-100) / <alpha-value>)',
          200: 'rgb(var(--acento-200) / <alpha-value>)',
          300: 'rgb(var(--acento-300) / <alpha-value>)',
          400: 'rgb(var(--acento-400) / <alpha-value>)',
          500: 'rgb(var(--acento-500) / <alpha-value>)',
          600: 'rgb(var(--acento-600) / <alpha-value>)',
          700: 'rgb(var(--acento-700) / <alpha-value>)',
          800: 'rgb(var(--acento-800) / <alpha-value>)',
          900: 'rgb(var(--acento-900) / <alpha-value>)',
        },
        acento: 'rgb(var(--acento-600) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Satoshi', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Satoshi', 'ui-sans-serif', 'sans-serif'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        'aparecer': 'aparecer 0.6s ease-out',
        'flotar': 'flotar 6s ease-in-out infinite',
        'brillar': 'brillar 2.5s ease-in-out infinite',
        'deslizar-arriba': 'deslizarArriba 0.5s ease-out',
        'modal-in': 'modalIn 0.18s ease-out',
      },
      keyframes: {
        aparecer: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flotar: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        brillar: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        deslizarArriba: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        modalIn: {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      backgroundImage: {
        'radial-acento': 'radial-gradient(circle at 50% 50%, rgb(var(--acento-600) / 0.15), transparent 70%)',
      },
    },
  },
  plugins: [],
};
