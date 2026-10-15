import { cn } from "@/lib/utils";

interface EventPosterProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

/** Keep the original poster readable; only its decorative backdrop is cropped. */
export function EventPoster({ src, alt, className, loading = "lazy" }: EventPosterProps) {
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
        className="relative block h-full w-full object-contain"
      />
    </div>
  );
}