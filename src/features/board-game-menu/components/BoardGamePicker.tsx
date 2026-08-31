import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiRequestError, boardGameApi } from '../api/boardGameApi'
import type { CatalogGame, CatalogResponse } from '../api/types'
import { createDefaultFilters, matchesFilters } from '../filters/matchesFilters'
import { packCrate } from '../packing/packCrate'
import type { CrateDimensions, PackingItem, PackingResult } from '../packing/types'
import {
  CREATE_DRAFT_KEY,
  editDraftKey,
  readStoredValue,
  removeStoredValue,
  writeStoredValue,
} from '../state/localStorage'
import { isValidDateOnly, todayDateOnly } from '../utils/dates'
import { CratePanel } from './CratePanel'
import { CatalogPreviewCanvas } from './CatalogPreviewCanvas'
import { PrimaryFilterBar, SecondaryFilterBar } from './FilterBar'
import { Game3DCard } from './Game3DCard'

export interface PickerDraft {
  gameNightDate: string
  selectedCrateGameIds: string[]
  selectedToteGameIds: string[]
  isToteSelected?: boolean
}

interface BoardGamePickerProps {
  catalog: CatalogResponse
  developmentMode?: boolean
  mode?: 'create' | 'edit'
  menuId?: string
  initialDraft?: PickerDraft
  onCancel?: () => void
  onSaved?: () => void | Promise<void>
}

const EMPTY_PACKING: PackingResult = { success: true, packed: [], overflow: [] }

function toPackingItem(game: CatalogGame, required: boolean): PackingItem | null {
  if (!game.widthMm || !game.heightMm || !game.depthMm) return null
  return {
    id: game.id,
    widthMm: game.widthMm,
    heightMm: game.heightMm,
    depthMm: game.depthMm,
    canOverflow: game.allowOverflow,
    required,
  }
}

function configuredCrate(catalog: CatalogResponse) {
  return catalog.containers.find((container) => container.slug === 'main-crate')
}

function createPacking(catalog: CatalogResponse, selectedIds: string[]): PackingResult {
  if (selectedIds.length === 0) return EMPTY_PACKING
  const crate = configuredCrate(catalog)
  if (!crate?.innerWidthMm || !crate.innerHeightMm || !crate.innerDepthMm) {
    return { success: false, packed: [], overflow: [], rejectedReason: 'INVALID_CRATE' }
  }
  const selected = catalog.crateGames
    .filter((game) => selectedIds.includes(game.id))
    .map((game) => toPackingItem(game, false))
  const required = catalog.requiredCrateItems.map((game) => toPackingItem(game, true))
  if ([...selected, ...required].some((item) => item === null)) {
    return { success: false, packed: [], overflow: [], rejectedReason: 'INVALID_ITEM' }
  }
  const crateDimensions: CrateDimensions = {
    widthMm: crate.innerWidthMm,
    heightMm: crate.innerHeightMm,
    depthMm: crate.innerDepthMm,
    overflowLimit: crate.overflowLimit,
    heightToleranceMm: crate.heightToleranceMm,
  }
  return packCrate([...selected, ...required] as PackingItem[], crateDimensions)
}

function validStoredDraft(value: PickerDraft | null, catalog: CatalogResponse, fallback: PickerDraft): PickerDraft {
  if (!value) return fallback
  const availableCrateGames = new Set(catalog.crateGames.map((game) => game.id))
  const availableToteGames = new Set(catalog.toteGames.map((game) => game.id))
  const selectedToteGameIds = Array.isArray(value.selectedToteGameIds)
    ? value.selectedToteGameIds.filter((id) => availableToteGames.has(id))
    : value.isToteSelected
      ? [...availableToteGames]
      : fallback.selectedToteGameIds
  return {
    gameNightDate: isValidDateOnly(value.gameNightDate) ? value.gameNightDate : fallback.gameNightDate,
    selectedCrateGameIds: value.selectedCrateGameIds.filter((id) => availableCrateGames.has(id)),
    selectedToteGameIds,
  }
}

