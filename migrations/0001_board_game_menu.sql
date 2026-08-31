PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS containers (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  packing_mode TEXT NOT NULL CHECK (packing_mode IN ('bin_pack', 'none')),
  selection_mode TEXT NOT NULL CHECK (selection_mode IN ('individual', 'whole_container')),
  inner_width_mm INTEGER,
  inner_height_mm INTEGER,
  inner_depth_mm INTEGER,
  overflow_limit INTEGER NOT NULL DEFAULT 0 CHECK (overflow_limit BETWEEN 0 AND 2),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'game' CHECK (item_type IN ('game', 'accessory')),
  container_id TEXT NOT NULL,
  selectable INTEGER NOT NULL DEFAULT 1 CHECK (selectable IN (0, 1)),
  always_packed INTEGER NOT NULL DEFAULT 0 CHECK (always_packed IN (0, 1)),
  allow_overflow INTEGER NOT NULL DEFAULT 1 CHECK (allow_overflow IN (0, 1)),
  width_mm INTEGER,
  height_mm INTEGER,
  depth_mm INTEGER,
  weight_grams INTEGER,
  min_players INTEGER,
  max_players INTEGER,
  min_play_time_minutes INTEGER,
  max_play_time_minutes INTEGER,
  complexity INTEGER CHECK (complexity BETWEEN 1 AND 5),
  course TEXT CHECK (course IN ('appetizer', 'main', 'dessert') OR course IS NULL),
  cover_image_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_tags (
  game_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (game_id, tag_id),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS menus (
  id TEXT PRIMARY KEY,
  game_night_date TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  edit_token_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_containers (
  menu_id TEXT NOT NULL,
  container_id TEXT NOT NULL,
  PRIMARY KEY (menu_id, container_id),
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS menu_items (
  menu_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  inclusion_source TEXT NOT NULL CHECK (inclusion_source IN ('selected', 'required_container_item', 'bundle_snapshot')),
  PRIMARY KEY (menu_id, game_id),
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS games_container_status_idx ON games(container_id, status, sort_order);
CREATE INDEX IF NOT EXISTS menu_items_game_idx ON menu_items(game_id);

INSERT OR IGNORE INTO containers (
  id, slug, name, packing_mode, selection_mode, inner_width_mm, inner_height_mm,
  inner_depth_mm, overflow_limit, is_active, created_at, updated_at
) VALUES
  ('container-main-crate', 'main-crate', 'Main Crate', 'bin_pack', 'individual', NULL, NULL, NULL, 2, 1, datetime('now'), datetime('now')),
  ('container-board-game-tote', 'board-game-tote', 'Board Game Tote', 'none', 'whole_container', NULL, NULL, NULL, 0, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO tags (id, slug, name, created_at, updated_at) VALUES
  ('tag-competitive', 'competitive', 'Competitive', datetime('now'), datetime('now')),
  ('tag-cooperative', 'cooperative', 'Cooperative', datetime('now'), datetime('now')),
  ('tag-chaotic', 'chaotic', 'Chaotic', datetime('now'), datetime('now')),
  ('tag-chill', 'chill', 'Chill', datetime('now'), datetime('now')),
  ('tag-thinky', 'thinky', 'Thinky', datetime('now'), datetime('now')),
  ('tag-social', 'social', 'Social', datetime('now'), datetime('now')),
  ('tag-bluffing', 'bluffing', 'Bluffing', datetime('now'), datetime('now')),
  ('tag-party', 'party', 'Party', datetime('now'), datetime('now'));
