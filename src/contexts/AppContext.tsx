import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, type Lang, type Dict } from "@/lib/i18n";

type Theme = "light" | "dark";

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  t: Dict;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const lang: Lang = "uk";
  const theme: Theme = "dark";

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.lang = "uk";
    localStorage.setItem("fe.theme", "dark");
    localStorage.setItem("fe.lang", "uk");
  }, []);

  const value: AppContextValue = {
    lang,
    setLang: () => {},
    theme,
    setTheme: () => {},
    toggleTheme: () => {},
    t: translations[lang],
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
