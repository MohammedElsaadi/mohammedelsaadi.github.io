export interface Env {
  ASSETS: Fetcher
  BOARD_GAME_DB: D1Database
  BOARD_GAME_MEDIA: R2Bucket
  TWILIO_ACCOUNT_SID?: string
  TWILIO_API_KEY_SID?: string
  TWILIO_API_KEY_SECRET?: string
  TWILIO_FROM_NUMBER?: string
  BOARD_GAME_NOTIFICATION_TO_PHONE?: string
  PUBLIC_SITE_ORIGIN?: string
}

export interface MenuPayload {
  gameNightDate: string
  selectedCrateGameIds: string[]
  selectedToteGameIds: string[]
  selectedContainerIds: string[]
}

export type InclusionSource = 'selected' | 'required_container_item' | 'bundle_snapshot'

export interface SelectionSnapshot {
  gameNightDate: string
  title: string
  containerIds: string[]
  items: Array<{ id: string; source: InclusionSource }>
  selectedCrateGameIds: string[]
  selectedToteGameIds: string[]
}
