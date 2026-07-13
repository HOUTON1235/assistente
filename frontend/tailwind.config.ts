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
        primary: {
          DEFAULT: "#1e40af",
          hover: "#1d3a9f",
          light: "#1e40af1a",
        },
        accent: {
          DEFAULT: "#f97316",
          hover: "#ea6c10",
          light: "#f973161a",
        },
        surface: {
          DEFAULT: "#111827",
          2: "#1f2937",
        },
        orbita: {
          bg: "#0a0f1e",
          border: "#1f2937",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
