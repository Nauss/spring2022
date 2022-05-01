import { hitDistance } from './constants'
import Game from './Game'
import Hero from './Hero'

export type Position = {
  x: number
  y: number
}
export const computeDistance = (pos1: Position, pos2: Position) =>
  Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2))

export const random = ({ min = 0, max = 100 }) =>
  Math.round(min + Math.random() * (max - min))

const farPoints = [
  { x: 5000, y: 400 },
  { x: 4800, y: 1800 },
  { x: 4000, y: 3200 },
  { x: 3300, y: 3600 },
  { x: 200, y: 5000 },
]
const closePoints = [
  { x: 3000, y: 400 },
  { x: 2700, y: 1200 },
  { x: 1900, y: 1900 },
  { x: 1000, y: 3000 },
  { x: 500, y: 3200 },
]
let pointIndex = 0
let direction = 1
export const randomPointToEnemyBase = (
  game: Game,
  hero1: Hero,
  hero2?: Hero
) => {
  const isTopLeft = game.base.x === 0
  const randomNess = {
    x: random({ min: 0, max: 0 }),
    y: random({ min: 0, max: 0 }),
  }
  let points = closePoints
  if (game.mana < 20 || game.pusherPatrol.close.length >= closePoints.length) {
    // All the close points visited without a spider
    // Go far range
    // OR
    // No mana
    points = farPoints
  }
  const point = points[pointIndex]
  pointIndex += direction
  if (pointIndex === points.length) {
    direction = -1
    pointIndex = points.length - 1
  } else if (pointIndex === -1) {
    direction = 1
    pointIndex = 0
  }
  let result = {
    x: point.x + randomNess.x,
    y: point.y + randomNess.y,
  }
  if (isTopLeft) {
    result = {
      x: game.enemyBase.x - point.x,
      y: game.enemyBase.y - point.y,
    }
  }
  // Update the patrol
  if (hero1.spiders.length === 0) {
    game.pusherPatrol.close.push(pointIndex)
  } else {
    game.pusherPatrol.close = []
  }
  // Check if there are any spider at the destination
  if (
    game.spiders.some(spider => {
      const nextSpiderPosition = {
        x: spider.position.x,
        y: spider.position.y,
      }
      const distance = computeDistance(nextSpiderPosition, result)
      if (distance < hitDistance) {
        const restricted = game.restrictDistance(
          hero1.position,
          nextSpiderPosition,
          780
        )
        const nextEnemyBaseDistance = computeDistance(
          restricted,
          game.enemyBase
        )
        if (nextEnemyBaseDistance < 6500) {
          game.move(restricted, 'Pusher to random restricted')
          return true
        }
      }
    })
  ) {
    return
  }
  console.error('Pusher move random')
  game.move(result, 'Pusher to random')
}

export const randomDefensePoint = (
  game: Game,
  radius: number,
  side: string
) => {
  const isTopLeft = game.base.x === 0
  let angle = (Math.random() * Math.PI) / 4
  if ((isTopLeft && side === 'down') || (!isTopLeft && side === 'up'))
    angle += Math.PI / 4
  const randomNess = {
    x: random({ min: 0, max: 200 }),
    y: random({ min: 0, max: 200 }),
  }
  if (isTopLeft) {
    return {
      x: Math.round(Math.cos(angle) * radius) + randomNess.x,
      y: Math.round(Math.sin(angle) * radius) + randomNess.y,
    }
  }
  return {
    x: Math.round(game.base.x - Math.cos(angle) * radius) - randomNess.x,
    y: Math.round(game.base.y - Math.sin(angle) * radius) - randomNess.y,
  }
}
