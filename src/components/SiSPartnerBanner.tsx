import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import banner from "@/assets/sis-ukraine-fartlek.webp.asset.json";
import { SIS_PARTNER } from "@/lib/sis-partner";

export function SiSPartnerBanner() {
  const { lang } = useApp();
  const label = lang === "uk" ? "SiS зі знижкою" : "SiS with a discount";
  return (
    <div className="mx-auto w-full max-w-[800px] space-y-3">
      <a
        href={SIS_PARTNER.url}
        target="_blank"
        rel="sponsored noopener noreferrer"
        aria-label={label}
        className="block overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img src={banner.url} width={800} height={200} loading="lazy" decoding="async" className="h-auto w-full" alt="SiS Ukraine — знижка 5% на спортивне харчування за промокодом fartlek" />
      </a>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {lang === "uk"
            ? `−${SIS_PARTNER.discountPercent}% на все спортивне харчування за промокодом `
            : `${SIS_PARTNER.discountPercent}% off all sports nutrition with promo code `}
          <strong className="text-foreground">{SIS_PARTNER.promoCode}</strong>
        </p>
        <Button asChild variant="outline" size="sm">
          <a href={SIS_PARTNER.url} target="_blank" rel="sponsored noopener noreferrer">
            {label}<ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}