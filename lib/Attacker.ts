import { positions, ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import { computeDistance, random } from './utils'

export const moveAttacker = (game: Game, hero: Hero) => {
  // Handle next move
  if (game.nextMove[hero.id]) {
    const { spell, target } = game.nextMove[hero.id]
    const enemy = game.enemies.find(e => e.id === target)
    if (enemy) {
      const enemyDistance = computeDistance(hero.position, enemy.position)
      if (game.mana >= 10 && enemyDistance <= ranges.control) {
        game.castSpell('CONTROL', enemy.id, game.base.x, game.base.y)
        return
      }
    }
  }
  // Farm mana
  if (!game.canAttack && game.spiders.length) {
    const sorted = game.spiders
      .map(spider => {
        const spiderDistance = computeDistance(hero.position, spider.position)
        return {
          ...spider,
          spiderDistance,
        }
      })
      .sort((a, b) => {
        if (a.spiderDistance < b.spiderDistance) return -1
        if (a.spiderDistance > b.spiderDistance) return 1
        return 0
      })
    const closest = sorted[0]
    game.move(closest.position, 'Attacker farming')
    return
  }

  // Control if a spider is close
  if (
    game.spiders.some(spider => {
      const spiderDistance = computeDistance(hero.position, spider.position)
      if (
        spider.isControlled === 0 &&
        spider.shieldLife === 0 &&
        spider.threatFor !== 2 &&
        spiderDistance <= ranges.control &&
        game.mana >= 30 &&
        spider.health > 15
      ) {
        game.castSpell('CONTROL', spider.id, game.enemyBase.x, game.enemyBase.y)
        return true
      }
    })
  ) {
    return
  }

  // Shield on a spider going to the enemy base
  let alreadyShielded = 0
  if (
    game.spiders.some(spider => {
      const spiderDistance = computeDistance(hero.position, spider.position)
      const spiderToEnemyBase = computeDistance(spider.position, game.enemyBase)
      if (spiderToEnemyBase < 5000 && spider.shieldLife > 0) {
        alreadyShielded++
      }
      if (alreadyShielded > 3) return false
      if (
        spider.threatFor === 2 &&
        spiderToEnemyBase < 5000 &&
        game.mana >= 20 &&
        spider.isControlled === 0 &&
        spider.shieldLife === 0 &&
        spider.health > 10
      )
        if (spiderDistance <= ranges.shield) {
          game.castSpell('SHIELD', spider.id)
          return true
        } else {
          // Go towards the spider
          game.move(spider.position, 'Attacker spider control')
          return true
        }
    })
  ) {
    return
  }

  // Wind the not shielded spiders going to the enemy base
  let spidersToWind = game.enemiesInEnemyBase + 1
  if (
    game.spiders.some(spider => {
      const spiderDistance = computeDistance(hero.position, spider.position)
      const spiderToEnemy = computeDistance(game.enemyBase, spider.position)
      if (spider.shieldLife === 0 && game.mana >= 10 && spiderToEnemy < 6500) {
        if (spiderDistance <= ranges.wind) {
          spidersToWind--
          if (spidersToWind === 0) {
            game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y)
            return true
          }
        }
        game.move(spider.position, 'Attacker spider wind')
        return true
      }
    })
  ) {
    return
  }

  // Control on the enemy hero
  const threatsToEnemy = game.spiders.filter(
    spider => spider.nearBase && spider.threatFor === 2
  )
  if (
    threatsToEnemy.length > 1 &&
    game.enemies.some(enemy => {
      const threat = threatsToEnemy[0]
      if (enemy.isControlled !== 0 || enemy.shieldLife !== 0) return false
      const enemyDistance = computeDistance(hero.position, enemy.position)
      const threatDistance = computeDistance(hero.position, threat.position)
      if (game.mana >= 20 && enemy.enemyBaseDistance < 6000) {
        if (enemyDistance <= ranges.control) {
          game.castSpell('CONTROL', enemy.id, game.base.x, game.base.y)
          game.nextMove[hero.id] = {
            spell: 'CONTROL',
            target: enemy.id,
          }
          return true
        } else if (
          threatDistance > ranges.wind &&
          enemyDistance <= ranges.wind
        ) {
          game.castSpell('WIND', game.base.x, game.base.y)
          return true
        }
        //  else {
        //   // Go towards the enemy
        //   game.move(enemy.position, 'Attacker')
        //   return true
        // }
      }
    })
  ) {
    return
  }

  if (game.avoidSpiders_old(hero)) {
    return
  }

  // Otherwise move towards the closest spider on the enemy side
  if (game.spiders.length) {
    let closest
    let closestDistance = Number.POSITIVE_INFINITY
    game.spiders.forEach(spider => {
      const spiderDistance = computeDistance(hero.position, spider.position)
      const spiderToEnemyBaseDistance = computeDistance(
        spider.position,
        game.enemyBase
      )
      if (
        spider.threatFor !== 2 &&
        spider.enemyBaseDistance > 3000 &&
        spider.enemyBaseDistance < 8500 &&
        spider.enemyBaseDistance < closestDistance
      ) {
        closest = spider
        closestDistance = spider.enemyBaseDistance
      }
    })
    if (closest) {
      game.move(closest.position, 'Attacker to closest')
      return true
    }
  }

  // Find spiders
  const squareSize = 3000
  const baseTolerance = 4000
  const isTopLeft = game.base.x === 0
  let min = isTopLeft
    ? game.enemyBase.x - baseTolerance - squareSize
    : baseTolerance
  let max = isTopLeft
    ? game.enemyBase.x - baseTolerance
    : baseTolerance + squareSize
  const x = random({
    min,
    max,
  })
  min = isTopLeft ? game.enemyBase.y - baseTolerance : 0
  max = isTopLeft ? game.enemyBase.y : baseTolerance
  const y = random({
    min,
    max,
  })
  game.move({ x, y }, 'Attacker to base')

  // Always move to the enemy base
  // if (hero.enemyBaseDistance > 4500) {
  //   game.move(game.enemyBase, 'Attacker to enemy')
  // } else {
  //   // Or back if too close
  //   game.move(game.base, 'Attacker to base')
  // }
}
