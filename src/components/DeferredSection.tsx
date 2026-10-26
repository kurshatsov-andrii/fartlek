import { useEffect, useRef, useState } from "react";

/**
 * Renders children only once the placeholder approaches the viewport.
 * Server and first client render both output an empty placeholder, so hydration
 * stays consistent; heavy below-fold sections (and their data fetching) start
 * only when the visitor actually scrolls toward them.
 */
export const DeferredSection = ({ children, rootMargin = "600px" }: { children: React.ReactNode; rootMargin?: string }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  if (!visible) return <div ref={ref} aria-hidden="true" />;
  return <>{children}</>;
};
