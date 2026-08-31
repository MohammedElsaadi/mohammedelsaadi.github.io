import { getAxisAlignedRotations, getOverflowOrientation } from './rotations'
import type {
  CrateDimensions,
  DimensionsMm,
  PackedTransform,
  PackingItem,
  PackingResult,
} from './types'

interface FreeSpace {
  x: number
  y: number
  z: number
  width: number
  height: number
  depth: number
}

interface InternalSolution {
  packed: PackedTransform[]
  maxHeight: number
}

const volume = (item: PackingItem) => item.widthMm * item.heightMm * item.depthMm
const footprint = (item: PackingItem) => {
  const dimensions = [item.widthMm, item.heightMm, item.depthMm].sort((a, b) => b - a)
  return dimensions[0] * dimensions[1]
}

function validPositive(value: number) {
  return Number.isFinite(value) && value > 0
}

function itemOrderings(items: PackingItem[]): PackingItem[][] {
  const stable = [...items].sort((a, b) => a.id.localeCompare(b.id))
  const orderings = [
    [...stable].sort((a, b) => volume(b) - volume(a) || a.id.localeCompare(b.id)),
    [...stable].sort(
      (a, b) =>
        Math.max(b.widthMm, b.heightMm, b.depthMm) - Math.max(a.widthMm, a.heightMm, a.depthMm) ||
        a.id.localeCompare(b.id),
    ),
    [...stable].sort((a, b) => footprint(b) - footprint(a) || a.id.localeCompare(b.id)),
    [...stable].sort((a, b) => b.heightMm - a.heightMm || a.id.localeCompare(b.id)),
    stable,
  ]

  const seen = new Set<string>()
  return orderings.filter((ordering) => {
    const key = ordering.map((item) => item.id).join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function fits(dimensions: DimensionsMm, space: FreeSpace) {
  return (
    dimensions.width <= space.width &&
    dimensions.height <= space.height &&
    dimensions.depth <= space.depth
  )
}

function splitSpace(space: FreeSpace, dimensions: DimensionsMm): FreeSpace[] {
  const spaces: FreeSpace[] = []
  const remainingWidth = space.width - dimensions.width
  const remainingHeight = space.height - dimensions.height
  const remainingDepth = space.depth - dimensions.depth

  if (remainingWidth > 0) {
    spaces.push({
      x: space.x + dimensions.width,
      y: space.y,
      z: space.z,
      width: remainingWidth,
      height: space.height,
      depth: space.depth,
    })
  }
  if (remainingHeight > 0) {
    spaces.push({
      x: space.x,
      y: space.y + dimensions.height,
      z: space.z,
      width: dimensions.width,
      height: remainingHeight,
      depth: space.depth,
    })
  }
  if (remainingDepth > 0) {
    spaces.push({
      x: space.x,
      y: space.y,
      z: space.z + dimensions.depth,
      width: dimensions.width,
      height: dimensions.height,
      depth: remainingDepth,
    })
  }

  return spaces
}

function packInOrder(items: PackingItem[], crate: CrateDimensions): InternalSolution | null {
  const spaces: FreeSpace[] = [
    {
      x: 0,
      y: 0,
      z: 0,
      width: crate.widthMm,
      height: crate.heightMm,
      depth: crate.depthMm,
    },
  ]
  const packed: PackedTransform[] = []

  for (const item of items) {
    const candidates = spaces.flatMap((space, spaceIndex) =>
      getAxisAlignedRotations(item)
        .filter(({ dimensions }) => fits(dimensions, space))
        .map(({ dimensions, rotation }) => ({
          dimensions,
          rotation,
          space,
          spaceIndex,
          top: space.y + dimensions.height,
          waste:
            space.width * space.height * space.depth -
            dimensions.width * dimensions.height * dimensions.depth,
        })),
    )

    candidates.sort(
      (a, b) =>
        a.top - b.top ||
        a.waste - b.waste ||
        a.space.y - b.space.y ||
        a.space.z - b.space.z ||
        a.space.x - b.space.x ||
        a.rotation.localeCompare(b.rotation),
    )
    const chosen = candidates[0]
    if (!chosen) return null

    spaces.splice(chosen.spaceIndex, 1, ...splitSpace(chosen.space, chosen.dimensions))
    packed.push({
      itemId: item.id,
      positionMm: { x: chosen.space.x, y: chosen.space.y, z: chosen.space.z },
      dimensionsMm: chosen.dimensions,
      rotation: chosen.rotation,
    })
  }

  packed.sort((a, b) => a.itemId.localeCompare(b.itemId))
  return {
    packed,
    maxHeight: packed.reduce(
      (maximum, item) => Math.max(maximum, item.positionMm.y + item.dimensionsMm.height),
      0,
    ),
  }
}

function tryPackInternal(items: PackingItem[], crate: CrateDimensions): InternalSolution | null {
  if (items.length === 0) return { packed: [], maxHeight: 0 }
  const solutions = itemOrderings(items)
    .map((ordering) => packInOrder(ordering, crate))
    .filter((solution): solution is InternalSolution => solution !== null)

  return solutions.sort((a, b) => {
    const height = a.maxHeight - b.maxHeight
    if (height !== 0) return height
    return JSON.stringify(a.packed).localeCompare(JSON.stringify(b.packed))
  })[0] ?? null
}

function combinations(items: PackingItem[], count: number): PackingItem[][] {
  if (count === 0) return [[]]
  const result: PackingItem[][] = []
  const visit = (start: number, current: PackingItem[]) => {
    if (current.length === count) {
      result.push([...current])
      return
    }
    for (let index = start; index < items.length; index += 1) {
      current.push(items[index])
      visit(index + 1, current)
      current.pop()
    }
  }
  visit(0, [])
  return result
}

export function packCrate(inputItems: PackingItem[], crate: CrateDimensions): PackingResult {
  if (
    !validPositive(crate.widthMm) ||
    !validPositive(crate.heightMm) ||
    !validPositive(crate.depthMm) ||
    !Number.isInteger(crate.overflowLimit) ||
    crate.overflowLimit < 0 ||
    !Number.isInteger(crate.heightToleranceMm) ||
    crate.heightToleranceMm < 0
  ) {
    return { success: false, packed: [], overflow: [], rejectedReason: 'INVALID_CRATE' }
  }

  if (
    inputItems.some(
      (item) =>
        !item.id ||
        !validPositive(item.widthMm) ||
        !validPositive(item.heightMm) ||
        !validPositive(item.depthMm),
    )
  ) {
    return { success: false, packed: [], overflow: [], rejectedReason: 'INVALID_ITEM' }
  }

  const items = [...inputItems].sort((a, b) => a.id.localeCompare(b.id))
  const effectiveCrate = {
    ...crate,
    heightMm: crate.heightMm + crate.heightToleranceMm,
  }
  const requiredItems = items.filter((item) => item.required || !item.canOverflow)
  if (!tryPackInternal(requiredItems, effectiveCrate)) {
    return {
      success: false,
      packed: [],
      overflow: [],
      rejectedReason: 'MANDATORY_ITEMS_DO_NOT_FIT',
    }
  }

  const eligibleOverflowItems = items.filter((item) => item.canOverflow && !item.required)
  const maximumOverflow = Math.min(crate.overflowLimit, 2, eligibleOverflowItems.length)

  for (let overflowCount = 0; overflowCount <= maximumOverflow; overflowCount += 1) {
    const feasible = combinations(eligibleOverflowItems, overflowCount).flatMap((overflowItems) => {
      const overflowIds = new Set(overflowItems.map((item) => item.id))
      const internal = tryPackInternal(
        items.filter((item) => !overflowIds.has(item.id)),
        effectiveCrate,
      )
      if (!internal) return []

      const oriented = overflowItems.map((item) => ({ item, oriented: getOverflowOrientation(item) }))
      oriented.sort((a, b) => {
        const footprintA = a.oriented.dimensions.width * a.oriented.dimensions.depth
        const footprintB = b.oriented.dimensions.width * b.oriented.dimensions.depth
        return footprintB - footprintA || a.item.id.localeCompare(b.item.id)
      })
      const overflow = oriented.map(({ item, oriented: orientation }, stackIndex) => ({
        itemId: item.id,
        dimensionsMm: orientation.dimensions,
        rotation: orientation.rotation,
        stackIndex,
      }))
      const stackHeight = overflow.reduce((sum, item) => sum + item.dimensionsMm.height, 0)

      return [{ internal, overflow, stackHeight }]
    })

    const best = feasible.sort(
      (a, b) =>
        a.stackHeight - b.stackHeight ||
        a.internal.maxHeight - b.internal.maxHeight ||
        a.overflow.map((item) => item.itemId).join('|').localeCompare(
          b.overflow.map((item) => item.itemId).join('|'),
        ),
    )[0]

    if (best) {
      return {
        success: true,
        packed: best.internal.packed,
        overflow: best.overflow,
        heightToleranceUsedMm: Math.max(0, best.internal.maxHeight - crate.heightMm),
      }
    }
  }

  return { success: false, packed: [], overflow: [], rejectedReason: 'TOO_MANY_OVERFLOW' }
}
