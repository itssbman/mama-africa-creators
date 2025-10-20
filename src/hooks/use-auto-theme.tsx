import { useEffect } from "react";

export const useAutoTheme = () => {
  useEffect(() => {
    const applyTheme = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Dark mode from 8pm (20:00) to 6am (06:00)
      const isDarkTime = hour >= 20 || hour < 6;
      
      if (isDarkTime) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Apply theme immediately
    applyTheme();

    // Check every minute for theme changes
    const interval = setInterval(applyTheme, 60000);

    return () => clearInterval(interval);
  }, []);
};
