/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4a0080',
        accent: '#00d4ff',
        green: '#00ff88',
        midnight: '#0a0a1a',
      },
    },
  },
  plugins: [],
}
