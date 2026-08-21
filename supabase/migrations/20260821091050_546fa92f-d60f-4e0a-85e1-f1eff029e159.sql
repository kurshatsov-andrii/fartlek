
UPDATE public.telegram_starts SET city='Київ' WHERE city='Київ або';
UPDATE public.telegram_starts SET city='Дніпро' WHERE city LIKE 'Дніпро%';
UPDATE public.telegram_starts SET city='Стара Гута' WHERE city='С' AND title ILIKE '%Синьогора%';
UPDATE public.calendar_events SET location='Київ' WHERE location='Київ або';
UPDATE public.calendar_events SET location='Дніпро' WHERE location LIKE 'Дніпро%' AND location <> 'Дніпро';
UPDATE public.calendar_events SET location='с. Стара Гута, Івано-Франківська обл.' WHERE location='С';
