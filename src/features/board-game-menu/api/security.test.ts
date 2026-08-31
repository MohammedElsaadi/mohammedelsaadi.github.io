import { afterEach, describe, expect, it, vi } from 'vitest'
import { boardGameApi } from './boardGameApi'

afterEach(() => vi.unstubAllGlobals())

describe('public menu edits', () => {
  it('updates a saved menu without requiring a browser-local edit token', async () => {
    const fetchMock = vi.fn(async (...requestArgs: [string, RequestInit?]) => {
      void requestArgs
      return {
        ok: true,
        status: 200,
        json: async () => ({ saved: true, menuId: 'menu-1', notificationSent: true }),
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    await boardGameApi.updateMenu('menu-1', {
      gameNightDate: '2026-09-05',
      selectedCrateGameIds: ['game-1'],
      selectedToteGameIds: [],
      selectedContainerIds: ['crate-1'],
    })

    const request = fetchMock.mock.calls[0]?.[1]
    expect(request).toBeDefined()
    expect(request?.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(request?.headers).not.toHaveProperty('X-Menu-Edit-Token')
  })
})
