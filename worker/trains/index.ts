import { createRoomSchema, ROOM_CODE_PATTERN } from '../../shared/trains/schemas'
import { normalizeNickname, RuleError } from '../../shared/trains/rules'
import type { TrainsEnv } from './GameSession'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function roomCode(): string {
  let code = ''
  while (code.length < 6) for (const byte of crypto.getRandomValues(new Uint8Array(12))) {
    if (byte < Math.floor(256 / ALPHABET.length) * ALPHABET.length) code += ALPHABET[byte % ALPHABET.length]
    if (code.length === 6) break
  }
  return code
}
export async function dispatchTrains(request: Request, env: TrainsEnv): Promise<Response> {
  const url = new URL(request.url), origin = request.headers.get('Origin')
  if (origin && origin !== url.origin) return Response.json({ error: 'Use the same website to join this room.' }, { status: 403 })
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return new Response('HTTPS required.', { status: 403 })
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local'
  const create = /^\/api\/trains\/rooms\/?$/.test(url.pathname) && request.method === 'POST'
  if (!(await (create ? env.TRAINS_CREATE_LIMIT : env.TRAINS_ACCESS_LIMIT).limit({ key: ip })).success) return Response.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429, headers: { 'Retry-After': '60' } })
  if (create) {
    if (Number(request.headers.get('Content-Length') ?? 0) > 1024) return new Response('Request too large.', { status: 413 })
    const text = await request.text()
    if (text.length > 1024) return new Response('Request too large.', { status: 413 })
    let input: unknown
    try { input = JSON.parse(text) } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }) }
    const parsed = createRoomSchema.safeParse(input)
    if (!parsed.success) return Response.json({ error: 'Enter a nickname.' }, { status: 400 })
    try { normalizeNickname(parsed.data.nickname) } catch (error) { return Response.json({ error: error instanceof RuleError ? error.message : 'Invalid nickname.' }, { status: 400 }) }
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = roomCode()
      const response = await env.TRAIN_ROOMS.getByName(code).fetch(new Request(`${url.origin}/initialize?code=${code}`, { method: 'POST', body: JSON.stringify(parsed.data), headers: { 'Content-Type': 'application/json' } }))
      if (response.status !== 409) return response
    }
    return Response.json({ error: 'Could not reserve a room code. Please try again.' }, { status: 503 })
  }
  const match = /^\/api\/trains\/rooms\/([^/]+)(\/ws)?\/?$/.exec(url.pathname)
  if (!match || !ROOM_CODE_PATTERN.test(match[1]) || request.method !== 'GET') return Response.json({ error: 'Room not found. Check the six-character code.' }, { status: 404 })
  return env.TRAIN_ROOMS.getByName(match[1]).fetch(request)
}
