/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // eazy mama Branding
        primary: "#dc758a",
        pink: "#f5a8b6",
        lightpink: "#fddbe3",
        extralightpink: "#fbe5e7",
        cream: "#fef5ce",
        textdark: "#231b18",
        // WHO curves
        whoGreen: "#2e7d32", // 0
        whoRed: "#c62828",   // ±2
        whoBlack: "#212121"  // ±3
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'Arial', 'sans-serif']
      },
      boxShadow: {
        soft: "0 6px 20px rgba(0,0,0,0.06)"
      }
    }
  },
  plugins: []
};
postcss.config.cjs