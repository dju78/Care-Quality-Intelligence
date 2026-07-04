/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12333A",
        petrol: {
          DEFAULT: "#0F5257",
          50: "#EAF3F3",
          100: "#D2E5E5",
          600: "#0F5257",
          700: "#0B3F43",
          800: "#0A3438",
        },
        sage: { DEFAULT: "#5F9678", 100: "#E4EFE8", 600: "#4C7E63" },
        amber: { DEFAULT: "#D9A441", 100: "#F8EDD8", 700: "#9A6F1F" },
        rust: { DEFAULT: "#BF4A36", 100: "#F6E1DD", 700: "#96351F" },
        mist: "#F3F6F5",
      },
      fontFamily: {
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,51,58,0.06), 0 4px 12px rgba(18,51,58,0.06)",
      },
    },
  },
  plugins: [],
};
