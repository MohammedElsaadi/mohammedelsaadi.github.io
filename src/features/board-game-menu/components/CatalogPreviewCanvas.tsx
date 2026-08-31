import { View } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, type RefObject } from 'react'

interface CatalogPreviewCanvasProps {
  scrollRoot: RefObject<HTMLElement | null>
}

function CatalogRenderScheduler({ scrollRoot }: CatalogPreviewCanvasProps) {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const root = scrollRoot.current
    if (!root) return

    let animationFrame = 0
    let animateUntil = 0

    const renderOnce = () => invalidate()
    const renderBurstFrame = (timestamp: number) => {
      invalidate()
      if (timestamp < animateUntil) {
        animationFrame = window.requestAnimationFrame(renderBurstFrame)
      } else {
        animationFrame = 0
      }
    }
    const renderBurst = () => {
      animateUntil = performance.now() + 280
      if (!animationFrame) animationFrame = window.requestAnimationFrame(renderBurstFrame)
    }

    root.addEventListener('scroll', renderOnce, { passive: true })
    root.addEventListener('transitionrun', renderBurst)
    root.addEventListener('animationstart', renderBurst)
    window.addEventListener('scroll', renderOnce, { passive: true })
    window.addEventListener('resize', renderOnce)
    window.addEventListener('orientationchange', renderOnce)

    const resizeObserver = new ResizeObserver(renderOnce)
    resizeObserver.observe(root)
    renderOnce()

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      root.removeEventListener('scroll', renderOnce)
      root.removeEventListener('transitionrun', renderBurst)
      root.removeEventListener('animationstart', renderBurst)
      window.removeEventListener('scroll', renderOnce)
      window.removeEventListener('resize', renderOnce)
      window.removeEventListener('orientationchange', renderOnce)
    }
  }, [invalidate, scrollRoot])

  return null
}

export function CatalogPreviewCanvas({ scrollRoot }: CatalogPreviewCanvasProps) {
  return (
    <div className="bgm-catalog-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.25]}
        camera={{ position: [3.7, 2.8, 4.2], fov: 34 }}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      >
        <View.Port />
        <CatalogRenderScheduler scrollRoot={scrollRoot} />
      </Canvas>
    </div>
  )
}
