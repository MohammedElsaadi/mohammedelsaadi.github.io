import { errorResponse, HttpError } from '../_lib/http'
import type { Env } from '../_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const segments = Array.isArray(params.path) ? params.path : [params.path]
    const key = segments.filter((segment): segment is string => typeof segment === 'string').join('/')
    const validPrefix = key.startsWith('board-games/') || key.startsWith('board-game-containers/')
    if (!validPrefix || key.includes('..')) throw new HttpError(400, 'Invalid media path.')
    const object = await env.BOARD_GAME_MEDIA.get(key)
    if (!object) throw new HttpError(404, 'Image not found.')
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('ETag', object.httpEtag)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    return new Response(object.body, { headers })
  } catch (error) {
    return errorResponse(error)
  }
}
