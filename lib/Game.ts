import { moveAttacker } from './Attacker'
import { attacker, defender, libero } from './constants'
import { moveDefender } from './Defender'
import Hero from './Hero'
import { moveLibero } from './Libero'
import Spider from './Spider'
import { computeDistance, Position } from './utils'

class Game {
  health: number
  mana: number
  base: Position
  enemyBase: Position
  canAttack: boolean = false

  spiders: Spider[] = []
  heroes: Hero[] = []
  enemies: Hero[] = []

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
    this.sortSpiders()
    moveDefender(this, this.heroes[defender.index])
    // moveDefender(this, this.heroes[libero.index])
    moveLibero(this, this.heroes[libero.index])
    moveAttacker(this, this.heroes[attacker.index])
  }

  castSpell(spell: string, ...options: any[]) {
    this.mana -= 10
    console.log(`SPELL ${spell}`, ...options)
  }

  move(position: Position, ...options: any[]) {
    console.log(`MOVE`, position.x, position.y, ...options)
  }

  wait(...options: any[]) {
    console.log(`WAIT`, ...options)
  }

  moveToClosestSpider(hero: Hero) {
    if (this.spiders.length) {
      let closest = this.spiders[0]
      let closestDistance = computeDistance(hero.position, closest.position)
      this.spiders.forEach(spider => {
        const spiderDistance = computeDistance(hero.position, spider.position)
        if (spiderDistance < closestDistance) {
          closest = spider
          closestDistance = spiderDistance
        }
      })
      if (closestDistance < 2500) {
        this.move(closest.position)
        return true
      }
    }
    return false
  }

  resetEntities() {
    this.spiders = []
    this.heroes = []
    this.enemies = []
  }
}

export default Game
