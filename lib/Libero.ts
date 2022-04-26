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
  TODO
  if (
    game.canAttack &&
    game.mana >= 50 &&
    game.spiders.some(spider => {
      const spiderDistance = computeDistance(hero.position, spider.position)
      const spiderToEnemy = computeDistance(game.enemyBase, spider.position)
      if (
        spider.isControlled === 0 &&
        spider.shieldLife === 0 &&
        spider.threatFor !== 2 &&
        spiderDistance <= ranges.control &&
        spiderToEnemy < 8500
      ) {
        game.castSpell('CONTROL', spider.id, game.enemyBase.x, game.enemyBase.y)
        return true
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
  // Move to second closest threat
  // (The defender will move to the closest threat)
  if (threats.length > 1) {
    const closest = threats[1]
    if (closest.liberoDistance <= ranges.wind && game.mana >= 30) {
      game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y)
      return
    }
    console.log('MOVE', closest.position.x, closest.position.y, 'Libero')
    return
  }
  if (sorted.length) {
    const closest = sorted[0]
    console.log('MOVE', closest.position.x, closest.position.y, 'Libero')
    return
  }

  // Otherwise move towards the closest spider
  if (game.moveToClosestSpider(hero)) {
    return
  }

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
