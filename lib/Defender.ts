import { defender, ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import { computeDistance, random } from './utils'

export const moveDefender = (game: Game, hero: Hero) => {
  if (game.stayShieled(hero)) {
    return
  }
  if (game.stayInBase(hero)) {
    return
  }
  // Defend
  const spidersByDistance = [...game.spiders].sort((a, b) => {
    if (a.distance < b.distance) return -1
    if (a.distance > b.distance) return 1
    return 0
  })
  // Threat first
  // At least 3 threats for wind
  let nbThreats = 0
  const threatSpiders = spidersByDistance.filter(({ threat }) => threat > 0)
  if (
    threatSpiders.some(spider => {
      const { position, distance, health, shieldLife } = spider
      const spiderDistance = computeDistance(hero.position, position)
      if (
        shieldLife === 0 &&
        spiderDistance <= ranges.wind &&
        game.mana >= 10 &&
        health > 6 &&
        distance < 3500
      ) {
        nbThreats++
        if (nbThreats >= 3 || distance < 2500) {
          game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y)
          return true
        }
      } else {
        game.move(position, 'Defender')
        return true
      }
    })
  ) {
    return
  } else if (nbThreats) {
    game.move(threatSpiders[0].position, 'Defender')
    return true
  }
  // Shield if enemy close by
  // if (
  //   hero.shieldLife === 0 &&
  //   game.mana >= 30 &&
  //   game.enemies.some(enemy => {
  //     const enemyDistance = computeDistance(hero.position, enemy.position)
  //     if (enemyDistance <= ranges.wind || enemyDistance <= ranges.control) {
  //       game.castSpell('SHIELD', hero.id)
  //       return true
  //     }
  //   })
  // ) {
  //   return
  // }

  // Otherwise move towards the closest spider
  if (game.moveToClosestSpider(hero)) {
    return
  }
  // Go explore
  const isTopLeft = game.base.x === 0
  let min = isTopLeft ? 0 : game.base.x - defender.maxDistance
  let max = isTopLeft ? defender.maxDistance : game.base.x
  const x = random({
    min,
    max,
  })
  min = isTopLeft ? 0 : game.base.y - defender.maxDistance
  max = isTopLeft ? defender.maxDistance / 2 : game.base.y
  const y = random({ min, max })
  game.move({ x, y }, 'Defender')
}
