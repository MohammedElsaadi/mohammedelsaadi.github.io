import { describe, expect, it } from 'vitest'
import { CITIES, ROUTES, TICKETS } from '../../shared/trains/board-data'
import { addEvent, applyAction, createRoom, expiresAt, joinRoom, makeTrainDeck, normalizeNickname, paymentOptions, projectState, refreshMarket, routeRestriction, shuffled } from '../../shared/trains/rules'
import { compareStandings, connected, longestTrail, ROUTE_POINTS, scoreGame } from '../../shared/trains/scoring'
import { clientMessageSchema } from '../../shared/trains/schemas'
import { CARD_COLORS } from '../../shared/trains/types'
import type { GameAction, GameState, Route } from '../../shared/trains/types'

export function seeded(seed = 17) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32 } }
export function setup(count = 2, initial = true) {
  let state = createRoom('ABC234', 1)
  for (let i = 0; i < count; i++) state = joinRoom(state, `Player ${i}`, `p${i}`, 2).state
  state = applyAction(state, 'p0', { type: 'START_GAME' }, seeded(), 3)
  if (initial) for (const player of state.players) state = applyAction(state, player.playerId, { type: 'KEEP_INITIAL_TICKETS', ticketIds: state.pendingTicketOfferByPlayer[player.playerId].slice(0, 2) }, seeded(), 4)
  return state
}
const act = (state: GameState, action: GameAction, playerId = state.currentPlayerId!) => applyAction(state, playerId, action, seeded(), state.lastMeaningfulActivityAt + 1)
function route(color: Route['color'], length: number) { return ROUTES.find(route => route.color === color && route.length === length)! }
function active(state: GameState) { return state.players.find(player => player.playerId === state.currentPlayerId)! }
function conservation(state: GameState) {
  const cards = [...state.trainDeck, ...state.trainDiscard, ...state.faceUp, ...state.players.flatMap(player => player.hand)]
  expect(cards).toHaveLength(110)
  for (const color of CARD_COLORS) expect(cards.filter(card => card === color)).toHaveLength(12)
  expect(cards.filter(card => card === 'locomotive')).toHaveLength(14)
  const tickets = [...state.destinationDeck, ...Object.values(state.pendingTicketOfferByPlayer).flat(), ...state.players.flatMap(player => player.destinationTicketIds)]
  expect(tickets).toHaveLength(30); expect(new Set(tickets).size).toBe(30)
}
describe('classic USA data and setup', () => {
  it('contains exactly 36 cities, 100 physical tracks and 30 original tickets', () => {
    expect(CITIES).toHaveLength(36); expect(ROUTES).toHaveLength(100); expect(TICKETS).toHaveLength(30)
    for (const values of [CITIES, ROUTES, TICKETS]) expect(new Set(values.map(value => value.id)).size).toBe(values.length)
    const ids = new Set(CITIES.map(city => city.id)), groups = new Map<string, number>()
    for (const edge of ROUTES) {
      expect(ids.has(edge.cityA) && ids.has(edge.cityB)).toBe(true)
      expect(edge.length).toBeGreaterThanOrEqual(1); expect(edge.length).toBeLessThanOrEqual(6)
      expect([...CARD_COLORS, 'gray']).toContain(edge.color)
      const pair = [edge.cityA, edge.cityB].sort().join(':'); groups.set(pair, (groups.get(pair) ?? 0) + 1)
    }
    expect(Math.max(...groups.values())).toBe(2)
    for (const ticket of TICKETS) expect(connected(ROUTES, ticket.cityA, ticket.cityB)).toBe(true)
    expect(makeTrainDeck()).toHaveLength(110); expect(makeTrainDeck()).not.toContain('purple')
    expect(TICKETS.find(ticket => ticket.id === 'seattle__new-york')?.points).toBe(22)
  })
  it.each([2, 3, 5])('sets up %i seats, private offers, correct cards and deterministic first player', count => {
    const state = setup(count, false)
    expect(state.phase).toBe('INITIAL_TICKETS')
    for (const player of state.players) { expect(player.hand).toHaveLength(4); expect(player.trainsRemaining).toBe(45); expect(state.pendingTicketOfferByPlayer[player.playerId]).toHaveLength(3) }
    expect(setup(count).currentPlayerId).toBe(state.currentPlayerId); conservation(state)
    expect(state.players.map(player => player.playerId)).toEqual(Array.from({ length: count }, (_, i) => `p${i}`))
  })
  it('keeps 2 or 3 tickets, appends rejected offers in offer order and waits for everyone', () => {
    const state = setup(2, false), offer = state.pendingTicketOfferByPlayer.p0
    expect(() => act(state, { type: 'KEEP_INITIAL_TICKETS', ticketIds: offer.slice(0, 1) }, 'p0')).toThrow()
    const next = act(state, { type: 'KEEP_INITIAL_TICKETS', ticketIds: offer.slice(1) }, 'p0')
    expect(next.destinationDeck.at(-1)).toBe(offer[0]); expect(next.phase).toBe('INITIAL_TICKETS')
    const playing = act(next, { type: 'KEEP_INITIAL_TICKETS', ticketIds: next.pendingTicketOfferByPlayer.p1 }, 'p1')
    expect(playing.phase).toBe('PLAYING'); conservation(playing)
    expect(() => act(playing, { type: 'KEEP_INITIAL_TICKETS', ticketIds: offer }, 'p0')).toThrow()
  })
  it('normalizes Unicode nicknames, limits length, rejects HTML and reclaims case-insensitively', () => {
    expect(normalizeNickname('  Ａlice  ')).toEqual({ nickname: 'Alice', nicknameKey: 'alice' })
    expect(normalizeNickname('नमस्ते').nickname).toBe('नमस्ते')
    expect(normalizeNickname('कि'.repeat(20)).nickname).toBe('कि'.repeat(20))
    for (const value of ['', '<script>', 'a'.repeat(21)]) expect(() => normalizeNickname(value)).toThrow()
    const state = joinRoom(createRoom('ABC234', 0), 'Alice', 'first', 1).state
    expect(joinRoom(state, 'ALICE', 'second', 2).playerId).toBe('first')
  })
  it('has collision-safe unique colors, host-only start/removal and host transfer', () => {
    let state = createRoom('ABC234', 0)
    for (let i = 0; i < 5; i++) state = joinRoom(state, `Player ${i}`, `p${i}`, 1).state
    expect(() => joinRoom(state, 'sixth', 'p6', 2)).toThrow(/full/)
    expect(() => act(state, { type: 'SELECT_COLOR', color: state.players[0].pieceColor }, 'p1')).toThrow()
    expect(() => act(state, { type: 'START_GAME' }, 'p1')).toThrow(/host/)
    state = act(state, { type: 'LEAVE_LOBBY' }, 'p0'); expect(state.players[0].isHost).toBe(true)
    state = act(state, { type: 'REMOVE_LOBBY_PLAYER', playerId: 'p2' }, 'p1'); expect(state.players).toHaveLength(3)
    expect(joinRoom(state, 'Player 2', 'new', 4).playerId).toBe('new')
  })
})
describe('route claims and turns', () => {
  it('charges blue cards, places the owner color, scores 4 and auto-ends one turn', () => {
    const state = setup(), player = active(state), edge = route('blue', 3)
    player.pieceColor = 'black'; player.hand = ['blue', 'blue', 'locomotive']
    const next = act(state, { type: 'CLAIM_ROUTE', routeId: edge.id, payment: { blue: 2, locomotive: 1 } })
    expect(next.ownedRoutes[edge.id]).toBe(player.playerId); expect(next.players.find(p => p.playerId === player.playerId)?.routeScore).toBe(4)
    expect(next.players.find(p => p.playerId === player.playerId)?.trainsRemaining).toBe(42); expect(next.currentPlayerId).not.toBe(player.playerId)
    expect(() => act(next, { type: 'CLAIM_ROUTE', routeId: edge.id, payment: { blue: 3 } }, player.playerId)).toThrow()
  })
  it('allows any single gray currency and deliberate wild substitutions, rejects mixed or forged payments', () => {
    const state = setup(), edge = route('gray', 3), player = active(state)
    player.hand = ['red', 'red', 'red', 'blue', 'blue', 'blue', 'locomotive', 'locomotive', 'locomotive']
    const options = paymentOptions(player.hand, edge)
    expect(options).toContainEqual({ red: 3 }); expect(options).toContainEqual({ red: 2, locomotive: 1 }); expect(options).toContainEqual({ locomotive: 3 })
    for (const payment of [{ red: 1, blue: 2 }, { red: -1, locomotive: 4 }, { red: 4 }, { green: 3 }, { locomotive: 1.5, red: 1.5 }]) expect(() => act(state, { type: 'CLAIM_ROUTE', routeId: edge.id, payment })).toThrow()
    player.trainsRemaining = 2; expect(() => act(state, { type: 'CLAIM_ROUTE', routeId: edge.id, payment: { red: 3 } })).toThrow(/pieces/)
  })
  it.each([2, 3, 4, 5])('applies both parallel-track restrictions with %i players', count => {
    const state = setup(count), a = ROUTES.find(route => route.parallelGroupId)!, b = ROUTES.find(route => route.id !== a.id && route.parallelGroupId === a.parallelGroupId)!
    state.ownedRoutes[a.id] = 'p0'
    expect(routeRestriction(state, 'p0', b)).not.toBeNull()
    expect(routeRestriction(state, 'p1', b) === null).toBe(count >= 4)
    expect(routeRestriction(state, 'p1', a)).not.toBeNull()
  })
  it('uses the complete original point table', () => { expect([...ROUTE_POINTS]).toEqual([0, 1, 2, 4, 7, 10, 15]) })
  it('rejects out-of-turn actions and leaves the input unchanged on failed validation', () => {
    const state = setup(), original = structuredClone(state)
    expect(() => act(state, { type: 'DRAW_DESTINATION_TICKETS' }, state.players.find(player => player.playerId !== state.currentPlayerId)!.playerId)).toThrow(/turn/)
    expect(state).toEqual(original)
  })
})
describe('train card draws and exhaustion', () => {
  it('ends on a first face-up locomotive and forbids a second face-up locomotive', () => {
    const state = setup(); state.faceUp = ['locomotive', 'blue', 'red', 'green', 'pink']
    expect(act(state, { type: 'DRAW_TRAIN_CARD', source: 0 }).currentPlayerId).not.toBe(state.currentPlayerId)
    const partial = act(state, { type: 'DRAW_TRAIN_CARD', source: 1 })
    expect(partial.currentPlayerId).toBe(state.currentPlayerId); expect(partial.turn.drawsTaken).toBe(1)
    expect(() => act(partial, { type: 'DRAW_TRAIN_CARD', source: 0 })).toThrow(/second/)
    expect(() => act(partial, { type: 'DRAW_DESTINATION_TICKETS' })).toThrow(/current action/)
  })
  it('allows a blind wild as one draw, then ends after the second and restores market slots', () => {
    const state = setup(); state.trainDeck = ['locomotive', 'red', 'blue']
    const next = act(state, { type: 'DRAW_TRAIN_CARD', source: 'blind' })
    expect(next.turn.drawsTaken).toBe(1); expect(active(next).hand.at(-1)).toBe('locomotive')
    const done = act(next, { type: 'DRAW_TRAIN_CARD', source: 'blind' }); expect(done.currentPlayerId).not.toBe(state.currentPlayerId)
  })
  it('refreshes three wilds, reshuffles discards and conserves every card', () => {
    const state = setup(); state.trainDeck.push(...state.faceUp); state.faceUp = []
    for (let i = 0; i < 3; i++) state.faceUp.push(state.trainDeck.splice(state.trainDeck.indexOf('locomotive'), 1)[0])
    state.faceUp.push(...state.trainDeck.splice(0, 2))
    refreshMarket(state, seeded(), 99)
    expect(state.faceUp.filter(card => card === 'locomotive').length).toBeLessThan(3); conservation(state)
    state.trainDiscard.push(...state.trainDeck); state.trainDeck = []
    const next = act(state, { type: 'DRAW_TRAIN_CARD', source: 'blind' }); conservation(next)
  })
  it('terminates impossible markets, short markets, one-card draws and no-card draws without duplication', () => {
    const state = setup(); state.trainDeck = []; state.trainDiscard = []; state.faceUp = ['locomotive', 'locomotive', 'locomotive', 'red', 'blue']
    refreshMarket(state, () => 0, 1); expect(state.faceUp).toHaveLength(5)
    state.faceUp = ['red']; const done = act(state, { type: 'DRAW_TRAIN_CARD', source: 0 }); expect(done.currentPlayerId).not.toBe(state.currentPlayerId)
    state.faceUp = []; expect(() => act(state, { type: 'DRAW_TRAIN_CARD', source: 'blind' })).toThrow(/empty/)
    expect(projectState(state, state.currentPlayerId!).private.canDrawBlind).toBe(false)
  })
})
describe('destinations, scoring and final turns', () => {
  it('orders ties by completed-ticket count, then longest bonus, then co-winners', () => {
    const result = { total:100, completedTickets:2, longestBonus:0 }
    expect(compareStandings(result,{...result,completedTickets:3})).toBeGreaterThan(0)
    expect(compareStandings({...result,completedTickets:3},{...result,longestBonus:10})).toBeLessThan(0)
    expect(compareStandings(result,{...result,longestBonus:10})).toBeGreaterThan(0)
    expect(compareStandings(result,{...result})).toBe(0)
  })
  it('draws up to three, enforces one retained and returns others at the bottom', () => {
    const state = setup(), player = active(state), offered = state.destinationDeck.slice(0, 3), tail = state.destinationDeck.slice(3)
    const next = act(state, { type: 'DRAW_DESTINATION_TICKETS' })
    expect(next.turn.action).toBe('SELECTING_TICKETS'); expect(next.currentPlayerId).toBe(player.playerId)
    expect(() => act(next, { type: 'KEEP_DESTINATION_TICKETS', ticketIds: [] })).toThrow()
    const done = act(next, { type: 'KEEP_DESTINATION_TICKETS', ticketIds: offered.slice(1, 2) })
    expect(done.destinationDeck).toEqual([...tail, offered[0], offered[2]]); conservation(done)
    state.destinationDeck = offered.slice(0, 1); expect(act(state, { type: 'DRAW_DESTINATION_TICKETS' }).pendingTicketOfferByPlayer[player.playerId]).toHaveLength(1)
    state.destinationDeck = []; expect(() => act(state, { type: 'DRAW_DESTINATION_TICKETS' })).toThrow(/No destination/)
  })
  it('uses own-network connectivity and reveals positive/negative tickets only on completion', () => {
    const state = setup(); state.players[0].destinationTicketIds = ['denver__el-paso', 'los-angeles__new-york']
    const a = ROUTES.find(route => route.cityA === 'santa-fe' && route.cityB === 'denver')!, b = ROUTES.find(route => route.cityA === 'el-paso' && route.cityB === 'santa-fe')!
    state.ownedRoutes[a.id] = 'p0'; state.ownedRoutes[b.id] = 'p1'
    expect(projectState(state, 'p0').private.tickets[0].completed).toBe(false)
    state.ownedRoutes[b.id] = 'p0'; const results = scoreGame(state)
    expect(results[0].tickets.map(ticket => ticket.score)).toEqual([4, -21])
    expect(projectState(state, 'p1').public.results).toBeNull()
  })
  it('finds exact weighted trails through repeated vertices, loops, parallel edges and branches', () => {
    const edges = (rows: [string, string, number][]) => rows.map(([cityA, cityB, length]) => ({ cityA, cityB, length }))
    expect(longestTrail(edges([['a', 'b', 2], ['b', 'c', 3], ['c', 'a', 4], ['a', 'd', 5]]))).toBe(14)
    expect(longestTrail(edges([['a', 'b', 2], ['a', 'b', 3], ['a', 'c', 4], ['c', 'd', 1]]))).toBe(10)
    expect(longestTrail(edges([['a', 'b', 2], ['a', 'c', 3], ['a', 'd', 4]]))).toBe(7)
    expect(longestTrail([])).toBe(0)
  })
  it('awards all longest ties and preserves co-winners after all tie breakers', () => {
    const state = setup(); state.players.forEach(player => { player.destinationTicketIds = [] })
    const singles = ROUTES.filter(route => route.length === 1)
    state.ownedRoutes[singles[0].id] = 'p0'; state.ownedRoutes[singles.at(-1)!.id] = 'p1'
    const scores = scoreGame(state)
    expect(scores.map(score => score.longestBonus)).toEqual([10, 10]); expect(scores.every(score => score.winner)).toBe(true)
  })
  it.each([0, 1, 2])('grants one additional turn to EVERY player after the trigger at %i trains', trains => {
    let state = setup(3)
    const trigger = state.currentPlayerId!
    active(state).trainsRemaining = trains
    state = act(state, { type: 'DRAW_TRAIN_CARD', source: 'blind' }); state = act(state, { type: 'DRAW_TRAIN_CARD', source: 'blind' })
    expect(state.phase).toBe('FINAL_ROUND'); expect(state.finalRound?.turnsOwedPlayerIds).toHaveLength(3)
    for (let i = 0; i < 3; i++) {
      if (i === 2) expect(state.currentPlayerId).toBe(trigger)
      state = act(state, { type: 'DRAW_DESTINATION_TICKETS' })
      state = act(state, { type: 'KEEP_DESTINATION_TICKETS', ticketIds: state.pendingTicketOfferByPlayer[state.currentPlayerId!].slice(0, 1) })
      expect(state.phase).toBe(i === 2 ? 'COMPLETED' : 'FINAL_ROUND')
    }
    expect(state.results).toHaveLength(3)
  })
  it('keeps pending actions after serialize/reload and never leaks other hands or offers', () => {
    let state = setup(); state = act(state, { type: 'DRAW_TRAIN_CARD', source: 'blind' })
    const restored = JSON.parse(JSON.stringify(state)) as GameState
    const view = projectState(restored, restored.currentPlayerId!)
    expect(view.public.turn.drawsTaken).toBe(1); expect(view.private.hand).toHaveLength(5)
    expect(view.public.players.every(player => !('hand' in player) && !('destinationTicketIds' in player))).toBe(true)
    expect(view).not.toHaveProperty('trainDeck'); expect(view.public).not.toHaveProperty('pendingTicketOfferByPlayer')
    expect(JSON.stringify(view.public.events)).not.toContain('ticketIds')
  })
  it('expires based on meaningful activity with 1/30/90/30-day defaults', () => {
    const state = createRoom('ABC234', 100)
    expect(expiresAt(state)).toBe(100 + 86_400_000)
    state.players = setup().players; expect(expiresAt(state)).toBe(100 + 30 * 86_400_000)
    state.phase = 'PLAYING'; expect(expiresAt(state)).toBe(100 + 90 * 86_400_000)
    state.phase = 'COMPLETED'; expect(expiresAt(state)).toBe(100 + 30 * 86_400_000)
    addEvent(state, 'presence only', 999); expect(state.lastMeaningfulActivityAt).toBe(100)
  })
  it('reproduces the documented total-exhaustion stalemate without inventing a pass rule', () => {
    const state=setup(3), player=active(state), others=state.players.filter(p=>p.playerId!==player.playerId)
    const cards=[...state.trainDeck,...state.trainDiscard,...state.faceUp,...state.players.flatMap(p=>p.hand)]
    const myTickets=[...player.destinationTicketIds]
    const tickets=[...state.destinationDeck,...state.players.flatMap(p=>p.destinationTicketIds)].filter(id=>!myTickets.includes(id))
    state.trainDeck=[];state.trainDiscard=[];state.faceUp=[];state.destinationDeck=[]
    state.players.forEach(p=>{p.hand=[];p.destinationTicketIds=[]})
    others[0].hand=cards.slice(0,55);others[1].hand=cards.slice(55)
    player.destinationTicketIds=myTickets
    others[0].destinationTicketIds=tickets.slice(0,14);others[1].destinationTicketIds=tickets.slice(14)
    player.trainsRemaining=45
    for (const edge of [...ROUTES].sort((a,b)=>a.length-b.length)) {
      if (edge.length<=player.trainsRemaining && !routeRestriction(state,player.playerId,edge)) {state.ownedRoutes[edge.id]=player.playerId;player.trainsRemaining-=edge.length;player.routeScore+=ROUTE_POINTS[edge.length]}
      if (player.trainsRemaining===0) break
    }
    expect(player.trainsRemaining).toBe(0)
    state.phase='FINAL_ROUND';state.finalRound={triggerPlayerId:player.playerId,turnsOwedPlayerIds:[player.playerId]}
    const view=projectState(state,player.playerId)
    expect(view.private.canDrawBlind).toBe(false);expect(view.private.canDrawDestinations).toBe(false);expect(view.private.canDrawMarket).toEqual([]);expect(view.private.legalPayments).toEqual({})
    expect(()=>act(state,{type:'DRAW_TRAIN_CARD',source:'blind'})).toThrow(/empty/)
    expect(()=>act(state,{type:'DRAW_DESTINATION_TICKETS'})).toThrow(/No destination/)
    conservation(state)
  })
  it('strictly rejects forged payloads, unexpected keys, malformed counts and indexes', () => {
    const envelope = (action: unknown) => ({ type: 'ACTION', actionId: '12345678', expectedVersion: 1, action })
    for (const action of [{ type: 'END_TURN' }, { type: 'DRAW_TRAIN_CARD', source: 5 }, { type: 'CLAIM_ROUTE', routeId: 'x', payment: { purple: 2 } }, { type: 'CLAIM_ROUTE', routeId: 'x', payment: { red: -1 } }, { type: 'START_GAME', playerId: 'p0' }]) expect(clientMessageSchema.safeParse(envelope(action)).success).toBe(false)
  })
  it('shuffles reproducibly without mutating inputs', () => { const input = [1, 2, 3, 4]; expect(shuffled(input, seeded())).toEqual(shuffled(input, seeded())); expect(input).toEqual([1, 2, 3, 4]) })
})
