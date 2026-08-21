/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12233D",
        paper: "#FAF6EE",
        parchment: "#F1E9D8",
        accent: "#E2892D",
        brass: "#E2892D",
        burgundy: "#E2892D",
        forest: "#E2892D",
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};