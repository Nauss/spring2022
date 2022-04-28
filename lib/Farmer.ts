import { defender, ranges } from './constants'
import Game from './Game'
import Hero from './Hero'
import { computeDistance, random } from './utils'

const farmPositions = {
  topLeft: {
    0: {
      x: 7000,
      y: 2000,
    },
    1: {
      x: 5500,
      y: 4000,
    },
    2: {
      x: 2000,
      y: 7000,
    },
  },
  bottomRight: {
    0: {
      x: 11000,
      y: 7000,
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
  // Go to closest spider
  const byDistance = game.spiders
    .map((spider) => {
      const distance = computeDistance(hero.position, spider.position)
      return { spider, distance }
    })
    .sort((a, b) => {
      if (a.distance < b.distance) return -1
      if (a.distance > b.distance) return 1
      return 0
    })
    .filter(({ distance }) => distance < 2000)
  if (byDistance.length) {
    game.move(byDistance[0].spider.position, 'Farmer')
  } else {
    const isTopLeft = game.base.x === 0
    game.move(
      isTopLeft
        ? farmPositions.topLeft[hero.id]
        : farmPositions.bottomRight[hero.id],
      'Farmer'
    )
  }
}
