import Game from './Game'
import { computeDistance, Position } from './utils'

export type EntityInfo = {
  id: number
  type: number
  x: number
  y: number
  shieldLife: number
  isControlled: number
  health: number
  vx: number
  vy: number
  nearBase: number
  threatFor: number
}

class Entity {
  id: number
  type: number
  position: Position
  shieldLife: number
  isControlled: number
  health: number
  vx: number
  vy: number
  nearBase: number
  threatFor: number

  distance: number
  enemyBaseDistance: number

  constructor(info: EntityInfo) {
    this.id = info.id
    this.type = info.type
    this.position = { x: info.x, y: info.y }
    this.shieldLife = info.shieldLife
    this.isControlled = info.isControlled
    this.health = info.health
    this.vx = info.vx
    this.vy = info.vy
    this.nearBase = info.nearBase
    this.threatFor = info.threatFor

    const game = Game.get()
    this.distance = computeDistance(game.base, this.position)
    this.enemyBaseDistance = computeDistance(this.position, game.enemyBase)
  }
}

export default Entity
