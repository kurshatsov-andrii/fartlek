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
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("fe.lang") as Lang) || "uk");
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("fe.theme") as Theme | null;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("fe.theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("fe.lang", lang);
  }, [lang]);

  const value: AppContextValue = {
    lang,
    setLang: setLangState,
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState((p) => (p === "dark" ? "light" : "dark")),
    t: translations[lang],
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
