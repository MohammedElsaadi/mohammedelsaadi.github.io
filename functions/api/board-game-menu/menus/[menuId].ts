import { errorResponse, json, readJsonObject } from '../_lib/http'
import { parseMenuPayload, readMenu, updateMenu } from '../_lib/menus'
import { notifyOwner } from '../_lib/notify'
import { routeParam } from '../_lib/params'
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
    const payload = parseMenuPayload(await readJsonObject(request))
    const snapshot = await updateMenu(env, menuId, payload)
    const notificationSent = await notifyOwner(env, request, menuId, snapshot.gameNightDate)
    return json({ saved: true, menuId, notificationSent })
  } catch (error) {
    return errorResponse(error)
  }
}
