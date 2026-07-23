import type { Config } from "tailwindcss";
const { heroui } = require("@heroui/react");

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--heroui-divider))",
        input: "hsl(var(--heroui-default-300))",
        ring: "hsl(var(--heroui-focus))",
        background: "hsl(var(--heroui-background))",
        foreground: "hsl(var(--heroui-foreground))",
        card: {
          DEFAULT: "hsl(var(--heroui-content1))",
          foreground: "hsl(var(--heroui-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--heroui-default-100))",
          foreground: "hsl(var(--heroui-default-500))",
        },
        accent: {
          DEFAULT: "hsl(var(--heroui-content2))",
          foreground: "hsl(var(--heroui-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--heroui-content1))",
          foreground: "hsl(var(--heroui-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--heroui-primary))",
          foreground: "hsl(var(--heroui-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--heroui-secondary))",
          foreground: "hsl(var(--heroui-secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--heroui-danger))",
          foreground: "hsl(var(--heroui-danger-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--heroui-success))",
          foreground: "hsl(var(--heroui-success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--heroui-warning))",
          foreground: "hsl(var(--heroui-warning-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--heroui-danger))",
          foreground: "hsl(var(--heroui-danger-foreground))",
        },
        surface: "#FFFFFF",
        "score-low": "#EF4444",
        "score-medium": "#F59E0B",
        "score-high": "#22C55E",
        "score-excellent": "#10B981",
      },
      borderRadius: {
        lg: "var(--heroui-radius-large)",
        md: "calc(var(--heroui-radius-large) - 4px)",
        sm: "calc(var(--heroui-radius-large) - 8px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-poppins)", "var(--font-sans)", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "Tajawal", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "h1": ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h2": ["2rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" }],
        "h3": ["1.5rem", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        "h4": ["1.25rem", { lineHeight: "1.5", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        "body": ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        "caption": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.01em" }],
      },
      spacing: {
        "4.5": "1.125rem",
        "18": "4.5rem",
        "76": "19rem",
      },
      boxShadow: {
        "soft": "0 2px 8px 0 rgb(0 0 0 / 0.04)",
        "card": "0 2px 10px 0 rgb(0 0 0 / 0.06)",
        "elevated": "0 8px 24px -4px rgb(0 0 0 / 0.08)",
        "float": "0 12px 32px -4px rgb(0 0 0 / 0.12)",
        "modal": "0 24px 48px -12px rgb(0 0 0 / 0.18)",
        "primary-glow": "0 8px 24px -4px rgb(14 165 133 / 0.25)",
        "success-glow": "0 8px 16px -4px rgb(16 185 129 / 0.25)",
        "warning-glow": "0 8px 16px -4px rgb(245 158 11 / 0.25)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
        "score-fill": {
          "from": { strokeDashoffset: "283" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "check-mark": {
          "0%": { transform: "scale(0)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        "slide-down": {
          "from": { opacity: "0", maxHeight: "0" },
          "to": { opacity: "1", maxHeight: "500px" },
        },
        "progress-fill": {
          "0%": { width: "0%" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "fade-in-down": "fade-in-down 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "scale-out": "scale-out 0.2s ease-out",
        "progress-fill": "progress-fill 1s ease-out forwards",
        "shimmer": "shimmer 2s infinite linear",
        "score-fill": "score-fill 1.5s ease-out forwards",
        "count-up": "count-up 0.5s ease-out forwards",
        "check-mark": "check-mark 0.3s ease-out forwards",
        "slide-down": "slide-down 0.3s ease-out forwards",
        "float": "float 3s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "gradient-x": "gradient-x 3s ease infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14,165,133,0.15), transparent)",
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        light: {
          background: 'oklch(0.990 0.004 160)',
          foreground: 'oklch(0.230 0.030 170)',
          card: {
            DEFAULT: 'oklch(1.000 0 0)',
            foreground: 'oklch(0.230 0.030 170)',
          },
          popover: {
            DEFAULT: 'oklch(1.000 0 0)',
            foreground: 'oklch(0.230 0.030 170)',
          },
          primary: {
            DEFAULT: 'oklch(0.580 0.160 165)',
            foreground: 'oklch(0.990 0 0)',
          },
          secondary: {
            DEFAULT: 'oklch(0.950 0.010 160)',
            foreground: 'oklch(0.350 0.050 170)',
          },
          muted: {
            DEFAULT: 'oklch(0.965 0.006 160)',
            foreground: 'oklch(0.500 0.030 170)',
          },
          accent: {
            DEFAULT: 'oklch(0.930 0.015 160)',
            foreground: 'oklch(0.280 0.040 170)',
          },
          success: {
            DEFAULT: 'oklch(0.650 0.190 150)',
            foreground: 'oklch(0.990 0 0)',
          },
          warning: {
            DEFAULT: 'oklch(0.780 0.150 80)',
            foreground: 'oklch(0.250 0.050 80)',
          },
          danger: {
            DEFAULT: 'oklch(0.600 0.220 25)',
            foreground: 'oklch(0.990 0 0)',
          },
          border: 'oklch(0.910 0.010 160)',
          input: 'oklch(0.910 0.010 160)',
          ring: 'oklch(0.580 0.160 165)',
          divider: 'oklch(0.920 0.008 160)',
          content1: 'oklch(1.000 0 0)',
          content2: 'oklch(0.975 0.005 160)',
          content3: 'oklch(0.960 0.008 160)',
          content4: 'oklch(0.940 0.012 160)',
          focus: 'oklch(0.580 0.160 165)',
          overlay: 'oklch(0 0 0 / 0.54)',
        },
        dark: {
          background: 'oklch(0.180 0.020 170)',
          foreground: 'oklch(0.940 0.010 160)',
          card: {
            DEFAULT: 'oklch(0.220 0.020 170)',
            foreground: 'oklch(0.940 0.010 160)',
          },
          popover: {
            DEFAULT: 'oklch(0.220 0.020 170)',
            foreground: 'oklch(0.940 0.010 160)',
          },
          primary: {
            DEFAULT: 'oklch(0.700 0.150 165)',
            foreground: 'oklch(0.180 0.020 170)',
          },
          secondary: {
            DEFAULT: 'oklch(0.250 0.020 170)',
            foreground: 'oklch(0.900 0.010 160)',
          },
          muted: {
            DEFAULT: 'oklch(0.250 0.020 170)',
            foreground: 'oklch(0.600 0.020 170)',
          },
          accent: {
            DEFAULT: 'oklch(0.280 0.020 170)',
            foreground: 'oklch(0.920 0.010 160)',
          },
          success: {
            DEFAULT: 'oklch(0.700 0.180 150)',
            foreground: 'oklch(0.180 0.020 170)',
          },
          warning: {
            DEFAULT: 'oklch(0.780 0.150 80)',
            foreground: 'oklch(0.200 0.040 80)',
          },
          danger: {
            DEFAULT: 'oklch(0.650 0.220 25)',
            foreground: 'oklch(0.990 0 0)',
          },
          border: 'oklch(0.320 0.020 170)',
          input: 'oklch(0.320 0.020 170)',
          ring: 'oklch(0.700 0.150 165)',
          divider: 'oklch(0.300 0.020 170)',
          content1: 'oklch(0.220 0.020 170)',
          content2: 'oklch(0.200 0.020 170)',
          content3: 'oklch(0.180 0.020 170)',
          content4: 'oklch(0.160 0.020 170)',
          focus: 'oklch(0.700 0.150 165)',
          overlay: 'oklch(0 0 0 / 0.54)',
        },
      },
    }),
  ],
};

export default config;
