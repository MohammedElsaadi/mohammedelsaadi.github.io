import { describe, expect, it } from 'vitest'
import { constantTimeEqual, createEditToken, hashToken } from '../../../../functions/api/board-game-menu/_lib/tokens'

describe('menu edit tokens', () => {
  it('generates a one-time raw token and hashes it before persistence', async () => {
    const token = createEditToken()
    const hash = await hashToken(token)
    expect(token).toHaveLength(43)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash).not.toContain(token)
    expect(constantTimeEqual(hash, await hashToken(token))).toBe(true)
    expect(constantTimeEqual(hash, await hashToken(`${token}x`))).toBe(false)
  })
})
