import { errorResponse, json, readJsonObject } from '../_lib/http'
import { createMenu, parseMenuPayload } from '../_lib/menus'
import { notifyOwner } from '../_lib/notify'
import type { Env } from '../_lib/types'

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    const payload = parseMenuPayload(await readJsonObject(request))
    const result = await createMenu(env, payload)
    const notificationSent = await notifyOwner(env, request, result.id, result.snapshot.gameNightDate, 'saved')
    return json({ saved: true, menuId: result.id, editToken: result.editToken, notificationSent }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
