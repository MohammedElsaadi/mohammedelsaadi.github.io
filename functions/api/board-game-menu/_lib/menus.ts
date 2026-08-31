import { readAdminCatalog } from './catalog'
import { HttpError } from './http'
import type { Env, InclusionSource, MenuPayload, SelectionSnapshot } from './types'
import { requireDateOnly, stringIdArray, titleForDate } from './validation'

interface MenuRow {
  id: string
  game_night_date: string
  title: string
  created_at: string
  updated_at: string
}

interface LinkRow { id: string }
interface ItemLinkRow { id: string; inclusion_source: InclusionSource }

export function parseMenuPayload(body: Record<string, unknown>): MenuPayload {
  return {
    gameNightDate: requireDateOnly(body.gameNightDate),
    selectedCrateGameIds: stringIdArray(body.selectedCrateGameIds, 'Selected crate game IDs'),
    selectedToteGameIds: stringIdArray(body.selectedToteGameIds ?? [], 'Selected tote game IDs'),
    selectedContainerIds: stringIdArray(body.selectedContainerIds, 'Selected container IDs', 4),
  }
}

export async function resolveSelection(env: Env, payload: MenuPayload): Promise<SelectionSnapshot> {
  const db = env.BOARD_GAME_DB
  const containers = await db.prepare("SELECT id, slug, is_active FROM containers WHERE slug IN ('main-crate', 'board-game-tote')").all<{ id: string; slug: string; is_active: number }>()
  const mainCrate = containers.results.find((container) => container.slug === 'main-crate')
  const tote = containers.results.find((container) => container.slug === 'board-game-tote')
  const validContainerIds = new Set(containers.results.map((container) => container.id))
  if (payload.selectedContainerIds.some((id) => !validContainerIds.has(id))) throw new HttpError(400, 'An unknown container was selected.')

  const crateActive = payload.selectedCrateGameIds.length > 0
  const toteActive = payload.selectedToteGameIds.length > 0
  if (!crateActive && !toteActive) throw new HttpError(400, 'Select at least one crate game or the Board Game Tote.')
  if (crateActive && (!mainCrate || !mainCrate.is_active)) throw new HttpError(409, 'The Main Crate is not available.')
  if (toteActive && (!tote || !tote.is_active)) throw new HttpError(409, 'The Board Game Tote is not available.')

  const selectedRows = payload.selectedCrateGameIds.length === 0 ? [] : (
    await db.prepare(
      `SELECT id FROM games WHERE id IN (${payload.selectedCrateGameIds.map(() => '?').join(',')}) AND status = 'active' AND selectable = 1 AND item_type = 'game' AND container_id = ?`,
    ).bind(...payload.selectedCrateGameIds, mainCrate?.id ?? '').all<{ id: string }>()
  ).results
  if (selectedRows.length !== payload.selectedCrateGameIds.length) throw new HttpError(400, 'One or more selected games are unavailable.')

  const requiredRows = crateActive ? (
    await db.prepare("SELECT id FROM games WHERE container_id = ? AND status = 'active' AND always_packed = 1 ORDER BY id")
      .bind(mainCrate?.id ?? '').all<{ id: string }>()
  ).results : []
  const toteRows = toteActive ? (
    await db.prepare(
      `SELECT id FROM games WHERE id IN (${payload.selectedToteGameIds.map(() => '?').join(',')}) AND status = 'active' AND selectable = 1 AND item_type = 'game' AND container_id = ? ORDER BY id`,
    ).bind(...payload.selectedToteGameIds, tote?.id ?? '').all<{ id: string }>()
  ).results : []
  if (toteRows.length !== payload.selectedToteGameIds.length) throw new HttpError(400, 'One or more selected tote games are unavailable.')

  const items: Array<{ id: string; source: InclusionSource }> = [
    ...selectedRows.map((row) => ({ id: row.id, source: 'selected' as const })),
    ...requiredRows.map((row) => ({ id: row.id, source: 'required_container_item' as const })),
    ...toteRows.map((row) => ({ id: row.id, source: 'bundle_snapshot' as const })),
  ]
  return {
    gameNightDate: payload.gameNightDate,
    title: titleForDate(payload.gameNightDate),
    containerIds: [
      ...(crateActive && mainCrate ? [mainCrate.id] : []),
      ...(toteActive && tote ? [tote.id] : []),
    ],
    items,
    selectedCrateGameIds: selectedRows.map((row) => row.id).sort(),
    selectedToteGameIds: toteRows.map((row) => row.id).sort(),
  }
}

