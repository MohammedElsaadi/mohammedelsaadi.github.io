import type { Env } from './types'
import { formatDateOnly } from './validation'

export function notificationText(origin: string, menuId: string, date: string) {
  const menuUrl = `${origin.replace(/\/$/, '')}/games/board-game-menu/menu/${encodeURIComponent(menuId)}`
  return `Board Game Menu saved for ${formatDateOnly(date)}. Open the website to see what to bring. ${menuUrl}`
}

export async function notifyOwner(env: Env, request: Request, menuId: string, date: string) {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    TWILIO_FROM_NUMBER,
    BOARD_GAME_NOTIFICATION_TO_PHONE,
  } = env
  if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET || !TWILIO_FROM_NUMBER || !BOARD_GAME_NOTIFICATION_TO_PHONE) {
    console.info('Board Game Menu saved; SMS notification skipped because local/server Twilio configuration is incomplete.')
    return false
  }
  const origin = env.PUBLIC_SITE_ORIGIN?.replace(/\/$/, '') || new URL(request.url).origin
  const form = new URLSearchParams({
    To: BOARD_GAME_NOTIFICATION_TO_PHONE,
    From: TWILIO_FROM_NUMBER,
    Body: notificationText(origin, menuId, date),
  })
  const credentials = btoa(`${TWILIO_API_KEY_SID}:${TWILIO_API_KEY_SECRET}`)
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(TWILIO_ACCOUNT_SID)}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null) as { code?: number } | null
      console.error('Board Game Menu SMS request failed', response.status, errorBody?.code ?? 'unknown-code')
      return false
    }
    const body = await response.json().catch(() => null) as { sid?: string } | null
    return typeof body?.sid === 'string' && body.sid.startsWith('SM')
  } catch (error) {
    console.error('Board Game Menu SMS request failed', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}
