// Test driver only. No bots or automated players are shipped in the application.
import { ROUTES, ROUTE_BY_ID } from '../../shared/trains/board-data'
import { routeRestriction } from '../../shared/trains/rules'
import { CARD_COLORS } from '../../shared/trains/types'
import type { GameAction, Snapshot, TrainCardColor } from '../../shared/trains/types'

export function nextTestAction(view: Snapshot): GameAction {
  const pub = view.public, priv = view.private, me = pub.players.find(player => player.playerId === priv.playerId)!
  if (priv.ticketOffer.length) return { type: pub.phase === 'INITIAL_TICKETS' ? 'KEEP_INITIAL_TICKETS' : 'KEEP_DESTINATION_TICKETS', ticketIds: priv.ticketOffer.map(ticket => ticket.id) }
  const payable = Object.keys(priv.legalPayments).map(id => ROUTE_BY_ID[id]).sort((a,b) => b.length-a.length)
  const available = ROUTES.filter(route => !routeRestriction(pub, me.playerId, route) && route.length <= me.trainsRemaining)
  const maximum = Math.max(...available.map(route => route.length), 0)
  if (pub.turn.action === 'AWAITING_ACTION' && payable.length && (payable[0].length >= Math.min(3,maximum) || me.trainsRemaining <= 7 || !priv.canDrawBlind && !priv.canDrawMarket.some(Boolean))) return { type: 'CLAIM_ROUTE', routeId: payable[0].id, payment: priv.legalPayments[payable[0].id][0] }
  const wilds = priv.hand.filter(card => card === 'locomotive').length
  const plans = available.filter(route => route.length >= Math.min(3,maximum)).flatMap(route => (route.color === 'gray' ? CARD_COLORS : [route.color]).map(color => ({ color: color as TrainCardColor, need: route.length-priv.hand.filter(card => card === color).length-wilds, length: route.length }))).sort((a,b) => (Math.max(0,a.need)*3-a.length)-(Math.max(0,b.need)*3-b.length))
  const desired = plans[0]?.color
  let market = pub.faceUp.findIndex((card,i) => priv.canDrawMarket[i] && card === desired)
  if (market < 0 && pub.turn.drawsTaken === 0) market = pub.faceUp.findIndex((card,i) => priv.canDrawMarket[i] && card === 'locomotive')
  if (market >= 0) return { type: 'DRAW_TRAIN_CARD', source: market }
  if (priv.canDrawBlind) return { type: 'DRAW_TRAIN_CARD', source: 'blind' }
  market = priv.canDrawMarket.findIndex(Boolean)
  if (market >= 0) return { type: 'DRAW_TRAIN_CARD', source: market }
  if (priv.canDrawDestinations) return { type: 'DRAW_DESTINATION_TICKETS' }
  if (payable.length) return { type: 'CLAIM_ROUTE', routeId: payable[0].id, payment: priv.legalPayments[payable[0].id][0] }
  throw new Error('Test policy has no legal action')
}
