import { afterEach, describe, expect, it, vi } from 'vitest'
import { notificationText, notifyOwner } from './notify'
import type { Env } from './types'

describe('notificationText', () => {
  it('formats the requested SMS with a direct saved-menu link', () => {
    expect(notificationText('https://mohammedelsaadi.com/', 'menu 123', '2026-09-05')).toBe(
      'Board Game Menu saved for 09/05/2026. Open the website to see what to bring. https://mohammedelsaadi.com/games/board-game-menu/menu/menu%20123',
    )
  })
})

describe('notifyOwner', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports success when Twilio accepts the request, regardless of response-body shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('accepted', { status: 201 })))
    const env = {
      TWILIO_ACCOUNT_SID: `AC${'a'.repeat(32)}`,
      TWILIO_API_KEY_SID: `SK${'b'.repeat(32)}`,
      TWILIO_API_KEY_SECRET: 'secret',
      TWILIO_FROM_NUMBER: '+12265550100',
      BOARD_GAME_NOTIFICATION_TO_PHONE: '+14165550100',
      PUBLIC_SITE_ORIGIN: 'https://mohammedelsaadi.com',
    } as unknown as Env

    await expect(notifyOwner(env, new Request('https://mohammedelsaadi.com/api/board-game-menu/menus'), 'menu-123', '2026-09-05')).resolves.toBe(true)
  })
})
