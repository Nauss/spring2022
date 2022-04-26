export type Position = {
  x: number
  y: number
}
export const computeDistance = (pos1: Position, pos2: Position) =>
  Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2))

export const random = ({ min = 0, max = 100 }) =>
  Math.round(min + Math.random() * (max - min))
