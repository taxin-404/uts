/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#F6FAEA",       // Soft, premium light-green canvas tint
          green: "#47A83E",    // Vivid accent green
          blue: "#237CBF",     // Reddit-style action link blue
          orange: "#E87C1E",   // Highlight/Downvote Orange
          dark: "#1E293B",     // Deep readable charcoal slate
        }
      },
      fontFamily: {
        sans: ["Hind Siliguri", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [],
}
