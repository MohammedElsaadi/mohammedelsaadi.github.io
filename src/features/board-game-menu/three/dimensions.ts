export const SCENE_UNITS_PER_MM = 0.01

export function mmToScene(value: number) {
  return value * SCENE_UNITS_PER_MM
}
