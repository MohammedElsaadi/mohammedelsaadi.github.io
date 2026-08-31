export type AxisAlignedRotation = 'WHD' | 'WDH' | 'HWD' | 'HDW' | 'DWH' | 'DHW'

export interface PackingItem {
  id: string
  widthMm: number
  heightMm: number
  depthMm: number
  canOverflow: boolean
  required: boolean
}

export interface CrateDimensions {
  widthMm: number
  heightMm: number
  depthMm: number
  overflowLimit: number
  heightToleranceMm: number
}

export interface DimensionsMm {
  width: number
  height: number
  depth: number
}

export interface PackedTransform {
  itemId: string
  positionMm: { x: number; y: number; z: number }
  dimensionsMm: DimensionsMm
  rotation: AxisAlignedRotation
}

export interface OverflowTransform {
  itemId: string
  dimensionsMm: DimensionsMm
  rotation: AxisAlignedRotation
  stackIndex: number
}

export interface PackingResult {
  success: boolean
  packed: PackedTransform[]
  overflow: OverflowTransform[]
  heightToleranceUsedMm?: number
  rejectedReason?:
    | 'TOO_MANY_OVERFLOW'
    | 'INVALID_CRATE'
    | 'INVALID_ITEM'
    | 'MANDATORY_ITEMS_DO_NOT_FIT'
}
