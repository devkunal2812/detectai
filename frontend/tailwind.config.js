/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        body: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        serif: ['Instrument Serif', 'serif'],
      },
      colors: {
        bg: {
          primary: '#080c14',
          secondary: '#0d1420',
          card: '#0f1826',
        },
        accent: {
          DEFAULT: '#3b82f6',
          bright: '#60a5fa',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'float': 'float 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
