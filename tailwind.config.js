/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./features/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#f4f1ea',
        primary: '#333333',
        charcoal: '#333333',
        cream: '#f4f1ea',
        shutter: '#1a1a1a',
      },
    },
  },
  plugins: [],
};
