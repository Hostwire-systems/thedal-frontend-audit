import { theme as antdTheme, type ThemeConfig } from "antd";

export type AuthThemeMode = "light" | "dark";

type CssVarMap = Record<`--${string}`, string>;

const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const lightCssVars: CssVarMap = {
  "--auth-surface-page": "255 255 255",
  "--auth-surface-elevated": "255 255 255",
  "--auth-surface-muted": "236 242 247",
  "--auth-text-primary": "62 62 62",
  "--auth-text-secondary": "107 114 128",
  "--auth-text-tertiary": "119 117 135",
  "--auth-text-resend": "14 94 158",
  "--auth-border-default": "199 196 216",
  "--auth-border-subtle": "243 244 246",
  "--auth-border-focus": "14 94 158",
  "--auth-interactive-primary": "14 94 158",
  "--auth-interactive-primary-hover": "12 78 132",
  "--auth-interactive-link": "14 94 158",
  "--auth-status-success": "34 197 94",
  "--auth-status-error": "201, 20, 33",
  
  "--auth-otp-input-bg": "251 251 251",
  "--auth-focus-ring": "14 94 158",
  "--auth-shadow-1": "0 10px 30px rgba(0,0,0,0.06)",
  "--auth-shadow-2": "0 18px 50px rgba(0,0,0,0.10)",
  "--auth-radius-sm": "10px",
  "--auth-radius-md": "12px",
  "--auth-radius-lg": "16px",
  "--auth-font-family": FONT_SANS,
};

const darkCssVars: CssVarMap = {
  "--auth-surface-page": "10 13 20",
  "--auth-surface-elevated": "17 24 39",
  "--auth-surface-muted": "15 23 42",
  "--auth-text-primary": "243 244 246",
  "--auth-text-secondary": "156 163 175", 
  "--auth-text-tertiary": "107 114 128",
  "--auth-text-resend": "156 163 175",
  "--auth-border-default": "55 65 81",
  "--auth-border-subtle": "31 41 55",
  "--auth-border-focus": "14 94 158",
  "--auth-interactive-primary": "14 94 158",
  "--auth-interactive-primary-hover": "12 78 132",
  "--auth-interactive-link": "14 94 158",
  "--auth-status-success": "34 197 94",
  "--auth-status-error": "248 113 113",
  "--auth-focus-ring": "96 165 250",
  "--auth-shadow-1": "0 10px 30px rgba(0,0,0,0.40)",
  "--auth-shadow-2": "0 18px 50px rgba(0,0,0,0.55)",
  "--auth-radius-sm": "10px",
  "--auth-radius-md": "12px",
  "--auth-radius-lg": "16px",
  "--auth-font-family": FONT_SANS,
};

export const getAuthTheme = (mode: AuthThemeMode): { cssVars: CssVarMap; antdTheme: ThemeConfig } => {
  const isDark = mode === "dark";
  const cssVars = isDark ? darkCssVars : lightCssVars;

  const algorithm = isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  const antdThemeConfig: ThemeConfig = {
    algorithm,
    token: {
      fontFamily: cssVars["--auth-font-family"],
      colorPrimary: "#0E5E9E",
      colorTextBase: isDark ? "#F3F4F6" : "#111827",
      colorText: isDark ? "#F3F4F6" : "#111827",
      colorTextSecondary: isDark ? "#9CA3AF" : "#6B7280",
      colorBgLayout: isDark ? "#0A0D14" : "#FFFFFF",
      colorBgContainer: isDark ? "#111827" : "#FFFFFF",
      colorBorder: isDark ? "#374151" : "#E5E7EB",
      borderRadius: 12,
      controlOutline: isDark ? "rgba(96, 165, 250, 0.35)" : "rgba(59, 130, 246, 0.25)",
      controlOutlineWidth: 3,
    },
    components: {
      Button: {
        primaryShadow: "none",
      },
      Input: {
        colorBgContainer: isDark ? "#111827" : "#FFFFFF",
        activeBorderColor: "#0E5E9E",
        hoverBorderColor: "#0E5E9E",
      },
      Tabs: {
        itemSelectedColor: "#0E5E9E",
        inkBarColor: "#0E5E9E",
      },
    },
  };

  return { cssVars, antdTheme: antdThemeConfig };
};
