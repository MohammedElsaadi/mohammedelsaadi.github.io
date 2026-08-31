import * as THREE from 'three'
import type { AxisAlignedRotation } from '../packing/types'

type Axis = [number, number, number]

const rotationBasis: Record<AxisAlignedRotation, [Axis, Axis, Axis]> = {
  WHD: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  WDH: [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
  HWD: [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  HDW: [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  DWH: [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
  DHW: [[0, 0, -1], [0, 1, 0], [1, 0, 0]],
}

export function packedRotationQuaternion(rotation: AxisAlignedRotation): [number, number, number, number] {
  const [xAxis, yAxis, zAxis] = rotationBasis[rotation]
  const matrix = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(...xAxis),
    new THREE.Vector3(...yAxis),
    new THREE.Vector3(...zAxis),
  )
  return new THREE.Quaternion().setFromRotationMatrix(matrix).toArray()
}
