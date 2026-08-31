import type { Env } from './types'
import { formatDateOnly } from './validation'

export async function notifyOwner(env: Env, request: Request, menuId: string, date: string, kind: 'saved' | 'updated') {
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_EMAIL_API_TOKEN, BOARD_GAME_NOTIFICATION_TO, BOARD_GAME_NOTIFICATION_FROM } = env
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_EMAIL_API_TOKEN || !BOARD_GAME_NOTIFICATION_TO || !BOARD_GAME_NOTIFICATION_FROM) {
    console.info(`Board Game Menu ${kind}; notification skipped because local/server email configuration is incomplete.`)
    return false
  }
  const origin = env.PUBLIC_SITE_ORIGIN?.replace(/\/$/, '') || new URL(request.url).origin
  const formattedDate = formatDateOnly(date)
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(CLOUDFLARE_ACCOUNT_ID)}/email/sending/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CLOUDFLARE_EMAIL_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: BOARD_GAME_NOTIFICATION_TO,
        from: BOARD_GAME_NOTIFICATION_FROM,
        subject: `🎲 Board Game Menu ${kind} — ${formattedDate}`,
        text: `A Board Game Menu has been ${kind} for ${formattedDate}.\nOpen the website to see what to prepare.\n\n${origin}/games/board-game-menu/menu/${encodeURIComponent(menuId)}`,
        html: `<p>A Board Game Menu has been ${kind} for <strong>${formattedDate}</strong>.</p><p><a href="${origin}/games/board-game-menu/menu/${encodeURIComponent(menuId)}">Open the website to see what to prepare.</a></p>`,
      }),
    })
    if (!response.ok) {
      console.error('Board Game Menu email request failed', response.status)
      return false
    }
    const body = await response.json().catch(() => null) as { success?: boolean } | null
    return body?.success === true
  } catch (error) {
    console.error('Board Game Menu email request failed', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}
