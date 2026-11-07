import { ROUTES, TICKET_BY_ID } from './board-data'
import type { GameState, PlayerResult, Route, Ticket, TicketResult } from './types'

export const ROUTE_POINTS = [0, 1, 2, 4, 7, 10, 15] as const
export function compareStandings(a: Pick<PlayerResult, 'total' | 'completedTickets' | 'longestBonus'>, b: Pick<PlayerResult, 'total' | 'completedTickets' | 'longestBonus'>) {
  return b.total - a.total || b.completedTickets - a.completedTickets || b.longestBonus - a.longestBonus
}

export function connected(routes: Pick<Route, 'cityA' | 'cityB'>[], from: string, to: string): boolean {
  const seen = new Set([from])
  const queue = [from]
  for (let i = 0; i < queue.length; i++) {
    if (queue[i] === to) return true
    for (const route of routes) {
      const next = route.cityA === queue[i] ? route.cityB : route.cityB === queue[i] ? route.cityA : null
      if (next && !seen.has(next)) { seen.add(next); queue.push(next) }
    }
  }
  return false
}

/** Exact weighted edge-simple trail: cities can repeat, individual tracks cannot. */
export function longestTrail(routes: Pick<Route, 'cityA' | 'cityB' | 'length'>[]): number {
  const vertices = [...new Set(routes.flatMap(route => [route.cityA, route.cityB]))]
  const edges = routes.map((route, i) => ({ a: route.cityA, b: route.cityB, weight: route.length, bit: 1n << BigInt(i) }))
  const adjacency = new Map(vertices.map(vertex => [vertex, edges.filter(edge => edge.a === vertex || edge.b === vertex)]))
  const visited = new Map<string, Set<bigint>>()
  let best = 0
  function search(vertex: string, used: bigint, length: number) {
    best = Math.max(best, length)
    const memo = visited.get(vertex) ?? new Set<bigint>()
    if (memo.has(used)) return
    memo.add(used); visited.set(vertex, memo)
    // Only unused edges reachable from here can contribute. Eulerian remainders
    // can be collected in full; all other remainders provide a safe upper bound.
    const reachable = new Set([vertex]), remaining = new Set<typeof edges[number]>()
    const queue = [vertex]
    for (let i = 0; i < queue.length; i++) {
      for (const edge of adjacency.get(queue[i]) ?? []) {
        if ((used & edge.bit) !== 0n) continue
        remaining.add(edge)
        const next = edge.a === queue[i] ? edge.b : edge.a
        if (!reachable.has(next)) { reachable.add(next); queue.push(next) }
      }
    }
    const upper = length + [...remaining].reduce((sum, edge) => sum + edge.weight, 0)
    if (upper <= best) return
    const odd = [...reachable].filter(v => [...remaining].filter(e => e.a === v || e.b === v).length % 2)
    if (odd.length === 0 || (odd.length === 2 && odd.includes(vertex))) { best = upper; return }
    for (const edge of adjacency.get(vertex) ?? []) {
      if ((used & edge.bit) === 0n) search(edge.a === vertex ? edge.b : edge.a, used | edge.bit, length + edge.weight)
    }
  }
  for (const vertex of vertices) search(vertex, 0n, 0)
  return best
}

export function ticketResults(state: GameState, playerId: string): TicketResult[] {
  const routes = ROUTES.filter(route => state.ownedRoutes[route.id] === playerId)
  return (state.players.find(player => player.playerId === playerId)?.destinationTicketIds ?? []).map(id => {
    const ticket: Ticket = TICKET_BY_ID[id]
    const completed = connected(routes, ticket.cityA, ticket.cityB)
    return { ...ticket, completed, score: completed ? ticket.points : -ticket.points }
  })
}

export function scoreGame(state: GameState): PlayerResult[] {
  const results = state.players.map(player => {
    const owned = ROUTES.filter(route => state.ownedRoutes[route.id] === player.playerId)
    const tickets = ticketResults(state, player.playerId)
    return {
      playerId: player.playerId, routePoints: owned.reduce((sum, route) => sum + ROUTE_POINTS[route.length], 0),
      tickets, completedTickets: tickets.filter(ticket => ticket.completed).length,
      longestPath: longestTrail(owned), longestBonus: 0, total: 0, winner: false,
    }
  })
  const longest = Math.max(...results.map(result => result.longestPath))
  for (const result of results) {
    result.longestBonus = result.longestPath === longest ? 10 : 0
    result.total = result.routePoints + result.tickets.reduce((sum, ticket) => sum + ticket.score, 0) + result.longestBonus
  }
  const top = [...results].sort(compareStandings)[0]
  for (const result of results) result.winner = compareStandings(result, top) === 0
  return results
}
