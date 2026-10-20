-- GRDPC's public page and admin UI define the weekly prayer schedule as
-- Sunday 20:00 and Monday 00:00 Africa/Lagos. Migration 0035 accidentally
-- seeded a different four-slot schedule. Correct only that untouched default;
-- preserve any configuration an administrator has already customized.
UPDATE grdpc_settings
SET config = json_set(
  config,
  '$.reminders',
  json('[{"day":0,"time":"20:00"},{"day":1,"time":"00:00"}]')
),
updated_at = CURRENT_TIMESTAMP
WHERE id = 1
  AND json_extract(config, '$.reminders') =
      '[{"day":5,"time":"20:00"},{"day":6,"time":"20:00"},{"day":0,"time":"16:00"},{"day":0,"time":"19:00"}]';
