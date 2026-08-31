import { errorResponse, HttpError, json, readJsonObject } from '../../_lib/http'
import { routeParam } from '../../_lib/params'
import type { Env } from '../../_lib/types'
import { requireString, slugify } from '../../_lib/validation'

export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
  try {
    const tagId = routeParam(params.tagId, 'Tag ID')
    const name = requireString((await readJsonObject(request)).name, 'Tag name', 80)
    const slug = slugify(name)
    if (!slug) throw new HttpError(400, 'Tag name must contain letters or numbers.')
    const duplicate = await env.BOARD_GAME_DB.prepare('SELECT id FROM tags WHERE (slug = ? OR name = ? COLLATE NOCASE) AND id <> ?').bind(slug, name, tagId).first()
    if (duplicate) throw new HttpError(409, 'That tag already exists.')
    const result = await env.BOARD_GAME_DB.prepare('UPDATE tags SET slug=?, name=?, updated_at=? WHERE id=?').bind(slug, name, new Date().toISOString(), tagId).run()
    if (!result.meta.changes) throw new HttpError(404, 'Tag not found.')
    return json({ id: tagId, slug, name })
  } catch (error) { return errorResponse(error) }
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const tagId = routeParam(params.tagId, 'Tag ID')
    const result = await env.BOARD_GAME_DB.prepare('DELETE FROM tags WHERE id = ?').bind(tagId).run()
    if (!result.meta.changes) throw new HttpError(404, 'Tag not found.')
    return json({ deleted: true })
  } catch (error) { return errorResponse(error) }
}
