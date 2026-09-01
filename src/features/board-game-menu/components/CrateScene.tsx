import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { CatalogContainer, CatalogGame } from '../api/types'
import type { PackingResult } from '../packing/types'
import { mmToScene } from '../three/dimensions'
import { useReducedMotion } from '../three/useReducedMotion'
import { CoverMaterial, PackedBox } from './BoardGameBoxMesh'

interface CrateSceneProps {
  crate: CatalogContainer
  tote?: CatalogContainer
  games: CatalogGame[]
  packing: PackingResult
  toteSelected: boolean
}

const palette = ['#e46f4c', '#e7b64d', '#4d8d78', '#7988bc', '#a977a8']
const DEFAULT_TOTE_WIDTH_MM = 300
const DEFAULT_TOTE_HEIGHT_MM = 350
const DEFAULT_TOTE_DEPTH_MM = 65
const TOTE_HANDLE_RISE_MM = 110
const TOTE_HANDLE_DEPTH_SCALE = 0.3
const IMPACT_DURATION_SECONDS = 0.28
const IMPACT_VERTICAL_FREQUENCY = 50
const MOBILE_CAMERA_DISTANCE_SCALE = 0.76

function useMobileCamera() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 800px)')
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update)
    update()
    return () => media.removeEventListener('change', update)
  }, [])

  return mobile
}

function colorFor(id: string) {
  const index = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length
  return palette[index]
}

function ToteMesh({ x, z, width, height, depth, imageUrl }: { x: number; z: number; width: number; height: number; depth: number; imageUrl: string | null }) {
  const handleRadius = Math.max(mmToScene(7), Math.min(width, height) * 0.025)
  const handleRise = mmToScene(TOTE_HANDLE_RISE_MM)
  const attachmentX = width * 0.3
  const top = height / 2
  const handles = useMemo(() => [-1, 1].map((side) => ({
    z: side * (depth / 2 + handleRadius * 0.35),
    curve: new THREE.CatmullRomCurve3([
      new THREE.Vector3(-attachmentX, top, 0),
      new THREE.Vector3(-attachmentX * 0.72, top + handleRise * 0.72, 0),
      new THREE.Vector3(0, top + handleRise, 0),
      new THREE.Vector3(attachmentX * 0.72, top + handleRise * 0.72, 0),
      new THREE.Vector3(attachmentX, top, 0),
    ]),
  })), [attachmentX, depth, handleRadius, handleRise, top])

  return (
    <group position={[x, height / 2, z]}>
      <mesh castShadow>
        <boxGeometry args={[width, height, depth]} />
        {imageUrl ? <CoverMaterial url={imageUrl} fallbackColor="#d9794f" rotationDegrees={0} /> : <meshStandardMaterial color="#d9794f" roughness={0.9} />}
      </mesh>
      {handles.map((handle, index) => (
        <mesh key={index} castShadow position-z={handle.z} scale-z={TOTE_HANDLE_DEPTH_SCALE}>
          <tubeGeometry args={[handle.curve, 28, handleRadius, 8, false]} />
          <meshStandardMaterial color="#cccccc" roughness={0.82} />
        </mesh>
      ))}
    </group>
  )
}

