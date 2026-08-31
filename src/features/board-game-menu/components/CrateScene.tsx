import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import type { CatalogContainer, CatalogGame } from '../api/types'
import type { PackingResult } from '../packing/types'
import { mmToScene } from '../three/dimensions'
import { CoverMaterial, PackedBox } from './BoardGameBoxMesh'

interface CrateSceneProps {
  crate: CatalogContainer
  tote?: CatalogContainer
  games: CatalogGame[]
  packing: PackingResult
  toteSelected: boolean
}

const palette = ['#e46f4c', '#e7b64d', '#4d8d78', '#7988bc', '#a977a8']

function colorFor(id: string) {
  const index = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length
  return palette[index]
}

function ToteMesh({ x, z, scale, imageUrl }: { x: number; z: number; scale: number; imageUrl: string | null }) {
  return (
    <group position={[x, scale * 0.62, z]}>
      <mesh castShadow>
        <boxGeometry args={[scale * 1.25, scale * 1.2, scale * 0.56]} />
        {imageUrl ? <CoverMaterial url={imageUrl} fallbackColor="#d9794f" rotationDegrees={0} /> : <meshStandardMaterial color="#d9794f" roughness={0.9} />}
      </mesh>
      <mesh position={[0, scale * 0.58, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[scale * 0.38, scale * 0.065, 8, 28, Math.PI]} />
        <meshStandardMaterial color="#f2c48c" roughness={0.9} />
      </mesh>
    </group>
  )
}

function SceneContents({ crate, tote, games, packing, toteSelected }: CrateSceneProps) {
  const width = mmToScene(crate.innerWidthMm ?? 1)
  const height = mmToScene(crate.innerHeightMm ?? 1)
  const depth = mmToScene(crate.innerDepthMm ?? 1)
  const wall = Math.max(Math.min(width, height, depth) * 0.018, 0.04)
  const gameMap = useMemo(() => new Map(games.map((game) => [game.id, game])), [games])
  const overflowByStack = [...packing.overflow].sort((a, b) => a.stackIndex - b.stackIndex)

  return (
    <>
      <ambientLight intensity={1.35} />
      <hemisphereLight args={['#fff5de', '#271b2a', 1.2]} />
      <directionalLight position={[width, height * 2, depth]} intensity={2.5} castShadow />

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
          const dimensions: [number, number, number] = [
            mmToScene(packed.dimensionsMm.width),
            mmToScene(packed.dimensionsMm.height),
            mmToScene(packed.dimensionsMm.depth),
          ]
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
              coverUrl={game?.coverUrl ?? null}
              coverRotationDegrees={game?.coverRotationDegrees ?? 0}
              color={colorFor(packed.itemId)}
            />
          )
        })}
        {overflowByStack.map((overflow, index) => {
          const game = gameMap.get(overflow.itemId)
          const itemHeight = mmToScene(overflow.dimensionsMm.height)
          const priorHeight = overflowByStack
            .slice(0, index)
            .reduce((sum, item) => sum + mmToScene(item.dimensionsMm.height) + wall, height)
          const position: [number, number, number] = [0, priorHeight + itemHeight / 2 + wall, 0]
          return (
            <PackedBox
              key={overflow.itemId}
              dimensions={[
                mmToScene(overflow.dimensionsMm.width),
                itemHeight,
                mmToScene(overflow.dimensionsMm.depth),
              ]}
              position={position}
              coverUrl={game?.coverUrl ?? null}
              coverRotationDegrees={game?.coverRotationDegrees ?? 0}
              color={colorFor(overflow.itemId)}
            />
          )
        })}
      </Suspense>

      {toteSelected ? (
        <ToteMesh
          x={width / 2 + Math.max(width * 0.28, 1.2)}
          z={depth * 0.12}
          scale={Math.max(Math.min(width, depth) * 0.28, 0.8)}
          imageUrl={tote?.imageUrl ?? null}
        />
      ) : null}

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
        target={[toteSelected ? width * 0.12 : 0, height * 0.45, 0]}
      />
    </>
  )
}

export function CrateScene(props: CrateSceneProps) {
  const width = mmToScene(props.crate.innerWidthMm ?? 1)
  const height = mmToScene(props.crate.innerHeightMm ?? 1)
  const depth = mmToScene(props.crate.innerDepthMm ?? 1)
  const maximum = Math.max(width, height, depth)
  const horizontalExtent = props.toteSelected ? Math.max(width * 1.45, width + 2.4) : width
  const overflowHeight = props.packing.overflow.reduce(
    (sum, item) => sum + mmToScene(item.dimensionsMm.height),
    0,
  )

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: [horizontalExtent * 1.05, Math.max(maximum * 1.05, height + overflowHeight), maximum * 1.5],
        fov: 42,
      }}
    >
      <SceneContents {...props} />
    </Canvas>
  )
}
