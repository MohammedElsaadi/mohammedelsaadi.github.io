UPDATE containers
SET inner_width_mm = COALESCE(inner_width_mm, 300),
    inner_height_mm = COALESCE(inner_height_mm, 350),
    inner_depth_mm = COALESCE(inner_depth_mm, 65),
    updated_at = datetime('now')
WHERE slug = 'board-game-tote';
