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
  floating?: boolean
}

function ToteOrbPreview({ tote }: { tote: CatalogContainer }) {
  return (
    <div className="bgm-tote-orb" aria-hidden="true">
      <div className="bgm-tote-orb__tote">
        <span className="bgm-tote-orb__handle bgm-tote-orb__handle--back" />
        <span className="bgm-tote-orb__handle bgm-tote-orb__handle--front" />
        <span className={`bgm-tote-orb__bag${tote.imageUrl ? ' has-image' : ''}`}>
          {tote.imageUrl ? <img src={tote.imageUrl} alt="" /> : <span>Tote</span>}
        </span>
      </div>
    </div>
  )
}

export function CratePanel({ crate, tote, games, packing, selectedCount, toteSelected, floating = false }: CratePanelProps) {
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
    <aside className={`bgm-crate-panel${floating ? ' bgm-crate-panel--orb' : ''}`} aria-label="Current container packing">
      <div className="bgm-crate-panel__heading">
        <div>
          <span className="bgm-kicker">Packing preview</span>
          <h2>{crate?.name ?? 'Main Crate'}</h2>
        </div>
        <span className="bgm-crate-panel__count">{selectedCount} selected</span>
      </div>
      <div className="bgm-crate-panel__scene">
        {configured && crate ? (
          <CrateScene crate={crate} tote={tote} games={games} packing={packing} toteSelected={toteSelected} orbMode={floating} />
        ) : (
          <div className="bgm-crate-panel__empty">
            <span aria-hidden="true">◇</span>
            <strong>Main Crate dimensions are not configured.</strong>
            <p>The collection is still visible, but crate-game selection is paused until dimensions are added in Admin.</p>
          </div>
        )}
      </div>
      {floating && toteSelected && tote ? <ToteOrbPreview tote={tote} /> : null}
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
