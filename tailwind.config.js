/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arcade: {
          bg: "#0B0E14",
          card: "#151B26",
          hover: "#1F2737",
          border: "#2A364F",
          accent: "#6366F1",
          gold: "#F59E0B",
          neon: "#10B981",
          pink: "#EC4899",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
