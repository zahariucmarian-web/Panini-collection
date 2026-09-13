import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        panini: {
          red: "#e2001a",    // Official vibrant Panini Red
          yellow: "#ffcc00", // Official Panini Accent Yellow
          dark: "#1c1c1c",   // Elegant deep dark grey for contrasts
          cream: "#fbfaf7",  // Background cream white
          green: "#0f766e"   // Collected sticker teal/green
        }
      }
    },
  },
  plugins: [],
};
export default config;
