import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        unair: {
          blue: "#0A2540",
          yellow: "#FFB800",
          gold: "#E6A100",
          navy: "#0F172A",
          dark: "#090D16",
        },
      },
    },
  },
  plugins: [],
};
export default config;
