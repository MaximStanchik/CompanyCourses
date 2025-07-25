import { useEffect, useState, useRef } from "react";

const useTheme = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const isFirstRun = useRef(true);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    const prev = localStorage.getItem("theme");
    localStorage.setItem("theme", theme);
    // Skip emitting on the very first mount or if theme hasn't actually changed
    if (!isFirstRun.current && prev !== theme) {
      window.dispatchEvent(new Event('themeChanged'));
    }
    isFirstRun.current = false;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme };
};

export default useTheme;
