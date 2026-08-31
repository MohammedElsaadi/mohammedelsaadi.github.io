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
    boardGameApi.getCatalog().then(
      (response) => {
        if (active) setCatalog(response)
      },
      () => {
        if (!active) return
        if (import.meta.env.DEV) {
          setCatalog(developmentCatalog)
          setDevelopmentMode(true)
        } else {
          setError(true)
        }
      },
    )
    return () => { active = false }
  }, [])

  if (error) {
    return <main className="bgm-page-state"><strong>Couldn’t load the board-game collection.</strong><p>Check the connection and try again.</p><button type="button" onClick={() => window.location.reload()}>Try again</button></main>
  }
  if (!catalog) return <main className="bgm-page-state" aria-live="polite">Loading the board-game shelf…</main>
  return <BoardGamePicker catalog={catalog} developmentMode={developmentMode} />
}

export default BoardGameMenu
