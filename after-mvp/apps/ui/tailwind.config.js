/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          0: "#fcf6ef",
          1: "#f6f0e9",
          2: "#efe7dd",
          3: "#e6dbcf",
        },
        ink: {
          DEFAULT: "#2b180a",
          soft: "#6f5a4a",
          muted: "#9a806e",
        },
        line: "#e6dbcf",
        accent: {
          DEFAULT: "#c87d42",
          light: "#df8a4f",
          dark: "#b45e2a",
          glow: "rgba(200, 125, 66, 0.18)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      borderRadius: {
        pill: "999px",
      },
      keyframes: {
        "fade-up-soft": {
          from: { opacity: "0", transform: "translate3d(0, 14px, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "fade-in-soft": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "typing-dot": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.5" },
          "50%": { transform: "translateY(-3px)", opacity: "1" },
        },
        "dreaming-spin": {
          to: { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(29, 106, 53, 0.4)" },
          "50%": { boxShadow: "0 0 8px 2px rgba(29, 106, 53, 0.15)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up-soft 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in-soft 420ms ease both",
        "typing-dot": "typing-dot 1.2s ease-in-out infinite",
        "dreaming-spin": "dreaming-spin 0.72s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.44, 0, 0.56, 1)",
      },
    },
  },
  plugins: [],
};
