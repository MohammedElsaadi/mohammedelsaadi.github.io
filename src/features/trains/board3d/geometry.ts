import { CITY_BY_ID } from '../../../../shared/trains/board-data'
import type { Route } from '../../../../shared/trains/types'
export const cityPosition = (id: string): [number, number] => [(CITY_BY_ID[id].x - 0.5) * 20, (0.5 - CITY_BY_ID[id].y) * 12]
const LABEL_OFFSETS: Record<string, [number, number]> = { 'new-york': [-45,-26], boston: [38,-25], montreal: [-20,-28], toronto: [-35,-28], pittsburgh: [-20,38], 'saint-louis': [0,36], nashville: [25,38], raleigh: [40,-28], charleston: [45,35], atlanta: [-25,38], dallas: [-25,-28], houston: [0,38], seattle: [45,0], vancouver: [25,-28], portland: [-20,38], 'kansas-city': [15,38], omaha: [-10,-28], 'oklahoma-city': [-35,38], 'little-rock': [10,38], 'new-orleans': [30,38] }
export function cityLabelPosition(id: string): [number, number, number] {
  const [x,z] = cityPosition(id), [ox,oy] = LABEL_OFFSETS[id] ?? [0,-28]
  return [x+ox*22/2400,.45,z+oy*14/1500]
}
export function trackSlots(route: Route) {
  const [ax, az] = cityPosition(route.cityA), [bx, bz] = cityPosition(route.cityB)
  const dx = bx - ax, dz = bz - az, distance = Math.hypot(dx, dz)
  const lane = route.parallelGroupId ? (route.variant === 0 ? -0.14 : 0.14) : 0
  const bend = route.length >= 4 ? 0.2 : 0.06
  return Array.from({ length: route.length }, (_, i) => {
    const t = (i + 0.5) / route.length, offset = lane + Math.sin(t * Math.PI) * bend
    const tangentOffset = Math.cos(t * Math.PI) * Math.PI * bend
    return { x: ax + dx * t - dz / distance * offset, z: az + dz * t + dx / distance * offset,
      angle: -Math.atan2(dz + dx / distance * tangentOffset, dx - dz / distance * tangentOffset), length: Math.min(1.3, distance / route.length * 0.78) }
  })
}
