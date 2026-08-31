import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import type { AxisAlignedRotation } from '../packing/types'
import { packedRotationQuaternion } from './packedRotation'

const expectedDimensions: Record<AxisAlignedRotation, [number, number, number]> = {
  WHD: [2, 3, 5],
  WDH: [2, 5, 3],
  HWD: [3, 2, 5],
  HDW: [3, 5, 2],
  DWH: [5, 2, 3],
  DHW: [5, 3, 2],
}

describe('packedRotationQuaternion', () => {
  it('rotates original box axes to every packed dimension permutation', () => {
    for (const [rotation, expected] of Object.entries(expectedDimensions) as Array<[AxisAlignedRotation, [number, number, number]]>) {
      const quaternion = new THREE.Quaternion(...packedRotationQuaternion(rotation))
      const axes = [
        new THREE.Vector3(2, 0, 0).applyQuaternion(quaternion),
        new THREE.Vector3(0, 3, 0).applyQuaternion(quaternion),
        new THREE.Vector3(0, 0, 5).applyQuaternion(quaternion),
      ]
      const extents = (['x', 'y', 'z'] as const).map((axis) => axes.reduce((sum, vector) => sum + Math.abs(vector[axis]), 0))
      expected.forEach((dimension, index) => expect(extents[index]).toBeCloseTo(dimension))
    }
  })
})
