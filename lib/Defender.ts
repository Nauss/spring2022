import { ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import { computeDistance, random } from './utils'

export const moveDefender = (game: Game, hero: Hero) => {
  // if (game.stayShieled(hero)) {
  //   return
  // }
  if (game.stayInBase(hero, 'Defender')) {
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
  const threatSpiders = spidersByDistance.filter(
    ({ threatFor }) => threatFor === 1
  )
  const absoluteThreats = game.absoluteThreats(game.spiders)
  if (
    threatSpiders.some(spider => {
      const { position, distance, health, shieldLife } = spider
      const spiderDistance = computeDistance(hero.position, position)
      if (
        shieldLife === 0 &&
        spiderDistance <= ranges.wind &&
        (game.mana >= 40 || absoluteThreats.length) &&
        (health > 6 || absoluteThreats.length) &&
        distance < 3000
      ) {
        nbThreats++
        if (nbThreats >= 3 || absoluteThreats.length) {
          game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y)
          return true
        }
      } else {
        game.move(position, 'Defender to wind')
        return true
      }
    })
  ) {
    return
  } else if (nbThreats) {
    game.move(threatSpiders[0].position, 'Defender to threat')
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
  if (game.moveToClosestSpider(hero, 'Defender closest')) {
    return
  }
  // Go explore
  const isTopLeft = game.base.x === 0
  let min = isTopLeft ? 0 : game.base.x - Game.defender.maxDistance
  let max = isTopLeft ? Game.defender.maxDistance : game.base.x
  const x = random({
    min,
    max,
  })
  min = isTopLeft ? 0 : game.base.y - Game.defender.maxDistance
  max = isTopLeft ? Game.defender.maxDistance / 2 : game.base.y
  const y = random({ min, max })
  game.move({ x, y }, 'Defender random')
}
