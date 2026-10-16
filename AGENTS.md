# Architecture rules

- Enrich calendar locations in the shared calendar-location formatter using linked published start descriptions; keep stored records unchanged so edits and synchronization remain independent of display.

- Use the shared EventPoster component for public event/start posters so the original remains fully visible and an image-derived backdrop fills unused space consistently.

- Keep the SiS offer in a shared configuration and banner component so partner links and discounts stay consistent across placements.

- Keep start-listing filter facets (distance buckets, city detection, month matching, category-to-sport mapping) in the shared start-filters module so the Starts page and category pages filter identically.