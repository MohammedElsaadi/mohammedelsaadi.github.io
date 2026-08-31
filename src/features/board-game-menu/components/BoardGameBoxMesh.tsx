import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface CoverMaterialProps {
  url: string
  fallbackColor: string
}

function CoverMaterial({ url, fallbackColor }: CoverMaterialProps) {
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
  }, [invalidate, url])

  return texture ? (
    <meshBasicMaterial map={texture} color="#ffffff" />
  ) : (
    <meshStandardMaterial color={fallbackColor} roughness={0.76} />
  )
}

interface PreviewBoxProps {
  dimensions: [number, number, number]
  coverUrl: string | null
  color: string
  dancing: boolean
  reducedMotion: boolean
}

export function PreviewBox({ dimensions, coverUrl, color, dancing, reducedMotion }: PreviewBoxProps) {
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
        {coverUrl ? <CoverMaterial url={coverUrl} fallbackColor={color} /> : <meshStandardMaterial color={color} roughness={0.76} />}
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
  color: string
}

export function PackedBox({ dimensions, position, coverUrl, color }: PackedBoxProps) {
  const group = useRef<THREE.Group>(null)
  const firstFrame = useRef(true)

  useFrame((_, delta) => {
    if (!group.current) return
    if (firstFrame.current) {
      group.current.position.set(...position)
      firstFrame.current = false
      return
    }
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, position[0], 9, delta)
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, position[1], 9, delta)
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, position[2], 9, delta)
  })

  return (
    <group ref={group} position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={dimensions} />
        {coverUrl ? <CoverMaterial url={coverUrl} fallbackColor={color} /> : <meshStandardMaterial color={color} roughness={0.72} />}
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...dimensions)]} />
        <lineBasicMaterial color="#160d0c" transparent opacity={0.62} />
      </lineSegments>
    </group>
  )
}
