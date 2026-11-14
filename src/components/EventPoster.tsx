import { cn } from "@/lib/utils";
import { imageDeliveryUrl } from "@/lib/image-delivery";

interface EventPosterProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  /** Both modes keep the whole poster visible; "cover" selects detail-page delivery sizes. */
  fit?: "contain" | "cover";
  sizes?: string;
}

/** Keeps the original poster fully visible with an image-derived backdrop on every screen. */
export function EventPoster({ src, alt, className, loading = "lazy", fit = "contain", sizes = fit === "cover" ? "(max-width: 767px) 100vw, 1000px" : "(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) 50vw, 450px" }: EventPosterProps) {
  const optimized = imageDeliveryUrl(src, 1140);
  const srcSet = optimized === src ? undefined : [480, 768, 1140, 1920].map((width) => `${imageDeliveryUrl(src, width)} ${width}w`).join(", ");
  const fallback: React.ReactEventHandler<HTMLImageElement> = (event) => {
    const image = event.currentTarget;
    if (image.getAttribute("src") === src) return;
    image.removeAttribute("srcset");
    image.src = src;
  };
  return (
    <div className={cn("relative isolate h-full w-full overflow-hidden bg-muted", className)}>
      <img
        src={imageDeliveryUrl(src, 80, 35)}
        alt=""
        aria-hidden="true"
        loading={loading}
        decoding="async"
        onError={fallback}
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-xl opacity-60"
      />
      <img
        src={optimized}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={fallback}
        className="relative block h-full w-full object-contain"
      />
    </div>
  );
}