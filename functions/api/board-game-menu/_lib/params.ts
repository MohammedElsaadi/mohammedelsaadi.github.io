import { HttpError } from './http'

export function routeParam(value: string | string[] | undefined, name: string) {
  const result = Array.isArray(value) ? value[0] : value
  if (!result || result.length > 200) throw new HttpError(400, `${name} is invalid.`)
  return result
}
