import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROOM_CODE_PATTERN } from '../../../../shared/trains/schemas'
import { saveNickname, savedNickname } from '../hooks/useSession'

export function NicknameForm({ code, onJoin }: { code?: string; onJoin: (name: string) => void }) {
  const [nickname, setNickname] = useState(code ? savedNickname(code) : '')
  return <form className="rail-form" onSubmit={event => { event.preventDefault(); if (nickname.trim()) onJoin(nickname.trim()) }}><label htmlFor="rail-name">Your nickname</label><input id="rail-name" autoComplete="nickname" maxLength={100} required value={nickname} onChange={event => setNickname(event.target.value)} placeholder="e.g. The Conductor" /><button className="rail-primary" type="submit">{code ? 'Join table' : 'Create a table'}</button><small>2–5 friends · no account needed. Anyone with the room code and your nickname can take your seat and see your cards.</small></form>
}
export default function Landing() {
  const navigate = useNavigate(), [error, setError] = useState(''), [busy, setBusy] = useState(false), [joinCode, setJoinCode] = useState('')
  async function create(nickname: string) {
    if (busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/trains/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname }) })
      const result = await response.json() as { code: string; nickname: string; error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Could not create the room.')
      saveNickname(result.code, result.nickname); navigate(`/games/trains/${result.code}`)
    } catch (error) { setError(error instanceof Error ? error.message : 'The room server is unavailable. Start the full local stack to play.') }
    finally { setBusy(false) }
  }
  return <main className="rail-app rail-landing"><Link className="rail-back" to="/games">← Games & experiments</Link><div className="rail-hero"><div className="rail-seal" aria-hidden="true">✦<span>EST.<br />1900</span>✦</div><p className="rail-eyebrow">An evening across America</p><h1>{import.meta.env.VITE_TRAINS_TITLE || 'Railway Tabletop'}</h1><p className="rail-hero-copy">A continent of possibilities.<br />Five friends. One extraordinary journey.</p><div className="rail-rule-line" /><p>Collect carriages, connect cities, and build your own great railway. A shared tabletop for the original USA rules.</p></div><div className="rail-landing-panels"><section className="rail-panel"><h2>All aboard.</h2><p>Open a private table and invite your fellow travelers.</p><fieldset disabled={busy}><NicknameForm onJoin={name => void create(name)} /></fieldset>{busy && <p role="status">Preparing your table…</p>}</section><section className="rail-panel"><p className="rail-eyebrow">Already have an invitation?</p><h2>Find your table</h2><form className="rail-form" onSubmit={event => { event.preventDefault(); if (ROOM_CODE_PATTERN.test(joinCode)) navigate(`/games/trains/${joinCode}`); else setError('Enter the six-character room code from your invitation.') }}><label htmlFor="rail-code">Room code</label><input id="rail-code" value={joinCode} onChange={event => setJoinCode(event.target.value.toUpperCase().trim())} maxLength={6} placeholder="K7M4PX" autoCapitalize="characters" required /><button type="submit">Continue to table</button></form><p className="rail-muted">Your nickname restores your seat and private hand, even on another device.</p></section></div>{error && <p className="rail-error" role="alert">{error}</p>}<footer>Original procedural artwork · Independent fan project · Not affiliated with the publisher</footer></main>
}
