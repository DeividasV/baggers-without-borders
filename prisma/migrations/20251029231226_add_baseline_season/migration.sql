-- Add BASELINE season for opening balances (peaks climbed before 2019)
INSERT INTO seasons (id, code, title, description, isActive, displayOrder, allowManualEntry, createdAt, updatedAt)
VALUES (
  'baseline_season_001',
  'BASELINE',
  '<2019',
  'Opening balance - peaks climbed before the 2019 season',
  1,
  -1,
  1,
  datetime('now'),
  datetime('now')
)
ON CONFLICT(code) DO NOTHING;