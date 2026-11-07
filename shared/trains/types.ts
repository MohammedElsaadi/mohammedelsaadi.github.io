export const CARD_COLORS = ['pink', 'white', 'blue', 'yellow', 'orange', 'black', 'red', 'green'] as const
export const CARD_KINDS = [...CARD_COLORS, 'locomotive'] as const
export const PIECE_COLORS = ['blue', 'red', 'green', 'yellow', 'black'] as const
export type TrainCardColor = typeof CARD_COLORS[number]
export type CardKind = typeof CARD_KINDS[number]
export type PieceColor = typeof PIECE_COLORS[number]
export type Phase = 'LOBBY' | 'INITIAL_TICKETS' | 'PLAYING' | 'FINAL_ROUND' | 'COMPLETED'
export interface City { id: string; name: string; x: number; y: number }
export interface Route { id: string; cityA: string; cityB: string; length: number; color: TrainCardColor | 'gray'; parallelGroupId: string | null; variant: number }
export interface Ticket { id: string; cityA: string; cityB: string; points: number }
export type Payment = Partial<Record<CardKind, number>>
export type GameAction =
  | { type: 'SELECT_COLOR'; color: PieceColor }
  | { type: 'LEAVE_LOBBY' }
  | { type: 'REMOVE_LOBBY_PLAYER'; playerId: string }
  | { type: 'START_GAME' }
  | { type: 'KEEP_INITIAL_TICKETS'; ticketIds: string[] }
  | { type: 'DRAW_TRAIN_CARD'; source: 'blind' | number }
  | { type: 'CLAIM_ROUTE'; routeId: string; payment: Payment }
  | { type: 'DRAW_DESTINATION_TICKETS' }
  | { type: 'KEEP_DESTINATION_TICKETS'; ticketIds: string[] }
export interface Player {
  playerId: string; nickname: string; nicknameKey: string; seat: number; pieceColor: PieceColor; isHost: boolean
  hand: CardKind[]; destinationTicketIds: string[]; trainsRemaining: number; routeScore: number
}
export interface GameEvent { id: number; at: number; text: string }
export interface TicketResult extends Ticket { completed: boolean; score: number }
export interface PlayerResult {
  playerId: string; routePoints: number; tickets: TicketResult[]; completedTickets: number
  longestPath: number; longestBonus: number; total: number; winner: boolean
}
export interface GameState {
  schemaVersion: 1; code: string; stateVersion: number; createdAt: number; lastMeaningfulActivityAt: number
  phase: Phase; players: Player[]; currentPlayerId: string | null
  pendingTicketOfferByPlayer: Record<string, string[]>; initialTicketChoices: Record<string, boolean>
  trainDeck: CardKind[]; trainDiscard: CardKind[]; faceUp: CardKind[]; destinationDeck: string[]
  ownedRoutes: Record<string, string>
  turn: { action: 'AWAITING_ACTION' | 'DRAWING_CARDS' | 'SELECTING_TICKETS'; drawsTaken: number }
  finalRound: { triggerPlayerId: string; turnsOwedPlayerIds: string[] } | null
  publicEvents: GameEvent[]; nextEventId: number; results: PlayerResult[] | null
}
export interface PublicPlayer {
  playerId: string; nickname: string; seat: number; pieceColor: PieceColor; isHost: boolean
  trainsRemaining: number; routeScore: number; handCount: number; ticketCount: number; initialTicketsChosen: boolean; online: boolean
}
export interface PublicView {
  code: string; phase: Phase; players: PublicPlayer[]; currentPlayerId: string | null; faceUp: CardKind[]
  trainDeckCount: number; trainDiscardCount: number; destinationDeckCount: number; ownedRoutes: Record<string, string>
  turn: GameState['turn']; finalRound: GameState['finalRound']; events: GameEvent[]; results: PlayerResult[] | null
}
export interface PrivateView {
  playerId: string; hand: CardKind[]; tickets: TicketResult[]; ticketOffer: Ticket[]
  legalPayments: Record<string, Payment[]>; canDrawBlind: boolean; canDrawDestinations: boolean; canDrawMarket: boolean[]
}
export type ClientMessage = { type: 'JOIN'; nickname: string } | { type: 'RESYNC' } | { type: 'ACTION'; actionId: string; expectedVersion: number; action: GameAction }
export type Snapshot = { stateVersion: number; public: PublicView; private: PrivateView }
export type ServerMessage =
  | ({ type: 'JOINED' | 'SNAPSHOT' } & Snapshot)
  | { type: 'ACK'; actionId: string; stateVersion: number }
  | { type: 'ERROR'; actionId?: string; code: string; message: string; stateVersion?: number }
  | { type: 'SEAT_TAKEN_OVER'; message: string }
  | { type: 'REMOVED'; message: string }
