/* eslint-disable react-hooks/immutability -- R3F exposes an imperative Three.js camera, which must be updated in effects. */
import { Component, memo, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, MapControls } from '@react-three/drei'
import { Group } from 'three'
import { CITIES, CITY_BY_ID, ROUTES } from '../../../../shared/trains/board-data'
import type { PieceColor, Route, Snapshot, TicketResult } from '../../../../shared/trains/types'
import { COLOR_HEX } from '../components/palette'
import { cityLabelPosition, cityPosition, trackSlots } from './geometry'
import { parchmentTexture } from './parchment'

class BoardBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="rail-board-loading">3D is unavailable on this device. Use the route list below to inspect and claim every track.</div> : this.props.children }
}
function Train({ color, length, delay, ghost }: { color: PieceColor; length: number; delay: number; ghost: boolean }) {
  const ref = useRef<Group>(null), start = useRef<number | null>(null)
  const reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  useFrame(({ clock, invalidate }) => {
    if (!ref.current || reduced || ghost) return
    start.current ??= clock.elapsedTime
    const elapsed = clock.elapsedTime - start.current - delay
    ref.current.position.y = Math.max(0, .45 * (1 - Math.max(0, elapsed) / .22))
    if (elapsed < .22) invalidate()
  })
  return <group ref={ref} scale={[length,1,1]}>
    <mesh castShadow position={[0,.16,0]}><boxGeometry args={[.92,.14,.19]} /><meshStandardMaterial color={COLOR_HEX[color]} transparent={ghost} opacity={ghost ? .5 : 1} roughness={.45} /></mesh>
    <mesh castShadow position={[-.16,.27,0]}><boxGeometry args={[.35,.16,.2]} /><meshStandardMaterial color={COLOR_HEX[color]} transparent={ghost} opacity={ghost ? .5 : 1} /></mesh>
    <mesh position={[-.16,.36,0]}><boxGeometry args={[.4,.035,.23]} /><meshStandardMaterial color="#e2cd9e" /></mesh>
    <mesh position={[.24,.25,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.075,.075,.36,10]} /><meshStandardMaterial color={COLOR_HEX[color]} /></mesh>
    <mesh position={[.32,.35,0]}><cylinderGeometry args={[.035,.045,.14,8]} /><meshStandardMaterial color="#302a25" /></mesh>
    {[-.3,.28].flatMap(x => [-.1,.1].map(z => <mesh key={`${x}-${z}`} position={[x,.1,z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.065,.065,.035,8]} /><meshStandardMaterial color="#2a2521" metalness={.3} roughness={.5} /></mesh>))}
  </group>
}
const Track = memo(function Track({ route, ownerColor, selected, previewColor, emphasized, onSelect }: { route: Route; ownerColor?: PieceColor; selected: boolean; previewColor: PieceColor; emphasized: boolean; onSelect: (route: Route) => void }) {
  const [hovered, setHovered] = useState(false)
  const slots = useMemo(() => trackSlots(route), [route])
  return <group name={`route:${route.id}`} onPointerOver={event => { event.stopPropagation(); setHovered(true) }} onPointerOut={() => setHovered(false)} onClick={event => { event.stopPropagation(); if (event.delta < 6) onSelect(route) }}>
    {slots.map((slot, i) => <group key={i} position={[slot.x,.06,slot.z]} rotation={[0,slot.angle,0]}>
      <mesh><boxGeometry args={[slot.length+.045,.055,.245]} /><meshStandardMaterial color={selected ? '#ffd365' : hovered || emphasized ? '#f6f3d0' : '#544c3b'} /></mesh>
      <mesh position={[0,.035,0]}><boxGeometry args={[slot.length,.06,.17]} /><meshStandardMaterial color={ownerColor ? '#706753' : COLOR_HEX[route.color]} roughness={.8} /></mesh>
      {(ownerColor || selected) && <Train key={ownerColor ?? 'ghost'} color={ownerColor ?? previewColor} length={slot.length} delay={i*.055} ghost={!ownerColor} />}
    </group>)}
    {hovered && <Html center position={[slots[Math.floor(slots.length/2)].x,.7,slots[Math.floor(slots.length/2)].z]} style={{ pointerEvents: 'none' }}><div className="rail-map-tooltip">{CITY_BY_ID[route.cityA].name} ↔ {CITY_BY_ID[route.cityB].name}<br />{route.length} {route.color} · Track {route.variant+1}{ownerColor ? ` · ${ownerColor} trains` : ''}</div></Html>}
  </group>
})
function Camera({ reset, storageKey }: { reset: number; storageKey: string }) {
  const { camera, size, invalidate } = useThree(), controls = useRef<React.ComponentRef<typeof MapControls>>(null)
  useEffect(() => {
    camera.position.set(0,24,6); camera.zoom = Math.min(size.width/23.3,size.height/15.5); camera.lookAt(0,0,0); controls.current?.target.set(0,0,0)
    if (reset === 0) try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as { position: number[]; target: number[]; zoom: number } | null
      if (saved && saved.position.length === 3 && saved.target.length === 3 && [...saved.position,...saved.target,saved.zoom].every(Number.isFinite)) { camera.position.set(saved.position[0],saved.position[1],saved.position[2]); camera.zoom=Math.max(10,Math.min(220,saved.zoom)); controls.current?.target.set(saved.target[0],saved.target[1],saved.target[2]) }
    } catch { /* Use fitted camera. */ }
    camera.updateProjectionMatrix(); controls.current?.update(); invalidate()
  }, [camera, invalidate, reset, size.width, size.height, storageKey])
  return <MapControls ref={controls} makeDefault enableRotate={false} enableDamping minZoom={10} maxZoom={220} onEnd={() => { try { sessionStorage.setItem(storageKey, JSON.stringify({ position: camera.position.toArray(), target: controls.current?.target.toArray(), zoom: camera.zoom })) } catch { /* Camera persistence is optional. */ } }} />
}
function MapArt() {
  const texture = useMemo(() => parchmentTexture(), [])
  useEffect(() => () => texture.dispose(), [texture])
  return <><mesh receiveShadow position={[0,-.24,0]}><boxGeometry args={[23,.4,15]} /><meshStandardMaterial color="#593722" roughness={.6} /></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,.005,0]} receiveShadow><planeGeometry args={[22,14]} /><meshStandardMaterial map={texture} roughness={.92} /></mesh></>
}
export default function Board({ snapshot, selected, highlight, reset, onSelect }: { snapshot: Snapshot; selected: string | null; highlight: TicketResult | null; reset: number; onSelect: (route: Route) => void }) {
  const me = snapshot.public.players.find(player => player.playerId === snapshot.private.playerId)!
  return <BoardBoundary><div className="rail-board-canvas" data-testid="rail-board"><Canvas orthographic shadows frameloop="demand" dpr={[1,1.5]} camera={{ position: [0,24,6], zoom: 40, near: .1, far: 80 }} gl={{ antialias: true }} fallback={<div>WebGL is unavailable. Use the accessible route list below.</div>}>
    <color attach="background" args={['#30251b']} /><ambientLight intensity={1.5} /><directionalLight position={[-5,15,5]} intensity={2.1} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-.001} />
    <MapArt />
    {ROUTES.map(route => <Track key={route.id} route={route} ownerColor={snapshot.public.players.find(player => player.playerId === snapshot.public.ownedRoutes[route.id])?.pieceColor} selected={selected === route.id} previewColor={me.pieceColor} emphasized={!!highlight && snapshot.public.ownedRoutes[route.id] === me.playerId} onSelect={onSelect} />)}
    {CITIES.map(city => <Html key={`label-${city.id}`} center position={cityLabelPosition(city.id)} style={{ pointerEvents: 'none' }} zIndexRange={[20,0]}><span className="rail-city-label">{city.name}</span></Html>)}
    {CITIES.map(city => { const [x,z] = cityPosition(city.id), highlighted = highlight && [highlight.cityA,highlight.cityB].includes(city.id); return <group key={city.id} position={[x,.11,z]}><mesh><cylinderGeometry args={[highlighted ? .17 : .09, highlighted ? .17 : .09,.05,20]} /><meshStandardMaterial color={highlighted ? '#facc45' : '#342f25'} emissive={highlighted ? '#d49c13' : '#000'} emissiveIntensity={.4} /></mesh><mesh position={[0,.035,0]}><cylinderGeometry args={[.045,.045,.02,12]} /><meshBasicMaterial color="#fff5db" /></mesh></group> })}
    <Camera reset={reset} storageKey={`trains.camera.${snapshot.public.code}.${me.playerId}`} />
  </Canvas></div></BoardBoundary>
}
