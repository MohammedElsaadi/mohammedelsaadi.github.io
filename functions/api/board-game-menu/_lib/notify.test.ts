import { describe, expect, it } from 'vitest'
import { notificationText } from './notify'

describe('notificationText', () => {
  it('formats the requested SMS with a direct saved-menu link', () => {
    expect(notificationText('https://mohammedelsaadi.com/', 'menu 123', '2026-09-05')).toBe(
      'Board Game Menu saved for 09/05/2026. Open the website to see what to bring. https://mohammedelsaadi.com/games/board-game-menu/menu/menu%20123',
    )
  })
})
