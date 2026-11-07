import { ROUTES, ROUTE_BY_ID, TICKETS, TICKET_BY_ID } from './board-data'
import { ROUTE_POINTS, scoreGame, ticketResults } from './scoring'
import { CARD_COLORS, CARD_KINDS, PIECE_COLORS } from './types'
import type { CardKind, GameAction, GameState, Payment, Player, Route, Snapshot } from './types'

export type Random = () => number
export class RuleError extends Error {
  readonly code: string
  constructor(message: string, code = 'INVALID_ACTION') { super(message); this.code = code }
}
function requireRule(condition: unknown, message: string): asserts condition { if (!condition) throw new RuleError(message) }
export function normalizeNickname(input: string) {
  const nickname = input.normalize('NFKC').trim().replace(/\s+/gu, ' ')
  const length = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(nickname)].length
  requireRule(length >= 1 && length <= 20 && /^[\p{L}\p{M}\p{N} _-]+$/u.test(nickname), 'Use 1–20 letters, numbers, spaces, hyphens or underscores for your nickname.')
  return { nickname, nicknameKey: nickname.toLocaleLowerCase('en-US') }
}
export function shuffled<T>(values: readonly T[], random: Random): T[] {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random() * (i + 1)))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
export function makeTrainDeck(): CardKind[] { return [...CARD_COLORS.flatMap(color => Array<CardKind>(12).fill(color)), ...Array<CardKind>(14).fill('locomotive')] }
export function addEvent(state: GameState, text: string, now: number) {
  state.publicEvents.push({ id: state.nextEventId++, at: now, text })
  state.publicEvents = state.publicEvents.slice(-50)
}
export function touch(state: GameState, now: number) { state.stateVersion++; state.lastMeaningfulActivityAt = now }
export function createRoom(code: string, now: number): GameState {
  return {
    schemaVersion: 1, code, stateVersion: 0, createdAt: now, lastMeaningfulActivityAt: now, phase: 'LOBBY', players: [], currentPlayerId: null,
    pendingTicketOfferByPlayer: {}, initialTicketChoices: {}, trainDeck: [], trainDiscard: [], faceUp: [], destinationDeck: [], ownedRoutes: {},
    turn: { action: 'AWAITING_ACTION', drawsTaken: 0 }, finalRound: null, publicEvents: [], nextEventId: 1, results: null,
  }
}
export function joinRoom(input: GameState, name: string, playerId: string, now: number) {
  const state = structuredClone(input)
  const normalized = normalizeNickname(name)
  const existing = state.players.find(player => player.nicknameKey === normalized.nicknameKey)
  if (existing) return { state, playerId: existing.playerId, existing: true }
  requireRule(state.phase === 'LOBBY', 'Game already started; only existing players may rejoin.')
  requireRule(state.players.length < 5, 'This room is full (five players).')
  const color = PIECE_COLORS.find(color => !state.players.some(player => player.pieceColor === color))!
  state.players.push({ ...normalized, playerId, seat: state.players.length, pieceColor: color, isHost: state.players.length === 0, hand: [], destinationTicketIds: [], trainsRemaining: 45, routeScore: 0 })
  addEvent(state, `${normalized.nickname} joined the table.`, now); touch(state, now)
  return { state, playerId, existing: false }
}
function takeTrain(state: GameState, random: Random): CardKind | undefined {
  if (!state.trainDeck.length && state.trainDiscard.length) { state.trainDeck = shuffled(state.trainDiscard, random); state.trainDiscard = [] }
  return state.trainDeck.shift()
}
/** Deterministic exhaustion policy: retain an unavoidable wild-heavy market. */
export function refreshMarket(state: GameState, random: Random, now: number) {
  while (state.faceUp.length < 5) {
    const next = takeTrain(state, random)
    if (!next) break
    state.faceUp.push(next)
  }
  let attempts = 0
  while (state.faceUp.length === 5 && state.faceUp.filter(card => card === 'locomotive').length >= 3) {
    const stock = [...state.faceUp, ...state.trainDeck, ...state.trainDiscard]
    if (stock.filter(card => card !== 'locomotive').length < 3) break
    state.trainDiscard.push(...state.faceUp); state.faceUp = []
    if (++attempts > 12) {
      // A bounded fallback prevents repeated unlucky shuffles from stalling a DO.
      state.trainDeck = shuffled([...state.trainDeck, ...state.trainDiscard], random); state.trainDiscard = []
      for (let i = 0; i < 3; i++) {
        const index = state.trainDeck.findIndex(card => card !== 'locomotive')
        state.faceUp.push(state.trainDeck.splice(index, 1)[0])
      }
    }
    while (state.faceUp.length < 5) { const next = takeTrain(state, random); if (!next) break; state.faceUp.push(next) }
  }
  if (attempts) addEvent(state, 'Three locomotives: the face-up market was refreshed.', now)
}
export function routeRestriction(state: { players: { playerId: string }[]; ownedRoutes: Record<string, string> }, playerId: string, route: Route): string | null {
  if (state.ownedRoutes[route.id]) return 'This track has already been claimed.'
  if (route.parallelGroupId) {
    const sibling = ROUTES.find(other => other.id !== route.id && other.parallelGroupId === route.parallelGroupId)
    const owner = sibling && state.ownedRoutes[sibling.id]
    if (owner === playerId) return 'You cannot own both tracks of a double route.'
    if (owner && state.players.length <= 3) return 'The second track is closed in a two- or three-player game.'
  }
  return null
}
export function paymentOptions(hand: CardKind[], route: Route): Payment[] {
  const counts = Object.fromEntries(CARD_KINDS.map(kind => [kind, hand.filter(card => card === kind).length])) as Record<CardKind, number>
  const colors = route.color === 'gray' ? CARD_COLORS : [route.color]
  const options: Payment[] = []
  for (let wilds = 0; wilds <= Math.min(route.length, counts.locomotive); wilds++) {
    const regular = route.length - wilds
    if (regular === 0) { options.push({ locomotive: wilds }); continue }
    for (const color of colors) if (counts[color] >= regular) options.push({ [color]: regular, ...(wilds ? { locomotive: wilds } : {}) })
  }
  return options
}
function finishTurn(state: GameState, player: Player, now: number) {
  state.turn = { action: 'AWAITING_ACTION', drawsTaken: 0 }
  if (state.finalRound) {
    state.finalRound.turnsOwedPlayerIds = state.finalRound.turnsOwedPlayerIds.filter(id => id !== player.playerId)
    if (!state.finalRound.turnsOwedPlayerIds.length) {
      state.phase = 'COMPLETED'; state.currentPlayerId = null; state.results = scoreGame(state)
      addEvent(state, 'The final train has arrived. Final results are ready.', now); return
    }
  } else if (player.trainsRemaining <= 2) {
    state.phase = 'FINAL_ROUND'
    state.finalRound = { triggerPlayerId: player.playerId, turnsOwedPlayerIds: state.players.map(player => player.playerId) }
    addEvent(state, `${player.nickname} has ${player.trainsRemaining} trains left. Everyone gets one more turn, including ${player.nickname}.`, now)
  }
  const index = state.players.findIndex(candidate => candidate.playerId === player.playerId)
  state.currentPlayerId = state.players[(index + 1) % state.players.length].playerId
}
function keepTickets(state: GameState, player: Player, ids: string[], minimum: number) {
  const offer = state.pendingTicketOfferByPlayer[player.playerId]
  requireRule(offer && ids.length >= minimum && new Set(ids).size === ids.length && ids.every(id => offer.includes(id)), `Keep at least ${minimum} of the offered tickets.`)
  player.destinationTicketIds.push(...offer.filter(id => ids.includes(id)))
  state.destinationDeck.push(...offer.filter(id => !ids.includes(id)))
  delete state.pendingTicketOfferByPlayer[player.playerId]
}
export function applyAction(input: GameState, playerId: string, action: GameAction, random: Random, now: number): GameState {
  const state = structuredClone(input)
  const player = state.players.find(player => player.playerId === playerId)
  requireRule(player, 'This seat is no longer in the room.')
  if (action.type === 'SELECT_COLOR' || action.type === 'LEAVE_LOBBY' || action.type === 'REMOVE_LOBBY_PLAYER' || action.type === 'START_GAME') {
    requireRule(state.phase === 'LOBBY', 'Lobby changes are closed after the game starts.')
    switch (action.type) {
      case 'SELECT_COLOR':
        requireRule(PIECE_COLORS.includes(action.color) && !state.players.some(other => other.playerId !== playerId && other.pieceColor === action.color), 'That piece color is already in use.')
        player.pieceColor = action.color; addEvent(state, `${player.nickname} chose ${action.color} pieces.`, now); break
      case 'LEAVE_LOBBY':
      case 'REMOVE_LOBBY_PLAYER': {
        const removedId = action.type === 'LEAVE_LOBBY' ? playerId : action.playerId
        if (action.type === 'REMOVE_LOBBY_PLAYER') requireRule(player.isHost && removedId !== playerId, 'Only the host can remove another lobby player.')
        const removed = state.players.find(candidate => candidate.playerId === removedId)
        requireRule(removed, 'Player not found.')
        state.players = state.players.filter(candidate => candidate.playerId !== removedId)
        state.players.forEach((candidate, seat) => { candidate.seat = seat; if (removed.isHost) candidate.isHost = seat === 0 })
        addEvent(state, `${removed.nickname} left the lobby.`, now); break
      }
      case 'START_GAME': {
        requireRule(player.isHost, 'Only the host can start.')
        requireRule(state.players.length >= 2 && state.players.length <= 5 && new Set(state.players.map(p => p.pieceColor)).size === state.players.length, 'Start with two to five players with unique colors.')
        state.trainDeck = shuffled(makeTrainDeck(), random)
        state.destinationDeck = shuffled(TICKETS.map(ticket => ticket.id), random)
        for (const seat of state.players) {
          seat.hand = state.trainDeck.splice(0, 4)
          state.pendingTicketOfferByPlayer[seat.playerId] = state.destinationDeck.splice(0, 3)
        }
        refreshMarket(state, random, now)
        state.currentPlayerId = state.players[Math.min(state.players.length - 1, Math.floor(random() * state.players.length))].playerId
        state.phase = 'INITIAL_TICKETS'; addEvent(state, 'The journey begins. Each player must keep at least two initial tickets.', now); break
      }
    }
  } else if (action.type === 'KEEP_INITIAL_TICKETS') {
    requireRule(state.phase === 'INITIAL_TICKETS' && !state.initialTicketChoices[playerId], 'Initial tickets have already been selected.')
    keepTickets(state, player, action.ticketIds, 2); state.initialTicketChoices[playerId] = true
    addEvent(state, `${player.nickname} selected initial tickets.`, now)
    if (state.players.every(candidate => state.initialTicketChoices[candidate.playerId])) {
      state.phase = 'PLAYING'; addEvent(state, `${state.players.find(candidate => candidate.playerId === state.currentPlayerId)!.nickname} takes the first turn.`, now)
    }
  } else {
    requireRule(state.phase === 'PLAYING' || state.phase === 'FINAL_ROUND', 'The game is not accepting turns.')
    requireRule(state.currentPlayerId === playerId, 'Wait for your turn.')
    if (action.type !== 'DRAW_TRAIN_CARD' && action.type !== 'KEEP_DESTINATION_TICKETS') requireRule(state.turn.action === 'AWAITING_ACTION', 'Finish your current action first.')
    switch (action.type) {
      case 'DRAW_TRAIN_CARD': {
        requireRule(state.turn.action === 'AWAITING_ACTION' || state.turn.action === 'DRAWING_CARDS', 'Finish selecting destination tickets first.')
        let card: CardKind | undefined
        const fromMarket = action.source !== 'blind'
        if (fromMarket) {
          const index = action.source as number
          requireRule(Number.isInteger(index) && index >= 0 && index < state.faceUp.length, 'Choose an available market card.')
          requireRule(!(state.turn.drawsTaken === 1 && state.faceUp[index] === 'locomotive'), 'A face-up locomotive cannot be your second draw.')
          card = state.faceUp[index]
          const replacement = takeTrain(state, random)
          if (replacement) state.faceUp[index] = replacement
          else state.faceUp.splice(index, 1)
        } else card = takeTrain(state, random)
        requireRule(card, 'The draw deck and discard pile are empty.')
        player.hand.push(card); state.turn.action = 'DRAWING_CARDS'; state.turn.drawsTaken++
        addEvent(state, fromMarket ? `${player.nickname} took a face-up ${card} card.` : `${player.nickname} drew a blind train card.`, now)
        refreshMarket(state, random, now)
        if ((fromMarket && card === 'locomotive') || state.turn.drawsTaken === 2 || (!state.trainDeck.length && !state.trainDiscard.length && !state.faceUp.some(card => card !== 'locomotive'))) finishTurn(state, player, now)
        break
      }
      case 'CLAIM_ROUTE': {
        const route = ROUTE_BY_ID[action.routeId]
        requireRule(route, 'Unknown route.')
        requireRule(!routeRestriction(state, playerId, route), routeRestriction(state, playerId, route) ?? '')
        requireRule(player.trainsRemaining >= route.length, 'You do not have enough train pieces.')
        const entries = Object.entries(action.payment)
        requireRule(entries.every(([kind, count]) => CARD_KINDS.includes(kind as CardKind) && Number.isInteger(count) && count >= 0), 'Invalid payment counts.')
        const options = paymentOptions(player.hand, route)
        requireRule(options.some(option => CARD_KINDS.every(kind => (option[kind] ?? 0) === (action.payment[kind] ?? 0))), 'Pay the exact route length with its matching color (one regular color for gray routes) and optional locomotives.')
        for (const [kind, count] of entries) for (let i = 0; i < count; i++) { player.hand.splice(player.hand.indexOf(kind as CardKind), 1); state.trainDiscard.push(kind as CardKind) }
        state.ownedRoutes[route.id] = playerId; player.trainsRemaining -= route.length; player.routeScore += ROUTE_POINTS[route.length]
        addEvent(state, `${player.nickname} claimed ${route.cityA.replaceAll('-', ' ')} – ${route.cityB.replaceAll('-', ' ')} (${route.length} trains, +${ROUTE_POINTS[route.length]} points).`, now)
        refreshMarket(state, random, now); finishTurn(state, player, now); break
      }
      case 'DRAW_DESTINATION_TICKETS':
        requireRule(state.destinationDeck.length > 0, 'No destination tickets remain.')
        state.pendingTicketOfferByPlayer[playerId] = state.destinationDeck.splice(0, 3)
        state.turn.action = 'SELECTING_TICKETS'; addEvent(state, `${player.nickname} is choosing destination tickets.`, now); break
      case 'KEEP_DESTINATION_TICKETS':
        requireRule(state.turn.action === 'SELECTING_TICKETS', 'There is no destination offer to confirm.')
        keepTickets(state, player, action.ticketIds, 1); addEvent(state, `${player.nickname} kept destination tickets.`, now); finishTurn(state, player, now); break
    }
  }
  touch(state, now)
  return state
}
export function projectState(state: GameState, playerId: string, online: Set<string> = new Set()): Snapshot {
  const player = state.players.find(player => player.playerId === playerId)
  requireRule(player, 'Seat not found.')
  const active = state.currentPlayerId === playerId && (state.phase === 'PLAYING' || state.phase === 'FINAL_ROUND')
  const draw = active && state.turn.action !== 'SELECTING_TICKETS'
  const legalPayments: Record<string, Payment[]> = {}
  for (const route of ROUTES) if (!routeRestriction(state, playerId, route) && player.trainsRemaining >= route.length) {
    const options = paymentOptions(player.hand, route)
    if (options.length) legalPayments[route.id] = options
  }
  return {
    stateVersion: state.stateVersion,
    public: {
      code: state.code, phase: state.phase, players: state.players.map(seat => ({
        playerId: seat.playerId, nickname: seat.nickname, seat: seat.seat, pieceColor: seat.pieceColor, isHost: seat.isHost,
        trainsRemaining: seat.trainsRemaining, routeScore: seat.routeScore, handCount: seat.hand.length, ticketCount: seat.destinationTicketIds.length,
        initialTicketsChosen: !!state.initialTicketChoices[seat.playerId], online: online.has(seat.playerId),
      })), currentPlayerId: state.currentPlayerId, faceUp: [...state.faceUp], trainDeckCount: state.trainDeck.length,
      trainDiscardCount: state.trainDiscard.length, destinationDeckCount: state.destinationDeck.length,
      ownedRoutes: { ...state.ownedRoutes }, turn: { ...state.turn }, finalRound: state.finalRound ? structuredClone(state.finalRound) : null,
      events: [...state.publicEvents], results: state.results ? structuredClone(state.results) : null,
    },
    private: {
      playerId, hand: [...player.hand], tickets: ticketResults(state, playerId), ticketOffer: (state.pendingTicketOfferByPlayer[playerId] ?? []).map(id => ({ ...TICKET_BY_ID[id] })), legalPayments,
      canDrawBlind: draw && (state.trainDeck.length + state.trainDiscard.length > 0),
      canDrawMarket: state.faceUp.map(card => draw && !(state.turn.drawsTaken === 1 && card === 'locomotive')),
      canDrawDestinations: active && state.turn.action === 'AWAITING_ACTION' && state.destinationDeck.length > 0,
    },
  }
}
export function expiresAt(state: GameState, retention = { empty: 1, lobby: 30, active: 90, completed: 30 }) {
  const days = state.phase === 'LOBBY' ? state.players.length ? retention.lobby : retention.empty : state.phase === 'COMPLETED' ? retention.completed : retention.active
  return state.lastMeaningfulActivityAt + days * 86_400_000
}
