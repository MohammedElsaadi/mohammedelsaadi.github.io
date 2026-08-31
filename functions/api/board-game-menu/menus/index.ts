import { errorResponse, json, readJsonObject } from '../_lib/http'
import { createMenu, findMenuByDate, parseMenuPayload } from '../_lib/menus'
import { notifyOwner } from '../_lib/notify'
import type { Env } from '../_lib/types'
import { requireDateOnly } from '../_lib/validation'

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  try {
    const date = requireDateOnly(new URL(request.url).searchParams.get('date'))
    const existing = await findMenuByDate(env, date)
    return json({ exists: Boolean(existing), menuId: existing?.id ?? null })
  } catch (error) {
    return errorResponse(error)
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    const payload = parseMenuPayload(await readJsonObject(request))
    const result = await createMenu(env, payload)
    const notificationSent = await notifyOwner(env, request, result.id, result.snapshot.gameNightDate)
    return json({ saved: true, menuId: result.id, notificationSent }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
