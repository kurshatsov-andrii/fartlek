import { useApp } from "@/contexts/AppContext";

/** Returns a picker `L(uk, en)` for inline bilingual UI strings. */
export function useL() {
  const { lang } = useApp();
  return <T,>(uk: T, en: T): T => (lang === "uk" ? uk : en);
}
