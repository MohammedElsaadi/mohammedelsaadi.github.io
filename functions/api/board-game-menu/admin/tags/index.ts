import { errorResponse, HttpError, json, readJsonObject } from '../../_lib/http'
import type { Env } from '../../_lib/types'
import { requireString, slugify } from '../../_lib/validation'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const tags = await env.BOARD_GAME_DB.prepare('SELECT id, slug, name FROM tags ORDER BY name COLLATE NOCASE').all()
    return json(tags.results)
  } catch (error) { return errorResponse(error) }
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    const name = requireString((await readJsonObject(request)).name, 'Tag name', 80)
    const slug = slugify(name)
    if (!slug) throw new HttpError(400, 'Tag name must contain letters or numbers.')
    const duplicate = await env.BOARD_GAME_DB.prepare('SELECT id FROM tags WHERE slug = ? OR name = ? COLLATE NOCASE').bind(slug, name).first()
    if (duplicate) throw new HttpError(409, 'That tag already exists.')
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await env.BOARD_GAME_DB.prepare('INSERT INTO tags (id, slug, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').bind(id, slug, name, now, now).run()
    return json({ id, slug, name }, 201)
  } catch (error) { return errorResponse(error) }
}
