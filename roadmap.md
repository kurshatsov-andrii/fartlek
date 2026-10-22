# Roadmap

## Unsaved forms across tabs and windows
- [ ] Fix background authentication refresh resetting editors
- [ ] Audit other adding/editing forms for focus-triggered resets
- [ ] Run regression tests and signed-in tab/window checks without saving test changes

## Homepage start discovery
- [x] Show only populated upcoming categories; shared filters above sibling event and other-start sections; empty events hidden; Krayna search and marathon selection verified with real starts, 9 tests passed, desktop/mobile checked without page errors

## Starts page community block
- [x] Move "Бігова спільнота Харкова у Telegram" bar below the catalog and directly above "Завершені"; verified block order at 1280px and 393px, no page errors

## Homepage compact layout
- [x] Reduce oversized section spacing; move community and Partners above completed starts; show two latest blog articles with images and links; verified at 393px and 1280px, both images loaded and article link opened without page errors

## Features page refresh
- [x] Describe saved starts, comparisons, opt-in reminders, guest likes, registration information and city calendars in Ukrainian and English; Ukrainian page and both participant/organizer tabs verified without browser errors (site currently Ukrainian-only)

## Category page recovery
- [x] Fix category rendering after completed-date changes; all 14 categories and marathon search verified with real records, no browser errors; 19 date/registration tests passed

## Vinnytsia calendar 2027
- [x] Add /calendar/vinnytsia using existing published starts, city filtering, metadata and sitemap
- [x] Verify VINNYTSIA RUN on May 23 and September 5, 2027 in the page and initial HTML (13 tests; desktop/mobile navigation checked)

## Visitor likes
- [x] Allow guests to like/unlike starts, persist browser identity, and verify shared counts and reloads (guest browser flow and identity test passed)

## SEO 2027 — current phase
- [x] Align homepage, calendar, Starts, map and category metadata for 2027; preserve historical dates and URLs
- [x] Add linked Kharkiv calendar using real records and the existing 2027 poster
- [x] Render calendar records and post-specific metadata for crawlers; verify sitemap and filters (123 URLs)
- [x] Verify public flows, initial HTML and 16 tests
- [x] /calendar/kharkiv indexed by Google (Submitted and indexed, crawled 18 Oct 2026) — no manual Request indexing needed
- [x] Import 16 Kharkiv 2027 starts from the owner's poster; preserve unknown prices and registration links
- [x] Verify imported starts in national and Kharkiv calendars (16 and 18 rows; 11 tests passed)
- [x] Request publication of updated pages for fartlek.com.ua (scheduled; completion not verified)
- [x] Check Google calendar indexing: /calendar indexed; /calendar/kharkiv unknown to Google; submit updated live sitemap (123 URLs, HTTP 204)
- [x] Calendar recrawls confirmed via URL Inspection: /calendar/kharkiv "Submitted and indexed" (18 Oct 2026)

## Saved starts, comparisons and opt-in reminders
- [x] Save platform events, external starts and calendar entries to a private account list
- [x] Compare up to three starts using current published information
- [x] Opt-in in-app reminders and calendar export with alarms; unknown times remain all-day dates
- [x] Verify signed-in saving, read-back, removal, comparisons and calendar downloads (18 tests; browser verified)

## Done
- [x] SiS partner banner: calendar above the add-event button and filters, upcoming start/event descriptions, and homepage Partners section
- [x] Calendar location: include city, region and venue from start descriptions
- [x] Show full event/start posters with image-derived backdrop in cards and detail pages
- [x] Custom domain fartlek.com.ua + www connected, primary set, redirects working
- [x] Mail on Mirohost preserved (info@fartlek.com.ua works)
- [x] 301 redirects for old pages published on fartlek.com.ua
- [x] sitemap.xml and robots.txt rewritten to fartlek.com.ua (source)
- [x] Owner published saved starts, likes, reminders and registration statuses to fartlek.com.ua (Oct 18 2026)

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
