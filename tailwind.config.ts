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
        brand: {
          gold:        "#C9A84C",
          "gold-dark": "#A8893A",
          "gold-light":"#E8C96B",
          "gold-muted":"rgba(201,168,76,0.1)",
        },
        /**
         * The accent at the eight opacities the interface actually needs.
         *
         * Before this existed the same gold appeared at 27 different opacities,
         * including 0.1 and 0.10 written side by side, which is what happens
         * when every component picks its own number instead of a step. Each
         * step here has one job, so a new surface has an obvious choice to make
         * rather than a value to invent.
         */
        gold: {
          ghost:  "rgba(201,168,76,0.05)", // ambient glow, hairlines
          wash:   "rgba(201,168,76,0.1)",  // tinted card surface
          line:   "rgba(201,168,76,0.16)", // quiet border
          border: "rgba(201,168,76,0.22)", // default accent border
          edge:   "rgba(201,168,76,0.28)", // hover, active border
          glow:   "rgba(201,168,76,0.4)",  // glows, focus rings
          strong: "rgba(201,168,76,0.55)", // selected state, gradient stops
          text:   "rgba(201,168,76,0.7)",  // muted gold text, needs the contrast
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "gold-sm": "0 4px 20px rgba(201,168,76,0.25)",
        "gold-md": "0 6px 32px rgba(201,168,76,0.35)",
        "gold-lg": "0 8px 48px rgba(201,168,76,0.40)",
        "card":    "0 8px 32px rgba(0,0,0,0.35)",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34,1.56,0.64,1)",
        "smooth": "cubic-bezier(0.4,0,0.2,1)",
      },
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-fast": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in":       "fade-in 0.38s cubic-bezier(0.4,0,0.2,1) both",
        "fade-in-fast":  "fade-in-fast 0.2s ease-out both",
        "slide-up":      "slide-up 0.42s cubic-bezier(0.4,0,0.2,1) both",
        "slide-in-right":"slide-in-right 0.35s cubic-bezier(0.4,0,0.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
