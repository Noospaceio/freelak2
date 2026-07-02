/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#3ecf6a",   // freelak green
        gold: "#d4af37",     // freelak gold
        panel: "#0a0f0a",    // dark panel bg
      },
    },
  },
  plugins: [],
};
