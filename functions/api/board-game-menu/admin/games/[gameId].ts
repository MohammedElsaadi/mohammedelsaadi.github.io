import { deleteGame, updateGame } from '../../_lib/games'
import { errorResponse, json, readJsonObject } from '../../_lib/http'
import { routeParam } from '../../_lib/params'
import type { Env } from '../../_lib/types'

export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
  try {
    const id = routeParam(params.gameId, 'Game ID')
    await updateGame(env, id, await readJsonObject(request))
    return json({ id })
  } catch (error) { return errorResponse(error) }
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  try {
    await deleteGame(env, routeParam(params.gameId, 'Game ID'))
    return json({ deleted: true })
  } catch (error) { return errorResponse(error) }
}
