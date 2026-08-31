import { errorResponse, json } from '../../_lib/http'
import { listMenus } from '../../_lib/menus'
import type { Env } from '../../_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try { return json(await listMenus(env)) } catch (error) { return errorResponse(error) }
}
