import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { boardGameApi } from '../features/board-game-menu/api/boardGameApi'
import type { CatalogResponse, SavedMenu } from '../features/board-game-menu/api/types'
import { BoardGamePicker, type PickerDraft } from '../features/board-game-menu/components/BoardGamePicker'
import { CratePanel } from '../features/board-game-menu/components/CratePanel'
import { packCrate } from '../features/board-game-menu/packing/packCrate'
import type { PackingItem, PackingResult } from '../features/board-game-menu/packing/types'
import { editDraftKey, editTokenKey, readStoredValue, removeStoredValue } from '../features/board-game-menu/state/localStorage'
import { formatDateOnly } from '../features/board-game-menu/utils/dates'
import '../features/board-game-menu/board-game-menu.css'

const EMPTY_PACKING: PackingResult = { success: true, packed: [], overflow: [] }

function BoardGameMenuSaved() {
  const { menuId = '' } = useParams()
  const location = useLocation()
  const [menu, setMenu] = useState<SavedMenu | null>(null)
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null)
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState(false)
  const hasEditToken = Boolean(readStoredValue<string>(editTokenKey(menuId)))
  const notificationSent = (location.state as { notificationSent?: boolean } | null)?.notificationSent

  useEffect(() => {
    let active = true
    Promise.all([boardGameApi.getMenu(menuId), boardGameApi.getCatalog()]).then(
      ([menuResponse, catalogResponse]) => {
        if (!active) return
        setMenu(menuResponse)
        setCatalog(catalogResponse)
      },
      () => { if (active) setError(true) },
    )
    return () => { active = false }
  }, [menuId])

  const packing = useMemo(() => {
    if (!menu) return EMPTY_PACKING
    const crate = menu.containers.find((container) => container.slug === 'main-crate')
    if (!crate?.innerWidthMm || !crate.innerHeightMm || !crate.innerDepthMm) return EMPTY_PACKING
    const packingItems = menu.items
      .filter((item) => item.inclusionSource !== 'bundle_snapshot')
      .flatMap((item): PackingItem[] => item.widthMm && item.heightMm && item.depthMm ? [{
        id: item.id,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        depthMm: item.depthMm,
        canOverflow: item.allowOverflow,
        required: item.inclusionSource === 'required_container_item',
      }] : [])
    return packCrate(packingItems, {
      widthMm: crate.innerWidthMm,
      heightMm: crate.innerHeightMm,
      depthMm: crate.innerDepthMm,
      overflowLimit: crate.overflowLimit,
    })
  }, [menu])

  if (error) return <main className="bgm-page-state"><strong>Couldn’t load this Board Game Menu.</strong><Link to="/games/board-game-menu">Build a new menu</Link></main>
  if (!menu || !catalog) return <main className="bgm-page-state">Opening the saved menu…</main>

  if (editing) {
    const toteId = catalog.containers.find((container) => container.slug === 'board-game-tote')?.id
    const initialDraft: PickerDraft = {
      gameNightDate: menu.gameNightDate,
      selectedCrateGameIds: menu.selectedCrateGameIds,
      isToteSelected: Boolean(toteId && menu.selectedContainerIds.includes(toteId)),
    }
    return (
      <BoardGamePicker
        key={`edit-${menu.id}`}
        catalog={catalog}
        mode="edit"
        menuId={menu.id}
        initialDraft={initialDraft}
        onCancel={() => {
          removeStoredValue(editDraftKey(menu.id))
          setEditing(false)
        }}
        onSaved={async () => {
          const refreshed = await boardGameApi.getMenu(menu.id)
          setMenu(refreshed)
          setEditing(false)
        }}
      />
    )
  }

  const crate = menu.containers.find((container) => container.slug === 'main-crate')
  const toteSelected = menu.containers.some((container) => container.slug === 'board-game-tote')
  const overflowIds = new Set(packing.overflow.map((item) => item.itemId))
  const packedIds = new Set(packing.packed.map((item) => item.itemId))
  const inside = menu.items.filter((item) => item.inclusionSource === 'selected' && packedIds.has(item.id))
  const onTop = menu.items.filter((item) => overflowIds.has(item.id))
  const accessories = menu.items.filter((item) => item.inclusionSource === 'required_container_item')
  const toteGames = menu.items.filter((item) => item.inclusionSource === 'bundle_snapshot')

  return (
    <main className="bgm-saved-page">
      <header className="bgm-saved-hero">
        <div>
          <Link to="/games/board-game-menu" className="bgm-back-link">← Build another menu</Link>
          <span className="bgm-kicker">Preparation view</span>
          <h1>{menu.title}</h1>
          <p>Everything to pull from the shelf before game night on {formatDateOnly(menu.gameNightDate)}.</p>
        </div>
        {hasEditToken ? <button type="button" className="bgm-primary-button" onClick={() => setEditing(true)}>Edit menu</button> : null}
      </header>

      {notificationSent === false ? <div className="bgm-saved-warning">Menu saved successfully, but the owner notification could not be sent.</div> : null}

      <div className="bgm-saved-grid">
        <CratePanel
          crate={crate}
          games={menu.items}
          packing={packing.success ? packing : EMPTY_PACKING}
          selectedCount={menu.selectedCrateGameIds.length}
          toteSelected={toteSelected}
        />
        <section className="bgm-prep-list">
          <PrepSection title="Main Crate — Inside" items={inside.map((item) => item.name)} empty="No selected games packed inside." />
          <PrepSection title="On Top" items={onTop.map((item) => item.name)} empty="Nothing needs to ride on top." />
          <PrepSection title="Auto-Included Accessories" items={accessories.map((item) => item.name)} empty="No crate accessories configured." />
          {toteSelected ? <PrepSection title="Board Game Tote" items={toteGames.map((item) => item.name)} empty="The tote snapshot was empty." /> : null}
          <p className="bgm-updated">Last updated {new Date(menu.updatedAt).toLocaleString()}</p>
        </section>
      </div>
    </main>
  )
}

function PrepSection({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <section className="bgm-prep-section">
      <h2>{title}</h2>
      {items.length > 0 ? <ul>{items.map((item) => <li key={item}><span aria-hidden="true">◆</span>{item}</li>)}</ul> : <p>{empty}</p>}
    </section>
  )
}

export default BoardGameMenuSaved
