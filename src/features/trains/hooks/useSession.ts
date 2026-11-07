import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { ClientMessage, GameAction, ServerMessage, Snapshot } from '../../../../shared/trains/types'

export function savedNickname(code: string) { try { return localStorage.getItem(`trains.nickname.${code}`) ?? '' } catch { return '' } }
export function saveNickname(code: string, nickname: string) { try { localStorage.setItem(`trains.nickname.${code}`, nickname) } catch { /* Convenience only. */ } }
interface SessionView { status: 'connecting' | 'connected' | 'reconnecting' | 'taken-over' | 'removed' | 'failed'; snapshot: Snapshot | null; error: string; pending: boolean }
class SessionClient {
  private value: SessionView = { status: 'connecting', snapshot: null, error: '', pending: false }
  private listeners = new Set<() => void>()
  private ws: WebSocket | null = null
  private stopped = false
  private attempt = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private heartbeat: ReturnType<typeof setInterval> | null = null
  private pending: Extract<ClientMessage, { type: 'ACTION' }> | null = null
  private lastPong = Date.now()
  private code: string
  private nickname: string
  constructor(code: string, nickname: string) { this.code = code; this.nickname = nickname }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  getSnapshot = () => this.value
  private update(patch: Partial<SessionView>) { this.value = { ...this.value, ...patch }; this.listeners.forEach(listener => listener()) }
  connect = () => {
    if (!this.nickname) return
    this.stopped = false
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/trains/rooms/${this.code}/ws`)
    this.ws = ws
    ws.onopen = () => { if (this.ws !== ws || this.stopped) { ws.close(); return }; this.lastPong = Date.now(); ws.send(JSON.stringify({ type: 'JOIN', nickname: this.nickname })) }
    ws.onmessage = event => {
      if (this.ws !== ws || this.stopped) return
      if (event.data === 'pong') { this.lastPong = Date.now(); return }
      let message: ServerMessage
      try { message = JSON.parse(event.data) as ServerMessage } catch { return }
      if (message.type === 'JOINED' || message.type === 'SNAPSHOT') {
        this.attempt = 0; this.update({ status: 'connected', snapshot: message, ...(message.type === 'JOINED' ? { error: '' } : {}) })
        if (message.type === 'JOINED' && this.pending) ws.send(JSON.stringify(this.pending))
      } else if (message.type === 'ACK') {
        if (this.pending?.actionId === message.actionId) { this.pending = null; this.update({ pending: false, error: '' }) }
      } else if (message.type === 'SEAT_TAKEN_OVER' || message.type === 'REMOVED') {
        this.stopped = true; this.pending = null
        this.update({ status: message.type === 'REMOVED' ? 'removed' : 'taken-over', error: message.message, pending: false })
      } else if (message.type === 'ERROR') {
        this.pending = null; this.update({ error: message.message, pending: false })
        if (!this.value.snapshot || message.code === 'EXPIRED' || message.code === 'SEAT_REVOKED') { this.stopped = true; this.update({ status: 'failed' }); ws.close() }
      }
    }
    ws.onerror = () => this.update({ error: 'Connection interrupted. Reconnecting preserves your cards and pending turn.' })
    ws.onclose = () => {
      if (this.heartbeat) clearInterval(this.heartbeat)
      if (this.stopped || this.ws !== ws) return
      this.update({ status: 'reconnecting' })
      void fetch(`/api/trains/rooms/${this.code}`).then(async response => {
        if (this.stopped) return
        if (response.status === 404 || response.status === 410) { this.stopped = true; const body = await response.json() as { error: string }; this.update({ status: 'failed', error: body.error }); return }
        this.retryLater()
      }).catch(() => this.retryLater())
    }
    this.heartbeat = setInterval(() => { if (ws.readyState !== WebSocket.OPEN) return; if (Date.now() - this.lastPong > 65_000) ws.close(); else ws.send('ping') }, 20_000)
  }
  private retryLater() { if (!this.stopped) this.timer = setTimeout(this.connect, Math.min(30_000, 700 * 2 ** this.attempt++) * (0.8 + Math.random() * 0.4)) }
  action = (action: GameAction) => {
    if (this.value.status !== 'connected' || !this.value.snapshot || this.pending || this.ws?.readyState !== WebSocket.OPEN) return
    this.pending = { type: 'ACTION', actionId: crypto.randomUUID(), expectedVersion: this.value.snapshot.stateVersion, action }
    this.update({ pending: true, error: '' }); this.ws.send(JSON.stringify(this.pending))
  }
  stop = () => { this.stopped = true; if (this.timer) clearTimeout(this.timer); if (this.heartbeat) clearInterval(this.heartbeat); this.ws?.close(); this.ws = null }
}
export function useSession(code: string, nickname: string) {
  const client = useMemo(() => new SessionClient(code, nickname), [code, nickname])
  const state = useSyncExternalStore(client.subscribe, client.getSnapshot)
  useEffect(() => { client.connect(); return client.stop }, [client])
  return { ...state, action: client.action }
}
