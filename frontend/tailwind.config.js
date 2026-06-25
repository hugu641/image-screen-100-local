/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#060a12',
          900: '#0b132b',
          800: '#1c2541',
          700: '#3a506b',
          600: '#5c7490'
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0efff',
          500: '#0070f3',
          600: '#0059c1',
          700: '#004494'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
