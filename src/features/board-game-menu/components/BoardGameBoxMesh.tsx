import { Edges } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { AxisAlignedRotation } from '../packing/types'
import { packedRotationQuaternion } from '../three/packedRotation'

type ImageRotation = 0 | 90 | 180 | 270

function useOwnedTexture(url: string | null, rotationDegrees: ImageRotation) {
  const loadKey = url ? `${url}:${rotationDegrees}` : null
  const [loaded, setLoaded] = useState<{ key: string; texture: THREE.Texture | null } | null>(null)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    let active = true
    let ownedTexture: THREE.Texture | null = null
    if (!url) {
      invalidate()
      return () => { active = false }
    }

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
        setLoaded({ key: loadKey ?? url, texture: loaded })
        invalidate()
      },
      undefined,
      () => {
        if (active) {
          setLoaded({ key: loadKey ?? url, texture: null })
          invalidate()
        }
      },
    )
    return () => {
      active = false
      ownedTexture?.dispose()
    }
  }, [invalidate, loadKey, rotationDegrees, url])

  return loaded?.key === loadKey ? loaded.texture : null
}

interface CoverMaterialProps {
  url: string
  fallbackColor: string
  rotationDegrees: ImageRotation
  muted?: boolean
  opacity?: number
}

export function CoverMaterial({ url, fallbackColor, rotationDegrees, muted = false, opacity = 1 }: CoverMaterialProps) {
  const texture = useOwnedTexture(url, rotationDegrees)
  return texture ? (
    <meshBasicMaterial map={texture} color={muted ? '#a9a2a5' : '#ffffff'} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} />
  ) : (
    <meshStandardMaterial color={muted ? '#918b8e' : fallbackColor} roughness={0.76} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} />
  )
}

interface FaceMaterialProps {
  attach: `material-${number}`
  texture: THREE.Texture | null
  fallbackColor: string
  muted: boolean
  opacity: number
}

function FaceMaterial({ attach, texture, fallbackColor, muted, opacity }: FaceMaterialProps) {
  return texture ? (
    <meshBasicMaterial attach={attach} map={texture} color={muted ? '#a9a2a5' : '#ffffff'} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} />
  ) : (
    <meshStandardMaterial attach={attach} color={muted ? '#918b8e' : fallbackColor} roughness={0.76} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} />
  )
}

interface BoxMaterialsProps {
  coverUrl: string | null
  sideUrl: string | null
  coverRotationDegrees: ImageRotation
  color: string
  muted?: boolean
  opacity?: number
}

function BoxMaterials({ coverUrl, sideUrl, coverRotationDegrees, color, muted = false, opacity = 1 }: BoxMaterialsProps) {
  const coverTexture = useOwnedTexture(coverUrl, coverRotationDegrees)
  const sideTexture = useOwnedTexture(sideUrl, 0)
  const nonTopTexture = sideTexture ?? coverTexture

  return (
    <>
      <FaceMaterial attach="material-0" texture={nonTopTexture} fallbackColor={color} muted={muted} opacity={opacity} />
      <FaceMaterial attach="material-1" texture={nonTopTexture} fallbackColor={color} muted={muted} opacity={opacity} />
      <FaceMaterial attach="material-2" texture={coverTexture} fallbackColor={color} muted={muted} opacity={opacity} />
      <FaceMaterial attach="material-3" texture={coverTexture} fallbackColor={color} muted={muted} opacity={opacity} />
      <FaceMaterial attach="material-4" texture={nonTopTexture} fallbackColor={color} muted={muted} opacity={opacity} />
      <FaceMaterial attach="material-5" texture={nonTopTexture} fallbackColor={color} muted={muted} opacity={opacity} />
    </>
  )
}

interface PreviewBoxProps {
  dimensions: [number, number, number]
  coverUrl: string | null
  sideUrl: string | null
  coverRotationDegrees: ImageRotation
  color: string
  dancing: boolean
  reducedMotion: boolean
  muted?: boolean
  opacity?: number
}

const PREVIEW_IDLE_PITCH = 0.5
const PREVIEW_IDLE_YAW = 0.25
const PREVIEW_SELECTED_PITCH = 0.12
const PREVIEW_SELECTED_YAW = -0.5
const PREVIEW_POSE_DAMPING = 20

export function PreviewBox({ dimensions, coverUrl, sideUrl, coverRotationDegrees, color, dancing, reducedMotion, muted = false, opacity = 1 }: PreviewBoxProps) {
  const group = useRef<THREE.Group>(null)
  const danceTime = useRef(0)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => invalidate(), [dancing, invalidate, muted, opacity])

  useFrame((_, delta) => {
    if (!group.current) return
    const active = dancing && !reducedMotion
    if (active) danceTime.current += delta
    const time = danceTime.current
    const pitch = dancing ? PREVIEW_SELECTED_PITCH : PREVIEW_IDLE_PITCH
    const yaw = (dancing ? PREVIEW_SELECTED_YAW : PREVIEW_IDLE_YAW) + (active ? Math.sin(time * 5) * 0.14 : 0)
    const roll = active ? Math.sin(time * 7) * 0.05 : 0
    const bob = active ? Math.abs(Math.sin(time * 5)) * 0.1 : 0
    if (reducedMotion) {
      group.current.rotation.set(pitch, yaw, roll)
      group.current.position.y = 0
      return
    }
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, pitch, PREVIEW_POSE_DAMPING, delta)
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, yaw, PREVIEW_POSE_DAMPING, delta)
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, roll, PREVIEW_POSE_DAMPING, delta)
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, bob, PREVIEW_POSE_DAMPING, delta)

    const settling = Math.abs(group.current.rotation.x - pitch) > 0.002
      || Math.abs(group.current.rotation.y - yaw) > 0.002
      || Math.abs(group.current.rotation.z - roll) > 0.002
      || Math.abs(group.current.position.y - bob) > 0.002
    if (active || settling) invalidate()
    if (!dancing && !settling) danceTime.current = 0
  })

  return (
    <group ref={group} rotation={[PREVIEW_IDLE_PITCH, PREVIEW_IDLE_YAW, 0]}>
      <mesh>
        <boxGeometry args={dimensions} />
        <BoxMaterials coverUrl={coverUrl} sideUrl={sideUrl} coverRotationDegrees={coverRotationDegrees} color={color} muted={muted} opacity={opacity} />
        <Edges color="#2a1a17" transparent opacity={0.5 * opacity} />
      </mesh>
    </group>
  )
}

interface PackedBoxProps {
  dimensions: [number, number, number]
  position: [number, number, number]
  orientation: AxisAlignedRotation
  coverUrl: string | null
  sideUrl: string | null
  coverRotationDegrees: ImageRotation
  color: string
  dropStartY: number
  reducedMotion: boolean
  onImpact: () => void
}

export function PackedBox({ dimensions, position, orientation, coverUrl, sideUrl, coverRotationDegrees, color, dropStartY, reducedMotion, onImpact }: PackedBoxProps) {
  const group = useRef<THREE.Group>(null)
  const quaternion = useMemo(() => packedRotationQuaternion(orientation), [orientation])
  const [startPosition] = useState<[number, number, number]>(() => [position[0], reducedMotion ? position[1] : Math.max(position[1], dropStartY), position[2]])
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
      <group quaternion={quaternion}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={dimensions} />
          <BoxMaterials coverUrl={coverUrl} sideUrl={sideUrl} coverRotationDegrees={coverRotationDegrees} color={color} />
          <Edges color="#160d0c" transparent opacity={0.62} />
        </mesh>
      </group>
    </group>
  )
}
