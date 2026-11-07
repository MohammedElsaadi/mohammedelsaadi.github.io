// Tilt toward the near edge of the table while keeping the map north-up.
export const DEFAULT_CAMERA_TILT = Math.PI / 6
export const MAX_CAMERA_TILT = Math.PI / 4
export function cameraOffset(tilt: number): [number, number, number] {
  return [0, 28 * Math.cos(tilt), 28 * Math.sin(tilt)]
}
export const CAMERA_OFFSET = cameraOffset(DEFAULT_CAMERA_TILT)
export const MAX_CAMERA_ZOOM = 220
// Orthographic visible distance is inverse to zoom: keep 60% of the old
// maximum visible width/depth, rather than lowering minZoom and moving farther out.
const MIN_CAMERA_ZOOM = 10 / 0.6

export function boardCameraFraming(width: number, height: number) {
  // Fit the 23 × 15 tabletop and raised pieces throughout the tilt range,
  // so moving to top-down never crops a freshly fitted board.
  const projectedWidth = 23
  const projectedHeight = Math.hypot(15, 0.8)
  const fitZoom = Math.max(1, Math.min(Math.max(1, width - 24) / projectedWidth, Math.max(1, height - 24) / projectedHeight))
  // Small viewports must still be able to fit the entire board.
  return { fitZoom, minZoom: Math.min(MIN_CAMERA_ZOOM, fitZoom) }
}
