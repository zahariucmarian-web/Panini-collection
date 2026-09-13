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
        fifa: {
          maroon: "#8a1538", // Official Qatar/World Cup style deep maroon
          gold: "#b49141",   // Elegant metallic gold
          sand: "#f7f5ee",   // Cream sand background
          navy: "#101827",   // Rich dark theme
          green: "#0f766e"   // Collected sticker green
        }
      }
    },
  },
  plugins: [],
};
export default config;
