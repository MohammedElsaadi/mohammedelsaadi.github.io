import type { CatalogContainer, CatalogGame } from '../api/types'
import type { PackingResult } from '../packing/types'
import { CrateScene } from './CrateScene'

interface CratePanelProps {
  crate: CatalogContainer | undefined
  tote: CatalogContainer | undefined
  games: CatalogGame[]
  packing: PackingResult
  selectedCount: number
  toteSelected: boolean
}

export function CratePanel({ crate, tote, games, packing, selectedCount, toteSelected }: CratePanelProps) {
  const configured = Boolean(
    crate?.innerWidthMm && crate.innerHeightMm && crate.innerDepthMm,
  )
  const overflowCount = packing.success ? packing.overflow.length : 0
  const heightToleranceUsed = packing.success ? packing.heightToleranceUsedMm ?? 0 : 0
  const status =
    selectedCount === 0
      ? toteSelected
        ? 'The tote is ready to go.'
        : 'Choose a box and watch the crate fill.'
      : overflowCount === 0
        ? heightToleranceUsed > 0
          ? `Fits using ${heightToleranceUsed} mm above the crate rim.`
          : 'Everything fits inside.'
        : `${overflowCount} game${overflowCount === 1 ? '' : 's'} stacked on top.`

  return (
    <aside className="bgm-crate-panel" aria-label="Current container packing">
      <div className="bgm-crate-panel__heading">
        <div>
          <span className="bgm-kicker">Live packing</span>
          <h2>{crate?.name ?? 'Main Crate'}</h2>
        </div>
        <span className="bgm-crate-panel__count">{selectedCount} selected</span>
      </div>
      <div className="bgm-crate-panel__scene">
        {configured && crate ? (
          <CrateScene crate={crate} tote={tote} games={games} packing={packing} toteSelected={toteSelected} />
        ) : (
          <div className="bgm-crate-panel__empty">
            <span aria-hidden="true">◇</span>
            <strong>Main Crate dimensions are not configured.</strong>
            <p>The collection is still visible, but crate-game selection is paused until dimensions are added in Admin.</p>
          </div>
        )}
      </div>
      <div className="bgm-packing-status" aria-live="polite">
        <strong>{status}</strong>
        <span>
          {selectedCount} crate game{selectedCount === 1 ? '' : 's'}
          {toteSelected ? ' · tote included' : ''}
        </span>
      </div>
      <p className="bgm-crate-panel__hint">Drag to orbit · scroll or pinch to zoom</p>
    </aside>
  )
}