function snapshotStatements(db: D1Database, menuId: string, snapshot: SelectionSnapshot) {
  return [
    ...snapshot.containerIds.map((containerId) => db.prepare('INSERT INTO menu_containers (menu_id, container_id) VALUES (?, ?)').bind(menuId, containerId)),
    ...snapshot.items.map((item) => db.prepare('INSERT INTO menu_items (menu_id, game_id, inclusion_source) VALUES (?, ?, ?)').bind(menuId, item.id, item.source)),
  ]
}

export async function createMenu(env: Env, payload: MenuPayload) {
  const db = env.BOARD_GAME_DB
  const existing = await db.prepare('SELECT id FROM menus WHERE game_night_date = ?').bind(payload.gameNightDate).first<{ id: string }>()
  if (existing) throw new HttpError(409, 'A menu already exists for that game-night date.', { existingMenuId: existing.id })
  const snapshot = await resolveSelection(env, payload)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.batch([
    db.prepare('INSERT INTO menus (id, game_night_date, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .bind(id, snapshot.gameNightDate, snapshot.title, now, now),
    ...snapshotStatements(db, id, snapshot),
  ])
  return { id, snapshot }
}

export async function findMenuByDate(env: Env, gameNightDate: string) {
  return env.BOARD_GAME_DB.prepare('SELECT id FROM menus WHERE game_night_date = ?')
    .bind(gameNightDate)
    .first<{ id: string }>()
}

export async function updateMenu(env: Env, menuId: string, payload: MenuPayload) {
  const db = env.BOARD_GAME_DB
  const existing = await db.prepare('SELECT id, game_night_date FROM menus WHERE id = ?').bind(menuId).first<{ id: string; game_night_date: string }>()
  if (!existing) throw new HttpError(404, 'Saved menu not found.')
  if (payload.gameNightDate !== existing.game_night_date) throw new HttpError(400, 'The game-night date cannot be changed for an existing menu.')
  const snapshot = await resolveSelection(env, payload)
  const now = new Date().toISOString()
  await db.batch([
    db.prepare('UPDATE menus SET title = ?, updated_at = ? WHERE id = ?').bind(snapshot.title, now, menuId),
    db.prepare('DELETE FROM menu_items WHERE menu_id = ?').bind(menuId),
    db.prepare('DELETE FROM menu_containers WHERE menu_id = ?').bind(menuId),
    ...snapshotStatements(db, menuId, snapshot),
  ])
  return snapshot
}

export async function readMenu(env: Env, menuId: string) {
  const db = env.BOARD_GAME_DB
  const menu = await db.prepare('SELECT * FROM menus WHERE id = ?').bind(menuId).first<MenuRow>()
  if (!menu) throw new HttpError(404, 'Saved menu not found.')
  const [containerLinks, itemLinks, catalog] = await Promise.all([
    db.prepare('SELECT container_id AS id FROM menu_containers WHERE menu_id = ?').bind(menuId).all<LinkRow>(),
    db.prepare('SELECT game_id AS id, inclusion_source FROM menu_items WHERE menu_id = ?').bind(menuId).all<ItemLinkRow>(),
    readAdminCatalog(env),
  ])
  const containerIds = containerLinks.results.map((row) => row.id)
  const itemMap = new Map(catalog.games.map((game) => [game.id, game]))
  const items = itemLinks.results.flatMap((link) => {
    const game = itemMap.get(link.id)
    return game ? [{ ...game, inclusionSource: link.inclusion_source }] : []
  })
  return {
    id: menu.id,
    gameNightDate: menu.game_night_date,
    title: menu.title,
    selectedContainerIds: containerIds,
    selectedCrateGameIds: itemLinks.results.filter((row) => row.inclusion_source === 'selected').map((row) => row.id),
    selectedToteGameIds: itemLinks.results.filter((row) => row.inclusion_source === 'bundle_snapshot').map((row) => row.id),
    containers: catalog.containers.filter((container) => containerIds.includes(container.id)),
    items,
    createdAt: menu.created_at,
    updatedAt: menu.updated_at,
  }
}

export async function listMenus(env: Env) {
  const rows = await env.BOARD_GAME_DB.prepare('SELECT id FROM menus ORDER BY game_night_date DESC').all<{ id: string }>()
  return Promise.all(rows.results.map((row) => readMenu(env, row.id)))
}

export async function deleteMenu(env: Env, menuId: string) {
  const result = await env.BOARD_GAME_DB.prepare('DELETE FROM menus WHERE id = ?').bind(menuId).run()
  if (!result.meta.changes) throw new HttpError(404, 'Saved menu not found.')
}
