export interface Env {
  BOARD_GAME_DB: D1Database
  BOARD_GAME_MEDIA: R2Bucket
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_EMAIL_API_TOKEN?: string
  BOARD_GAME_NOTIFICATION_TO?: string
  BOARD_GAME_NOTIFICATION_FROM?: string
  PUBLIC_SITE_ORIGIN?: string
}

export interface MenuPayload {
  gameNightDate: string
  selectedCrateGameIds: string[]
  selectedContainerIds: string[]
}

export type InclusionSource = 'selected' | 'required_container_item' | 'bundle_snapshot'

export interface SelectionSnapshot {
  gameNightDate: string
  title: string
  containerIds: string[]
  items: Array<{ id: string; source: InclusionSource }>
  selectedCrateGameIds: string[]
}
