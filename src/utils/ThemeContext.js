import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LIGHT, DARK, STORAGE_KEYS } from "./constants";

const ThemeContext = createContext({ colors: LIGHT, isDark: false, toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.theme).then((v) => {
      if (v === "1") setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    setIsDark((d) => {
      const next = !d;
      AsyncStorage.setItem(STORAGE_KEYS.theme, next ? "1" : "0");
      return next;
    });
  };

  const colors = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
