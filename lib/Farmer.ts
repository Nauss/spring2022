import { defender, ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import { computeDistance, random } from './utils'

export const moveCatapulter = (game: Game, hero: Hero) => {
  // Farm
  if (
    game.spiders.some(spider => {
      const spiderDistance = computeDistance(hero.position, spider.position)
      if (spiderDistance < ranges.wind) {
        game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y)
        return true
      }
      if (!spider.isControlled && spiderDistance <= ranges.control) {
        game.castSpell('CONTROL', spider.id, hero.position.x, hero.position.y)
        return true
      }
    })
  ) {
    return
  }
  const isTopLeft = game.base.x === 0
  const attackPoint = {
    x: isTopLeft ? 13000 : 6700,
    y: isTopLeft ? 6700 : 2200,
  }
  if (hero.id === 1) {
    attackPoint.x += 300
    attackPoint.y -= 300
  } else if (hero.id === 2) {
    attackPoint.x -= 300
    attackPoint.y += 300
  }
  // Get in position
  if (hero.position.x !== attackPoint.x || hero.position.y !== attackPoint.y) {
    game.move(attackPoint, 'Catapulter')
    return
  }
}
