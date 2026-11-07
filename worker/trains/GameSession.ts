import { clientMessageSchema, createRoomSchema } from '../../shared/trains/schemas'
import { addEvent, applyAction, createRoom, expiresAt, joinRoom, normalizeNickname, projectState, RuleError, touch } from '../../shared/trains/rules'
import type { GameState, ServerMessage } from '../../shared/trains/types'

interface Attachment { connectionId: string; playerId: string | null; openedAt: number; windowAt: number; messages: number }
type SeatRow = { player_id: string; connection_id: string; offline_at: number | null }
export interface TrainsEnv {
  TRAIN_ROOMS: DurableObjectNamespace
  TRAINS_CREATE_LIMIT: RateLimit
  TRAINS_ACCESS_LIMIT: RateLimit
  PUBLIC_SITE_ORIGIN?: string
  TRAINS_RETENTION_DAYS?: string
}
export const cryptoRandom = () => crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000
const send = (ws: WebSocket, message: ServerMessage) => { try { ws.send(JSON.stringify(message)) } catch { /* Rejoin from SQLite after disconnect. */ } }

/** SQLite is authoritative; every event reloads it, including after hibernation. */
export class GameSession implements DurableObject {
  constructor(private readonly ctx: DurableObjectState, private readonly env: TrainsEnv) {
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS game_state (id INTEGER PRIMARY KEY CHECK(id = 1), json TEXT NOT NULL)')
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS lifecycle (id INTEGER PRIMARY KEY CHECK(id = 1), expired INTEGER NOT NULL DEFAULT 0)')
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS seats (player_id TEXT PRIMARY KEY, connection_id TEXT NOT NULL, offline_at INTEGER)')
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS game_events (id INTEGER PRIMARY KEY, at INTEGER NOT NULL, text TEXT NOT NULL)')
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS processed_actions (player_id TEXT, action_id TEXT, payload TEXT NOT NULL, version INTEGER NOT NULL, PRIMARY KEY(player_id, action_id))')
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS join_limits (key TEXT PRIMARY KEY, window_at INTEGER NOT NULL, attempts INTEGER NOT NULL)')
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
  }
  private read(): GameState | null {
    const row = this.ctx.storage.sql.exec<{ json: string }>('SELECT json FROM game_state WHERE id = 1').toArray()[0]
    if (!row) return null
    const state = JSON.parse(row.json) as GameState
    if (state.schemaVersion !== 1) throw new Error('Unsupported room schema version')
    return state
  }
  private write(state: GameState) {
    this.ctx.storage.sql.exec('INSERT OR REPLACE INTO game_state (id, json) VALUES (1, ?)', JSON.stringify(state))
    for (const event of state.publicEvents) this.ctx.storage.sql.exec('INSERT OR IGNORE INTO game_events (id, at, text) VALUES (?, ?, ?)', event.id, event.at, event.text)
  }
  private expiry(state: GameState) {
    const override = Number(this.env.TRAINS_RETENTION_DAYS)
    return Number.isFinite(override) && override > 0 ? expiresAt(state, { empty: override, lobby: override, active: override, completed: override }) : expiresAt(state)
  }
  private isExpired(state: GameState | null) {
    return !!this.ctx.storage.sql.exec<{ expired: number }>('SELECT expired FROM lifecycle WHERE id = 1').toArray()[0]?.expired || !!state && this.expiry(state) <= Date.now()
  }
  private seat(playerId: string) { return this.ctx.storage.sql.exec<SeatRow>('SELECT * FROM seats WHERE player_id = ?', playerId).toArray()[0] }
  private attachment(ws: WebSocket) { return ws.deserializeAttachment() as Attachment | null }
  private active(attachment: Attachment) { const seat = attachment.playerId && this.seat(attachment.playerId); return seat && seat.connection_id === attachment.connectionId && seat.offline_at === null }
  private presence(): Set<string> { return new Set(this.ctx.storage.sql.exec<SeatRow>('SELECT * FROM seats').toArray().filter(row => row.offline_at === null || Date.now() - row.offline_at < 3000).map(row => row.player_id)) }
  private broadcast(state: GameState) {
    const online = this.presence()
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = this.attachment(ws)
      if (!attachment?.playerId || !this.active(attachment)) continue
      if (!state.players.some(player => player.playerId === attachment.playerId)) { send(ws, { type: 'REMOVED', message: 'You left or were removed from the lobby.' }); ws.close(4003, 'Seat removed'); continue }
      send(ws, { type: 'SNAPSHOT', ...projectState(state, attachment.playerId, online) })
    }
  }
  private schedule(state: GameState) {
    let next = this.expiry(state)
    for (const seat of this.ctx.storage.sql.exec<SeatRow>('SELECT * FROM seats').toArray()) if (seat.offline_at && seat.offline_at + 3100 > Date.now()) next = Math.min(next, seat.offline_at + 3100)
    for (const ws of this.ctx.getWebSockets()) {
      if (ws.readyState !== 1) continue
      const attachment = this.attachment(ws)
      if (!attachment) continue
      if (!attachment.playerId) next = Math.min(next, attachment.openedAt + 10_000)
      else if (this.active(attachment)) next = Math.min(next, (this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? attachment.openedAt) + 75_000)
    }
    this.ctx.waitUntil(this.ctx.storage.setAlarm(Math.max(Date.now() + 100, next)))
  }
  private limitJoin() {
    const now = Date.now()
    const row = this.ctx.storage.sql.exec<{ window_at: number; attempts: number }>('SELECT * FROM join_limits WHERE key = ?', 'room').toArray()[0]
    const attempts = row && now - row.window_at < 60_000 ? row.attempts + 1 : 1
    const windowAt = row && now - row.window_at < 60_000 ? row.window_at : now
    this.ctx.storage.sql.exec('INSERT OR REPLACE INTO join_limits (key, window_at, attempts) VALUES (?, ?, ?)', 'room', windowAt, attempts)
    if (attempts > 20) throw new RuleError('Too many joins. Please wait a minute.', 'RATE_LIMITED')
  }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url), state = this.read()
    if (url.pathname.endsWith('/initialize') && request.method === 'POST') {
      if (state || this.isExpired(state)) return Response.json({ error: 'Code already used.' }, { status: 409 })
      const parsed = createRoomSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) return Response.json({ error: 'Enter a nickname.' }, { status: 400 })
      try {
        const joined = joinRoom(createRoom(url.searchParams.get('code')!, Date.now()), parsed.data.nickname, crypto.randomUUID(), Date.now())
        this.ctx.storage.transactionSync(() => {
          if (this.read() || this.isExpired(null)) throw new RuleError('Code already used.', 'CODE_USED')
          this.ctx.storage.sql.exec('INSERT INTO lifecycle (id, expired) VALUES (1, 0)'); this.write(joined.state)
        })
        this.schedule(joined.state)
        return Response.json({ code: joined.state.code, nickname: joined.state.players[0].nickname }, { status: 201 })
      } catch (error) { return Response.json({ error: error instanceof RuleError ? error.message : 'Could not create room.' }, { status: error instanceof RuleError && error.code === 'CODE_USED' ? 409 : 400 }) }
    }
    if (!state || this.isExpired(state)) return Response.json({ error: this.isExpired(state) ? 'This room has expired.' : 'Room not found.' }, { status: this.isExpired(state) ? 410 : 404 })
    if (!url.pathname.endsWith('/ws')) return Response.json({ code: state.code, phase: state.phase, players: state.players.length })
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket upgrade required.', { status: 426 })
    if (this.ctx.getWebSockets().length >= 15) return new Response('Too many connections. Try again shortly.', { status: 429 })
    const [client, server] = Object.values(new WebSocketPair()), now = Date.now()
    server.serializeAttachment({ connectionId: crypto.randomUUID(), playerId: null, openedAt: now, windowAt: now, messages: 0 } satisfies Attachment)
    this.ctx.acceptWebSocket(server); this.schedule(state)
    return new Response(null, { status: 101, webSocket: client })
  }
  webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const attachment = this.attachment(ws)
    if (!attachment) return ws.close(4001, 'Missing connection')
    if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 4096) { send(ws, { type: 'ERROR', code: 'BAD_MESSAGE', message: 'Messages must be JSON smaller than 4 KB.' }); return ws.close(1009, 'Message too large') }
    const now = Date.now()
    if (now - attachment.windowAt > 60_000) { attachment.windowAt = now; attachment.messages = 0 }
    attachment.messages++; ws.serializeAttachment(attachment)
    if (attachment.messages > 120) { send(ws, { type: 'ERROR', code: 'RATE_LIMITED', message: 'Too many messages. Reconnect in a minute.' }); return ws.close(4008, 'Rate limited') }
    let actionId: string | undefined
    try {
      let decoded: unknown
      try { decoded = JSON.parse(raw) } catch { throw new RuleError('Send a valid JSON message.', 'BAD_MESSAGE') }
      const parsed = clientMessageSchema.safeParse(decoded)
      if (!parsed.success) throw new RuleError('Invalid message or action payload.', 'BAD_MESSAGE')
      const message = parsed.data, state = this.read()
      if (!state || this.isExpired(state)) { send(ws, { type: 'ERROR', code: 'EXPIRED', message: 'This room has expired.' }); return ws.close(4004, 'Room expired') }
      if (message.type === 'JOIN') {
        if (attachment.playerId) throw new RuleError('This connection already has a seat.')
        this.limitJoin(); normalizeNickname(message.nickname)
        const joined = joinRoom(state, message.nickname, crypto.randomUUID(), now), previous = this.seat(joined.playerId)
        if (joined.existing) { addEvent(joined.state, `${joined.state.players.find(p => p.playerId === joined.playerId)!.nickname} rejoined${previous?.offline_at === null ? ' (previous connection replaced)' : ''}.`, now); touch(joined.state, now) }
        // Persist the generation before sending private views or closing old sockets.
        this.ctx.storage.transactionSync(() => {
          this.ctx.storage.sql.exec('INSERT OR REPLACE INTO seats (player_id, connection_id, offline_at) VALUES (?, ?, NULL)', joined.playerId, attachment.connectionId)
          this.write(joined.state)
        })
        attachment.playerId = joined.playerId; ws.serializeAttachment(attachment)
        for (const old of this.ctx.getWebSockets()) if (old !== ws && this.attachment(old)?.playerId === joined.playerId) { send(old, { type: 'SEAT_TAKEN_OVER', message: 'Seat opened elsewhere. This tab can no longer play.' }); old.close(4001, 'Seat opened elsewhere') }
        send(ws, { type: 'JOINED', ...projectState(joined.state, joined.playerId, this.presence()) })
        this.broadcast(joined.state); this.schedule(joined.state); return
      }
      if (!this.active(attachment) || !attachment.playerId) throw new RuleError('This connection no longer owns the seat. Rejoin by nickname.', 'SEAT_REVOKED')
      if (message.type === 'RESYNC') { send(ws, { type: 'SNAPSHOT', ...projectState(state, attachment.playerId, this.presence()) }); return }
      actionId = message.actionId
      const payload = JSON.stringify(message.action)
      let committed = state, ackVersion = state.stateVersion
      this.ctx.storage.transactionSync(() => {
        const duplicate = this.ctx.storage.sql.exec<{ payload: string; version: number }>('SELECT payload, version FROM processed_actions WHERE player_id = ? AND action_id = ?', attachment.playerId!, message.actionId).toArray()[0]
        if (duplicate) { if (duplicate.payload !== payload) throw new RuleError('Action ID already used for a different action.', 'ACTION_ID_REUSED'); ackVersion = duplicate.version; return }
        if (message.expectedVersion !== state.stateVersion) throw new RuleError('The table changed. Your view has been refreshed; choose again.', 'STALE_VERSION')
        committed = applyAction(state, attachment.playerId!, message.action, cryptoRandom, now); ackVersion = committed.stateVersion
        this.write(committed)
        this.ctx.storage.sql.exec('INSERT INTO processed_actions (player_id, action_id, payload, version) VALUES (?, ?, ?, ?)', attachment.playerId!, message.actionId, payload, ackVersion)
      })
      send(ws, { type: 'ACK', actionId, stateVersion: ackVersion }); this.broadcast(committed); this.schedule(committed)
    } catch (error) {
      const state = this.read()
      send(ws, { type: 'ERROR', actionId, code: error instanceof RuleError ? error.code : 'SERVER_ERROR', message: error instanceof RuleError ? error.message : 'The action could not be saved. Reconnect and try again.', stateVersion: state?.stateVersion })
      if (state && attachment.playerId && this.active(attachment) && state.players.some(player => player.playerId === attachment.playerId)) send(ws, { type: 'SNAPSHOT', ...projectState(state, attachment.playerId, this.presence()) })
    }
  }
  webSocketClose(ws: WebSocket, code: number) {
    const attachment = this.attachment(ws)
    if (attachment?.playerId && this.active(attachment)) {
      this.ctx.storage.sql.exec('UPDATE seats SET offline_at = ? WHERE player_id = ? AND connection_id = ?', Date.now(), attachment.playerId, attachment.connectionId)
      const state = this.read(); if (state) this.schedule(state)
    }
    try { ws.close(code === 1006 ? 1000 : code, 'Connection closed') } catch { /* Already closed. */ }
  }
  webSocketError(ws: WebSocket) { this.webSocketClose(ws, 1011) }
  async alarm() {
    const state = this.read()
    if (!state) return
    if (this.isExpired(state)) {
      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec('UPDATE lifecycle SET expired = 1 WHERE id = 1')
        for (const table of ['game_state', 'game_events', 'processed_actions', 'seats', 'join_limits']) this.ctx.storage.sql.exec(`DELETE FROM ${table}`)
      })
      for (const ws of this.ctx.getWebSockets()) { send(ws, { type: 'ERROR', code: 'EXPIRED', message: 'This room has expired.' }); ws.close(4004, 'Expired') }
      await this.ctx.storage.deleteAlarm(); return
    }
    for (const ws of this.ctx.getWebSockets()) {
      if (ws.readyState !== 1) continue
      const attachment = this.attachment(ws)
      if (!attachment) continue
      if (!attachment.playerId && Date.now() - attachment.openedAt >= 10_000) ws.close(4002, 'Join timed out')
      else if (attachment.playerId && this.active(attachment) && Date.now() - (this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? attachment.openedAt) >= 75_000) this.webSocketClose(ws, 4000)
    }
    this.broadcast(state); this.schedule(state)
  }
}
