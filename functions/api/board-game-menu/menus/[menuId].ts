import { errorResponse, HttpError, json, readJsonObject } from '../_lib/http'
import { getMenuTokenHash, parseMenuPayload, readMenu, updateMenu } from '../_lib/menus'
import { notifyOwner } from '../_lib/notify'
import { routeParam } from '../_lib/params'
import { constantTimeEqual, hashToken } from '../_lib/tokens'
import type { Env } from '../_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  try {
    return json(await readMenu(env, routeParam(params.menuId, 'Menu ID')))
  } catch (error) {
    return errorResponse(error)
  }
}

export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
  try {
    const menuId = routeParam(params.menuId, 'Menu ID')
    const rawToken = request.headers.get('X-Menu-Edit-Token') ?? ''
    const storedHash = await getMenuTokenHash(env, menuId)
    const suppliedHash = rawToken ? await hashToken(rawToken) : ''
    if (!storedHash || !constantTimeEqual(storedHash, suppliedHash)) throw new HttpError(403, 'Edit permission is required.')
    const payload = parseMenuPayload(await readJsonObject(request))
    const snapshot = await updateMenu(env, menuId, payload)
    const notificationSent = await notifyOwner(env, request, menuId, snapshot.gameNightDate, 'updated')
    return json({ saved: true, menuId, notificationSent })
  } catch (error) {
    return errorResponse(error)
  }
}
