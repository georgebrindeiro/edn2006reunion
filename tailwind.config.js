/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── EDN Brand Colors ───────────────────────────────────────────
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        edn: {
          navy:       "#1a2744",   // deep navy — primary brand
          "navy-mid": "#243461",   // slightly lighter navy
          steel:      "#4a6080",   // steel blue — secondary
          "steel-lt": "#7a96b8",   // light steel — accents
          mist:       "#c8d6e8",   // very light blue-gray — backgrounds
          cloud:      "#edf1f7",   // near-white with blue tint
          white:      "#ffffff",
          gray:       "#6b7280",
          "gray-lt":  "#f3f4f6",
        },
      },
      // ─── Typography ─────────────────────────────────────────────────
      fontFamily: {
        display: ["var(--font-display)", "serif"],   // headings — loaded via next/font
        body:    ["var(--font-body)", "sans-serif"], // body text
        mono:    ["var(--font-mono)", "monospace"],
      },
      // ─── Spacing ────────────────────────────────────────────────────
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      // ─── Border radius ──────────────────────────────────────────────
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // ─── Animations ─────────────────────────────────────────────────
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%":   { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "figures-wave": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%":       { transform: "rotate(6deg)" },
          "75%":       { transform: "rotate(-6deg)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "fade-up":       "fade-up 0.5s ease-out forwards",
        "fade-in":       "fade-in 0.4s ease-out forwards",
        "slide-in":      "slide-in 0.4s ease-out forwards",
        "figures-wave":  "figures-wave 2s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