export function BoardGamePicker({
  catalog,
  developmentMode = false,
  mode = 'create',
  menuId,
  initialDraft,
  onCancel,
  onSaved,
}: BoardGamePickerProps) {
  const navigate = useNavigate()
  const storageKey = mode === 'edit' && menuId ? editDraftKey(menuId) : CREATE_DRAFT_KEY
  const fallbackDraft: PickerDraft = initialDraft ?? {
    gameNightDate: todayDateOnly(),
    selectedCrateGameIds: [],
    selectedToteGameIds: [],
  }
  const storedDraft = readStoredValue<PickerDraft>(storageKey)
  const startingDraft = validStoredDraft(storedDraft, catalog, fallbackDraft)
  const [gameNightDate, setGameNightDate] = useState(startingDraft.gameNightDate)
  const [selectedIds, setSelectedIds] = useState(startingDraft.selectedCrateGameIds)
  const [selectedToteIds, setSelectedToteIds] = useState(startingDraft.selectedToteGameIds)
  const [filters, setFilters] = useState(createDefaultFilters)
  const [message, setMessage] = useState<string | null>(null)
  const [rejectedId, setRejectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [duplicateMenuId, setDuplicateMenuId] = useState<string | null>(null)
  const rejectTimer = useRef<number | null>(null)
  const browserRef = useRef<HTMLElement>(null)

  const crate = configuredCrate(catalog)
  const tote = catalog.containers.find((container) => container.slug === 'board-game-tote')
  const toteSelected = selectedToteIds.length > 0
  const packing = useMemo(() => createPacking(catalog, selectedIds), [catalog, selectedIds])
  const allSceneGames = useMemo(
    () => [...catalog.crateGames, ...catalog.requiredCrateItems],
    [catalog.crateGames, catalog.requiredCrateItems],
  )
  const menuGameCount = selectedIds.length + selectedToteIds.length
  const visibleToteGames = useMemo(
    () => catalog.toteGames.filter((game) => matchesFilters(game, filters)),
    [catalog.toteGames, filters],
  )
  const visibleCrateGames = useMemo(
    () => catalog.crateGames.filter((game) => matchesFilters(game, filters)),
    [catalog.crateGames, filters],
  )

  const persistDraft = (next: PickerDraft) => writeStoredValue(storageKey, next)
  const updateDate = (date: string) => {
    setGameNightDate(date)
    setDuplicateMenuId(null)
    setMessage(null)
    persistDraft({ gameNightDate: date, selectedCrateGameIds: selectedIds, selectedToteGameIds: selectedToteIds })
  }

  const rejectSelection = (gameId: string, text: string) => {
    setRejectedId(gameId)
    setMessage(text)
    if (rejectTimer.current) window.clearTimeout(rejectTimer.current)
    rejectTimer.current = window.setTimeout(() => setRejectedId(null), 650)
  }

  const toggleGame = (game: CatalogGame) => {
    if (selectedIds.includes(game.id)) {
      const next = selectedIds.filter((id) => id !== game.id)
      setSelectedIds(next)
      setMessage(null)
      persistDraft({ gameNightDate, selectedCrateGameIds: next, selectedToteGameIds: selectedToteIds })
      return
    }
    const tentative = [...selectedIds, game.id]
    const result = createPacking(catalog, tentative)
    if (!result.success) {
      const text = result.rejectedReason === 'INVALID_CRATE'
        ? 'Main Crate dimensions need to be configured in Admin first.'
        : result.rejectedReason === 'MANDATORY_ITEMS_DO_NOT_FIT'
          ? 'The required crate accessories do not fit with this selection.'
          : 'No room — the crate already needs two games on top. Remove a crate game first.'
      rejectSelection(game.id, text)
      return
    }
    setSelectedIds(tentative)
    setMessage(null)
    persistDraft({ gameNightDate, selectedCrateGameIds: tentative, selectedToteGameIds: selectedToteIds })
  }

  const toggleToteGame = (game: CatalogGame) => {
    const next = selectedToteIds.includes(game.id)
      ? selectedToteIds.filter((id) => id !== game.id)
      : [...selectedToteIds, game.id]
    setSelectedToteIds(next)
    setMessage(null)
    persistDraft({ gameNightDate, selectedCrateGameIds: selectedIds, selectedToteGameIds: next })
  }

  const clearSelection = () => {
    if (selectedIds.length + selectedToteIds.length >= 3 && !window.confirm('Clear the current board-game menu draft?')) return
    setSelectedIds([])
    setSelectedToteIds([])
    setMessage(null)
    persistDraft({ gameNightDate, selectedCrateGameIds: [], selectedToteGameIds: [] })
  }

  useEffect(() => {
    if (mode !== 'create' || !isValidDateOnly(gameNightDate)) {
      setDuplicateMenuId(null)
      return
    }

    let active = true
    const timer = window.setTimeout(() => {
      boardGameApi.findMenuByDate(gameNightDate).then(
        (result) => {
          if (active) setDuplicateMenuId(result.exists ? result.menuId : null)
        },
        () => {
          // Saving still performs the authoritative uniqueness check.
        },
      )
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [gameNightDate, mode, selectedIds, selectedToteIds])

  const save = async () => {
    if (!isValidDateOnly(gameNightDate)) {
      setMessage('Choose a valid game-night date.')
      return
    }
    if (mode === 'create' && duplicateMenuId) {
      setMessage('Choose another date or edit the menu that is already saved for this game night.')
      return
    }
    if (!packing.success) {
      setMessage('Resolve the crate packing issue before saving.')
      return
    }
    setSaving(true)
    setMessage(null)
    setDuplicateMenuId(null)
    const selectedContainerIds = [
      ...(selectedIds.length > 0 && crate ? [crate.id] : []),
      ...(selectedToteIds.length > 0 && tote ? [tote.id] : []),
    ]
    const payload = { gameNightDate, selectedCrateGameIds: selectedIds, selectedToteGameIds: selectedToteIds, selectedContainerIds }
    try {
      const result = mode === 'edit' && menuId
        ? await boardGameApi.updateMenu(menuId, payload)
        : await boardGameApi.createMenu(payload)
      removeStoredValue(storageKey)
      if (mode === 'edit' && onSaved) {
        await onSaved()
        return
      }
      navigate(`/games/board-game-menu/menu/${result.menuId}`, {
        replace: mode === 'edit',
        state: { notificationSent: result.notificationSent },
      })
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409 && error.body.existingMenuId) {
        setDuplicateMenuId(error.body.existingMenuId)
        setMessage('A menu already exists for that game-night date.')
      } else {
        setMessage('Could not save the menu. Your local draft is safe; please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="bgm-picker">
      <header className="bgm-picker__header">
        <Link to="/games" className="bgm-back-link">← Games & experiments</Link>
        <div className="bgm-picker__intro">
          <h1>Board Game Menu</h1>
          <p>Build the game-night menu and watch the real crate fill up.</p>
        </div>
        <div className="bgm-picker__date">
          <label htmlFor="game-night-date">Game night</label>
          <input id="game-night-date" type="date" value={gameNightDate} disabled={mode === 'edit'} onChange={(event) => updateDate(event.target.value)} />
        </div>
      </header>

      <div className="bgm-picker__toolbar">
        {developmentMode ? (
          <div className="bgm-dev-banner">Previewing fictional development data. Run the full local stack to use D1.</div>
        ) : null}
        <PrimaryFilterBar filters={filters} setFilters={setFilters} tags={catalog.tags} />
        {message || duplicateMenuId ? (
          <div className="bgm-message" role="status">
            <span>{duplicateMenuId ? 'A Board Game Menu is already saved for this date.' : message}</span>
            {duplicateMenuId ? <Link to={`/games/board-game-menu/menu/${duplicateMenuId}`}>Open existing menu</Link> : null}
          </div>
        ) : null}
      </div>

      <div className="bgm-picker__body">
        <CratePanel
          crate={crate}
          tote={tote}
          games={allSceneGames}
          packing={packing.success ? packing : EMPTY_PACKING}
          selectedCount={selectedIds.length}
          toteSelected={toteSelected}
        />
        <section ref={browserRef} className="bgm-browser" aria-label="Board-game collection">
          {visibleCrateGames.length + visibleToteGames.length > 0 ? <CatalogPreviewCanvas scrollRoot={browserRef} /> : null}
          <div className="bgm-browser__filters">
            <SecondaryFilterBar filters={filters} setFilters={setFilters} tags={catalog.tags} />
          </div>
          <div className="bgm-game-grid">
            {visibleToteGames.map((game) => (
              <Game3DCard
                key={game.id}
                game={game}
                selected={selectedToteIds.includes(game.id)}
                matches
                rejected={false}
                onToggle={() => toggleToteGame(game)}
              />
            ))}
            {visibleCrateGames.map((game) => (
              <Game3DCard
                key={game.id}
                game={game}
                selected={selectedIds.includes(game.id)}
                matches
                rejected={rejectedId === game.id}
                disabled={!crate?.innerWidthMm || !crate.innerHeightMm || !crate.innerDepthMm}
                onToggle={() => toggleGame(game)}
              />
            ))}
          </div>
          {catalog.crateGames.length === 0 && catalog.toteGames.length === 0 ? (
            <div className="bgm-empty-state"><strong>No board games have been published yet.</strong><p>Add a draft in Admin, then publish it when its details are complete.</p></div>
          ) : visibleCrateGames.length === 0 && visibleToteGames.length === 0 ? (
            <div className="bgm-empty-state"><strong>No games match these filters.</strong><p>Choose another course or clear a filter to see more games.</p></div>
          ) : null}

          <footer className="bgm-save-bar">
            <div>
              <strong>{menuGameCount} game{menuGameCount === 1 ? '' : 's'} on the menu</strong>
              <span>{selectedIds.length} crate box{selectedIds.length === 1 ? '' : 'es'}{selectedToteIds.length ? ` · ${selectedToteIds.length} in the tote` : ''}</span>
            </div>
            <button type="button" className="bgm-secondary-button" onClick={clearSelection} disabled={selectedIds.length === 0 && selectedToteIds.length === 0}>Clear</button>
            {mode === 'edit' ? <button type="button" className="bgm-secondary-button" onClick={onCancel}>Cancel</button> : null}
            <button type="button" className="bgm-primary-button" onClick={save} disabled={saving || (selectedIds.length === 0 && selectedToteIds.length === 0) || (mode === 'create' && Boolean(duplicateMenuId))}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : duplicateMenuId ? 'Menu Already Saved' : 'Save Board Game Menu'}
            </button>
          </footer>
        </section>
      </div>
    </main>
  )
}