function SceneContents({
  crate,
  tote,
  games,
  packing,
  toteSelected,
  reducedMotion,
}: CrateSceneProps & { reducedMotion: boolean }) {
  const width = mmToScene(crate.innerWidthMm ?? 1)
  const height = mmToScene(crate.innerHeightMm ?? 1)
  const depth = mmToScene(crate.innerDepthMm ?? 1)
  const toteWidth = mmToScene(tote?.innerWidthMm ?? DEFAULT_TOTE_WIDTH_MM)
  const toteHeight = mmToScene(tote?.innerHeightMm ?? DEFAULT_TOTE_HEIGHT_MM)
  const toteDepth = mmToScene(tote?.innerDepthMm ?? DEFAULT_TOTE_DEPTH_MM)
  const wall = Math.max(Math.min(width, height, depth) * 0.018, 0.04)
  const assembly = useRef<THREE.Group>(null)
  const impactElapsed = useRef<number | null>(null)
  const gameMap = useMemo(() => new Map(games.map((game) => [game.id, game])), [games])
  const overflowByStack = [...packing.overflow].sort((a, b) => a.stackIndex - b.stackIndex)
  const packedTop = height + mmToScene(packing.heightToleranceUsedMm ?? 0)
  const overflowHeight = overflowByStack.reduce((sum, item) => sum + mmToScene(item.dimensionsMm.height) + wall, 0)
  const sceneHeight = Math.max(width, packedTop + overflowHeight, depth, toteSelected ? toteHeight + mmToScene(TOTE_HANDLE_RISE_MM) : 0)
  const dropStartY = height * 0.45 + sceneHeight * 1.15
  const triggerImpact = useCallback(() => {
    if (!reducedMotion) impactElapsed.current = 0
  }, [reducedMotion])

  useFrame(({ clock }, delta) => {
    if (!assembly.current) return
    if (reducedMotion) {
      assembly.current.position.set(0, 0, 0)
      assembly.current.rotation.set(0, 0, 0)
      impactElapsed.current = null
      return
    }

    const time = clock.getElapsedTime()
    const danceRotation = Math.sin(time * 2.2) * 0.16
    let shakeY = 0

    if (impactElapsed.current !== null) {
      impactElapsed.current += delta
      const envelope = Math.max(0, 1 - impactElapsed.current / IMPACT_DURATION_SECONDS)
      shakeY = Math.sin(impactElapsed.current * IMPACT_VERTICAL_FREQUENCY) * height * 0.012 * envelope * envelope
      if (envelope === 0) impactElapsed.current = null
    }

    assembly.current.position.x = 0
    assembly.current.position.y = shakeY
    assembly.current.rotation.y = danceRotation
    assembly.current.rotation.z = 0
  })

  return (
    <>
      <ambientLight intensity={1.35} />
      <hemisphereLight args={['#fff5de', '#271b2a', 1.2]} />
      <directionalLight position={[width, height * 2, depth]} intensity={2.5} castShadow />

      <group ref={assembly}>
        <group>
          <mesh position={[0, -wall / 2, 0]} receiveShadow>
            <boxGeometry args={[width + wall * 2, wall, depth + wall * 2]} />
            <meshStandardMaterial color="#313842" roughness={0.78} />
          </mesh>
          <mesh position={[-width / 2 - wall / 2, height / 2, 0]} receiveShadow>
            <boxGeometry args={[wall, height, depth + wall * 2]} />
            <meshStandardMaterial color="#424b57" transparent opacity={0.56} roughness={0.72} />
          </mesh>
          <mesh position={[width / 2 + wall / 2, height / 2, 0]} receiveShadow>
            <boxGeometry args={[wall, height, depth + wall * 2]} />
            <meshStandardMaterial color="#424b57" transparent opacity={0.56} roughness={0.72} />
          </mesh>
          <mesh position={[0, height / 2, -depth / 2 - wall / 2]} receiveShadow>
            <boxGeometry args={[width, height, wall]} />
            <meshStandardMaterial color="#424b57" transparent opacity={0.48} roughness={0.72} />
          </mesh>
          <mesh position={[0, height / 2, depth / 2 + wall / 2]} receiveShadow>
            <boxGeometry args={[width, height, wall]} />
            <meshStandardMaterial color="#424b57" transparent opacity={0.28} roughness={0.72} depthWrite={false} />
          </mesh>
        </group>

        <Suspense fallback={null}>
          {packing.packed.map((packed) => {
            const game = gameMap.get(packed.itemId)
            const dimensions: [number, number, number] = game?.widthMm && game.heightMm && game.depthMm
              ? [mmToScene(game.widthMm), mmToScene(game.heightMm), mmToScene(game.depthMm)]
              : [mmToScene(packed.dimensionsMm.width), mmToScene(packed.dimensionsMm.height), mmToScene(packed.dimensionsMm.depth)]
            const position: [number, number, number] = [
              mmToScene(packed.positionMm.x + packed.dimensionsMm.width / 2) - width / 2,
              mmToScene(packed.positionMm.y + packed.dimensionsMm.height / 2),
              mmToScene(packed.positionMm.z + packed.dimensionsMm.depth / 2) - depth / 2,
            ]
            return (
              <PackedBox
                key={packed.itemId}
                dimensions={dimensions}
                position={position}
                orientation={packed.rotation}
                coverUrl={game?.coverUrl ?? null}
                sideUrl={game?.sideUrl ?? null}
                coverRotationDegrees={game?.coverRotationDegrees ?? 0}
                color={colorFor(packed.itemId)}
                dropStartY={dropStartY}
                reducedMotion={reducedMotion}
                onImpact={triggerImpact}
              />
            )
          })}
          {overflowByStack.map((overflow, index) => {
            const game = gameMap.get(overflow.itemId)
            const itemHeight = mmToScene(overflow.dimensionsMm.height)
            const dimensions: [number, number, number] = game?.widthMm && game.heightMm && game.depthMm
              ? [mmToScene(game.widthMm), mmToScene(game.heightMm), mmToScene(game.depthMm)]
              : [mmToScene(overflow.dimensionsMm.width), itemHeight, mmToScene(overflow.dimensionsMm.depth)]
            const priorHeight = overflowByStack
              .slice(0, index)
              .reduce((sum, item) => sum + mmToScene(item.dimensionsMm.height) + wall, packedTop)
            const position: [number, number, number] = [0, priorHeight + itemHeight / 2 + wall, 0]
            return (
              <PackedBox
                key={overflow.itemId}
                dimensions={dimensions}
                position={position}
                orientation={overflow.rotation}
                coverUrl={game?.coverUrl ?? null}
                sideUrl={game?.sideUrl ?? null}
                coverRotationDegrees={game?.coverRotationDegrees ?? 0}
                color={colorFor(overflow.itemId)}
                dropStartY={dropStartY}
                reducedMotion={reducedMotion}
                onImpact={triggerImpact}
              />
            )
          })}
        </Suspense>

        {toteSelected ? (
          <ToteMesh
            x={width / 2 + toteWidth / 2 + Math.max(width * 0.08, 0.4)}
            z={depth * 0.12}
            width={toteWidth}
            height={toteHeight}
            depth={toteDepth}
            imageUrl={tote?.imageUrl ?? null}
          />
        ) : null}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -wall, 0]} receiveShadow>
        <planeGeometry args={[width * 4, depth * 4]} />
        <shadowMaterial transparent opacity={0.18} />
      </mesh>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={Math.max(width, depth) * 1.1}
        maxDistance={Math.max(width, depth) * 2.7}
        minPolarAngle={Math.PI / 7}
        maxPolarAngle={Math.PI / 2.15}
        target={[toteSelected ? width * 0.12 : 0, Math.max(height, toteSelected ? toteHeight : 0) * 0.45, 0]}
      />
    </>
  )
}

