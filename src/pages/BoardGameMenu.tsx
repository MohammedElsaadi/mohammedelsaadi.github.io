import { useEffect, useState } from 'react'
import { boardGameApi } from '../features/board-game-menu/api/boardGameApi'
import { developmentCatalog } from '../features/board-game-menu/api/devCatalog'
import type { CatalogResponse } from '../features/board-game-menu/api/types'
import { BoardGamePicker } from '../features/board-game-menu/components/BoardGamePicker'
import '../features/board-game-menu/board-game-menu.css'

function BoardGameMenu() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null)
  const [developmentMode, setDevelopmentMode] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    let loadedOnce = false
    const loadCatalog = () => boardGameApi.getCatalog().then(
      (response) => {
        if (!active) return
        loadedOnce = true
        setCatalog(response)
        setDevelopmentMode(false)
        setError(false)
      },
      () => {
        if (!active) return
        if (import.meta.env.DEV && !loadedOnce) {
          setCatalog(developmentCatalog)
          setDevelopmentMode(true)
        } else if (!loadedOnce) {
          setError(true)
        }
      },
    )
    void loadCatalog()
    window.addEventListener('focus', loadCatalog)
    return () => {
      active = false
      window.removeEventListener('focus', loadCatalog)
    }
  }, [])

  if (error) {
    return <main className="bgm-page-state"><strong>Couldn’t load the board-game collection.</strong><p>Check the connection and try again.</p><button type="button" onClick={() => window.location.reload()}>Try again</button></main>
  }
  if (!catalog) return <main className="bgm-page-state" aria-live="polite">Loading the board-game shelf…</main>
  return <BoardGamePicker catalog={catalog} developmentMode={developmentMode} />
}

export default BoardGameMenu
