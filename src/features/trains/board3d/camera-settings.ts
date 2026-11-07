// A gentle isometric view, with the long edge of the map still easy to read.
export const CAMERA_OFFSET: [number, number, number] = [8, 24, 16]
export const MAX_CAMERA_ZOOM = 220
// Orthographic visible distance is inverse to zoom: keep 60% of the old
// maximum visible width/depth, rather than lowering minZoom and moving farther out.
const MIN_CAMERA_ZOOM = 10 / 0.6

export function boardCameraFraming(width: number, height: number) {
  const [x, y, z] = CAMERA_OFFSET
  const horizontal = Math.hypot(x, z), distance = Math.hypot(x, y, z)
  // Project the complete 23 × 15 tabletop and its raised pieces onto the
  // camera's right/up axes, leaving a small margin on each side.
  const projectedWidth = (23 * Math.abs(z) + 15 * Math.abs(x)) / horizontal
  const projectedHeight = (23 * Math.abs(x) + 15 * Math.abs(z)) * y / (distance * horizontal) + 0.8 * horizontal / distance
  const fitZoom = Math.max(1, Math.min(Math.max(1, width - 24) / projectedWidth, Math.max(1, height - 24) / projectedHeight))
  // Small viewports must still be able to fit the entire board.
  return { fitZoom, minZoom: Math.min(MIN_CAMERA_ZOOM, fitZoom) }
}
