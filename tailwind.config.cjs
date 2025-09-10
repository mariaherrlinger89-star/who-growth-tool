/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#dc758a",
        pink: "#ff6392",
        lightpink: "#fba9bb",
        extralightpink: "#f8e5e9",
        blue: "#5aa9e6",
        cream: "#fef5ce",
        textdark: "#231b18",
        whoGreen: "#2e7d32",   // Z0
        whoRed: "#c62828",     // Z±2
        whoBlack: "#212121"    // Z±3
      },
      fontFamily: { inter: ["Inter","system-ui","Arial","sans-serif"] }
