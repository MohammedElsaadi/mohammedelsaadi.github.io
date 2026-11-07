import type { CardKind } from '../../../../shared/trains/types'
export const COLOR_HEX: Record<CardKind | 'gray', string> = { pink: '#c75a9d', white: '#f3f1e9', blue: '#286fc3', yellow: '#e4b633', orange: '#e57b30', black: '#26272b', red: '#c94642', green: '#2d915a', gray: '#8b9289', locomotive: '#72558b' }
export const cardLabel = (color: CardKind) => color === 'locomotive' ? 'Locomotive · WILD' : color[0].toUpperCase() + color.slice(1)
