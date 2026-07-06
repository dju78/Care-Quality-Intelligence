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
        sage: { DEFAULT: "#5F9678", 100: "#E4EFE8", 600: "#3d6b52" },
        amber: { DEFAULT: "#D9A441", 100: "#F8EDD8", 700: "#8a6113" },
        rust: { DEFAULT: "#BF4A36", 100: "#F6E1DD", 700: "#96351F" },
        mist: "#F3F6F5",
        // design-system neutrals (from the CQI design system)
        line: "#DDE6E3",
        muted: "#5B7370",
        faint: "#8AA09B",
        label: "#7A908C",
        moss: "#3D5450",
        // tint surfaces
        petroltint: "#EAF3F3",
        sagetint: "#F0F6F2",
        avatar: "#DCEAE2",
      },
      fontFamily: {
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,51,58,0.04)",
        cardhover: "0 6px 20px rgba(18,51,58,0.09)",
        btn: "0 1px 2px rgba(18,51,58,0.12)",
      },
      borderRadius: {
        xl: "0.875rem", // 14px cards
      },
    },
  },
  plugins: [],
};
