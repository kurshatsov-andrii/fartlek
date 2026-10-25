import { baseCity, categorySport, detectCity } from "./start-filters";
import type { EventCategory } from "./i18n";

export interface CatalogStart {
  source: "event" | "start";
  id: string;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  register_url: string | null;
  results_url: string | null;
  registration_status: string | null;
  registration_opens_on?: string | null;
  registration_closed?: boolean;
  event_date: string | null;
  city: string | null;
  location: string | null;
  region: string | null;
  organizer_name: string | null;
  sport_types: string[];
  distances_km: number[];
  is_paid: boolean | null;
}

export interface ExternalCatalogStart extends Omit<CatalogStart, "source" | "url" | "location"> {
  slug: string | null;
}

export interface CatalogEvent {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  organizer_name: string;
  event_date: string;
  location: string | null;
  image_url: string | null;
  is_paid: boolean;
  category: EventCategory;
  registration_closed: boolean;
  registration_opens_on: string | null;
  results_url: string | null;
  results_pdf_url: string | null;
  distances: { distance_km: number; is_active: boolean }[];
}

/** Keep the original source IDs: planner actions and detail pages use different catalogs. */
export function mergeStartsCatalog(starts: ExternalCatalogStart[], events: CatalogEvent[]): CatalogStart[] {
  return [
    ...starts.map((start): CatalogStart => ({
      ...start,
      source: "start",
      url: `/starts/${start.slug ?? start.id}`,
      city: baseCity(start.city) || null,
      location: start.city,
    })),
    ...events.map((event): CatalogStart => {
      const url = `/events/${event.slug ?? event.id}`;
      const sport = categorySport(event.category);
      return {
        source: "event",
        id: event.id,
        url,
        title: event.title,
        description: event.description,
        image_url: event.image_url,
        register_url: url,
        results_url: event.results_url || event.results_pdf_url,
        registration_status: null,
        registration_opens_on: event.registration_opens_on,
        registration_closed: event.registration_closed,
        event_date: event.event_date,
        city: detectCity(event.location) || baseCity(event.location) || null,
        location: event.location,
        region: null,
        organizer_name: event.organizer_name,
        sport_types: sport ? [sport] : [],
        distances_km: event.distances.filter((distance) => distance.is_active !== false)
          .map((distance) => Number(distance.distance_km)),
        is_paid: event.is_paid,
      };
    }),
  ];
}