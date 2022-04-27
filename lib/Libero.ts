import { defender, libero, ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import { computeDistance, random } from './utils'

export const moveLibero = (game: Game, hero: Hero) => {
  // Control a hero getting to close to base
  // if (
  //   game.mana >= 150 &&
  //   game.enemies.some(h => {
  //     if (h.isControlled !== 0 || h.shieldLife !== 0) return false
  //     const enemyToHeroDistance = computeDistance(h.position, hero.position)
  //     if (enemyToHeroDistance <= ranges.wind && h.distance < 8000) {
  //       game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y)
  //       // game.castSpell('CONTROL', h.id, game.enemyBase.x, game.enemyBase.y)
  //       return true
  //     } else if (
  //       // Too far to cast spell > move towards the enemy
  //       enemyToHeroDistance > ranges.wind
  //     ) {
  //       game.move(h.position, 'Libero')
  //       return true
  //     }
  //   })
  // ) {
  //   return
  // }
  // Control the mid-range spiders
  if (
    game.canAttack &&
    game.mana >= 40 &&
    game.spiders.some(spider => {
      const spiderDistance = computeDistance(hero.position, spider.position)
      if (
        spider.distance > 5000 &&
        spider.isControlled === 0 &&
        spider.shieldLife === 0 &&
        spider.threatFor === 1
      ) {
        if (spiderDistance <= ranges.control) {
          game.castSpell(
            'CONTROL',
            spider.id,
            game.enemyBase.x,
            game.enemyBase.y
          )
          return true
        } else {
          game.move(spider.position, 'Libero')

          return true
        }
      }
    })
  ) {
    return
  }
  const sorted = game.spiders
    .map((spider, index) => ({
      ...spider,
      liberoIndex: index,
      liberoDistance: computeDistance(hero.position, spider.position),
    }))
    .sort((a, b) => {
      if (a.liberoDistance < b.liberoDistance) return -1
      if (a.liberoDistance > b.liberoDistance) return 1
      return 0
    })
  const threats = sorted.filter(({ threat }) => threat > 0)
  // Move to the closest threat if at least 3 threats
  if (threats.length > 2) {
    const closest = threats[0]
    if (
      closest.shieldLife === 0 &&
      closest.liberoDistance <= ranges.wind &&
      game.mana >= 30 &&
      closest.distance < 5000
    ) {
      game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y)
      return
    }
    game.move(closest.position, 'Libero')
    return
  }

  if (
    sorted.some(spider => {
      if (spider.distance > 5000 && spider.threatFor !== 2) {
        console.log('MOVE', spider.position.x, spider.position.y, 'Libero')
        return true
      }
    })
  ) {
    return
  }

  // Otherwise move towards the closest spider
  // if (game.moveToClosestSpider(hero)) {
  //   return
  // }

  // Go explore
  const isTopLeft = game.base.x === 0
  let min = isTopLeft
    ? defender.maxDistance - 1000
    : game.base.x - libero.maxDistance
  let max = isTopLeft
    ? libero.maxDistance
    : game.base.x - defender.maxDistance + 1000
  const x = random({
    min,
    max,
  })
  min = isTopLeft ? 0 : game.base.y - libero.maxDistance
  max = isTopLeft ? libero.maxDistance : game.base.y
  const y = random({ min, max })
  console.log('MOVE', x, y, 'Libero')
}
