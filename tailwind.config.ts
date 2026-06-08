import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // LoL AI Coach Design System
        background: "#0A0E1A",
        surface: {
          DEFAULT: "#0F1629",
          2: "#1A2138",
          dark: "#07090F",
        },
        border: "#2A3550",
        text: {
          DEFAULT: "#E8F0FF",
          muted: "#8899BB",
        },
        accent: {
          DEFAULT: "#C89B3C",
          blue: "#4FC3F7",
        },
        success: "#52B788",
        danger: "#E63946",
        warning: "#F4A261",
        // Rank colors
        rank: {
          iron: "#8C8C8C",
          bronze: "#CD7F32",
          silver: "#C0C0C0",
          gold: "#FFD700",
          platinum: "#00C0A0",
          emerald: "#50C878",
          diamond: "#B9F2FF",
          master: "#9B59B6",
          grandmaster: "#E74C3C",
          challenger: "#F1C40F",
        },
        // shadcn/ui CSS variable tokens
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-rajdhani)", "var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 6px rgba(200,155,60,0.25)" },
          "50%": { boxShadow: "0 0 18px rgba(200,155,60,0.55)" },
        },
        "confetti-fall": {
          "0%":   { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(300px) rotate(720deg)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "confetti-fall": "confetti-fall 0.8s ease-in forwards",
      },
    },
  },
  plugins: [],
};

export default config;
