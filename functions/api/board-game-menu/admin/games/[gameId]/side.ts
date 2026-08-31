import { errorResponse, HttpError, json } from '../../../_lib/http'
import { readImageUpload } from '../../../_lib/images'
import { routeParam } from '../../../_lib/params'
import type { Env } from '../../../_lib/types'

interface GameSideImage {
  side_image_key: string | null
}

export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
  try {
    const gameId = routeParam(params.gameId, 'Game ID')
    const image = await readImageUpload(request, 'Side image')
    const game = await env.BOARD_GAME_DB.prepare('SELECT side_image_key FROM games WHERE id = ?').bind(gameId).first<GameSideImage>()
    if (!game) throw new HttpError(404, 'Game not found.')

    const key = `board-games/${gameId}/side-${crypto.randomUUID()}.${image.extension}`
    await env.BOARD_GAME_MEDIA.put(key, image.buffer, { httpMetadata: { contentType: image.type } })
    try {
      await env.BOARD_GAME_DB.prepare('UPDATE games SET side_image_key = ?, updated_at = ? WHERE id = ?').bind(key, new Date().toISOString(), gameId).run()
    } catch (error) {
      await env.BOARD_GAME_MEDIA.delete(key)
      throw error
    }
    if (game.side_image_key) await env.BOARD_GAME_MEDIA.delete(game.side_image_key)
    return json({ sideUrl: `/api/board-game-menu/media/${key}` })
  } catch (error) { return errorResponse(error) }
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const gameId = routeParam(params.gameId, 'Game ID')
    const game = await env.BOARD_GAME_DB.prepare('SELECT side_image_key FROM games WHERE id = ?').bind(gameId).first<GameSideImage>()
    if (!game) throw new HttpError(404, 'Game not found.')
    await env.BOARD_GAME_DB.prepare('UPDATE games SET side_image_key = NULL, updated_at = ? WHERE id = ?').bind(new Date().toISOString(), gameId).run()
    if (game.side_image_key) await env.BOARD_GAME_MEDIA.delete(game.side_image_key)
    return json({ removed: true })
  } catch (error) { return errorResponse(error) }
}
