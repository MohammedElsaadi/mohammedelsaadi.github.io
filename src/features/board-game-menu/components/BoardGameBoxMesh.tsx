import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface CoverMaterialProps {
  url: string
  fallbackColor: string
  rotationDegrees: 0 | 90 | 180 | 270
}

export function CoverMaterial({ url, fallbackColor, rotationDegrees }: CoverMaterialProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    let active = true
    let ownedTexture: THREE.Texture | null = null
    const loader = new THREE.TextureLoader()
    loader.load(
      url,
      (loaded) => {
        if (!active) {
          loaded.dispose()
          return
        }
        ownedTexture = loaded
        loaded.colorSpace = THREE.SRGBColorSpace
        loaded.center.set(0.5, 0.5)
        loaded.rotation = THREE.MathUtils.degToRad(rotationDegrees)
        setTexture(loaded)
        invalidate()
      },
      undefined,
      () => {
        if (active) {
          setTexture(null)
          invalidate()
        }
      },
    )
    return () => {
      active = false
      ownedTexture?.dispose()
    }
  }, [invalidate, rotationDegrees, url])

  return texture ? (
    <meshBasicMaterial map={texture} color="#ffffff" />
  ) : (
    <meshStandardMaterial color={fallbackColor} roughness={0.76} />
  )
}

interface PreviewBoxProps {
  dimensions: [number, number, number]
  coverUrl: string | null
  coverRotationDegrees: 0 | 90 | 180 | 270
  color: string
  dancing: boolean
  reducedMotion: boolean
}

export function PreviewBox({ dimensions, coverUrl, coverRotationDegrees, color, dancing, reducedMotion }: PreviewBoxProps) {
  const group = useRef<THREE.Group>(null)

  useFrame(({ clock }, delta) => {
    if (!group.current) return
    const active = dancing && !reducedMotion
    const time = clock.getElapsedTime()
    const yaw = -0.5 + (active ? Math.sin(time * 5) * 0.14 : 0)
    const roll = active ? Math.sin(time * 7) * 0.05 : 0
    const bob = active ? Math.abs(Math.sin(time * 5)) * 0.1 : 0
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, yaw, 12, delta)
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, roll, 12, delta)
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, bob, 12, delta)
  })

  return (
    <group ref={group} rotation={[0.12, -0.5, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={dimensions} />
        {coverUrl ? <CoverMaterial url={coverUrl} fallbackColor={color} rotationDegrees={coverRotationDegrees} /> : <meshStandardMaterial color={color} roughness={0.76} />}
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...dimensions)]} />
        <lineBasicMaterial color="#2a1a17" transparent opacity={0.5} />
      </lineSegments>
    </group>
  )
}

interface PackedBoxProps {
  dimensions: [number, number, number]
  position: [number, number, number]
  coverUrl: string | null
  coverRotationDegrees: 0 | 90 | 180 | 270
  color: string
  dropHeight: number
  reducedMotion: boolean
  onImpact: () => void
}

export function PackedBox({
  dimensions,
  position,
  coverUrl,
  coverRotationDegrees,
  color,
  dropHeight,
  reducedMotion,
  onImpact,
}: PackedBoxProps) {
  const group = useRef<THREE.Group>(null)
  const [startPosition] = useState<[number, number, number]>(() => [
    position[0],
    position[1] + (reducedMotion ? 0 : dropHeight),
    position[2],
  ])
  const dropping = useRef(!reducedMotion)

  useFrame((_, delta) => {
    if (!group.current) return

    if (reducedMotion) {
      group.current.position.set(...position)
      dropping.current = false
      return
    }

    const smoothing = dropping.current ? 18 : 9
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, position[0], smoothing, delta)
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, position[1], smoothing, delta)
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, position[2], smoothing, delta)

    if (dropping.current && Math.abs(group.current.position.y - position[1]) < 0.025) {
      group.current.position.set(...position)
      dropping.current = false
      onImpact()
    }
  })

  return (
    <group ref={group} position={startPosition}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={dimensions} />
        {coverUrl ? <CoverMaterial url={coverUrl} fallbackColor={color} rotationDegrees={coverRotationDegrees} /> : <meshStandardMaterial color={color} roughness={0.72} />}
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...dimensions)]} />
        <lineBasicMaterial color="#160d0c" transparent opacity={0.62} />
      </lineSegments>
    </group>
  )
}
