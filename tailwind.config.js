// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
    backgroundImage: {
  stars: "url('../src/assets/images/stars-background.png')",
      },
      colors: {
        cosmic: "#00122e",
        star: "#000000",
        gold: "#FFD700",
      },
      fontFamily: {
        title: ["Cinzel Decorative", "serif"],
        body: ["Lora", "serif"],
      },
      screens: {
        sm: "600px",
        md: "900px",
        lg: "1200px",
      },
    },
  },
  plugins: [],
};
