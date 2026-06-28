UPDATE telegram_starts
SET sport_types = ARRAY(
  SELECT DISTINCT CASE
    WHEN s = 'біг' THEN 'run'
    WHEN s = 'плавання' THEN 'swim'
    WHEN s = 'напівмарафон' THEN 'half_marathon'
    WHEN s = 'марафон' THEN 'marathon'
    WHEN s = 'ультра' THEN 'ultra'
    WHEN s = 'трейл' THEN 'trail'
    WHEN s = 'крос' THEN 'cross'
    WHEN s = 'триатлон' THEN 'triathlon'
    WHEN s = 'акватлон' THEN 'aquathlon'
    WHEN s = 'дуатлон' THEN 'duathlon'
    WHEN s = 'велостарти' THEN 'cycling'
    WHEN s = 'онлайн' THEN 'online'
    ELSE s
  END
  FROM unnest(sport_types) AS s
)
WHERE sport_types && ARRAY['біг','плавання','напівмарафон','марафон','ультра','трейл','крос','триатлон','акватлон','дуатлон','велостарти','онлайн'];