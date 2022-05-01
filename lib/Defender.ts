import { positions, ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import Spider from './Spider'
import { computeDistance, random, randomDefensePoint } from './utils'

const pi8 = Math.PI / 8
const pi6 = Math.PI / 6

const castWind = (game: Game, hero: Hero, spider: Spider, enemy?: Hero) => {
  const isTopLeft = game.base.x === 0
  let direction = positions.center
  // Correct the angle
  const heroX = spider.position.x - hero.position.x
  const heroY = spider.position.y - hero.position.y
  const angle = Math.atan2(heroY, heroX)
  const spiderX = spider.position.x - game.base.x
  const spiderY = spider.position.y - game.base.y
  const spiderAngle = Math.atan2(spiderY, spiderX)
  let diff = spiderAngle - angle
  // If enemy is in range, try to wind away from him
  if (enemy) {
    const distance = computeDistance(hero.position, enemy.position)
    if (distance <= 2200) {
      const enemyX = enemy.position.x - game.base.x
      const enemyY = enemy.position.y - game.base.y
      const enemyAngle = Math.atan2(enemyY, enemyX)
      if (enemyAngle + pi8 > spiderAngle && enemyAngle - pi8 < spiderAngle) {
        if (isTopLeft) {
          if (diff <= pi6) diff += pi6
          else diff -= pi6
        } else {
          if (diff >= pi6) diff -= pi6
          else diff += pi6
        }
      }
    }
  }
  const deltaY = Math.round(heroX * Math.tan(diff))
  game.castSpell(
    'WIND',
    direction.x,
    direction.y + deltaY,
    'Defender Pre enemy WIND'
  )
}

export const moveDefender = (game: Game, hero1: Hero, hero2?: Hero) => {
  // if (game.stayShieled(hero)) {
  //   return
  // }
  // if (game.stayInBase(hero1, 'Defender stay in base')) {
  //   hero2 && game.stayInBase(hero2, 'Defender stay in base')
  //   return
  // }
  const alreadyWind = game.heroes.find(
    h => h.id === Game.defender.index && h.castWind
  )
  // Defend
  const spidersByDistance = [...game.spiders].sort((a, b) => {
    if (a.distance < b.distance) return -1
    if (a.distance > b.distance) return 1
    return 0
  })
  let inRangeEnemy: Hero | undefined
  const spidersInEnemyWindRange = spidersByDistance.filter(
    ({ position, distance }) => {
      if (
        distance < 6000 &&
        game.enemies.some(enemy => {
          const enemySipderDistance =
            computeDistance(enemy.position, position) - 800
          const heroSipderDistance = computeDistance(hero1.position, position)
          if (
            enemySipderDistance <= ranges.wind &&
            heroSipderDistance <= ranges.wind
          ) {
            inRangeEnemy = enemy
            return true
          }
        })
      ) {
        return true
      }
    }
  )
  if (!alreadyWind && spidersInEnemyWindRange.length && game.mana >= 20) {
    hero1.castWind = true
    castWind(game, hero1, spidersInEnemyWindRange[0], inRangeEnemy!)
    return
  }
  // Threat first
  // At least 3 threats for wind
  let nbThreats = 0
  const threatSpiders = spidersByDistance.filter(
    ({ threatFor }) => threatFor === 1
  )
  const absoluteThreats = game.absoluteThreats(game.spiders)
  if (
    !alreadyWind &&
    threatSpiders.some(spider => {
      const { position, distance, health, shieldLife } = spider
      const spiderDistance = computeDistance(hero1.position, position)
      if (
        shieldLife === 0 &&
        spiderDistance <= ranges.wind &&
        (game.mana >= 20 || (game.mana >= 10 && absoluteThreats.length)) &&
        (health > 6 || absoluteThreats.length) &&
        distance < 3500
      ) {
        nbThreats++
        // Can kill before too late ?
        const nbTurnsToBase = game.turnToBase(spider)
        const nbHitters = game.heroes.filter(hero => {
          const distance = computeDistance(hero.position, position)
          return distance <= ranges.hit
        }).length
        if (spider.health > nbTurnsToBase * nbHitters * 2) {
          hero1.castWind = true
          castWind(game, hero1, spider, inRangeEnemy)
          hero2 &&
            game.castSpell(
              'WIND',
              game.enemyBase.x,
              // game.enemyBase.y,
              0,
              'Defender WIND'
            )
          return true
        }
      }
      //  else {
      //   game.move(position, 'Defender to wind')
      //   return true
      // }
    })
  ) {
    return
  } else if (threatSpiders.length) {
    let spider = threatSpiders[0]
    if (
      spider.distance <= 7500 &&
      hero1.id === Game.libero.index &&
      threatSpiders.length > 1
    ) {
      const second = threatSpiders[1]
      const distanceToSecond = computeDistance(hero1.position, second.position)
      const distanceToFirst = computeDistance(hero1.position, spider.position)
      if (distanceToSecond < distanceToFirst) {
        spider = threatSpiders[1]
      }
    }
    game.move(spider.position, 'Defender to threat')
    hero2 && game.move(spider.position, 'Defender to threat')
    return true
  }

  // Anything to control ?
  if (
    hero1.spiders.some(spider => {
      const spiderDistance = computeDistance(hero1.position, spider.position)
      if (
        spider.threatFor !== 2 &&
        spider.health >= 13 &&
        spider.shieldLife === 0 &&
        spiderDistance <= ranges.control &&
        game.mana >= 20
      ) {
        game.castSpell('CONTROL', spider.id, game.enemyBase.x, game.enemyBase.y)
        return true
      }
    })
  ) {
    return
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
  // if (game.moveToClosestSpider(hero1, 'Defender closest')) {
  //   hero2 && game.moveToClosestSpider(hero1, 'Defender closest')
  //   return
  // }
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
  let nextPosition = randomDefensePoint(
    game,
    5000,
    hero1.id === Game.defender.index ? 'up' : 'down'
  )
  game.move(nextPosition, 'Defender random')
  nextPosition = randomDefensePoint(game, 5000, 'down')
  hero2 && game.move(nextPosition, 'Defender random')
}
