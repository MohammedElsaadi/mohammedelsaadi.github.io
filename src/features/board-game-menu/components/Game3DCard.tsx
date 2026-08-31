import { View } from '@react-three/drei'
import type { CatalogGame } from '../api/types'
import { useReducedMotion } from '../three/useReducedMotion'
import { PreviewBox } from './BoardGameBoxMesh'

interface Game3DCardProps {
  game: CatalogGame
  selected: boolean
  matches: boolean
  rejected: boolean
  disabled?: boolean
  onToggle: () => void
}

const palette = ['#d76b4b', '#d6a843', '#49806c', '#6978a8', '#9a6a9d']

function gameColor(id: string) {
  const total = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return palette[total % palette.length]
}

function normalizedDimensions(game: CatalogGame): [number, number, number] {
  const physical = [game.widthMm ?? 200, game.heightMm ?? 50, game.depthMm ?? 200]
  const maximum = Math.max(...physical)
  const scale = 2.5 / maximum
  return physical.map((value) => Math.max(value * scale, 0.18)) as [number, number, number]
}

function courseLabel(course: CatalogGame['course']) {
  if (course === 'main') return 'Main Course'
  if (!course) return 'Unassigned'
  return course[0].toUpperCase() + course.slice(1)
}

export function Game3DCard({ game, selected, matches, rejected, disabled, onToggle }: Game3DCardProps) {
  const reducedMotion = useReducedMotion()
  const motionLabel = selected ? ', selected' : ''

  return (
    <button
      type="button"
      className={`bgm-game-card${selected ? ' is-selected' : ''}${!matches ? ' is-filtered' : ''}${rejected ? ' is-rejected' : ''}`}
      aria-pressed={selected}
      aria-label={`${game.name}${motionLabel}`}
      disabled={disabled}
      onClick={onToggle}
    >
      <span className="bgm-game-card__selection" aria-hidden="true">
        {selected ? 'Selected' : ''}
      </span>
      <View as="span" className="bgm-game-card__canvas" frames={Infinity}>
        <ambientLight intensity={1.6} />
        <directionalLight position={[4, 6, 5]} intensity={2.6} />
        <PreviewBox
          dimensions={normalizedDimensions(game)}
          coverUrl={game.coverUrl}
          sideUrl={game.sideUrl}
          coverRotationDegrees={game.coverRotationDegrees}
          color={gameColor(game.id)}
          dancing={selected}
          reducedMotion={reducedMotion}
          muted={!matches}
          opacity={!matches ? (selected ? 0.84 : 0.36) : 1}
        />
      </View>
      <span className="bgm-game-card__copy">
        <strong>{game.name}</strong>
        <span>{courseLabel(game.course)}</span>
        <span>
          {game.minPlayTimeMinutes ?? '?'}–{game.maxPlayTimeMinutes ?? '?'}m · {game.minPlayers ?? '?'}–{game.maxPlayers ?? '?'} players
        </span>
        <span className="bgm-game-card__tags">{game.tags.map((tag) => tag.name).join(' · ') || 'No vibes yet'}</span>
      </span>
    </button>
  )
}
