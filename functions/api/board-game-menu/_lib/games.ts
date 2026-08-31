import { HttpError } from './http'
import type { Env } from './types'
import { booleanValue, nullableInteger, requireSlug, requireString, stringIdArray } from './validation'

interface ContainerRecord { id: string; slug: string }
interface ExistingGame { id: string; cover_image_key: string | null; status: string }

interface NormalizedGame {
  name: string
  slug: string
  itemType: 'game' | 'accessory'
  status: 'draft' | 'active' | 'archived'
  containerId: string
  selectable: boolean
  alwaysPacked: boolean
  allowOverflow: boolean
  widthMm: number | null
  heightMm: number | null
  depthMm: number | null
  weightGrams: number | null
  minPlayers: number | null
  maxPlayers: number | null
  minPlayTimeMinutes: number | null
  maxPlayTimeMinutes: number | null
  complexity: number | null
  course: 'appetizer' | 'main' | 'dessert' | null
  sortOrder: number
  tagIds: string[]
}

function enumValue<T extends string>(value: unknown, name: string, values: readonly T[]): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw new HttpError(400, `${name} is invalid.`)
  return value as T
}

function sortOrderValue(value: unknown) {
  if (!Number.isInteger(value) || Number(value) < -100000 || Number(value) > 100000) throw new HttpError(400, 'Sort order is invalid.')
  return Number(value)
}

async function normalizeGame(env: Env, body: Record<string, unknown>, existingCoverKey: string | null): Promise<NormalizedGame> {
  const name = requireString(body.name, 'Name')
  const slug = requireSlug(body.slug)
  const itemType = enumValue(body.itemType, 'Item type', ['game', 'accessory'] as const)
  const status = enumValue(body.status, 'Status', ['draft', 'active', 'archived'] as const)
  const containerId = requireString(body.containerId, 'Container ID')
  const container = await env.BOARD_GAME_DB.prepare('SELECT id, slug FROM containers WHERE id = ?').bind(containerId).first<ContainerRecord>()
  if (!container) throw new HttpError(400, 'Container does not exist.')

  let selectable = booleanValue(body.selectable, 'Selectable')
  let alwaysPacked = booleanValue(body.alwaysPacked, 'Always packed')
  let allowOverflow = booleanValue(body.allowOverflow, 'Allow overflow')
  const widthMm = nullableInteger(body.widthMm, 'Width')
  const heightMm = nullableInteger(body.heightMm, 'Height')
  const depthMm = nullableInteger(body.depthMm, 'Depth')
  const weightGrams = nullableInteger(body.weightGrams, 'Weight')
  let minPlayers = nullableInteger(body.minPlayers, 'Minimum players', 1, 100)
  let maxPlayers = nullableInteger(body.maxPlayers, 'Maximum players', 1, 100)
  let minPlayTimeMinutes = nullableInteger(body.minPlayTimeMinutes, 'Minimum play time', 1, 10000)
  let maxPlayTimeMinutes = nullableInteger(body.maxPlayTimeMinutes, 'Maximum play time', 1, 10000)
  let complexity = nullableInteger(body.complexity, 'Complexity', 1, 5)
  let course = body.course === null || body.course === '' ? null : enumValue(body.course, 'Course', ['appetizer', 'main', 'dessert'] as const)
  const sortOrder = sortOrderValue(body.sortOrder)
  const tagIds = stringIdArray(body.tagIds, 'Tag IDs')

  if (alwaysPacked) selectable = false
  if (itemType === 'accessory') {
    minPlayers = null
    maxPlayers = null
    minPlayTimeMinutes = null
    maxPlayTimeMinutes = null
    complexity = null
    course = null
  }
  if (container.slug === 'board-game-tote') {
    selectable = false
    alwaysPacked = false
    allowOverflow = false
  }
  if (minPlayers !== null && maxPlayers !== null && minPlayers > maxPlayers) throw new HttpError(400, 'Minimum players cannot exceed maximum players.')
  if (minPlayTimeMinutes !== null && maxPlayTimeMinutes !== null && minPlayTimeMinutes > maxPlayTimeMinutes) throw new HttpError(400, 'Minimum play time cannot exceed maximum play time.')

  if (status === 'active') {
    if (container.slug === 'main-crate' && (!widthMm || !heightMm || !depthMm)) throw new HttpError(400, 'Active Main Crate items require positive dimensions.')
    if (itemType === 'game' && (!existingCoverKey || !minPlayers || !maxPlayers || !minPlayTimeMinutes || !maxPlayTimeMinutes || !complexity || !course)) {
      throw new HttpError(400, 'Active games require a cover, player range, play-time range, complexity, and course.')
    }
  }

  if (tagIds.length > 0) {
    const rows = await env.BOARD_GAME_DB.prepare(`SELECT id FROM tags WHERE id IN (${tagIds.map(() => '?').join(',')})`).bind(...tagIds).all<{ id: string }>()
    if (rows.results.length !== tagIds.length) throw new HttpError(400, 'One or more tags do not exist.')
  }

  return { name, slug, itemType, status, containerId, selectable, alwaysPacked, allowOverflow, widthMm, heightMm, depthMm, weightGrams, minPlayers, maxPlayers, minPlayTimeMinutes, maxPlayTimeMinutes, complexity, course, sortOrder, tagIds }
}

