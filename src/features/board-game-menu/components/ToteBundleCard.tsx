import type { CatalogGame } from '../api/types'

interface ToteBundleCardProps {
  name: string
  games: CatalogGame[]
  selected: boolean
  matches: boolean
  onToggle: () => void
}

export function ToteBundleCard({ name, games, selected, matches, onToggle }: ToteBundleCardProps) {
  return (
    <button
      type="button"
      className={`bgm-tote-card${selected ? ' is-selected' : ''}${!matches ? ' is-filtered' : ''}`}
      aria-pressed={selected}
      onClick={onToggle}
    >
      <span className="bgm-tote-card__eyebrow">One complete bundle</span>
      <span className="bgm-tote-card__visual" aria-hidden="true">
        <span className="bgm-tote-card__handle" />
        <span className="bgm-tote-card__bag">TOTE</span>
      </span>
      <strong>{name}</strong>
      <span className="bgm-tote-card__contents">
        {games.slice(0, 3).map((game) => game.name).join(' · ')}
        {games.length > 3 ? ` · +${games.length - 3} more` : ''}
      </span>
      <span className="bgm-tote-card__action">{selected ? 'Tote added' : 'Add the whole tote'}</span>
    </button>
  )
}
