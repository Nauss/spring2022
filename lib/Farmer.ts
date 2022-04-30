import { ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import { computeDistance, random, randomPointOnCircle } from './utils'

const farmPositions = {
  topLeft: {
    0: {
      x: 6500,
      y: 1500,
    },
    1: {
      x: 5500,
      y: 4000,
    },
    2: {
      x: 1500,
      y: 6500,
    },
  },
  bottomRight: {
    0: {
      x: 11000,
      y: 6500,
    },
    1: {
      x: 12000,
      y: 5000,
    },
    2: {
      x: 14000,
      y: 3000,
    },
  },
}
export const moveFarmer = (game: Game, hero: Hero) => {
  const isTopLeft = game.base.x === 0
  let position = isTopLeft
    ? farmPositions.topLeft[hero.id]
    : farmPositions.bottomRight[hero.id]
  // handle absolute threats with a wind
  const absoluteThreats = game.absoluteThreats(game.spiders)
  if (absoluteThreats.length > 0) {
    const spider = absoluteThreats[0]
    const spiderDistance = computeDistance(hero.position, spider.position)
    if (game.mana >= 10 && spiderDistance <= ranges.wind) {
      console.error('Farmer wind absolute threat')
      game.castSpell('WIND', game.enemyBase.x, game.enemyBase.y)
      return
    }
  }
  // Go to closest threat
  const byBaseDistance = hero.spiders
    .sort((a, b) => {
      if (a.distance < b.distance) return -1
      if (a.distance > b.distance) return 1
      return 0
    })
    .filter(({ threatFor }) => threatFor === 1)
  if (byBaseDistance.length) {
    const closest = byBaseDistance[0]
    console.error('Farmer to closest threat')
    game.moveToFuture(closest, 'Farmer')
    return
  }
  // Go to closest spider
  const byDistance = hero.spiders
    .map(spider => {
      let distance = computeDistance(hero.position, spider.position)
      const toPosition = computeDistance(position, spider.position)
      if (toPosition > 3500) {
        return null
      }
      return { spider, distance }
    })
    .filter(o => o && o.distance < 8500 && o.spider.threatFor !== 2)
    .sort((a, b) => {
      if (a.distance < b.distance) return -1
      if (a.distance > b.distance) return 1
      return 0
    })
  if (byDistance.length) {
    const closest = byDistance[0]
    console.error('Farmer to closest spider')
    game.moveToFuture(closest.spider, 'Farmer')
    return
  } else {
    // position.x += random({ min: -1100, max: 1100 })
    // position.y += random({ min: -1100, max: 1100 })
    console.error('Farmer to position', position)
    game.move(position, 'Farmer')
    return
  }
}
