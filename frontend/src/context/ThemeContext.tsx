import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Theme = "light" | "dark";
type ThemeColor = "orange" | "blue" | "purple" | "green";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) return savedTheme;

    // Then check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    // Default to light
    return "light";
  });

  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    const savedColor = localStorage.getItem("themeColor") as ThemeColor | null;
    return savedColor || "orange";
  });

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem("theme", theme);

    // Update document classes
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    // Update localStorage when theme color changes
    localStorage.setItem("themeColor", themeColor);

    // Remove all theme color classes
    document.documentElement.classList.remove(
      "theme-orange",
      "theme-blue",
      "theme-purple",
      "theme-green"
    );

    // Add current theme color class
    document.documentElement.classList.add(`theme-${themeColor}`);
  }, [themeColor]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Only change if user hasn't explicitly set a preference
      if (!localStorage.getItem("theme")) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    // Add listener if supported
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setThemeColor = (newColor: ThemeColor) => {
    setThemeColorState(newColor);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, themeColor, setThemeColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
