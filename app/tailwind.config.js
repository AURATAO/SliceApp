/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        paper: "#E8E2D0",
        rust: "#D35400",
        teal: "#4A9B94",
        mustard: "#F4B41A",
        charcoal: "#2C2C2C",
      },
    },
  },
  plugins: [],
};
