import { DatabaseSync } from 'node:sqlite'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GameSession } from '../../worker/trains/GameSession'
import type { TrainsEnv } from '../../worker/trains/GameSession'
import type { GameAction, GameState, ServerMessage, Snapshot } from '../../shared/trains/types'
import { ROOM_CODE_PATTERN } from '../../shared/trains/schemas'
import { dispatchTrains, roomCode } from '../../worker/trains/index'
import { ROUTES } from '../../shared/trains/board-data'

class Socket {
  attachment: unknown
  messages: ServerMessage[] = []
  closed = false
  get readyState() { return this.closed ? 3 : 1 }
  serializeAttachment(value: unknown) { this.attachment = structuredClone(value) }
  deserializeAttachment() { return this.attachment }
  send(text: string) { this.messages.push(JSON.parse(text) as ServerMessage) }
  close() { this.closed = true }
  get view() { return [...this.messages].reverse().find(message => message.type === 'JOINED' || message.type === 'SNAPSHOT') as Snapshot }
  get error() { return [...this.messages].reverse().find(message => message.type === 'ERROR') }
}
class Harness {
  db = new DatabaseSync(':memory:')
  sockets: Socket[] = []
  alarmAt = 0
  tasks: Promise<unknown>[] = []
  sql = { exec: (query: string, ...bindings: (string | number | null)[]) => { const rows = this.db.prepare(query).all(...bindings); return { toArray: () => rows } } }
  ctx = {
    storage: { sql: this.sql, transactionSync: <T>(fn: () => T): T => { this.db.exec('BEGIN'); try { const result = fn(); this.db.exec('COMMIT'); return result } catch (e) { this.db.exec('ROLLBACK'); throw e } }, setAlarm: async (at: number) => { this.alarmAt = at }, deleteAlarm: async () => { this.alarmAt = 0 } },
    getWebSockets: () => this.sockets.filter(socket => !socket.closed), getWebSocketAutoResponseTimestamp: () => null, waitUntil: (promise: Promise<unknown>) => { this.tasks.push(promise) }, setWebSocketAutoResponse: vi.fn(),
  }
  room = new GameSession(this.ctx as unknown as DurableObjectState, {} as TrainsEnv)
  async initialize() { return this.room.fetch(new Request('http://localhost/initialize?code=ABC234', { method: 'POST', body: JSON.stringify({ nickname: 'Alice' }) })) }
  connect(nickname: string) {
    const socket = new Socket()
    socket.serializeAttachment({ connectionId: crypto.randomUUID(), playerId: null, openedAt: Date.now(), windowAt: Date.now(), messages: 0 })
    this.sockets.push(socket); this.message(socket, { type: 'JOIN', nickname }); return socket
  }
  message(socket: Socket, message: unknown) { this.room.webSocketMessage(socket as unknown as WebSocket, JSON.stringify(message)) }
  action(socket: Socket, action: GameAction, actionId = crypto.randomUUID(), version = socket.view.stateVersion) { this.message(socket, { type: 'ACTION', actionId, expectedVersion: version, action }); return actionId }
  read() { return JSON.parse((this.sql.exec('SELECT json FROM game_state').toArray()[0] as { json: string }).json) as GameState }
  save(state: GameState) { this.sql.exec('UPDATE game_state SET json = ?', JSON.stringify(state)) }
  wake() { this.room = new GameSession(this.ctx as unknown as DurableObjectState, {} as TrainsEnv) }
}
let harness: Harness
beforeEach(() => { vi.stubGlobal('WebSocketRequestResponsePair', class { constructor(public request: string, public response: string) {} }); harness = new Harness() })
afterEach(() => { harness.db.close(); vi.unstubAllGlobals(); vi.useRealTimers() })
describe('SQLite session authority, projection and hibernation', () => {
  it('rejects a simultaneous initializer with a collision response instead of replacing the room', async () => {
    const results = await Promise.all([harness.initialize(),harness.initialize()])
    expect(results.map(r => r.status).sort()).toEqual([201,409]); expect(harness.read().players).toHaveLength(1)
  })
  it('atomically reserves the code and never initializes an existing or expired room again', async () => {
    expect((await harness.initialize()).status).toBe(201); expect((await harness.initialize()).status).toBe(409)
    const state = harness.read(); state.lastMeaningfulActivityAt = 0; harness.save(state)
    await harness.room.alarm()
    expect((await harness.room.fetch(new Request('http://localhost/rooms/ABC234'))).status).toBe(410)
    expect((await harness.initialize()).status).toBe(409)
    expect(harness.sql.exec('SELECT * FROM game_state').toArray()).toHaveLength(0)
  })
  it('takes over one nickname, rejects the old connection, and ignores its late close', async () => {
    await harness.initialize(); const old = harness.connect('Alice'), other = harness.connect('Bob'), replacement = harness.connect('ＡLICE')
    expect(old.closed).toBe(true); expect(old.messages.some(message => message.type === 'SEAT_TAKEN_OVER')).toBe(true)
    expect(replacement.view.private.playerId).toBe(old.view.private.playerId)
    const before = harness.read(); harness.action(old, { type: 'START_GAME' })
    expect(old.error?.type === 'ERROR' && old.error.code).toBe('SEAT_REVOKED'); expect(harness.read()).toEqual(before)
    harness.room.webSocketClose(old as unknown as WebSocket, 1000)
    harness.action(replacement, { type: 'SELECT_COLOR', color: 'green' })
    expect(other.view.public.players.find(player => player.nickname === 'Alice')?.online).toBe(true)
  })
  it('serializes racing claims and preserves the loser’s cards and the winning owner', async () => {
    await harness.initialize(); const a = harness.connect('Alice'), b = harness.connect('Bob')
    harness.action(a,{type:'START_GAME'})
    for (const socket of [a,b]) harness.action(socket,{type:'KEEP_INITIAL_TICKETS',ticketIds:socket.view.private.ticketOffer.map(t => t.id)})
    const state = harness.read(), edge = ROUTES.find(r => r.length===3 && r.color==='blue')!
    state.currentPlayerId=a.view.private.playerId; state.players.forEach(p => {p.hand=['blue','blue','blue']}); harness.save(state)
    const version=state.stateVersion
    harness.action(a,{type:'CLAIM_ROUTE',routeId:edge.id,payment:{blue:3}},crypto.randomUUID(),version)
    harness.action(b,{type:'CLAIM_ROUTE',routeId:edge.id,payment:{blue:3}},crypto.randomUUID(),version)
    expect(b.error?.type === 'ERROR' && b.error.code).toBe('STALE_VERSION')
    expect(harness.read().ownedRoutes[edge.id]).toBe(a.view.private.playerId); expect(harness.read().players[1].hand).toHaveLength(3)
  })
  it('restores mid-destination selection, final rounds and completed results after rejoin', async () => {
    await harness.initialize(); let a = harness.connect('Alice'); let b=harness.connect('Bob')
    harness.action(a,{type:'START_GAME'})
    for (const socket of [a,b]) harness.action(socket,{type:'KEEP_INITIAL_TICKETS',ticketIds:socket.view.private.ticketOffer.map(t=>t.id)})
    const state=harness.read(); state.currentPlayerId=a.view.private.playerId; state.players[0].trainsRemaining=2; harness.save(state)
    harness.action(a,{type:'DRAW_DESTINATION_TICKETS'}); const offer=a.view.private.ticketOffer
    harness.wake(); a=harness.connect('Alice'); expect(a.view.private.ticketOffer).toEqual(offer); expect(a.view.public.turn.action).toBe('SELECTING_TICKETS')
    harness.action(a,{type:'KEEP_DESTINATION_TICKETS',ticketIds:offer.map(t=>t.id)}); expect(a.view.public.phase).toBe('FINAL_ROUND')
    harness.wake(); b=harness.connect('Bob'); expect(b.view.public.finalRound?.turnsOwedPlayerIds).toHaveLength(2)
    for (const socket of [b,a]) {harness.action(socket,{type:'DRAW_TRAIN_CARD',source:'blind'});harness.action(socket,{type:'DRAW_TRAIN_CARD',source:'blind'})}
    expect(a.view.public.phase).toBe('COMPLETED'); const results=a.view.public.results
    harness.wake(); a=harness.connect('Alice'); expect(a.view.public.results).toEqual(results)
  })
  it('deduplicates actions durably, rejects action ID reuse and stale versions without mutation', async () => {
    await harness.initialize(); const a = harness.connect('Alice'); harness.connect('Bob')
    const version = a.view.stateVersion, id = harness.action(a, { type: 'START_GAME' }), after = harness.read()
    harness.wake(); harness.action(a, { type: 'START_GAME' }, id, version)
    expect(harness.read()).toEqual(after)
    harness.action(a, { type: 'SELECT_COLOR', color: 'green' }, id)
    expect(a.error?.type === 'ERROR' && a.error.code).toBe('ACTION_ID_REUSED')
    harness.action(a, { type: 'KEEP_INITIAL_TICKETS', ticketIds: a.view.private.ticketOffer.slice(0,2).map(t => t.id) }, crypto.randomUUID(), 0)
    expect(a.error?.type === 'ERROR' && a.error.code).toBe('STALE_VERSION'); expect(harness.read()).toEqual(after)
  })
  it('reconstructs private offers and mid-turn draws after instance recreation and nickname rejoin', async () => {
    await harness.initialize(); let a = harness.connect('Alice'); const b = harness.connect('Bob')
    harness.action(a, { type: 'START_GAME' }); const offer = a.view.private.ticketOffer
    harness.wake(); a = harness.connect('Alice'); expect(a.view.private.ticketOffer).toEqual(offer)
    for (const socket of [a,b]) harness.action(socket, { type: 'KEEP_INITIAL_TICKETS', ticketIds: socket.view.private.ticketOffer.slice(0,2).map(t => t.id) })
    const current = a.view.public.currentPlayerId === a.view.private.playerId ? a : b
    harness.action(current, { type: 'DRAW_TRAIN_CARD', source: 'blind' }); expect(current.view.public.turn.drawsTaken).toBe(1)
    const hand = current.view.private.hand; harness.wake()
    const rejoined = harness.connect(current === a ? 'Alice' : 'Bob')
    expect(rejoined.view.private.hand).toEqual(hand); expect(rejoined.view.public.turn.drawsTaken).toBe(1)
    harness.action(rejoined, { type: 'DRAW_TRAIN_CARD', source: 'blind' }); expect(rejoined.view.public.turn.drawsTaken).toBe(0)
  })
  it('keeps new nicknames out after start and never projects other players’ private data', async () => {
    await harness.initialize(); const a = harness.connect('Alice'), b = harness.connect('Bob')
    harness.action(a, { type: 'START_GAME' }); const newcomer = harness.connect('Eve')
    expect(newcomer.error?.type === 'ERROR' && newcomer.error.message).toContain('already started')
    expect(newcomer.view).toBeUndefined()
    const publicText = JSON.stringify(a.view.public)
    for (const ticket of b.view.private.ticketOffer) expect(publicText).not.toContain(ticket.id)
    for (const view of [a.view,b.view]) { expect(view.public).not.toHaveProperty('trainDeck'); expect(view.public.players[0]).not.toHaveProperty('hand'); expect(view.private).not.toHaveProperty('pendingTicketOfferByPlayer') }
  })
  it('removes a lobby player and revokes that connection before it can start or read new private state', async () => {
    await harness.initialize(); const a = harness.connect('Alice'), b = harness.connect('Bob')
    harness.action(a, { type: 'REMOVE_LOBBY_PLAYER', playerId: b.view.private.playerId })
    expect(b.closed).toBe(true); expect(b.messages.some(m => m.type === 'REMOVED')).toBe(true)
    const before = harness.read(); harness.action(b, { type: 'START_GAME' }); expect(harness.read()).toEqual(before)
  })
  it('does not renew retention for RESYNC or presence, handles malformed and oversized messages', async () => {
    await harness.initialize(); const a = harness.connect('Alice'), before = harness.read()
    harness.message(a, { type: 'RESYNC' }); expect(harness.read().lastMeaningfulActivityAt).toBe(before.lastMeaningfulActivityAt)
    harness.room.webSocketMessage(a as unknown as WebSocket, '{'); expect(a.error?.type === 'ERROR' && a.error.code).toBe('BAD_MESSAGE')
    harness.message(a, { type: 'ACTION', actionId: '12345678', expectedVersion: before.stateVersion, action: { type: 'END_TURN' } }); expect(harness.read()).toEqual(before)
    harness.room.webSocketMessage(a as unknown as WebSocket, 'x'.repeat(4097)); expect(a.closed).toBe(true)
  })
  it('marks presence offline only after grace and restores after wake', async () => {
    vi.useFakeTimers(); await harness.initialize(); const a = harness.connect('Alice'), b = harness.connect('Bob')
    a.closed = true; harness.room.webSocketClose(a as unknown as WebSocket, 1000)
    harness.message(b, { type: 'RESYNC' }); expect(b.view.public.players[0].online).toBe(true)
    vi.advanceTimersByTime(3101); harness.wake(); await harness.room.alarm()
    expect(b.view.public.players[0].online).toBe(false)
  })
  it('detects heartbeat loss without skipping turns or extending retention', async () => {
    vi.useFakeTimers(); await harness.initialize(); const a=harness.connect('Alice'), before=harness.read()
    vi.advanceTimersByTime(75_001); await harness.room.alarm()
    expect(a.closed).toBe(true); expect(harness.read()).toEqual(before)
  })
})
describe('HTTP boundary', () => {
  const env = () => ({ TRAINS_CREATE_LIMIT: { limit: async () => ({ success: true }) }, TRAINS_ACCESS_LIMIT: { limit: async () => ({ success: true }) }, TRAIN_ROOMS: { getByName: vi.fn() } }) as unknown as TrainsEnv
  it('generates unpredictable valid six-character codes', () => { const codes = Array.from({ length: 100 }, roomCode); expect(new Set(codes).size).toBe(100); expect(codes.every(code => ROOM_CODE_PATTERN.test(code))).toBe(true) })
  it('rejects bad origin, invalid code, HTTP on production and rate-limited access', async () => {
    expect((await dispatchTrains(new Request('https://example.com/api/trains/rooms/ABC234/ws', { headers: { Origin: 'https://attacker.example' } }), env())).status).toBe(403)
    expect((await dispatchTrains(new Request('http://example.com/api/trains/rooms/ABC234'), env())).status).toBe(403)
    expect((await dispatchTrains(new Request('http://localhost/api/trains/rooms/INVALID'), env())).status).toBe(404)
    const limited = env(); limited.TRAINS_ACCESS_LIMIT.limit = async () => ({ success: false })
    expect((await dispatchTrains(new Request('http://localhost/api/trains/rooms/ABC234'), limited)).status).toBe(429)
  })
})
