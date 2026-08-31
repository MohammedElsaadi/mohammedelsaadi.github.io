import { onRequestGet as getCatalog } from '../functions/api/board-game-menu/catalog'
import { onRequestGet as getMedia } from '../functions/api/board-game-menu/media/[[path]]'
import { onRequestPost as createMenu } from '../functions/api/board-game-menu/menus/index'
import { onRequestGet as getMenu, onRequestPut as updateMenu } from '../functions/api/board-game-menu/menus/[menuId]'
import { onRequestPut as updateContainer } from '../functions/api/board-game-menu/admin/containers/[containerId]'
import { onRequestDelete as deleteContainerImage, onRequestPut as uploadContainerImage } from '../functions/api/board-game-menu/admin/containers/[containerId]/image'
import { onRequestDelete as deleteGame, onRequestPut as updateGame } from '../functions/api/board-game-menu/admin/games/[gameId]'
import { onRequestDelete as deleteCover, onRequestPut as uploadCover } from '../functions/api/board-game-menu/admin/games/[gameId]/cover'
import { onRequestGet as getAdminCatalog, onRequestPost as createGame } from '../functions/api/board-game-menu/admin/games/index'
import { onRequestDelete as deleteAdminMenu, onRequestGet as getAdminMenu, onRequestPut as updateAdminMenu } from '../functions/api/board-game-menu/admin/menus/[menuId]'
import { onRequestGet as getAdminMenus } from '../functions/api/board-game-menu/admin/menus/index'
import { onRequestDelete as deleteTag, onRequestPut as updateTag } from '../functions/api/board-game-menu/admin/tags/[tagId]'
import { onRequestGet as getTags, onRequestPost as createTag } from '../functions/api/board-game-menu/admin/tags/index'
import type { Env } from '../functions/api/board-game-menu/_lib/types'

type Handler = PagesFunction<Env>

interface Route {
  method: string
  pattern: RegExp
  parameterNames: string[]
  handler: Handler
  wildcardParameter?: string
}

const routes: Route[] = [
  { method: 'GET', pattern: /^\/api\/board-game-menu\/catalog\/?$/, parameterNames: [], handler: getCatalog },
  { method: 'GET', pattern: /^\/api\/board-game-menu\/media\/(.+)$/, parameterNames: [], wildcardParameter: 'path', handler: getMedia },
  { method: 'POST', pattern: /^\/api\/board-game-menu\/menus\/?$/, parameterNames: [], handler: createMenu },
  { method: 'GET', pattern: /^\/api\/board-game-menu\/menus\/([^/]+)\/?$/, parameterNames: ['menuId'], handler: getMenu },
  { method: 'PUT', pattern: /^\/api\/board-game-menu\/menus\/([^/]+)\/?$/, parameterNames: ['menuId'], handler: updateMenu },
  { method: 'GET', pattern: /^\/api\/board-game-menu\/admin\/games\/?$/, parameterNames: [], handler: getAdminCatalog },
  { method: 'POST', pattern: /^\/api\/board-game-menu\/admin\/games\/?$/, parameterNames: [], handler: createGame },
  { method: 'PUT', pattern: /^\/api\/board-game-menu\/admin\/games\/([^/]+)\/?$/, parameterNames: ['gameId'], handler: updateGame },
  { method: 'DELETE', pattern: /^\/api\/board-game-menu\/admin\/games\/([^/]+)\/?$/, parameterNames: ['gameId'], handler: deleteGame },
  { method: 'PUT', pattern: /^\/api\/board-game-menu\/admin\/games\/([^/]+)\/cover\/?$/, parameterNames: ['gameId'], handler: uploadCover },
  { method: 'DELETE', pattern: /^\/api\/board-game-menu\/admin\/games\/([^/]+)\/cover\/?$/, parameterNames: ['gameId'], handler: deleteCover },
  { method: 'PUT', pattern: /^\/api\/board-game-menu\/admin\/containers\/([^/]+)\/?$/, parameterNames: ['containerId'], handler: updateContainer },
  { method: 'PUT', pattern: /^\/api\/board-game-menu\/admin\/containers\/([^/]+)\/image\/?$/, parameterNames: ['containerId'], handler: uploadContainerImage },
  { method: 'DELETE', pattern: /^\/api\/board-game-menu\/admin\/containers\/([^/]+)\/image\/?$/, parameterNames: ['containerId'], handler: deleteContainerImage },
  { method: 'GET', pattern: /^\/api\/board-game-menu\/admin\/tags\/?$/, parameterNames: [], handler: getTags },
  { method: 'POST', pattern: /^\/api\/board-game-menu\/admin\/tags\/?$/, parameterNames: [], handler: createTag },
  { method: 'PUT', pattern: /^\/api\/board-game-menu\/admin\/tags\/([^/]+)\/?$/, parameterNames: ['tagId'], handler: updateTag },
  { method: 'DELETE', pattern: /^\/api\/board-game-menu\/admin\/tags\/([^/]+)\/?$/, parameterNames: ['tagId'], handler: deleteTag },
  { method: 'GET', pattern: /^\/api\/board-game-menu\/admin\/menus\/?$/, parameterNames: [], handler: getAdminMenus },
  { method: 'GET', pattern: /^\/api\/board-game-menu\/admin\/menus\/([^/]+)\/?$/, parameterNames: ['menuId'], handler: getAdminMenu },
  { method: 'PUT', pattern: /^\/api\/board-game-menu\/admin\/menus\/([^/]+)\/?$/, parameterNames: ['menuId'], handler: updateAdminMenu },
  { method: 'DELETE', pattern: /^\/api\/board-game-menu\/admin\/menus\/([^/]+)\/?$/, parameterNames: ['menuId'], handler: deleteAdminMenu },
]

function decodeParameter(value: string) {
  try { return decodeURIComponent(value) } catch { return value }
}

async function dispatchApi(request: Request, env: Env, execution: ExecutionContext) {
  const pathname = new URL(request.url).pathname
  for (const route of routes) {
    if (request.method !== route.method) continue
    const match = route.pattern.exec(pathname)
    if (!match) continue
    const params: Record<string, string | string[]> = {}
    route.parameterNames.forEach((name, index) => { params[name] = decodeParameter(match[index + 1]) })
    if (route.wildcardParameter) params[route.wildcardParameter] = match[1].split('/').map(decodeParameter)
    const context: EventContext<Env, string, Record<string, unknown>> = {
      request: request as EventContext<Env, string, Record<string, unknown>>['request'],
      env,
      params,
      data: {},
      functionPath: pathname,
      waitUntil: execution.waitUntil.bind(execution),
      passThroughOnException: execution.passThroughOnException.bind(execution),
      next: () => env.ASSETS.fetch(request),
    }
    const response = await route.handler(context)
    return response ?? new Response(null, { status: 204 })
  }
  return Response.json({ error: 'API route not found.' }, { status: 404 })
}

export default {
  fetch(request: Request, env: Env, execution: ExecutionContext) {
    const pathname = new URL(request.url).pathname
    return pathname.startsWith('/api/')
      ? dispatchApi(request, env, execution)
      : env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
