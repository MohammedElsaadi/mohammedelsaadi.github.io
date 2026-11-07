import { z } from 'zod'
import { CARD_KINDS, PIECE_COLORS } from './types'

const tickets = z.array(z.string().min(1).max(100)).min(1).max(3)
export const actionSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('SELECT_COLOR'), color: z.enum(PIECE_COLORS) }),
  z.strictObject({ type: z.literal('LEAVE_LOBBY') }),
  z.strictObject({ type: z.literal('REMOVE_LOBBY_PLAYER'), playerId: z.string().min(1).max(100) }),
  z.strictObject({ type: z.literal('START_GAME') }),
  z.strictObject({ type: z.literal('KEEP_INITIAL_TICKETS'), ticketIds: tickets }),
  z.strictObject({ type: z.literal('DRAW_TRAIN_CARD'), source: z.union([z.literal('blind'), z.number().int().min(0).max(4)]) }),
  z.strictObject({ type: z.literal('CLAIM_ROUTE'), routeId: z.string().min(1).max(100), payment: z.partialRecord(z.enum(CARD_KINDS), z.number().int().min(0).max(6)) }),
  z.strictObject({ type: z.literal('DRAW_DESTINATION_TICKETS') }),
  z.strictObject({ type: z.literal('KEEP_DESTINATION_TICKETS'), ticketIds: tickets }),
])
export const clientMessageSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('JOIN'), nickname: z.string().min(1).max(100) }),
  z.strictObject({ type: z.literal('RESYNC') }),
  z.strictObject({ type: z.literal('ACTION'), actionId: z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/), expectedVersion: z.number().int().nonnegative(), action: actionSchema }),
])
export const createRoomSchema = z.strictObject({ nickname: z.string().min(1).max(100) })
export const ROOM_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/
