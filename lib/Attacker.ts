import { positions, ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import { computeDistance, random } from './utils'

export const moveAttacker = (game: Game, hero: Hero) => {
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
      const spiderToEnemy = computeDistance(game.enemyBase, spider.position)
      if (
        spider.isControlled === 0 &&
        spider.shieldLife === 0 &&
        spider.threatFor !== 2 &&
        spiderDistance <= ranges.control &&
        game.mana >= 40 &&
        spiderToEnemy < 8500
      ) {
        game.castSpell('CONTROL', spider.id, game.enemyBase.x, game.enemyBase.y)
        return true
      }
    })
  ) {
    return
  }

  // Shield on a spider going to the enemy base
  if (
    game.spiders.some(spider => {
      const spiderDistance = computeDistance(hero.position, spider.position)
      const spiderToEnemyBase = computeDistance(spider.position, game.enemyBase)
      if (
        spider.threatFor === 2 &&
        spiderToEnemyBase < 5500 &&
        game.mana >= 50 &&
        spider.isControlled === 0 &&
        spider.shieldLife === 0
      )
        if (spiderDistance <= ranges.shield) {
          game.castSpell('SHIELD', spider.id)
          return true
        }
      // else {
      //   // Go towards the spider
      //   game.move(spider.position, 'Attacker spider control')
      //   return true
      // }
    })
  ) {
    return
  }

  // Wind the not shielded spiders going to the enemy base
  if (
    game.spiders.some(spider => {
      const spiderDistance = computeDistance(hero.position, spider.position)
      const spiderToEnemy = computeDistance(game.enemyBase, spider.position)
      if (spider.shieldLife === 0 && game.mana >= 30 && spiderToEnemy < 8500) {
        if (spiderDistance <= ranges.wind) {
          game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y)
          return true
        }
        //  else {
        //   game.move(spider.position, 'Attacker spider wind')
        //   return true
        // }
      }
    })
  ) {
    return
  }

  // Control on the enemy hero
  // const threatsToEnemy = game.spiders.filter(
  //   spider => spider.nearBase && spider.threatFor === 2
  // )
  // if (
  //   threatsToEnemy.length > 0 &&
  //   game.enemies.some(enemy => {
  //     const threat = threatsToEnemy[0]
  //     if (enemy.isControlled !== 0 || enemy.shieldLife !== 0) return false
  //     const enemyDistance = computeDistance(hero.position, enemy.position)
  //     const threatDistance = computeDistance(hero.position, threat.position)
  //     if (game.mana >= 20 && enemy.enemyBaseDistance < 4000) {
  //       if (threatDistance <= ranges.wind && enemyDistance <= ranges.control) {
  //         game.castSpell('CONTROL', enemy.id, game.base.x, game.base.y)
  //         return true
  //       } else if (
  //         threatDistance > ranges.wind &&
  //         enemyDistance <= ranges.wind
  //       ) {
  //         game.castSpell('WIND', game.base.x, game.base.y)
  //         return true
  //       } else {
  //         // Go towards the enemy
  //         game.move(enemy.position, 'Attacker')
  //         return true
  //       }
  //     }
  //   })
  // ) {
  //   return
  // }

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
        spider.enemyBaseDistance > 5200 &&
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

  // Always move to the enemy base
  if (hero.enemyBaseDistance > 4500) {
    game.move(game.enemyBase, 'Attacker to enemy')
  } else {
    // Or back if too close
    game.move(game.base, 'Attacker to base')
  }
}
