import { defender, libero, ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import { computeDistance, random } from './utils'

export const moveLibero = (game: Game, hero: Hero) => {
  // Handle next move
  if (game.nextMove[hero.id]) {
    const { spell, target } = game.nextMove[hero.id]
    if (spell === 'CONTROL') {
      const enemy = game.enemies.find(e => e.id === target)
      if (enemy) {
        const enemyDistance = computeDistance(hero.position, enemy.position)
        if (game.mana >= 10 && enemyDistance <= ranges.control) {
          game.castSpell(
            'CONTROL',
            enemy.id,
            game.enemyBase.x,
            game.enemyBase.y
          )
          return
        }
      } else if (spell === 'WIND') {
        if (game.mana >= 10) {
          game.castSpell('WIND', target.x, target.y)
          return
        }
      }
    }
  }
  // Control a hero getting to close to base
  if (
    game.mana >= 70 &&
    game.enemies.some(h => {
      if (h.isControlled !== 0 || h.shieldLife !== 0) return false
      const enemyToHeroDistance = computeDistance(h.position, hero.position)
      if (enemyToHeroDistance <= ranges.control && h.distance < 5500) {
        game.castSpell('CONTROL', h.id, game.enemyBase.x, game.enemyBase.y)
        game.nextMove[h.id] = { spell: 'CONTROL', target: h }
        return true
      } else if (
        // Too far to cast spell > move towards the enemy
        enemyToHeroDistance > ranges.control
      ) {
        game.move(h.position, 'Libero')
        return true
      }
    })
  ) {
    return
  }
  // Or 2 heroes in the same position
  if (game.mana >= 50) {
    // Compute the distances between enemies
    const distances = game.enemies
      .flatMap(e1 =>
        game.enemies.map(e2 => ({
          position: e1.position,
          distance:
            e1.id !== e2.id
              ? computeDistance(e1.position, e2.position)
              : Number.NaN,
        }))
      )
      .filter(({ distance }) => !isNaN(distance))
    console.error(distances)
    if (
      distances.some(({ distance, position }) => {
        if (distance > 200) return false
        const distanceToEnemy = computeDistance(hero.position, position)
        if (distanceToEnemy < ranges.wind) {
          game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y)
          game.nextMove[hero.id] = { spell: 'WIND', target: game.enemyBase }
          return true
        } else {
          game.move(position, 'Libero')
          return true
        }
      })
    ) {
      return
    }
  }
  // Control the mid-range spiders
  if (
    game.canAttack &&
    game.mana >= 40 &&
    game.spiders.some(spider => {
      const spiderDistance = computeDistance(hero.position, spider.position)
      const spiderBaseDistance = computeDistance(game.base, spider.position)
      if (
        spider.isControlled === 0 &&
        spider.shieldLife === 0 &&
        spider.threatFor !== 2 &&
        spiderBaseDistance > 5000
      ) {
        if (spiderDistance <= ranges.control) {
          game.castSpell(
            'CONTROL',
            spider.id,
            game.enemyBase.x,
            game.enemyBase.y
          )
          return true
        }
        // else {
        //   game.move(spider.position, 'Libero')

        //   return true
        // }
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
      closest.distance < 2500
    ) {
      game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y)
      return
    }
    game.move(closest.position, 'Libero')
    return
  }

  // Otherwise move towards the closest spider
  if (
    sorted.some(spider => {
      if (
        spider.distance > 5000 &&
        spider.distance < 10000 &&
        spider.threatFor !== 2
      ) {
        game.move(spider.position, 'Libero')
        return true
      }
    })
  ) {
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
