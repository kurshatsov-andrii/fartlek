import { ShieldCheck } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { INSURANCE_PARTNER } from "@/lib/insurance-partner";

/**
 * Спільний блок про спортивне страхування. Використовується на головній,
 * /starts, /calendar, /map, /clubs, /organizers, а також на сторінках
 * окремих подій і стартів, щоб посилання й тексти залишалися однаковими всюди.
 */
export function InsuranceBanner() {
  const { lang } = useApp();

  if (lang === "en") {
    return (
      <section aria-label="Sports insurance" className="mt-12">
        <div className="rounded-lg border bg-card/50 p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold sm:text-2xl">
            <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            Sports insurance for race participants
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Before registering for a race or trail, consider insurance: a{" "}
            <a
              href={INSURANCE_PARTNER.sportsUrl}
              target="_blank"
              rel="noopener"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              sports insurance
            </a>{" "}
            policy can be arranged online and covers training sessions and competitions.
          </p>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            If an athlete also drives, you can arrange{" "}
            <a
              href={INSURANCE_PARTNER.url}
              target="_blank"
              rel="noopener"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              insurance online
            </a>{" "}
            — motor third-party liability (OSAGO), Green Card for driving abroad, travel
            medical insurance, or sports insurance — all in one place.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Спортивне страхування" className="mt-12">
      <div className="rounded-lg border bg-card/50 p-6">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold sm:text-2xl">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
          Спортивне страхування для учасників стартів
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Перед реєстрацією на забіг, трейл чи триатлон варто подбати про страховку. Оформити{" "}
          <a
            href={INSURANCE_PARTNER.sportsUrl}
            target="_blank"
            rel="noopener"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            спортивне страхування
          </a>{" "}
          можна онлайн — поліс покриває тренування та змагання.
        </p>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">
          Якщо спортсмен має авто, то автоцивілку, зелену карту на авто за кордон, медичне
          туристичне страхування за кордон або спортивне страхування можна оформити як{" "}
          <a
            href={INSURANCE_PARTNER.url}
            target="_blank"
            rel="noopener"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            страхування онлайн
          </a>{" "}
          — усе на одному сайті.
        </p>
      </div>
    </section>
  );
}
