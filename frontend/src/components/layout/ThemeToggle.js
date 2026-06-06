import React from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle${isDark ? " theme-toggle--dark" : ""}`}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <FaSun className="theme-toggle__icon theme-toggle__icon--sun" />
        <span className="theme-toggle__thumb" />
        <FaMoon className="theme-toggle__icon theme-toggle__icon--moon" />
      </span>
      {/* <span className="theme-toggle__label">
        {isDark ? "Dark" : "Light"}
      </span> */}
    </button>
  );
};

export default ThemeToggle;
