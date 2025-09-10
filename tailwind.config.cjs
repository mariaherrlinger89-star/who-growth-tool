/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#dc758a",
        pink: "#f5a8b6",
        lightpink: "#fddbe3",
        extralightpink: "#fbe5e7",
        cream: "#fef5ce",
        textdark: "#231b18",
        whoGreen: "#2e7d32",   // Z0
        whoRed: "#c62828",     // Z±2
        whoBlack: "#212121"    // Z±3
      },
      fontFamily: { inter: ["Inter","system-ui","Arial","sans-serif"] }
