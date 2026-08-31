import { errorResponse, HttpError, json, readJsonObject } from '../../_lib/http'
import { routeParam } from '../../_lib/params'
import type { Env } from '../../_lib/types'
import { booleanValue, nullableInteger, requireString } from '../../_lib/validation'

export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
  try {
    const containerId = routeParam(params.containerId, 'Container ID')
    const existing = await env.BOARD_GAME_DB.prepare('SELECT slug FROM containers WHERE id = ?').bind(containerId).first<{ slug: string }>()
    if (!existing) throw new HttpError(404, 'Container not found.')
    const body = await readJsonObject(request)
    const name = requireString(body.name, 'Name')
    const isActive = booleanValue(body.isActive, 'Active')
    if (existing.slug === 'main-crate') {
      const width = nullableInteger(body.innerWidthMm, 'Internal width')
      const height = nullableInteger(body.innerHeightMm, 'Internal height')
      const depth = nullableInteger(body.innerDepthMm, 'Internal depth')
      const overflow = nullableInteger(body.overflowLimit, 'Overflow limit', 0, 2)
      if (overflow === null) throw new HttpError(400, 'Overflow limit is required.')
      await env.BOARD_GAME_DB.prepare('UPDATE containers SET name=?, inner_width_mm=?, inner_height_mm=?, inner_depth_mm=?, overflow_limit=?, is_active=?, updated_at=? WHERE id=?')
        .bind(name, width, height, depth, overflow, Number(isActive), new Date().toISOString(), containerId).run()
    } else {
      await env.BOARD_GAME_DB.prepare("UPDATE containers SET name=?, packing_mode='none', selection_mode='whole_container', inner_width_mm=NULL, inner_height_mm=NULL, inner_depth_mm=NULL, overflow_limit=0, is_active=?, updated_at=? WHERE id=?")
        .bind(name, Number(isActive), new Date().toISOString(), containerId).run()
    }
    return json({ saved: true })
  } catch (error) { return errorResponse(error) }
}
