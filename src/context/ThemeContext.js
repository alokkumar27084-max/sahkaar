import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme-mode', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, toggleTheme: () => setIsDark(!isDark) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
