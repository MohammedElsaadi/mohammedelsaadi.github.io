ALTER TABLE containers ADD COLUMN height_tolerance_mm INTEGER NOT NULL DEFAULT 0
  CHECK (height_tolerance_mm BETWEEN 0 AND 500);

UPDATE containers
SET height_tolerance_mm = 30
WHERE slug = 'main-crate';

UPDATE containers
SET selection_mode = 'individual'
WHERE slug = 'board-game-tote';

UPDATE games
SET selectable = 1
WHERE item_type = 'game'
  AND container_id = (SELECT id FROM containers WHERE slug = 'board-game-tote');
