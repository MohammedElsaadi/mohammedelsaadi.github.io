import type { Env } from './types'

export interface ContainerRow {
  id: string
  slug: string
  name: string
  packing_mode: 'bin_pack' | 'none'
  selection_mode: 'individual' | 'whole_container'
  inner_width_mm: number | null
  inner_height_mm: number | null
  inner_depth_mm: number | null
  overflow_limit: number
  height_tolerance_mm: number
  is_active: number
  image_key: string | null
}

export interface GameRow {
  id: string
  slug: string
  name: string
  item_type: 'game' | 'accessory'
  container_id: string
  container_slug: string
  selectable: number
  always_packed: number
  allow_overflow: number
  width_mm: number | null
  height_mm: number | null
  depth_mm: number | null
  weight_grams: number | null
  min_players: number | null
  max_players: number | null
  min_play_time_minutes: number | null
  max_play_time_minutes: number | null
  complexity: number | null
  course: 'appetizer' | 'main' | 'dessert' | null
  cover_image_key: string | null
  side_image_key: string | null
  cover_rotation_degrees: 0 | 90 | 180 | 270
  status: 'draft' | 'active' | 'archived'
  sort_order: number
}

interface TagRow { id: string; slug: string; name: string }
interface GameTagRow extends TagRow { game_id: string }

export function mediaUrl(key: string | null) {
  if (!key) return null
  return `/api/board-game-menu/media/${key.split('/').map(encodeURIComponent).join('/')}`
}

export function mapContainer(row: ContainerRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    packingMode: row.packing_mode,
    selectionMode: row.selection_mode,
    innerWidthMm: row.inner_width_mm,
    innerHeightMm: row.inner_height_mm,
    innerDepthMm: row.inner_depth_mm,
    overflowLimit: row.overflow_limit,
    heightToleranceMm: row.height_tolerance_mm,
    isActive: Boolean(row.is_active),
    imageUrl: mediaUrl(row.image_key),
  }
}

export function mapGame(row: GameRow, tags: TagRow[]) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    itemType: row.item_type,
    containerId: row.container_id,
    containerSlug: row.container_slug,
    selectable: Boolean(row.selectable),
    alwaysPacked: Boolean(row.always_packed),
    allowOverflow: Boolean(row.allow_overflow),
    widthMm: row.width_mm,
    heightMm: row.height_mm,
    depthMm: row.depth_mm,
    weightGrams: row.weight_grams,
    minPlayers: row.min_players,
    maxPlayers: row.max_players,
    minPlayTimeMinutes: row.min_play_time_minutes,
    maxPlayTimeMinutes: row.max_play_time_minutes,
    complexity: row.complexity,
    course: row.course,
    coverUrl: mediaUrl(row.cover_image_key),
    sideUrl: mediaUrl(row.side_image_key),
    coverRotationDegrees: row.cover_rotation_degrees,
    status: row.status,
    sortOrder: row.sort_order,
    tags,
  }
}

async function catalogRows(db: D1Database, includeAll: boolean) {
  const [containerResult, gameResult, tagResult, gameTagResult] = await Promise.all([
    db.prepare(`SELECT id, slug, name, packing_mode, selection_mode, inner_width_mm, inner_height_mm, inner_depth_mm, overflow_limit, height_tolerance_mm, is_active, image_key FROM containers ${includeAll ? '' : 'WHERE is_active = 1'} ORDER BY slug`).all<ContainerRow>(),
    db.prepare(`SELECT g.*, c.slug AS container_slug FROM games g JOIN containers c ON c.id = g.container_id ${includeAll ? '' : "WHERE g.status = 'active' AND c.is_active = 1"} ORDER BY g.sort_order, g.name COLLATE NOCASE`).all<GameRow>(),
    db.prepare('SELECT id, slug, name FROM tags ORDER BY name COLLATE NOCASE').all<TagRow>(),
    db.prepare('SELECT gt.game_id, t.id, t.slug, t.name FROM game_tags gt JOIN tags t ON t.id = gt.tag_id ORDER BY t.name COLLATE NOCASE').all<GameTagRow>(),
  ])
  const tagMap = new Map<string, TagRow[]>()
  for (const row of gameTagResult.results) tagMap.set(row.game_id, [...(tagMap.get(row.game_id) ?? []), { id: row.id, slug: row.slug, name: row.name }])
  return {
    containers: containerResult.results.map(mapContainer),
    games: gameResult.results.map((row) => mapGame(row, tagMap.get(row.id) ?? [])),
    tags: tagResult.results,
  }
}

export async function readPublicCatalog(env: Env) {
  const rows = await catalogRows(env.BOARD_GAME_DB, false)
  return {
    containers: rows.containers,
    crateGames: rows.games.filter((game) => game.containerSlug === 'main-crate' && game.itemType === 'game' && game.selectable && !game.alwaysPacked),
    toteGames: rows.games.filter((game) => game.containerSlug === 'board-game-tote' && game.itemType === 'game' && game.selectable),
    requiredCrateItems: rows.games.filter((game) => game.containerSlug === 'main-crate' && game.alwaysPacked),
    tags: rows.tags,
  }
}

export async function readAdminCatalog(env: Env) {
  const rows = await catalogRows(env.BOARD_GAME_DB, true)
  return { games: rows.games, containers: rows.containers, tags: rows.tags }
}
