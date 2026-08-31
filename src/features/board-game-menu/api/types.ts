export type Course = 'appetizer' | 'main' | 'dessert'
export type GameStatus = 'draft' | 'active' | 'archived'
export type ItemType = 'game' | 'accessory'

export interface Tag {
  id: string
  slug: string
  name: string
}

export interface CatalogContainer {
  id: string
  slug: 'main-crate' | 'board-game-tote' | string
  name: string
  packingMode: 'bin_pack' | 'none'
  selectionMode: 'individual' | 'whole_container'
  innerWidthMm: number | null
  innerHeightMm: number | null
  innerDepthMm: number | null
  overflowLimit: number
  isActive: boolean
  imageUrl: string | null
}

export interface CatalogGame {
  id: string
  slug: string
  name: string
  itemType: ItemType
  containerId: string
  containerSlug: string
  selectable: boolean
  alwaysPacked: boolean
  allowOverflow: boolean
  widthMm: number | null
  heightMm: number | null
  depthMm: number | null
  weightGrams: number | null
  minPlayers: number | null
  maxPlayers: number | null
  minPlayTimeMinutes: number | null
  maxPlayTimeMinutes: number | null
  complexity: number | null
  course: Course | null
  coverUrl: string | null
  coverRotationDegrees: 0 | 90 | 180 | 270
  status: GameStatus
  sortOrder: number
  tags: Tag[]
}

export interface CatalogResponse {
  containers: CatalogContainer[]
  crateGames: CatalogGame[]
  toteGames: CatalogGame[]
  requiredCrateItems: CatalogGame[]
  tags: Tag[]
}

export type InclusionSource = 'selected' | 'required_container_item' | 'bundle_snapshot'

export interface SavedMenuItem extends CatalogGame {
  inclusionSource: InclusionSource
}

export interface SavedMenu {
  id: string
  gameNightDate: string
  title: string
  selectedContainerIds: string[]
  selectedCrateGameIds: string[]
  containers: CatalogContainer[]
  items: SavedMenuItem[]
  createdAt: string
  updatedAt: string
}

export interface AdminCatalogResponse {
  games: CatalogGame[]
  containers: CatalogContainer[]
  tags: Tag[]
}

export interface MenuMutationPayload {
  gameNightDate: string
  selectedCrateGameIds: string[]
  selectedContainerIds: string[]
}

export interface MenuMutationResponse {
  saved: true
  menuId: string
  editToken?: string
  notificationSent: boolean
}

export interface ApiErrorBody {
  error?: string
  existingMenuId?: string
}
