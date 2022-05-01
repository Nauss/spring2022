import { moveAttacker } from './Attacker'
import { hitDistance, manaToAttack, ranges } from './constants'
import { moveDefender } from './Defender'
import { moveFarmer } from './Farmer'
import Hero from './Hero'
import { moveLibero } from './Libero'
import { movePusher } from './Pusher'
import Spider from './Spider'
import Entity from './Entity'
import { computeDistance, Position } from './utils'

class Game {
  health: number
  mana: number
  base: Position
  enemyHealth: number
  enemyMana: number
  enemyBase: Position
  canAttack: boolean = false
  shouldDefend: boolean = false
  hasAttacked: boolean = false
  enemiesInBase: number = 0
  enemiesInEnemyBase: number = 0

  spiders: Spider[] = []
  heroes: Hero[] = []
  enemies: Hero[] = []

  previousHeroes: Hero[] = []
  nextMove: any = {}

  pusherPatrol: { close: number[]; far: number[] } = { close: [], far: [] }

  static defender = {
    index: 0,
    maxDistance: 4500,
  }
  static libero = {
    index: 1,
    maxDistance: 9000,
  }
  static attacker = {
    index: 2,
    maxDistance: 90000,
  }
  static instance: Game

  constructor() {
    this.health = 0
    this.mana = 0
    this.base = { x: 0, y: 0 }
    this.enemyBase = { x: 0, y: 0 }
    Game.instance = this
  }

  static get() {
    if (!Game.instance) {
      Game.instance = new Game()
    }
    return Game.instance
  }

  sortSpiders() {
    // Assign threat level between 0 and 1000
    this.spiders.forEach(spider => {
      spider.threat = 0
      if (spider.nearBase && spider.threatFor === 1) spider.threat = 800
      else if (spider.threatFor === 1) spider.threat = 400
      // Distance bonus
      // spider.threat += (1 / (spider.distance + 1)) * 5000
    })

    // Sort spiders
    this.spiders.sort((a, b) => {
      if (a.threat < b.threat) return 1
      else if (b.threat < a.threat) return -1
      return 0
    })
  }

  play() {
    // this.sortSpiders()
    // moveDefender(this, this.heroes[defender.index])
    // // If there is an enemy in the base, the libero becomes defender
    // if (this.enemies.some(enemy => enemy.distance < 5666))
    //   moveDefender(this, this.heroes[libero.index])
    // moveLibero(this, this.heroes[libero.index])
    // moveAttacker(this, this.heroes[attacker.index])
    if (this.canAttack) {
      moveDefender(this, this.heroes[Game.defender.index])
      moveDefender(this, this.heroes[Game.libero.index])
      // moveLibero(this, this.heroes[Game.libero.index])
      // if (this.mana >= 20) {
      movePusher(
        this,
        // this.heroes[Game.libero.index],
        this.heroes[Game.attacker.index]
      )
      // } else {
      //   this.canAttack = false
      //   moveFarmer(this, this.heroes[Game.libero.index])
      //   // moveFarmer(this, this.heroes[Game.attacker.index])
      // }
      // movePusher(this, this.heroes[Game.attacker.index])
    } else {
      if (this.hasAttacked) {
        moveDefender(this, this.heroes[Game.defender.index])
        moveDefender(this, this.heroes[Game.libero.index])
        movePusher(
          this,
          // this.heroes[Game.libero.index],
          this.heroes[Game.attacker.index]
        )
      } else {
        moveFarmer(this, this.heroes[Game.defender.index])
        moveFarmer(this, this.heroes[Game.libero.index])
        moveFarmer(this, this.heroes[Game.attacker.index])
      }
    }
  }

  castSpell(spell: string, ...options: any[]) {
    this.mana -= 10
    console.log(`SPELL ${spell}`, ...options)
  }

  move(position: Position, ...options: any[]) {
    let x = position.x
    let y = position.y
    if (x < 550) x = 550
    if (y < 550) y = 550
    if (x > 17630 - 550) x = 17630 - 550
    if (y > 9000 - 550) y = 9000 - 550
    console.log(`MOVE`, x, y, ...options)
  }

  moveToFuture(entity: Entity, ...options: any[]) {
    let x = Math.round(entity.position.x + entity.vx * 1.9)
    let y = Math.round(entity.position.y + entity.vy * 1.9)
    if (x < 550) x = 550
    if (y < 550) y = 550
    if (x > 17630 - 550) x = 17630 - 550
    if (y > 9000 - 550) y = 9000 - 550
    console.error(`MOVE TO FUTURE`, x, y, ...options)
    console.log(`MOVE`, x, y, ...options)
  }

