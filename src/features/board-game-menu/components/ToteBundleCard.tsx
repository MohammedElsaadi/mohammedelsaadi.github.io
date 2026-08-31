import { useState } from 'react'
import type { CatalogGame } from '../api/types'

interface ToteBundleCardProps {
  name: string
  imageUrl: string | null
  games: CatalogGame[]
  selected: boolean
  matches: boolean
  onToggle: () => void
}

export function ToteBundleCard({ name, imageUrl, games, selected, matches, onToggle }: ToteBundleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleGames = expanded ? games : games.slice(0, 2)

  return (
    <article
      className={`bgm-tote-card${selected ? ' is-selected' : ''}${!matches ? ' is-filtered' : ''}`}
    >
      <button
        type="button"
        className="bgm-tote-card__toggle"
        aria-pressed={selected}
        onClick={onToggle}
      >
        <span className="bgm-tote-card__eyebrow">One complete bundle</span>
        <span className={`bgm-tote-card__visual${imageUrl ? ' has-image' : ''}`} aria-hidden="true">
          {imageUrl ? <img src={imageUrl} alt="" /> : <><span className="bgm-tote-card__handle" /><span className="bgm-tote-card__bag">TOTE</span></>}
        </span>
        <strong>{name}</strong>
        <span className="bgm-tote-card__action">{selected ? 'Tote added' : 'Add the whole tote'}</span>
      </button>
      <div className="bgm-tote-card__contents">
        <span>Games inside</span>
        <ul>
          {visibleGames.map((game) => <li key={game.id}>{game.name}</li>)}
        </ul>
        {!expanded && games.length > 2 ? <span className="bgm-tote-card__ellipsis" aria-hidden="true">…</span> : null}
        {games.length > 2 ? (
          <button
            type="button"
            className="bgm-tote-card__more"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? 'Show less' : `Show ${games.length - 2} more`}
          </button>
        ) : null}
      </div>
    </article>
  )
}
