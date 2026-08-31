const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

export function isValidDateOnly(value: string): boolean {
  const match = DATE_ONLY.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function formatDateOnly(value: string): string {
  const match = DATE_ONLY.exec(value)
  if (!match || !isValidDateOnly(value)) return value
  return `${match[2]}/${match[3]}/${match[1]}`
}

export function menuTitle(value: string): string {
  return `Board Game Menu - ${formatDateOnly(value)}`
}

export function todayDateOnly(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