  wait(...options: any[]) {
    console.log(`WAIT`, ...options)
  }

  moveToClosestSpider(hero: Hero, ...options: any[]) {
    if (hero.spiders.length) {
      let closest = this.spiders[0]
      let closestDistance = computeDistance(hero.position, closest.position)
      this.spiders.forEach(spider => {
        const spiderDistance = computeDistance(hero.position, spider.position)
        if (spiderDistance < closestDistance) {
          closest = spider
          closestDistance = spiderDistance
        }
      })
      if (closestDistance < 3500) {
        this.move(closest.position, ...options)
        return true
      }
    }
    return false
  }

  restrictDistance = (
    position: Position,
    target: Position,
    distance: number
  ) => {
    const newX = target.x - position.x
    const newY = target.y - position.y
    const a = newY / newX
    const x = Math.sqrt((distance * distance) / (a * a + 1))
    const y = a * x
    let result = { x: position.x, y: position.y }
    if (newX > 0) {
      result.x += x
    } else {
      result.x -= x
    }
    if (newY > 0) {
      result.y += y
    } else {
      result.y -= y
    }
    console.error('restrictDistance', {
      position,
      target,
      distance,
      newX,
      newY,
      a,
      x,
      y,
      result,
      newDistance: computeDistance(position, result),
    })
    return { x: Math.round(result.x), y: Math.round(result.y) }
  }

  avoidSpiders = (hero: Hero, target: Position) => {
    let newTarget = this.restrictDistance(hero.position, target, 800)
    hero.spiders.forEach(spider => {
      const spiderNextPosition = {
        x: spider.position.x + spider.vx,
        y: spider.position.y + spider.vy,
      }
      const nextDistance = computeDistance(spiderNextPosition, newTarget)
      if (nextDistance <= hitDistance) {
        newTarget = this.restrictDistance(
          hero.position,
          newTarget,
          hitDistance + 1 - nextDistance
        )
      }
    })
    console.error(`AVOID SPIDERS`, {
      hero: hero.position,
      target,
      newTarget,
    })
    return {
      x: Math.round(newTarget.x),
      y: Math.round(newTarget.y),
    }
  }

  avoidSpiders_old(hero: Hero) {
    if (this.spiders.length) {
      const isTopLeft = this.base.x === 0
      if (
        this.spiders.some(spider => {
          let distance = computeDistance(hero.position, spider.position)
          if (spider.threatFor === 2 && distance < 800) {
            const deltaX = isTopLeft ? 600 : -600
            const deltaY = isTopLeft ? 600 : -600
            this.move({
              x: spider.position.x + deltaX,
              y: spider.position.y + deltaY,
            })
            return true
          }
        })
      ) {
        return true
      }
    }
    return false
  }

  stayInBase(hero: Hero, ...options: any[]) {
    let distance = computeDistance(this.base, hero.position)
    if (this.canAttack && distance > 5500) {
      this.move(
        {
          x: this.base.x,
          y: this.base.y,
        },
        ...options
      )
      return true
    }
    return false
  }

  uncontrol(hero: Hero) {
    // Uncontrol when the hero was controlled but is not anymore
    if (this.previousHeroes.length) {
      const previous = this.previousHeroes.find(h => h.id === hero.id)
      if (
        previous &&
        previous.isControlled &&
        !hero.isControlled &&
        this.mana >= 20
      ) {
        this.castSpell('SHIELD', hero.id)
        return true
      }
    }
    return false
  }

  stayShieled(hero: Hero) {
    if (this.mana > 50 && this.enemiesInBase && hero.shieldLife === 0) {
      this.castSpell('SHIELD', hero.id)
      return true
    }

    return false
  }

  resetEntities() {
    this.spiders = []
    this.previousHeroes = this.heroes
    this.heroes = []
    this.enemies = []
  }

  // Spider stuff
  inRange(spiders: Spider[], position: Position, range: number) {
    return spiders.filter(spider => {
      const distance = computeDistance(position, spider.position)
      return distance < range
    }).length
  }
  absoluteThreats(spiders: Spider[]) {
    return spiders.filter(spider => {
      const nbHitters = this.heroes.filter(hero => {
        const distance = computeDistance(hero.position, spider.position)
        return distance <= ranges.hit
      }).length
      if (
        spider.threatFor === 1 &&
        spider.distance <
          (400 * spider.health) / (nbHitters ? 2 * nbHitters : 2)
      ) {
        return true
      }
      return false
    })
  }

  turnToBase(spider: Spider) {
    return Math.floor((spider.distance - 300) / 400)
  }
}

export default Game
