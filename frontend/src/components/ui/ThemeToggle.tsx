import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-8 w-14 items-center rounded-full bg-gray-200 p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 dark:bg-gray-700 dark:focus:ring-offset-brand-dark"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 dark:bg-gray-900 ${
          theme === "dark" ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {theme === "dark" ? (
          <Moon size={14} className="text-brand-orange" />
        ) : (
          <Sun size={14} className="text-brand-orange" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
