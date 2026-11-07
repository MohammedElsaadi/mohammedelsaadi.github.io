import { useState } from 'react'
import { CITY_BY_ID } from '../../../../shared/trains/board-data'
import { CARD_KINDS } from '../../../../shared/trains/types'
import type { CardKind, Ticket, TicketResult } from '../../../../shared/trains/types'
import { COLOR_HEX, cardLabel } from './palette'

export function TrainCard({ kind, count, onClick, disabled, label }: { kind: CardKind; count?: number; onClick?: () => void; disabled?: boolean; label?: string }) {
  const style = { '--card-color': COLOR_HEX[kind] } as React.CSSProperties
  const content = <><span className="rail-car-icon" aria-hidden="true"><svg viewBox="0 0 64 46" fill="currentColor"><path d={kind === 'locomotive' ? 'M9 31V12H27V23H47V13H53V29L60 35H5V31ZM12 5H25V10H12ZM44 7H56V11H44Z' : 'M5 11H59V32H5ZM11 4H53V8H11Z'} /><circle cx="15" cy="38" r="6"/><circle cx="48" cy="38" r="6"/>{kind !== 'locomotive' && <path d="M14 16H22V23H14ZM28 16H36V23H28ZM42 16H50V23H42Z" fill="var(--card-color)" />}</svg></span><span>{cardLabel(kind)}</span>{count !== undefined && <strong>{count}</strong>}</>
  return onClick ? <button className={`rail-card rail-card--${kind}`} style={style} onClick={onClick} disabled={disabled} aria-label={label ?? cardLabel(kind)}>{content}</button> : <div className={`rail-card rail-card--${kind}`} style={style}>{content}</div>
}
export function Hand({ cards }: { cards: CardKind[] }) { return <div className="rail-hand" aria-label="Your private train cards">{CARD_KINDS.map(kind => <TrainCard key={kind} kind={kind} count={cards.filter(card => card === kind).length} />)}</div> }
export function TicketCard({ ticket, children }: { ticket: Ticket | TicketResult; children?: React.ReactNode }) {
  return <article className={`rail-ticket ${'completed' in ticket && ticket.completed ? 'rail-ticket--complete' : ''}`}><div className="rail-ticket-top"><span>DESTINATION TICKET</span><strong>{ticket.points}<small> points</small></strong></div><h3>{CITY_BY_ID[ticket.cityA].name} <span aria-hidden="true">↔</span> {CITY_BY_ID[ticket.cityB].name}</h3>{'completed' in ticket && <p>{ticket.completed ? '✓ Connected' : 'Not connected yet'} · {ticket.score > 0 ? '+' : ''}{ticket.score} at finish</p>}{children}</article>
}
export function TicketChoice({ offer, minimum, pending, onKeep }: { offer: Ticket[]; minimum: number; pending: boolean; onKeep: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>(offer.map(ticket => ticket.id))
  return <section className="rail-ticket-selection" aria-label="Choose destination tickets"><div><p className="rail-eyebrow">Your private tickets</p><h2>Which journeys will you take?</h2><p>Keep at least {minimum}. Completed tickets add points; unfinished tickets subtract their value at the end.</p></div><div className="rail-ticket-grid">{offer.map(ticket => <TicketCard ticket={ticket} key={ticket.id}><label><input type="checkbox" checked={selected.includes(ticket.id)} onChange={event => setSelected(event.target.checked ? [...selected, ticket.id] : selected.filter(id => id !== ticket.id))} /> Keep {CITY_BY_ID[ticket.cityA].name} to {CITY_BY_ID[ticket.cityB].name}</label></TicketCard>)}</div><button className="rail-primary" disabled={pending || selected.length < minimum} onClick={() => onKeep(selected)}>Keep {selected.length} ticket{selected.length === 1 ? '' : 's'}</button><small>Unselected tickets return to the bottom of the deck.</small></section>
}
