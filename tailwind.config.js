/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff'
        },
        surface: {
          DEFAULT: '#0f172a',
          foreground: '#e2e8f0'
        }
      }
    },
  },
  plugins: [],
}
