import React, { createContext, useEffect, useMemo, useState } from "react";
import { ConfigProvider } from "antd";
import { useLocation } from "react-router-dom";
import { getAuthTheme, type AuthThemeMode } from "../../theme/auth/getAuthTheme";
import "../../theme/auth/authTheme.css";

// Define the shape of our theme context
interface AuthThemeContextType {
  theme: AuthThemeMode;
  setTheme: (theme: AuthThemeMode) => void;
}

// Create and export the context
export const AuthThemeContext = createContext<AuthThemeContextType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

const STORAGE_KEY = "thedal.auth.theme";

const readStoredMode = (): AuthThemeMode | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "dark" || raw === "light" ? raw : null;
};

const readQueryMode = (search: string): AuthThemeMode | null => {
  const params = new URLSearchParams(search);
  const raw = params.get("theme");
  return raw === "dark" || raw === "light" ? raw : null;
};

const readSystemMode = (): AuthThemeMode => {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export default function AuthThemeProvider({ children }: Props) {
  const location = useLocation();
  const queryMode = useMemo(() => readQueryMode(location.search), [location.search]);
  const [mode, setMode] = useState<AuthThemeMode>(() => queryMode || readStoredMode() || "light");

  useEffect(() => {
    if (queryMode) {
      setMode(queryMode);
      return;
    }
    const stored = readStoredMode();
    if (stored) {
      setMode(stored);
    }
  }, [queryMode]);

  const { cssVars, antdTheme } = useMemo(() => getAuthTheme(mode), [mode]);

  const contextValue = useMemo(() => ({
    theme: mode,
    setTheme: (newMode: AuthThemeMode) => {
      setMode(newMode);
      localStorage.setItem(STORAGE_KEY, newMode);
    }
  }), [mode]);

  return (
    <AuthThemeContext.Provider value={contextValue}>
      <div data-scope="auth" data-theme={mode} style={cssVars as unknown as React.CSSProperties}>
        <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>
      </div>
    </AuthThemeContext.Provider>
  );
}
