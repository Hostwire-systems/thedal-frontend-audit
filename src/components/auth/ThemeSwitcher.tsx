// src/components/auth/ThemeSwitcher.tsx
import React, { useContext } from "react";
import { AuthThemeContext } from "./AuthThemeProvider";
import { SunFilled, MoonFilled } from "@ant-design/icons";

const ThemeSwitcher: React.FC = () => {
  const context = useContext(AuthThemeContext);

  if (!context) {
    console.error("ThemeSwitcher must be used within an AuthThemeProvider");
    return null;
  }

  const { theme, setTheme } = context;

  return (
    <div className="flex items-center">
      <div
        role="radiogroup"
        aria-label="Theme switcher"
        className="relative flex items-center p-1 rounded-full bg-[rgb(var(--auth-switcher-bg)/1)] border border-[rgb(var(--auth-border-default)/0.5)] shadow-inner transition-all duration-500 ease-in-out w-[72px] h-[36px] group hover:shadow-md"
      >
        {/* Sliding thumb */}
        <div
          aria-hidden="true"
          className={`absolute top-[3px] left-[3px] w-[28px] h-[28px] rounded-full bg-[rgb(var(--auth-switcher-thumb)/1)] shadow-md transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
            theme === "dark" ? "translate-x-[34px] rotate-[360deg]" : "translate-x-0 rotate-0"
          }`}
        >
          {/* Subtle glow on thumb */}
          <div className="absolute inset-0 rounded-full blur-[4px] bg-[rgb(var(--auth-switcher-thumb)/0.4)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Icons container */}
        <div className="flex justify-between items-center w-full px-1.5 relative z-10 pointer-events-none">
          <SunFilled
            className={`text-[14px] transition-all duration-500 ${
              theme === "light" 
                ? "text-[rgb(var(--auth-switcher-icon-active)/1)] scale-110" 
                : "text-[rgb(var(--auth-switcher-icon-inactive)/1)] scale-90 opacity-40"
            }`}
          />
          <MoonFilled
            className={`text-[14px] transition-all duration-500 ${
              theme === "dark" 
                ? "text-[rgb(var(--auth-switcher-icon-active)/1)] scale-110" 
                : "text-[rgb(var(--auth-switcher-icon-inactive)/1)] scale-90 opacity-40"
            }`}
          />
        </div>

        {/* Clickable areas */}
        <button
          type="button"
          onClick={() => setTheme("light")}
          className="absolute left-0 top-0 w-1/2 h-full rounded-l-full cursor-pointer z-20 focus:outline-none"
          aria-label="Switch to light theme"
        />
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className="absolute right-0 top-0 w-1/2 h-full rounded-r-full cursor-pointer z-20 focus:outline-none"
          aria-label="Switch to dark theme"
        />
      </div>
    </div>
  );
};

export default ThemeSwitcher;
