import type {
  AdminCatalogResponse,
  ApiErrorBody,
  CatalogContainer,
  CatalogResponse,
  MenuMutationPayload,
  MenuMutationResponse,
  MenuDateStatusResponse,
  SavedMenu,
  Tag,
} from './types'

export class ApiRequestError extends Error {
  status: number
  body: ApiErrorBody

  constructor(status: number, body: ApiErrorBody) {
    super(body.error ?? `Request failed (${status})`)
    this.status = status
    this.body = body
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const body = await response.json().catch(() => null) as (T & ApiErrorBody) | null
  if (body === null) {
    throw new ApiRequestError(response.ok ? 502 : response.status, { error: 'The server returned an invalid response.' })
  }
  if (!response.ok) throw new ApiRequestError(response.status, body)
  return body
}

function jsonInit(method: string, body: unknown, headers?: HeadersInit): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }
}

export const boardGameApi = {
  getCatalog: () => requestJson<CatalogResponse>('/api/board-game-menu/catalog', { cache: 'no-store' }),
  getMenu: (menuId: string) =>
    requestJson<SavedMenu>(`/api/board-game-menu/menus/${encodeURIComponent(menuId)}`),
  findMenuByDate: (gameNightDate: string) =>
    requestJson<MenuDateStatusResponse>(`/api/board-game-menu/menus?date=${encodeURIComponent(gameNightDate)}`),
  createMenu: (payload: MenuMutationPayload) =>
    requestJson<MenuMutationResponse>('/api/board-game-menu/menus', jsonInit('POST', payload)),
  updateMenu: (menuId: string, payload: MenuMutationPayload) =>
    requestJson<MenuMutationResponse>(
      `/api/board-game-menu/menus/${encodeURIComponent(menuId)}`,
      jsonInit('PUT', payload),
    ),
  admin: {
    getCatalog: () => requestJson<AdminCatalogResponse>('/api/board-game-menu/admin/games'),
    saveGame: (gameId: string | null, payload: unknown) =>
      requestJson<{ id: string }>(
        gameId
          ? `/api/board-game-menu/admin/games/${encodeURIComponent(gameId)}`
          : '/api/board-game-menu/admin/games',
        jsonInit(gameId ? 'PUT' : 'POST', payload),
      ),
    deleteGame: (gameId: string) =>
      requestJson<{ deleted: true }>(`/api/board-game-menu/admin/games/${encodeURIComponent(gameId)}`, {
        method: 'DELETE',
      }),
    uploadCover: async (gameId: string, file: File) => {
      const response = await fetch(
        `/api/board-game-menu/admin/games/${encodeURIComponent(gameId)}/cover`,
        { method: 'PUT', headers: { 'Content-Type': file.type }, body: file },
      )
      const body = (await response.json().catch(() => ({}))) as { coverUrl?: string } & ApiErrorBody
      if (!response.ok) throw new ApiRequestError(response.status, body)
      return body
    },
    removeCover: (gameId: string) =>
      requestJson<{ removed: true }>(
        `/api/board-game-menu/admin/games/${encodeURIComponent(gameId)}/cover`,
        { method: 'DELETE' },
      ),
    uploadSide: async (gameId: string, file: File) => {
      const response = await fetch(
        `/api/board-game-menu/admin/games/${encodeURIComponent(gameId)}/side`,
        { method: 'PUT', headers: { 'Content-Type': file.type }, body: file },
      )
      const body = (await response.json().catch(() => ({}))) as { sideUrl?: string } & ApiErrorBody
      if (!response.ok) throw new ApiRequestError(response.status, body)
      return body
    },
    removeSide: (gameId: string) =>
      requestJson<{ removed: true }>(
        `/api/board-game-menu/admin/games/${encodeURIComponent(gameId)}/side`,
        { method: 'DELETE' },
      ),
    updateContainer: (container: CatalogContainer) =>
      requestJson<{ saved: true }>(
        `/api/board-game-menu/admin/containers/${encodeURIComponent(container.id)}`,
        jsonInit('PUT', container),
      ),
    uploadContainerImage: async (containerId: string, file: File) => {
      const response = await fetch(
        `/api/board-game-menu/admin/containers/${encodeURIComponent(containerId)}/image`,
        { method: 'PUT', headers: { 'Content-Type': file.type }, body: file },
      )
      const body = (await response.json().catch(() => ({}))) as { imageUrl?: string } & ApiErrorBody
      if (!response.ok) throw new ApiRequestError(response.status, body)
      return body
    },
    removeContainerImage: (containerId: string) =>
      requestJson<{ removed: true }>(
        `/api/board-game-menu/admin/containers/${encodeURIComponent(containerId)}/image`,
        { method: 'DELETE' },
      ),
    createTag: (name: string) =>
      requestJson<Tag>('/api/board-game-menu/admin/tags', jsonInit('POST', { name })),
    updateTag: (tagId: string, name: string) =>
      requestJson<Tag>(
        `/api/board-game-menu/admin/tags/${encodeURIComponent(tagId)}`,
        jsonInit('PUT', { name }),
      ),
    deleteTag: (tagId: string) =>
      requestJson<{ deleted: true }>(`/api/board-game-menu/admin/tags/${encodeURIComponent(tagId)}`, {
        method: 'DELETE',
      }),
    getMenus: () => requestJson<SavedMenu[]>('/api/board-game-menu/admin/menus'),
    updateMenu: (menuId: string, payload: MenuMutationPayload) =>
      requestJson<MenuMutationResponse>(
        `/api/board-game-menu/admin/menus/${encodeURIComponent(menuId)}`,
        jsonInit('PUT', payload),
      ),
    deleteMenu: (menuId: string) =>
      requestJson<{ deleted: true }>(`/api/board-game-menu/admin/menus/${encodeURIComponent(menuId)}`, {
        method: 'DELETE',
      }),
  },
}
