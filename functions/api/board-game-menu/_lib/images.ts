import { HttpError } from './http'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function detectImage(bytes: Uint8Array, label: string) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { type: 'image/jpeg', extension: 'jpg' }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return { type: 'image/png', extension: 'png' }
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return { type: 'image/webp', extension: 'webp' }
  throw new HttpError(415, `${label} must be a valid JPEG, PNG, or WebP image.`)
}

export async function readImageUpload(request: Request, label: string) {
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_IMAGE_BYTES) throw new HttpError(413, `${label} must be 10 MB or smaller.`)
  const buffer = await request.arrayBuffer()
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new HttpError(413, `${label} must be between 1 byte and 10 MB.`)
  }
  return { buffer, ...detectImage(new Uint8Array(buffer), label) }
}