function values(game: NormalizedGame) {
  return [
    game.slug, game.name, game.itemType, game.containerId, Number(game.selectable), Number(game.alwaysPacked), Number(game.allowOverflow),
    game.widthMm, game.heightMm, game.depthMm, game.weightGrams, game.minPlayers, game.maxPlayers, game.minPlayTimeMinutes,
    game.maxPlayTimeMinutes, game.complexity, game.course, game.status, game.sortOrder,
  ]
}

async function ensureUnique(env: Env, slug: string, id?: string) {
  const existing = await env.BOARD_GAME_DB.prepare('SELECT id FROM games WHERE slug = ?').bind(slug).first<{ id: string }>()
  if (existing && existing.id !== id) throw new HttpError(409, 'A game with that slug already exists.')
}

export async function createGame(env: Env, body: Record<string, unknown>) {
  const game = await normalizeGame(env, body, null)
  await ensureUnique(env, game.slug)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const db = env.BOARD_GAME_DB
  await db.batch([
    db.prepare(`INSERT INTO games (slug, name, item_type, container_id, selectable, always_packed, allow_overflow, width_mm, height_mm, depth_mm, weight_grams, min_players, max_players, min_play_time_minutes, max_play_time_minutes, complexity, course, status, sort_order, id, cover_image_key, created_at, updated_at) VALUES (${Array(23).fill('?').join(',')})`)
      .bind(...values(game), id, null, now, now),
    ...game.tagIds.map((tagId) => db.prepare('INSERT INTO game_tags (game_id, tag_id) VALUES (?, ?)').bind(id, tagId)),
  ])
  return id
}

export async function updateGame(env: Env, gameId: string, body: Record<string, unknown>) {
  const existing = await env.BOARD_GAME_DB.prepare('SELECT id, cover_image_key, status FROM games WHERE id = ?').bind(gameId).first<ExistingGame>()
  if (!existing) throw new HttpError(404, 'Game not found.')
  const game = await normalizeGame(env, body, existing.cover_image_key)
  await ensureUnique(env, game.slug, gameId)
  const db = env.BOARD_GAME_DB
  await db.batch([
    db.prepare('UPDATE games SET slug=?, name=?, item_type=?, container_id=?, selectable=?, always_packed=?, allow_overflow=?, width_mm=?, height_mm=?, depth_mm=?, weight_grams=?, min_players=?, max_players=?, min_play_time_minutes=?, max_play_time_minutes=?, complexity=?, course=?, status=?, sort_order=?, updated_at=? WHERE id=?')
      .bind(...values(game), new Date().toISOString(), gameId),
    db.prepare('DELETE FROM game_tags WHERE game_id = ?').bind(gameId),
    ...game.tagIds.map((tagId) => db.prepare('INSERT INTO game_tags (game_id, tag_id) VALUES (?, ?)').bind(gameId, tagId)),
  ])
}

export async function deleteGame(env: Env, gameId: string) {
  const reference = await env.BOARD_GAME_DB.prepare('SELECT COUNT(*) AS count FROM menu_items WHERE game_id = ?').bind(gameId).first<{ count: number }>()
  if ((reference?.count ?? 0) > 0) throw new HttpError(409, 'This game is part of a saved menu. Archive it instead.')
  const game = await env.BOARD_GAME_DB.prepare('SELECT cover_image_key FROM games WHERE id = ?').bind(gameId).first<{ cover_image_key: string | null }>()
  if (!game) throw new HttpError(404, 'Game not found.')
  await env.BOARD_GAME_DB.prepare('DELETE FROM games WHERE id = ?').bind(gameId).run()
  if (game.cover_image_key) await env.BOARD_GAME_MEDIA.delete(game.cover_image_key)
}
