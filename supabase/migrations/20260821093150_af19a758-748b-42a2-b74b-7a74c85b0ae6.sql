-- Прибрати артефакти в містах
UPDATE public.telegram_starts SET city = regexp_replace(city, '\s+(або|чи)$', '', 'i') WHERE city ~* '\s+(або|чи)$';

WITH v AS (
  SELECT id, city,
         btrim(regexp_replace((regexp_match(description, '(^|\n)[[:space:]]*\*{0,2}Де\*{0,2}[[:space:]]*[:\-—][[:space:]]*([^\n]+)', 'i'))[2], '[[:space:]]*[.,;:]+$', '')) AS venue
  FROM public.telegram_starts
)
UPDATE public.telegram_starts t
SET city = t.city || ', ' || v.venue
FROM v
WHERE v.id = t.id
  AND t.city IS NOT NULL
  AND v.venue IS NOT NULL
  AND length(v.venue) BETWEEN 2 AND 80
  AND position(lower(v.venue) in lower(t.city)) = 0;

-- Синхронізувати з календарем
UPDATE public.calendar_events c
SET location = t.city
FROM public.telegram_starts t
WHERE c.telegram_start_id = t.id AND t.city IS NOT NULL AND c.location IS DISTINCT FROM t.city;