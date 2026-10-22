# Architecture rules

- Keep background auth refresh out of initial loading and hydrate editable forms by account/record IDs, not auth object identity, so tab/window changes cannot unmount forms or overwrite unsaved input.

- Keep guest likes separate from account likes, accessible only through token-scoped RPCs; aggregate both for public counts without exposing visitor identities.

- Persist saved start references and reminder opt-ins in user-owned rows with RLS; resolve current public data rather than storing snapshots so date edits remain current.
- Share start planner controls across listings and details; keep comparison selection session-local, and derive in-app reminders from Kyiv dates without polling jobs.
- Keep the planner context identity in a non-component module for React Refresh, and let shared navigation render without planner state on fallback pages.
- Export unknown start times as all-day calendar entries and only add alarms on explicit reminder opt-in so calendar exports never invent start times.
- Let signed-in users browse start discovery and planner pages without completing registration profile fields; those fields remain required by the existing registration flow.

- Enrich calendar locations in the shared calendar-location formatter using linked published start descriptions; keep stored records unchanged so edits and synchronization remain independent of display.

- Use the shared EventPoster component for public event/start posters so the original remains fully visible and an image-derived backdrop fills unused space consistently.

- Keep the SiS offer in a shared configuration and banner component so partner links and discounts stay consistent across placements.

- Keep start-listing filter facets (distance buckets, city detection, month matching, category-to-sport mapping) in the shared start-filters module so the Starts page and category pages filter identically.
- Keep homepage discovery controls above sibling event and external-start sections; derive category availability from upcoming records in both catalogs so empty categories and empty event results do not mislead visitors.

- Keep discovery-page metadata in discovery-seo and use it in both route heads and page SEO so initial HTML and hydrated metadata agree.
- Reuse CalendarPage for national and city calendars with public-calendar Query data primed by loaders so crawlers and visitors see the same real records.
- Extend the shared calendar scope predicate for each city and reuse its public records without duplicating starts, so city pages remain current when records change.
- City calendar scoping includes explicitly attributed local season posters through source notes, without rewriting out-of-city venues as city locations.
- Keep calendar route variants as sibling leaf files under routes/calendar so the city calendar does not inherit a second calendar page or canonical.
- Format calendar date-only values in an explicit Kyiv timezone so browser and crawler timezones cannot shift race dates or month headings.
- Derive public blog-post metadata from published post fields and then apply per-path admin overrides so new posts do not inherit generic titles.
- Treat public metadata transport failures as optional fallback metadata and keep calendar data failures in a retryable page with navigation, so connectivity interruptions cannot blank public pages.- Derive registration state (open/expected/closed/cancelled/unknown) only in the shared registration-status module; external starts stay "unknown" until an admin confirms a status, so the site never claims registration is open without a source.
- Detect date-change and registration-opened reminders by comparing current public data with the acknowledged values on the user's saved row; reminders stay opt-in and in-app.
- A start counts as finished from the day before its start date; decide finished/upcoming splits, register-button hiding and the SiS banner with the shared isCompletedDate in src/lib/event-date, never raw date comparisons.

- Keep running-tip categories in the shared tips module as fixed slugs so the /tips filter, category pages, admin form and sitemap stay aligned.
