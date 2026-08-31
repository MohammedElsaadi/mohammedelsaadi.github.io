import type { AxisAlignedRotation, DimensionsMm, PackingItem } from './types'

export interface OrientedDimensions {
  rotation: AxisAlignedRotation
  dimensions: DimensionsMm
}

export function getAxisAlignedRotations(item: PackingItem): OrientedDimensions[] {
  const { widthMm: w, heightMm: h, depthMm: d } = item
  const candidates: OrientedDimensions[] = [
    { rotation: 'WHD', dimensions: { width: w, height: h, depth: d } },
    { rotation: 'WDH', dimensions: { width: w, height: d, depth: h } },
    { rotation: 'HWD', dimensions: { width: h, height: w, depth: d } },
    { rotation: 'HDW', dimensions: { width: h, height: d, depth: w } },
    { rotation: 'DWH', dimensions: { width: d, height: w, depth: h } },
    { rotation: 'DHW', dimensions: { width: d, height: h, depth: w } },
  ]

  const seen = new Set<string>()
  return candidates.filter(({ dimensions }) => {
    const key = `${dimensions.width}:${dimensions.height}:${dimensions.depth}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getOverflowOrientation(item: PackingItem): OrientedDimensions {
  return [...getAxisAlignedRotations(item)].sort((a, b) => {
    const height = a.dimensions.height - b.dimensions.height
    if (height !== 0) return height
    const footprintA = a.dimensions.width * a.dimensions.depth
    const footprintB = b.dimensions.width * b.dimensions.depth
    if (footprintA !== footprintB) return footprintB - footprintA
    return a.rotation.localeCompare(b.rotation)
  })[0]
}
