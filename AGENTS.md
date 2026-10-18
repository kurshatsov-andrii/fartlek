# Architecture rules

- Enrich calendar locations in the shared calendar-location formatter using linked published start descriptions; keep stored records unchanged so edits and synchronization remain independent of display.

- Use the shared EventPoster component for public event/start posters so the original remains fully visible and an image-derived backdrop fills unused space consistently.

- Keep the SiS offer in a shared configuration and banner component so partner links and discounts stay consistent across placements.

- Keep start-listing filter facets (distance buckets, city detection, month matching, category-to-sport mapping) in the shared start-filters module so the Starts page and category pages filter identically.

- Keep discovery-page metadata in discovery-seo and use it in both route heads and page SEO so initial HTML and hydrated metadata agree.
- Reuse CalendarPage for national and city calendars with public-calendar Query data primed by loaders so crawlers and visitors see the same real records.
- Keep calendar route variants as sibling leaf files under routes/calendar so the city calendar does not inherit a second calendar page or canonical.
- Format calendar date-only values in an explicit Kyiv timezone so browser and crawler timezones cannot shift race dates or month headings.
- Derive public blog-post metadata from published post fields and then apply per-path admin overrides so new posts do not inherit generic titles.
- Treat public metadata transport failures as optional fallback metadata and keep calendar data failures in a retryable page with navigation, so connectivity interruptions cannot blank public pages.