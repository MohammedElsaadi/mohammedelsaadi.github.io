import { HttpError } from './http'

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function requireString(value: unknown, name: string, maximum = 160) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > maximum) {
    throw new HttpError(400, `${name} is invalid.`)
  }
  return value.trim()
}

export function requireSlug(value: unknown, name = 'Slug') {
  const slug = requireString(value, name, 120)
  if (!SLUG.test(slug)) throw new HttpError(400, `${name} must use lowercase letters, numbers, and hyphens.`)
  return slug
}

export function booleanValue(value: unknown, name: string) {
  if (typeof value !== 'boolean') throw new HttpError(400, `${name} must be true or false.`)
  return value
}

export function nullableInteger(value: unknown, name: string, minimum = 1, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === null || value === undefined || value === '') return null
  if (!Number.isInteger(value) || Number(value) < minimum || Number(value) > maximum) {
    throw new HttpError(400, `${name} must be an integer between ${minimum} and ${maximum}.`)
  }
  return Number(value)
}

export function requireDateOnly(value: unknown) {
  if (typeof value !== 'string') throw new HttpError(400, 'Game-night date must use YYYY-MM-DD.')
  const match = DATE_ONLY.exec(value)
  if (!match) throw new HttpError(400, 'Game-night date must use YYYY-MM-DD.')
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new HttpError(400, 'Game-night date is invalid.')
  }
  return value
}

export function stringIdArray(value: unknown, name: string, maximum = 100) {
  if (!Array.isArray(value) || value.length > maximum || value.some((entry) => typeof entry !== 'string' || entry.length < 1 || entry.length > 160)) {
    throw new HttpError(400, `${name} is invalid.`)
  }
  return [...new Set(value as string[])]
}

export function formatDateOnly(date: string) {
  const [year, month, day] = date.split('-')
  return `${month}/${day}/${year}`
}

export function titleForDate(date: string) {
  return `Board Game Menu - ${formatDateOnly(date)}`
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
