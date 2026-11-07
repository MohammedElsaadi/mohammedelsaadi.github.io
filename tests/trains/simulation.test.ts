import { describe, expect, it } from 'vitest'
import { CITIES, ROUTES } from '../../shared/trains/board-data'
import { applyAction, createRoom, joinRoom, projectState } from '../../shared/trains/rules'
import { longestTrail } from '../../shared/trains/scoring'
import { cityPosition, trackSlots } from '../../src/features/trains/board3d/geometry'
import { nextTestAction } from './policy'

const random = (seed = 1234) => () => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed / 2**32 }
describe('complete deterministic games and board geometry', () => {
  it.each([2,3,5])('plays a complete %i-player game from lobby to correctly conserved final scores', count => {
    let state = createRoom('ABC234', 1); const rng = random(count)
    for (let i = 0; i < count; i++) state = joinRoom(state, `Conductor ${i}`, `p${i}`, 1).state
    state = applyAction(state,'p0',{ type:'START_GAME' },rng,2)
    for (const player of state.players) state = applyAction(state, player.playerId, nextTestAction(projectState(state,player.playerId)),rng,3)
    let actions = 0
    while (state.phase !== 'COMPLETED' && actions < 1000) {
      const playerId = state.currentPlayerId!, before = state.stateVersion
      state = applyAction(state, playerId, nextTestAction(projectState(state,playerId)),rng,++actions+10)
      expect(state.stateVersion).toBe(before+1)
      expect(state.trainDeck.length+state.trainDiscard.length+state.faceUp.length+state.players.reduce((sum,p) => sum+p.hand.length,0)).toBe(110)
      for (const player of state.players) expect(player.trainsRemaining + ROUTES.filter(route => state.ownedRoutes[route.id] === player.playerId).reduce((sum,route) => sum+route.length,0)).toBe(45)
    }
    expect(state.phase, `${actions} actions`).toBe('COMPLETED'); expect(state.results).toHaveLength(count)
    expect(state.results?.some(result => result.winner)).toBe(true)
    for (const result of state.results!) expect(result.total).toBe(result.routePoints+result.longestBonus+result.tickets.reduce((sum,ticket) => sum+ticket.score,0))
  })
  it('gives every route its exact train slots, distinct parallel lanes, finite positions and valid anchors', () => {
    for (const route of ROUTES) {
      const slots = trackSlots(route); expect(slots).toHaveLength(route.length)
      expect(slots.every(slot => Object.values(slot).every(Number.isFinite))).toBe(true)
      if (route.parallelGroupId && route.variant === 0) { const other = ROUTES.find(r => r.parallelGroupId === route.parallelGroupId && r.id !== route.id)!; expect(trackSlots(other)).not.toEqual(slots) }
    }
    for (const city of CITIES) expect(cityPosition(city.id).every(Number.isFinite)).toBe(true)
  })
  it('benchmarks dense 45-piece networks and compares with independent exhaustive search on small graphs', () => {
    const rng = random(8), started = performance.now()
    for (let sample = 0; sample < 25; sample++) {
      const selected = [...ROUTES].sort(() => rng()-.5), network: typeof ROUTES = []; let budget = 45
      for (const route of selected) if (route.length <= budget) { network.push(route); budget-=route.length }
      expect(longestTrail(network)).toBeLessThanOrEqual(45)
    }
    expect(performance.now()-started).toBeLessThan(5000)
    function brute(edges: { cityA:string; cityB:string; length:number }[], vertex:string, used:Set<number>):number {
      let best = 0
      for (const [i,edge] of edges.entries()) if (!used.has(i) && [edge.cityA,edge.cityB].includes(vertex)) best=Math.max(best,edge.length+brute(edges,edge.cityA===vertex?edge.cityB:edge.cityA,new Set([...used,i])))
      return best
    }
    for (let sample=0;sample<30;sample++) {
      const edges = Array.from({length:8},() => { const a=Math.floor(rng()*5), b=(a+1+Math.floor(rng()*4))%5; return { cityA:String(a),cityB:String(b),length:1+Math.floor(rng()*6) } })
      expect(longestTrail(edges)).toBe(Math.max(...['0','1','2','3','4'].map(v => brute(edges,v,new Set()))))
    }
  })
})
