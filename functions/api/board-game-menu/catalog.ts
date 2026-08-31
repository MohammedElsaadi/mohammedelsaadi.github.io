import { readPublicCatalog } from './_lib/catalog'
import { errorResponse, json } from './_lib/http'
import type { Env } from './_lib/types'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    return json(await readPublicCatalog(env), 200, { 'Cache-Control': 'no-store' })
  } catch (error) {
    return errorResponse(error)
  }
}
