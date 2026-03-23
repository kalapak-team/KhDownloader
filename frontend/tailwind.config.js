/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bgPrimary: "#0A0A0F",
        bgSurface: "#111118",
        bgCard: "#1A1A24",
        bgHover: "#22222F",
        textPrimary: "#F0F0F5",
        textSecondary: "#8888A0",
        borderColor: "#2A2A3A",
        success: "#30D158",
        warning: "#FFD60A",
        danger: "#FF453A",
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        accentGradient: "linear-gradient(135deg, #FF3B30, #FF6B35)",
      },
    },
  },
  plugins: [],
};
