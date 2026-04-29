export const CLUB_ACTIVITY_TYPES = [
  "road_run",
  "trail",
  "ocr",
] as const;

export type ClubActivityType = (typeof CLUB_ACTIVITY_TYPES)[number];

export const CLUB_ACTIVITY_LABELS: Record<"uk" | "en", Record<ClubActivityType, string>> = {
  uk: {
    road_run: "Біг по асфальту",
    trail: "Трейл",
    ocr: "OCR",
  },
  en: {
    road_run: "Road running",
    trail: "Trail",
    ocr: "OCR",
  },
};

export interface Club {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  city: string | null;
  description: string | null;
  activity_types: ClubActivityType[];
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  telegram_url: string | null;
  strava_url: string | null;
  youtube_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  founded_year: number | null;
  members_count: number | null;
  training_location: string | null;
  training_schedule: string | null;
  created_at: string;
  updated_at: string;
}
