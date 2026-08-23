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
        // ── LaneIQ raw scales (ADR-015) ──────────────────────────────────
        // Author new work against these. The semantic names below are what
        // the pre-rebrand components already consume, repointed to match.
        ink: {
          1000: "#050706",
          900: "#080B0A",
          800: "#0C1110",
          700: "#111817",
          600: "#17201F",
          500: "#1E2A28",
          400: "#283634",
        },
        line: {
          1: "#20302D",
          2: "#2E4340",
          3: "#456460",
        },
        fg: {
          1: "#E9F5EE",
          2: "#A7BCB5",
          3: "#6C817B",
          4: "#485954",
        },
        acid: {
          300: "#E4FF9B",
          400: "#D4FF6A",
          500: "#C6FF3D",
          600: "#A9E01B",
          700: "#7FA914",
        },

        // ── Semantic names (unchanged keys, LaneIQ values) ───────────────
        background: "#080B0A",
        surface: {
          DEFAULT: "#0C1110",
          2: "#17201F",
          dark: "#050706",
        },
        border: "#20302D",
        text: {
          DEFAULT: "#E9F5EE",
          muted: "#6C817B",
          faint: "#485954",
          body: "#A7BCB5",
        },
        accent: {
          DEFAULT: "#C6FF3D",
          // Support hues are data semantics only — never a second brand accent.
          blue: "#4C8FFF",
        },
        success: "#C6FF3D",
        danger: "#FF5A5A",
        warning: "#FFC24B",
        info: "#3FE0C8",

        // Rank colors are game-domain, not brand. Only `gold` moves, onto the
        // system's amber so it stops clashing with the accent.
        rank: {
          iron: "#8C8C8C",
          bronze: "#CD7F32",
          silver: "#C0C0C0",
          gold: "#FFC24B",
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

      // Shape comes from chamfers, not roundness (ADR-015). The scale is
      // collapsed rather than edited out of ~143 files: `rounded-2xl` still
      // parses, it just no longer rounds. `full` survives for avatars and meters.
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "2px",
        md: "2px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
        "3xl": "8px",
        full: "9999px",
      },

      fontFamily: {
        sans: ["var(--font-chakra)", "system-ui", "sans-serif"],
        display: ["var(--font-orbitron)", "var(--font-chakra)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },

      letterSpacing: {
        label: "0.16em",
        micro: "0.22em",
      },

      transitionTimingFunction: {
        out: "cubic-bezier(.16,.84,.44,1)",
        snap: "cubic-bezier(.2,1.4,.4,1)",
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
          "0%, 100%": { boxShadow: "0 0 6px rgba(198,255,61,0.25)" },
          "50%": { boxShadow: "0 0 18px rgba(198,255,61,0.55)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(300px) rotate(720deg)", opacity: "0" },
        },
        "coach-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        blink: {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "96%": { transform: "scaleY(0.1)" },
        },
        nudge: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(5px)" },
        },
        "hud-enter": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },

        // LaneIQ Daily stage motion. A guess is a scoreboard event, so the
        // cells flip open in sequence rather than fading in together.
        "quiz-flip": {
          "0%": { transform: "rotateX(-92deg)", opacity: "0" },
          "55%": { opacity: "1" },
          "100%": { transform: "none", opacity: "1" },
        },
        "quiz-stage": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        "quiz-scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(220%)" },
        },
        "quiz-sweep": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(320%)" },
        },
        "quiz-rise": {
          from: { opacity: "0", transform: "translateY(14px) scale(.985)" },
          to: { opacity: "1", transform: "none" },
        },
        "quiz-pop": {
          "0%, 100%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.07)" },
        },
        "quiz-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "60%": { transform: "translateX(-2px)" },
          "80%": { transform: "translateX(2px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "confetti-fall": "confetti-fall 0.8s ease-in forwards",
        "coach-bounce": "coach-bounce 2s ease-in-out infinite",
        blink: "blink 4s ease-in-out infinite",
        nudge: "nudge 1s ease-in-out infinite",
        "hud-enter": "hud-enter 420ms cubic-bezier(.16,.84,.44,1) both",
        "quiz-flip": "quiz-flip 340ms cubic-bezier(.16,.84,.44,1) both",
        "quiz-stage": "quiz-stage 320ms cubic-bezier(.16,.84,.44,1) both",
        "quiz-scan": "quiz-scan 3.4s linear infinite",
        "quiz-sweep": "quiz-sweep 1.5s cubic-bezier(.16,.84,.44,1) 260ms both",
        "quiz-rise": "quiz-rise 420ms cubic-bezier(.16,.84,.44,1) both",
        "quiz-pop": "quiz-pop 320ms cubic-bezier(.2,1.4,.4,1) both",
        "quiz-shake": "quiz-shake 280ms cubic-bezier(.16,.84,.44,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
