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
        bg:       { DEFAULT: "#000000", 2: "#0a0a0a" },
        surface:  { DEFAULT: "#111111", 2: "#18181b" },
        border:   { DEFAULT: "#27272a", 2: "#3f3f46" },
        muted:    { DEFAULT: "#71717a", 2: "#52525b" },
        accent:   { DEFAULT: "#f97316", hover: "#ea6c10" },
        zinc:     { 950: "#09090b", 900: "#18181b", 800: "#27272a", 700: "#3f3f46", 600: "#52525b", 500: "#71717a", 400: "#a1a1aa", 300: "#d4d4d8", 200: "#e4e4e7", 100: "#f4f4f5", 50: "#fafafa" },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        sm: "6px", DEFAULT: "8px", md: "10px", lg: "12px", xl: "16px", "2xl": "20px",
      },
      boxShadow: {
        sm:  "0 1px 2px rgba(0,0,0,0.5)",
        DEFAULT: "0 1px 4px rgba(0,0,0,0.6)",
        md:  "0 4px 12px rgba(0,0,0,0.6)",
        lg:  "0 8px 24px rgba(0,0,0,0.7)",
        xl:  "0 16px 48px rgba(0,0,0,0.8)",
        inner: "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
