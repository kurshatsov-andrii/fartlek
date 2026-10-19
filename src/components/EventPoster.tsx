import { cn } from "@/lib/utils";

interface EventPosterProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  /** "contain" keeps the whole poster visible with a blurred backdrop; "cover" fills the frame edge to edge. */
  fit?: "contain" | "cover";
}

/** "contain" keeps the original poster readable; "cover" fills the frame with no empty bars. */
export function EventPoster({ src, alt, className, loading = "lazy", fit = "contain" }: EventPosterProps) {
  return (
    <div className={cn("relative isolate h-full w-full overflow-hidden bg-muted", className)}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading={loading}
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-xl opacity-60"
      />
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={cn(
          "relative block h-full w-full",
          // Phones keep the edge-to-edge fill; tablets and desktops show the whole poster.
          fit === "cover" ? "object-cover md:object-contain" : "object-contain",
        )}
      />
    </div>
  );
}