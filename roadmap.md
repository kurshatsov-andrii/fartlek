# Roadmap

## SEO 2027 — current phase
- [x] Align homepage, calendar, Starts, map and category metadata for 2027; preserve historical dates and URLs
- [x] Add linked Kharkiv calendar using real records and the existing 2027 poster (no individual Kharkiv 2027 records published yet)
- [x] Render calendar records and post-specific metadata for crawlers; verify sitemap and filters (123 URLs)
- [x] Verify public flows, initial HTML and 16 tests
- [ ] Publish updated pages — waits on explicit publish request

## Later phases
Saved starts, comparisons and opt-in reminders are outside this first SEO/calendar phase.

## Done
- [x] SiS partner banner: calendar above the add-event button and filters, upcoming start/event descriptions, and homepage Partners section
- [x] Calendar location: include city, region and venue from start descriptions
- [x] Show full event/start posters with image-derived backdrop in cards and detail pages
- [x] Custom domain fartlek.com.ua + www connected, primary set, redirects working
- [x] Mail on Mirohost preserved (info@fartlek.com.ua works)
- [x] 301 redirects for old pages published on fartlek.com.ua
- [x] sitemap.xml and robots.txt rewritten to fartlek.com.ua (source)

- [x] blog-images public download — accepted by owner as intended
- [x] Registration links removed from all finished events/starts (cards + detail pages)
- [x] "Онлайн" removed from start descriptions (stored SEO text + generator)
- [x] Kharkiv 2027 calendar poster replaced with owner's new image on /calendar
- [x] /calendar copy optimized for "забіги/пробіги України 2027" and "календар забігів України 2027"
- [x] Calendar page description spans full content width under the heading
- [x] Community intro (найбільша спільнота Харкова з 2026, 200+ учасників) on /about and /blog via shared CommunityIntro + FAQ first answer updated
- [x] /blog header description spans full content width on one line
- [x] Category pages (/category and every /category/<slug>) descriptions span full content width on one line
- [x] Category pages now list telegram starts alongside platform events, with the Starts page filters (search, month, distance, city, organizer, paid/free) via shared src/lib/start-filters.ts
- [x] "Найближчі події" button in the hero on phones/tablets (hidden from lg up) scrolls to the #events section
- [x] Mobile burger menu no longer repeats Старти/Календар/Мапа (they stay in the top bar only)

## Waiting on user
- [ ] "Біготрейл: Львів" (01.11.2026) — needs distance list, then publish
- [ ] Біготрейли Вінниця / Хмельницький / Тернопіль — no distances yet, unpublished
- [ ] Verify FAQ wording on /about (weekly runs — participant count confirmed)
- [x] /calendar quick year filter chips (Усі роки / 2026 / 2027) above search+filters; month dropdown narrows to chosen year