export function CrateScene(props: CrateSceneProps) {
  const reducedMotion = useReducedMotion()
  const mobileCamera = useMobileCamera()
  const width = mmToScene(props.crate.innerWidthMm ?? 1)
  const height = mmToScene(props.crate.innerHeightMm ?? 1)
  const effectiveHeight = height + mmToScene(props.crate.heightToleranceMm)
  const depth = mmToScene(props.crate.innerDepthMm ?? 1)
  const toteWidth = mmToScene(props.tote?.innerWidthMm ?? DEFAULT_TOTE_WIDTH_MM)
  const toteHeight = mmToScene(props.tote?.innerHeightMm ?? DEFAULT_TOTE_HEIGHT_MM)
  const toteWithHandlesHeight = toteHeight + mmToScene(TOTE_HANDLE_RISE_MM)
  const maximum = Math.max(width, effectiveHeight, depth, props.toteSelected ? toteWithHandlesHeight : 0)
  const horizontalExtent = props.toteSelected
    ? width + toteWidth + Math.max(width * 0.08, 0.4)
    : width
  const overflowHeight = props.packing.overflow.reduce(
    (sum, item) => sum + mmToScene(item.dimensionsMm.height),
    0,
  )
  const overflowStackTop = height + mmToScene(props.packing.heightToleranceUsedMm ?? 0) + overflowHeight
  const cameraTargetX = props.toteSelected ? width * 0.12 : 0
  const cameraTargetY = Math.max(height, props.toteSelected ? toteHeight : 0) * 0.45
  const cameraDistanceScale = mobileCamera ? MOBILE_CAMERA_DISTANCE_SCALE : 1
  const cameraX = cameraTargetX + (horizontalExtent * 1.05 - cameraTargetX) * cameraDistanceScale
  const cameraYBase = Math.max(maximum * 1.05, overflowStackTop)
  const cameraY = cameraTargetY + (cameraYBase - cameraTargetY) * cameraDistanceScale
  const cameraZ = maximum * 1.5 * cameraDistanceScale

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: [cameraX, cameraY, cameraZ],
        fov: 42,
      }}
    >
      <SceneContents {...props} reducedMotion={reducedMotion} />
    </Canvas>
  )
}
