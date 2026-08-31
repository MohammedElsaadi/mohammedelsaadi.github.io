import { describe, expect, it } from 'vitest'
import { packCrate } from './packCrate'
import type { CrateDimensions, PackedTransform, PackingItem } from './types'

const crate: CrateDimensions = { widthMm: 10, heightMm: 10, depthMm: 10, overflowLimit: 2, heightToleranceMm: 0 }
const item = (id: string, dimensions: [number, number, number], extra: Partial<PackingItem> = {}): PackingItem => ({
  id,
  widthMm: dimensions[0],
  heightMm: dimensions[1],
  depthMm: dimensions[2],
  canOverflow: true,
  required: false,
  ...extra,
})

function overlaps(a: PackedTransform, b: PackedTransform) {
  return !(
    a.positionMm.x + a.dimensionsMm.width <= b.positionMm.x ||
    b.positionMm.x + b.dimensionsMm.width <= a.positionMm.x ||
    a.positionMm.y + a.dimensionsMm.height <= b.positionMm.y ||
    b.positionMm.y + b.dimensionsMm.height <= a.positionMm.y ||
    a.positionMm.z + a.dimensionsMm.depth <= b.positionMm.z ||
    b.positionMm.z + b.dimensionsMm.depth <= a.positionMm.z
  )
}

describe('packCrate', () => {
  it('packs one box and accepts an exact boundary fit', () => {
    const result = packCrate([item('exact', [10, 10, 10])], crate)
    expect(result.success).toBe(true)
    expect(result.packed).toHaveLength(1)
    expect(result.overflow).toHaveLength(0)
  })

  it('rotates a box using an axis-aligned dimension permutation', () => {
    const result = packCrate([item('rotate', [11, 9, 10])], { ...crate, widthMm: 9, heightMm: 10, depthMm: 11 })
    expect(result.success).toBe(true)
    expect(result.packed[0].dimensionsMm).toEqual({ width: 9, height: 10, depth: 11 })
  })

  it('never scales a box to fit', () => {
    const result = packCrate([item('large', [11, 11, 11])], crate)
    expect(result.success).toBe(true)
    expect(result.packed).toHaveLength(0)
    expect(result.overflow[0].dimensionsMm.width * result.overflow[0].dimensionsMm.height * result.overflow[0].dimensionsMm.depth).toBe(1331)
  })

  it('creates non-overlapping, in-bounds internal transforms', () => {
    const result = packCrate([item('a', [5, 10, 10]), item('b', [5, 10, 10])], crate)
    expect(result.success).toBe(true)
    expect(overlaps(result.packed[0], result.packed[1])).toBe(false)
    for (const packed of result.packed) {
      expect(packed.positionMm.x + packed.dimensionsMm.width).toBeLessThanOrEqual(crate.widthMm)
      expect(packed.positionMm.y + packed.dimensionsMm.height).toBeLessThanOrEqual(crate.heightMm)
      expect(packed.positionMm.z + packed.dimensionsMm.depth).toBeLessThanOrEqual(crate.depthMm)
    }
  })

  it('accepts one and two overflow items but rejects a third required overflow', () => {
    expect(packCrate([item('a', [10, 10, 10]), item('b', [10, 10, 10])], crate).overflow).toHaveLength(1)
    expect(packCrate([item('a', [10, 10, 10]), item('b', [10, 10, 10]), item('c', [10, 10, 10])], crate).overflow).toHaveLength(2)
    const rejected = packCrate(
      [item('a', [10, 10, 10]), item('b', [10, 10, 10]), item('c', [10, 10, 10]), item('d', [10, 10, 10])],
      crate,
    )
    expect(rejected.success).toBe(false)
    expect(rejected.rejectedReason).toBe('TOO_MANY_OVERFLOW')
  })

  it('keeps required/non-overflow accessories inside', () => {
    const result = packCrate(
      [item('accessory', [10, 10, 10], { required: true, canOverflow: false }), item('game', [5, 5, 5])],
      crate,
    )
    expect(result.success).toBe(true)
    expect(result.packed.map((packed) => packed.itemId)).toContain('accessory')
    expect(result.overflow.map((overflow) => overflow.itemId)).toEqual(['game'])
  })

  it('is selection-order independent', () => {
    const items = [item('z', [6, 10, 10]), item('a', [4, 10, 10]), item('m', [5, 5, 5])]
    const forward = packCrate(items, crate)
    const reverse = packCrate([...items].reverse(), crate)
    expect(reverse.success).toBe(forward.success)
    expect(reverse.overflow.map((entry) => entry.itemId)).toEqual(forward.overflow.map((entry) => entry.itemId))
    expect(reverse.packed).toEqual(forward.packed)
  })

  it('fails safely for invalid crate and item dimensions', () => {
    expect(packCrate([], { ...crate, widthMm: 0 }).rejectedReason).toBe('INVALID_CRATE')
    expect(packCrate([item('bad', [-1, 1, 1])], crate).rejectedReason).toBe('INVALID_ITEM')
  })

  it('repacking after removal can bring an overflow game inside', () => {
    const full = packCrate([item('a', [10, 10, 10]), item('b', [10, 10, 10])], crate)
    expect(full.overflow).toHaveLength(1)
    const reduced = packCrate([item('b', [10, 10, 10])], crate)
    expect(reduced.overflow).toHaveLength(0)
    expect(reduced.packed[0].itemId).toBe('b')
  })

  it('uses configurable invisible height above the physical crate rim', () => {
    const withoutTolerance = packCrate([item('tall', [10, 12, 10], { canOverflow: false })], crate)
    expect(withoutTolerance.success).toBe(false)

    const withTolerance = packCrate(
      [item('tall', [10, 12, 10], { canOverflow: false })],
      { ...crate, heightToleranceMm: 2 },
    )
    expect(withTolerance.success).toBe(true)
    expect(withTolerance.packed).toHaveLength(1)
    expect(withTolerance.heightToleranceUsedMm).toBe(2)
    expect(withTolerance.packed[0].positionMm.y + withTolerance.packed[0].dimensionsMm.height).toBe(12)
  })
})
