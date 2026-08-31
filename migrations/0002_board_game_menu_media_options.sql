ALTER TABLE containers ADD COLUMN image_key TEXT;

ALTER TABLE games ADD COLUMN cover_rotation_degrees INTEGER NOT NULL DEFAULT 0
  CHECK (cover_rotation_degrees IN (0, 90, 180, 270));
