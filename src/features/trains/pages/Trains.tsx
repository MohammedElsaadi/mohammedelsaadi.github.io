import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ROOM_CODE_PATTERN } from '../../../../shared/trains/schemas'
import type { GameAction } from '../../../../shared/trains/types'
import { Dialog } from '../components/Dialog'
import { GameTable } from '../components/GameTable'
import { Lobby } from '../components/Lobby'
import { savedNickname, saveNickname, useSession } from '../hooks/useSession'
import Landing, { NicknameForm } from './Landing'
import '../styles/trains.css'

function ConnectedRoom({ code, nickname, onExit }: { code: string; nickname: string; onExit: () => void }) {
  const session = useSession(code, nickname), [copied, setCopied] = useState(false), [rules, setRules] = useState(false), [audio, setAudio] = useState(false)
  const audioRef = useRef<AudioContext | null>(null)
  const disabled = session.status !== 'connected' || session.pending
  function playAction(action: GameAction) {
    session.action(action)
    if (audio) { const ctx = audioRef.current ?? new AudioContext(); audioRef.current = ctx; void ctx.resume(); const oscillator = ctx.createOscillator(), gain = ctx.createGain(); oscillator.frequency.value = 440; gain.gain.setValueAtTime(0.025, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); oscillator.connect(gain).connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime + 0.1) }
  }
  return <main className="rail-app rail-room"><header className="rail-header"><Link to="/games/trains" className="rail-brand">✦ {import.meta.env.VITE_TRAINS_TITLE || 'Railway Tabletop'}</Link><div className="rail-room-code"><span>TABLE</span><strong>{code}</strong><button onClick={() => { void navigator.clipboard.writeText(location.href).then(() => setCopied(true)).catch(() => setCopied(false)) }}>{copied ? 'Link copied ✓' : 'Copy invite link'}</button></div><div className="rail-header-settings"><button onClick={() => setRules(true)}>How to play</button><button aria-pressed={audio} onClick={() => setAudio(!audio)}>Sound {audio ? 'on' : 'off'}</button><span className={`rail-connection rail-connection--${session.status}`} role="status">{session.status.replaceAll('-', ' ')}</span></div></header>
    {session.error && <div className="rail-error" role="alert">{session.error}</div>}
    {['taken-over', 'removed', 'failed'].includes(session.status) ? <section className="rail-panel"><h1>{session.status === 'taken-over' ? 'Seat opened elsewhere' : 'This connection has ended'}</h1><p>{session.error}</p><button onClick={onExit}>Choose a nickname to rejoin</button><Link className="rail-button" to="/games/trains">Find another table</Link></section> : !session.snapshot ? <p role="status" className="rail-board-loading">Connecting to your table…</p> : session.snapshot.public.phase === 'LOBBY' ? <Lobby snapshot={session.snapshot} action={playAction} disabled={disabled} /> : <GameTable snapshot={session.snapshot} action={playAction} disabled={disabled} />}
    {rules && <Dialog title="A conductor’s field guide" onClose={() => setRules(false)}><div className="rail-rules"><p>On your turn, take exactly one action:</p><ol><li><b>Draw train cards.</b> Take two, one at a time, from the market or blind deck. A face-up locomotive counts as both draws and cannot be your second pick. A blind locomotive is one draw.</li><li><b>Claim one route.</b> Pay its length in matching cards with optional wild locomotives. Gray routes accept any single regular color. Place your own color’s trains; routes need not touch your network.</li><li><b>Draw destinations.</b> Draw up to three and keep at least one. Tickets add points if connected by your trains and subtract points otherwise.</li></ol><p>With 2–3 players, claiming one half of a double route closes the other. With 4–5, different players may own the two halves. Nobody may own both.</p><p>Route scores: 1 / 2 / 3 / 4 / 5 / 6 spaces earn 1 / 2 / 4 / 7 / 10 / 15 points.</p><p>After anyone ends a turn with at most two trains left, everyone, including that player, takes one more turn. Each player tied for the longest continuous trail gets 10 points. A trail may revisit cities but cannot reuse a track.</p><p>No timer. Rejoin with the same room code and nickname to resume your exact turn.</p><p>Choose Pan or Tilt, then drag the board. Tilt moves between an overhead view and a gentle table angle; the map always stays north-up. Right-drag or Shift-drag uses the other mode. Wheel or pinch to zoom, Top-down to look straight down, and Reset view to fit. The text route list supports keyboard and non-WebGL play.</p></div></Dialog>}
  </main>
}
function Room({ code }: { code: string }) {
  const [nickname, setNickname] = useState(() => savedNickname(code))
  if (!ROOM_CODE_PATTERN.test(code)) return <main className="rail-app rail-landing"><h1>That room code is not valid.</h1><Link to="/games/trains">Return to the station</Link></main>
  return nickname ? <ConnectedRoom code={code} nickname={nickname} onExit={() => setNickname('')} /> : <main className="rail-app rail-landing"><Link className="rail-back" to="/games/trains">← Back to the station</Link><section className="rail-panel"><p className="rail-eyebrow">Table {code}</p><h1>Welcome aboard</h1><p>Enter an existing nickname to reclaim your seat, or a new nickname to join the lobby.</p><NicknameForm code={code} onJoin={name => { saveNickname(code, name); setNickname(name) }} /></section></main>
}
export default function Trains() { const { code } = useParams(); return code ? <Room key={code} code={code.toUpperCase()} /> : <Landing /> }
