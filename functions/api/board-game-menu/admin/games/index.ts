import { createGame } from '../../_lib/games'
import { errorResponse, json, readJsonObject } from '../../_lib/http'
import { readAdminCatalog } from '../../_lib/catalog'
import type { Env } from '../../_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try { return json(await readAdminCatalog(env)) } catch (error) { return errorResponse(error) }
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    const id = await createGame(env, await readJsonObject(request))
    return json({ id }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
