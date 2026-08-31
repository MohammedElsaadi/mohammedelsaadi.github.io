export const CREATE_DRAFT_KEY = 'board-game-menu:draft:v1'

export function editDraftKey(menuId: string) {
  return `board-game-menu:edit:${menuId}:v1`
}

export function editTokenKey(menuId: string) {
  return `board-game-menu:edit-token:${menuId}:v1`
}

export function readStoredValue<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

export function writeStoredValue<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // A disabled/full localStorage should not make the picker unusable.
  }
}

export function removeStoredValue(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore unavailable storage.
  }
}
