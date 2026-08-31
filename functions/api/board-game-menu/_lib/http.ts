export class HttpError extends Error {
  status: number
  details?: Record<string, unknown>

  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.details = details
  }
}

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message, ...error.details }, error.status)
  console.error('Board Game Menu request failed', error instanceof Error ? error.message : 'Unknown error')
  return json({ error: 'The request could not be completed.' }, 500)
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) throw new HttpError(415, 'Expected JSON.')
  const body = await request.json().catch(() => null)
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new HttpError(400, 'Invalid JSON body.')
  return body as Record<string, unknown>
}
