import React, { createContext, useContext, useState, useEffect } from 'react';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('bioguard-theme') || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bioguard-theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => t === 'light' ? 'dark' : 'light');

  return (
    _jsxDEV(ThemeContext.Provider, { value: { theme, toggle }, children:
      children }, void 0, false
    ));

};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: 'light', toggle: () => {} };
  return ctx;
};