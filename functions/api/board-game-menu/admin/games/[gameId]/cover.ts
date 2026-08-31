import { errorResponse, HttpError, json } from '../../../_lib/http'
import { routeParam } from '../../../_lib/params'
import type { Env } from '../../../_lib/types'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function detectImage(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { type: 'image/jpeg', extension: 'jpg' }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return { type: 'image/png', extension: 'png' }
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return { type: 'image/webp', extension: 'webp' }
  throw new HttpError(415, 'Cover must be a valid JPEG, PNG, or WebP image.')
}

export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
  try {
    const gameId = routeParam(params.gameId, 'Game ID')
    const length = Number(request.headers.get('content-length') ?? 0)
    if (length > MAX_IMAGE_BYTES) throw new HttpError(413, 'Cover image must be 10 MB or smaller.')
    const buffer = await request.arrayBuffer()
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) throw new HttpError(413, 'Cover image must be between 1 byte and 10 MB.')
    const bytes = new Uint8Array(buffer)
    const image = detectImage(bytes)
    const game = await env.BOARD_GAME_DB.prepare('SELECT cover_image_key FROM games WHERE id = ?').bind(gameId).first<{ cover_image_key: string | null }>()
    if (!game) throw new HttpError(404, 'Game not found.')
    const key = `board-games/${gameId}/${crypto.randomUUID()}.${image.extension}`
    await env.BOARD_GAME_MEDIA.put(key, buffer, { httpMetadata: { contentType: image.type } })
    try {
      await env.BOARD_GAME_DB.prepare('UPDATE games SET cover_image_key = ?, updated_at = ? WHERE id = ?').bind(key, new Date().toISOString(), gameId).run()
    } catch (error) {
      await env.BOARD_GAME_MEDIA.delete(key)
      throw error
    }
    if (game.cover_image_key) await env.BOARD_GAME_MEDIA.delete(game.cover_image_key)
    return json({ coverUrl: `/api/board-game-menu/media/${key}` })
  } catch (error) { return errorResponse(error) }
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const gameId = routeParam(params.gameId, 'Game ID')
    const game = await env.BOARD_GAME_DB.prepare('SELECT cover_image_key, status FROM games WHERE id = ?').bind(gameId).first<{ cover_image_key: string | null; status: string }>()
    if (!game) throw new HttpError(404, 'Game not found.')
    if (game.status !== 'draft') throw new HttpError(409, 'Only draft cover images can be removed.')
    await env.BOARD_GAME_DB.prepare('UPDATE games SET cover_image_key = NULL, updated_at = ? WHERE id = ?').bind(new Date().toISOString(), gameId).run()
    if (game.cover_image_key) await env.BOARD_GAME_MEDIA.delete(game.cover_image_key)
    return json({ removed: true })
  } catch (error) { return errorResponse(error) }
}
