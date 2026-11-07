import { PIECE_COLORS } from '../../../../shared/trains/types'
import type { GameAction, Snapshot } from '../../../../shared/trains/types'
import { COLOR_HEX } from './palette'

export function Lobby({ snapshot, action, disabled }: { snapshot: Snapshot; action: (a: GameAction) => void; disabled: boolean }) {
  const me = snapshot.public.players.find(player => player.playerId === snapshot.private.playerId)!
  return <section className="rail-lobby rail-panel"><p className="rail-eyebrow">Gather your traveling companions</p><h2>The departure lounge</h2><p>Share this table’s link. The host can depart with 2–5 players; everyone already has a unique piece color.</p>
    <ol className="rail-lobby-players">{snapshot.public.players.map(player => <li key={player.playerId}><span className="rail-piece-dot" style={{ background: COLOR_HEX[player.pieceColor] }} /><div><strong>{player.nickname}{player.playerId === me.playerId ? ' (you)' : ''}</strong><small>{player.pieceColor} trains · {player.online ? 'At the table' : 'Away'}{player.isHost ? ' · Host' : ''}</small></div>{me.isHost && player.playerId !== me.playerId && <button disabled={disabled} onClick={() => action({ type: 'REMOVE_LOBBY_PLAYER', playerId: player.playerId })} aria-label={`Remove ${player.nickname}`}>Remove</button>}</li>)}</ol>
    <fieldset disabled={disabled}><legend>Your train pieces</legend><div className="rail-color-picker">{PIECE_COLORS.map(color => <button key={color} aria-pressed={me.pieceColor === color} disabled={snapshot.public.players.some(player => player.playerId !== me.playerId && player.pieceColor === color)} onClick={() => action({ type: 'SELECT_COLOR', color })}><span style={{ background: COLOR_HEX[color] }} />{color}{me.pieceColor === color ? ' ✓' : ''}</button>)}</div></fieldset>
    <div className="rail-actions">{me.isHost ? <button className="rail-primary" disabled={disabled || snapshot.public.players.length < 2} onClick={() => action({ type: 'START_GAME' })}>Start journey</button> : <p>Waiting for the host to start the journey.</p>}<button disabled={disabled} onClick={() => action({ type: 'LEAVE_LOBBY' })}>Leave lobby</button></div>
  </section>
}
