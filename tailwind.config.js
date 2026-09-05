/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        kaksha: {
          orange: '#ff6b35',
          teal: '#00a896',
          navy: '#028090',
          yellow: '#f7b801',
          dark: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}
