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
  const [lang, setLangState] = useState<Lang>("uk");
  const theme: Theme = "dark";

  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("fe.theme", "dark");
    if (localStorage.getItem("fe.lang") === "en") setLangState("en");
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("fe.lang", l);
  };

  const value: AppContextValue = {
    lang,
    setLang,
    theme,
    setTheme: () => {},
    toggleTheme: () => {},
    t: translations[lang],
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    // Safe fallback to avoid blank screen if a consumer renders before provider mounts
    return {
      lang: "uk" as Lang,
      setLang: () => {},
      theme: "dark" as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
      t: translations.uk,
    };
  }
  return ctx;
};
