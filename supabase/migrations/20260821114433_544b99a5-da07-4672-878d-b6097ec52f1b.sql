ALTER TABLE public.profiles DISABLE TRIGGER validate_profile_fields;
ALTER TABLE public.profiles DISABLE TRIGGER profiles_sync_self_athlete;
ALTER TABLE public.athletes DISABLE TRIGGER validate_athlete_fields;

UPDATE public.profiles
SET city = 'Харків'
WHERE city IS NOT NULL
  AND (
    lower(city) = 'харьков'
    OR lower(city) = 'kharkiv'
    OR lower(city) = 'kharkov'
    OR lower(city) = 'харків'
    OR lower(city) = 'харьків'
    OR lower(city) = 'harkiv'
    OR lower(city) = 'charcov'
    OR lower(city) = 'charkow'
    OR lower(city) = 'м. харків'
    OR lower(city) = 'харків (харківська)'
    OR lower(city) LIKE 'харків %'
  );

UPDATE public.athletes
SET city = 'Харків'
WHERE city IS NOT NULL
  AND (
    lower(city) = 'харьков'
    OR lower(city) = 'kharkiv'
    OR lower(city) = 'kharkov'
    OR lower(city) = 'харків'
    OR lower(city) = 'харьків'
    OR lower(city) = 'harkiv'
    OR lower(city) = 'charcov'
    OR lower(city) = 'charkow'
    OR lower(city) = 'м. харків'
    OR lower(city) = 'харків (харківська)'
    OR lower(city) LIKE 'харків %'
  );

ALTER TABLE public.profiles ENABLE TRIGGER validate_profile_fields;
ALTER TABLE public.profiles ENABLE TRIGGER profiles_sync_self_athlete;
ALTER TABLE public.athletes ENABLE TRIGGER validate_athlete_fields;