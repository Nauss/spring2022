import { hitDistance, ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import Spider from './Spider'
import Entity from './Entity'
import { computeDistance, Position, random, randomPointOnCircle } from './utils'

const castWind = (
  game: Game,
  closest: Spider,
  hero1: Hero,
  hero2?: Hero,
  one: boolean = false
) => {
  // Correct the angle
  // const x = closest.position.x - hero.position.x
  // const y = hero.position.y - closest.position.y
  // @Todo isTopLeft
  const heroX = game.enemyBase.x - hero1.position.x
  const heroY = game.enemyBase.y - hero1.position.y
  const angle = Math.atan2(heroY, heroX)
  const spiderX = game.enemyBase.x - closest.position.x
  const spiderY = game.enemyBase.y - closest.position.y
  const spiderAngle = Math.atan2(spiderY, spiderX)
  const diff = spiderAngle - angle
  const newY = Math.round(heroX * Math.tan(diff))
  game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y + newY, 'Pusher')
  if (hero2) {
    if (one) {
      game.wait('Pusher')
    } else {
      game.castSpell(
        'WIND',
        game.enemyBase.x,
        game.enemyBase.y + newY,
        'Pusher'
      )
    }
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
const move = (game: Game, target: Position, hero2: Hero) => {
  game.move(target, 'Pusher')
  if (hero2) {
    game.move(target, 'Pusher')
  }
}
const moveToFuture = (game: Game, target: Entity, hero2: Hero) => {
  let avoidSpider = {
    x: target.position.x,
    y: target.position.y,
  }
  const nextPosition = {
    x: target.position.x + avoidSpider.x + target.vx,
    y: target.position.y + avoidSpider.y + target.vy,
  }
  const spiderNextPosition = {
    x: target.position.x + target.vx,
    y: target.position.y + target.vy,
  }
  const distance = computeDistance(nextPosition, spiderNextPosition)
  if (distance < hitDistance) {
    avoidSpider = {
      x: avoidSpider.x + hitDistance,
      y: avoidSpider.y + hitDistance,
    }
  }
  game.moveToFuture(target, 'Pusher')
  if (hero2) {
    game.moveToFuture(target, 'Pusher')
  }
}

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
  const inShieldRange = byDistance.filter(
    ({ spider, distance }) =>
      spider.shieldLife === 0 && distance <= ranges.shield
  )
  if (game.nextMove) {
    const { spell } = game.nextMove
    if (spell === 'MOVE') {
      if (
        inShieldRange.length &&
        inShieldRange[0].spider.enemyBaseDistance < 4000 &&
        game.mana >= 10
      ) {
        console.error('Pusher next move SHIELD')
        castShield(game, inShieldRange[0].spider.id)
        if (hero2) {
          if (
            inShieldRange.length > 1 &&
            inShieldRange[1].spider.enemyBaseDistance < 4000
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
      if (inWindRange.length && game.mana >= 10) {
        console.error('Pusher next move WIND')
        castWind(game, inWindRange[0].spider, hero1, hero2)
        game.nextMove = undefined
        return
      }
      console.error('Pusher next move MOVE')
      move(game, game.enemyBase, hero2)
      if (hero1.enemyBaseDistance > 4200) {
        game.nextMove = { spell: 'MOVE' }
      } else {
        game.nextMove = undefined
      }
      return
    } else if (spell === 'CONTROL') {
      console.error('Pusher next move CONTROL')
      castControl(game, game.nextMove.enemyId, hero2)
      const closestEnemy = game.enemies.find(
        enemy => enemy.id === game.nextMove.enemyId
      )
      if (closestEnemy.enemyBaseDistance > 4000 || game.mana < 20) {
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
  if (hero1.enemyBaseDistance > 9000) {
    if (
      inWindRange.some(({ spider, distance }) => {
        if (
          distance < ranges.control &&
          spider.threatFor !== 2 &&
          spider.distance > 9500
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
    move(game, game.enemyBase, hero2)
    return
  }
  // Find the spider closest to the enemy base
  if (inWindRange.length >= 1) {
    const closestToEnemyBase = inWindRange.sort((a, b) => {
      if (a.spider.enemyBaseDistance < b.spider.enemyBaseDistance) return -1
      if (a.spider.enemyBaseDistance > b.spider.enemyBaseDistance) return 1
      return 0
    })[0]
    if (game.mana >= 20) {
      if (
        closestToEnemyBase.spider.enemyBaseDistance < 7000
        // &&
        // (closestToEnemyBase.spider.health >= 12 ||
        //   closestToEnemyBase.spider.enemyBaseDistance < 4000)
      ) {
        console.error('Pusher closest wind')
        castWind(game, closestToEnemyBase.spider, hero1, hero2, true)
        game.nextMove = {
          spell: 'MOVE',
        }
        return
      }
    }
  }
  if (byDistance.length) {
    const { spider, distance } = byDistance[0]
    if (distance > ranges.wind) {
      console.error('Pusher moveToFuture to closest')
      moveToFuture(game, spider, hero2)
      return
    }
  }
  // Control
  const enemyThreats = hero1.spiders.filter(spider => {
    return spider.threatFor === 2 && spider.distance < 4000
  })
  if (enemyThreats.length >= 3) {
    const enemyInBase = game.enemies.filter(enemy => {
      return enemy.enemyBaseDistance < 4000
    })
    if (enemyInBase.length) {
      const closestEnemy = enemyInBase.sort((a, b) => {
        const aDistance = computeDistance(hero1.position, a.position)
        const bDistance = computeDistance(hero1.position, b.position)
        if (aDistance < bDistance) return -1
        if (aDistance > bDistance) return 1
        return 0
      })[0]
      const distance = computeDistance(hero1.position, closestEnemy.position)
      if (distance < ranges.control && game.mana >= 20) {
        console.error('Pusher control enemy')
        castControl(game, closestEnemy.id, hero2)
        game.nextMove = {
          spell: 'CONTROL',
          enemyId: closestEnemy.id,
        }
        return
      }
    }
  }
  // // @Todo Determine the future position of the spider
  // const destination = {
  //   x: spider.position.x + spider.vx,
  //   y: spider.position.y + spider.vy,
  // }
  // game.move(destination, 'Pusher')
  // game.move(destination, 'Pusher')
  // return
  const position = randomPointOnCircle(game.enemyBase, 6000)
  console.error('Pusher move random')
  move(game, position, hero2)
  return
  // // Out of the base
  // if (hero1.enemyBaseDistance < 4000) {
  //   game.move(game.base, 'Pusher')
  //   game.move(game.base, 'Pusher')
  //   return
  // }

  // // New random position close by
  // const destination = {
  //   x: random({
  //     min: hero1.position.x - ranges.wind / 2,
  //     max: hero1.position.x + ranges.wind / 2,
  //   }),
  //   y: random({
  //     min: hero1.position.y - ranges.wind / 2,
  //     max: hero1.position.y + ranges.wind / 2,
  //   }),
  // }

  // game.move(destination, 'Pusher')
  // game.move(destination, 'Pusher')
}
