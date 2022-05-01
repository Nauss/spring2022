import { hitDistance, moveStep, ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import Spider from './Spider'
import {
  computeDistance,
  Position,
  random,
  randomPointToEnemyBase,
} from './utils'

const castWind = ({
  game,
  closest,
  hero1,
  hero2,
  limit = false,
  one = false,
}: {
  game: Game
  closest: Spider
  hero1: Hero
  hero2?: Hero
  limit?: boolean
  one?: boolean
}) => {
  const isTopLeft = game.base.x === 0
  const targetInBase = {
    x: game.enemyBase.x + (isTopLeft ? -300 : 300),
    y: game.enemyBase.y + (isTopLeft ? -300 : 300),
  }
  // Correct the angle
  const heroX = targetInBase.x - hero1.position.x
  const heroY = targetInBase.y - hero1.position.y
  const angle = Math.atan2(heroY, heroX)
  const spiderX = targetInBase.x - closest.position.x
  const spiderY = targetInBase.y - closest.position.y
  const spiderAngle = Math.atan2(spiderY, spiderX)
  const diff = spiderAngle - angle
  const deltaY = Math.round(heroX * Math.tan(diff))
  game.castSpell('WIND', targetInBase.x, targetInBase.y + deltaY, 'Pusher')
  if (hero2) {
    if (one) {
      game.wait('Pusher')
    }
    // else {
    //   game.castSpell(
    //     'WIND',
    //     game.enemyBase.x,
    //     game.enemyBase.y + newY,
    //     'Pusher'
    //   )
    // }
  }
}
const castControl = (game: Game, spiderId: number, hero2: Hero) => {
  game.castSpell('CONTROL', spiderId, game.enemyBase.x, game.enemyBase.y)
  if (hero2) {
    game.wait('Pusher')
  }
}
const castShield = (game: Game, spiderId: number) => {
  game.castSpell('SHIELD', spiderId)
}
const move = (game: Game, target: Position, hero1: Hero, hero2: Hero) => {
  // const newTarget = game.avoidSpiders(hero1, target)
  const newTarget = target
  game.move(newTarget, 'Pusher')
  if (hero2) {
    game.move(newTarget, 'Pusher')
  }
}
const moveToSpider = (
  game: Game,
  target: Position,
  hero1: Hero,
  hero2: Hero
) => {
  const newTarget = game.avoidSpiders(hero1, target)
  game.move(newTarget, 'Pusher')
  if (hero2) {
    game.move(newTarget, 'Pusher')
  }
}
// const moveToFuture = (game: Game, target: Entity, hero2: Hero) => {
//   game.moveToFuture(target, 'Pusher')
//   if (hero2) {
//     game.moveToFuture(target, 'Pusher')
//   }
// }

export const movePusher = (game: Game, hero1: Hero, hero2?: Hero) => {
  const byDistance = hero1.spiders
    .map(spider => {
      const distance = computeDistance(hero1.position, spider.position)
      return { spider, distance }
    })
    .sort((a, b) => {
      if (a.distance < b.distance) return -1
      if (a.distance > b.distance) return 1
      return 0
    })
  const inWindRange = byDistance.filter(
    ({ distance }) => distance <= ranges.wind
  )
  const inWindRangeNext = byDistance.filter(
    ({ distance }) => distance <= ranges.wind + moveStep
  )
  const inShieldRange = byDistance.filter(
    ({ spider, distance }) =>
      spider.shieldLife === 0 && distance <= ranges.shield
  )
  const inControldRange = byDistance.filter(
    ({ spider, distance }) =>
      spider.shieldLife === 0 && distance <= ranges.control
  )
  if (game.nextMove) {
    const { spell } = game.nextMove
    if (spell === 'MOVE') {
      // if (hero1.enemyBaseDistance > 3000) {
      //   console.error('Pusher next move MOVE')
      //   move(game, game.enemyBase, hero1, hero2)
      //   game.nextMove = undefined
      //   return
      // }
      if (inWindRange.length && game.mana >= 10) {
        console.error('Pusher next move WIND')
        castWind({
          game,
          closest: inWindRange[0].spider,
          hero1,
          hero2,
          one: true,
        })
        game.nextMove = undefined
        return
      }
      if (
        inShieldRange.length &&
        inShieldRange[0].spider.enemyBaseDistance < 3500 &&
        inShieldRange[0].spider.health > 12 &&
        game.mana >= 10
      ) {
        console.error('Pusher next move SHIELD')
        castShield(game, inShieldRange[0].spider.id)
        if (hero2) {
          if (
            inShieldRange.length > 1 &&
            inShieldRange[1].spider.enemyBaseDistance < 3500
          ) {
            console.error('Pusher next move SHIELD 2')
            castShield(game, inShieldRange[1].spider.id)
          } else {
            console.error('Pusher next move WAIT')
            game.wait('Pusher')
          }
        }
        game.nextMove = undefined
        return
      }
    } else if (spell === 'CONTROL') {
      console.error('Pusher next move CONTROL')
      castControl(game, game.nextMove.enemyId, hero2)
      const closestEnemy = game.enemies.find(
        enemy => enemy.id === game.nextMove.enemyId
      )
      if (closestEnemy.enemyBaseDistance > 4000 || game.mana < 10) {
        game.nextMove = undefined
      }
      return
    }
    // else if (spell === 'WIND') {
    //   if (inWindRange.length) {
    //     castWind(game, inWindRange[0].spider, hero1)
    //     game.nextMove = undefined
    //     return
    //   }
    //   if (hero1.enemyBaseDistance > 3000) {
    //     game.nextMove = { spell: 'MOVE' }
    //   }
    // }
  }
  // Be one
  // const distanceBetweenheroes = computeDistance(hero1.position, hero2.position)
  // if (distanceBetweenheroes > 400) {
  //   if (hero1.enemyBaseDistance < hero2.enemyBaseDistance) {
  //     game.wait('Pusher')
  //     game.move(hero1.position, 'Pusher')
  //     return
  //   } else {
  //     game.move(hero2.position, 'Pusher')
  //     game.wait('Pusher')
  //     return
  //   }
  // }
  // Go towards enemy base
  if (hero1.enemyBaseDistance > 8000) {
    if (
      inWindRange.some(({ spider, distance }) => {
        if (
          game.mana >= 60 &&
          distance > hitDistance &&
          distance < ranges.control &&
          spider.threatFor !== 2 &&
          spider.distance > 9500 &&
          spider.health >= 12
        ) {
          console.error('Pusher towards enemy base control')
          castControl(game, spider.id, hero2)
          return true
        }
        return false
      })
    ) {
      return
    }
    console.error('Pusher towards enemy base')
    move(game, game.enemyBase, hero1, hero2)
    return
  }
  // Try to stack the spiders
  if (inWindRange.length && inWindRange.length < inWindRangeNext.length) {
    const spider = inWindRangeNext[inWindRange.length].spider
    move(
      game,
      {
        x: Math.round(spider.position.x + spider.vx * 2.2),
        y: Math.round(spider.position.y + spider.vy * 2.2),
      },
      hero1,
      hero2
    )
    return
  }
  // Find the spider closest to the enemy base
  if (
    (inWindRange.length >= 1 &&
      inWindRange[0].spider.enemyBaseDistance < 6500) ||
    inWindRange.length >= 2
  ) {
    const { spider } = inWindRange.sort((a, b) => {
      if (a.spider.enemyBaseDistance < b.spider.enemyBaseDistance) return -1
      if (a.spider.enemyBaseDistance > b.spider.enemyBaseDistance) return 1
      return 0
    })[0]
    if (game.mana >= 10) {
      if (
        spider.enemyBaseDistance < 6500 &&
        spider.shieldLife === 0
        // &&
        // (spider.health >= 12 ||
        //   spider.enemyBaseDistance < 4000)
      ) {
        console.error('Pusher closest wind')
        castWind({
          game,
          closest: spider,
          hero1,
          hero2,
          one: true,
          limit: true,
        })
        game.nextMove = {
          spell: 'MOVE',
        }
        return
      }
    }
  }
  // Control
  if (
    inControldRange.some(({ spider }) => {
      if (spider.threatFor !== 2 && spider.health < 14 && game.mana >= 20) {
        console.error('Pusher control spider')
        castControl(game, spider.id, hero2)
        // game.nextMove = {
        //   spell: 'CONTROL',
        //   enemyId: spider.id,
        // }
        return true
      }
    })
  ) {
    return
  }

  // Wait if spiders are close and coming
  // if (
  //   hero1.spiders.some(spider => {
  //     const distance = computeDistance(spider.position, hero1.position)
  //     const nextDistance = computeDistance(
  //       {
  //         x: spider.position.x + spider.vx,
  //         y: spider.position.y + spider.vy,
  //       },
  //       hero1.position
  //     )
  //     if (spider.enemyBaseDistance < 5000 && nextDistance <= ranges.wind) {
  //       game.wait('Pusher')
  //       return true
  //     }
  //   })
  // ) {
  //   return
  // }

  if (byDistance.length) {
    const closest = byDistance[0]
    const enemiesInSpiderRange = game.enemies.filter(enemy => {
      const distance = computeDistance(enemy.position, closest.spider.position)
      return distance <= 800
    })
    const nbTurnsToBase = game.turnToBase(closest.spider)
    const nextDistance =
      computeDistance(closest.spider.position, hero1.position) - 800
    if (
      closest.spider.shieldLife === 0 &&
      nextDistance > 800 &&
      closest.spider.health >
        (enemiesInSpiderRange.length
          ? enemiesInSpiderRange.length * nbTurnsToBase * 2
          : 0)
    ) {
      const nextSpiderPosition = {
        x: closest.spider.position.x,
        y: closest.spider.position.y,
      }
      // if (game.base.x !== 0) {
      //   position = {
      //     x: closest.spider.position.x + (closest.spider.vx + 200),
      //     y: closest.spider.position.y + (closest.spider.vy + 200),
      //   }
      // }
      // const nextDistance =
      //   computeDistance(nextSpiderPosition, hero1.position) - 800
      // const restricted =
      //   nextDistance <= 800
      //     ? game.restrictDistance(hero1.position, nextSpiderPosition, 780)
      //     : nextSpiderPosition
      const restricted = game.restrictDistance(
        hero1.position,
        nextSpiderPosition,
        780
      )
      console.error({
        // nextDistance,
        spiderPosition: closest.spider.position,
        nextSpiderPosition,
        restricted,
      })
      const nextEnemyBaseDistance = computeDistance(restricted, game.enemyBase)
      if (nextEnemyBaseDistance < 7500) {
        game.move(restricted, 'Pusher to closest restricted')
        return
      }
    }
  }

  // Go to random point
  randomPointToEnemyBase(game, hero1, hero2)
  return
}
