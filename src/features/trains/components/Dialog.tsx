import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; ref.current?.showModal(); return () => { previous?.focus() } }, [])
  return <dialog ref={ref} className="rail-dialog" onCancel={onClose} aria-label={title}><header><h2>{title}</h2><button onClick={onClose} aria-label="Close dialog">×</button></header>{children}</dialog>
}
