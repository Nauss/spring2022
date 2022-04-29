export type Position = {
  x: number
  y: number
}
export const computeDistance = (pos1: Position, pos2: Position) =>
  Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2))

export const random = ({ min = 0, max = 100 }) =>
  Math.round(min + Math.random() * (max - min))

export const randomPointOnCircle = (base: Position, radius: number) => {
  const angle = (Math.random() * Math.PI) / 2
  const isTopLeft = base.x === 0
  if (isTopLeft) {
    return {
      x: Math.round(Math.cos(angle) * radius),
      y: Math.round(Math.sin(angle) * radius),
    }
  }
  return {
    x: Math.round(base.x - Math.cos(angle) * radius),
    y: Math.round(base.y - Math.sin(angle) * radius),
  }
}
