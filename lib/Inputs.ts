import { positions } from './constants'
import Game from './Game'
import Hero from './Hero'
import Spider from './Spider'

class Inputs {
  static instance: Inputs
  static get(): Inputs {
    if (!Inputs.instance) {
      Inputs.instance = new Inputs()
    }
    return Inputs.instance
  }
  static readInit() {
    // @ts-ignore-next-line
    var inputs = readline().split(' ')
    const baseX = parseInt(inputs[0]) // The corner of the map representing your base
    const baseY = parseInt(inputs[1])
    // @ts-ignore-next-line
    const heroesPerPlayer = parseInt(readline()) // Always 3
    const game = Game.get()
    game.health = 0
    game.mana = 0
    game.base = { x: baseX, y: baseY }
    game.enemyBase = baseX === 0 ? positions.bottomRight : positions.topLeft
  }

  static readTurn() {
    const game = Game.get()
    game.resetEntities()
    // @ts-ignore-next-line
    let inputs = readline().split(' ')
    game.health = parseInt(inputs[0])
    game.mana = parseInt(inputs[1])
    // Discard other plater stats for now
    // @ts-ignore-next-line
    inputs = readline().split(' ')

    // @ts-ignore-next-line
    const entityCount = parseInt(readline()) // Amount of heros and monsters you can see
    for (let i = 0; i < entityCount; i++) {
      // @ts-ignore-next-line
      inputs = readline().split(' ')
      const x = parseInt(inputs[2]) // Position of this entity
      const y = parseInt(inputs[3])
      let entity = {
        id: parseInt(inputs[0]), // Unique identifier
        type: parseInt(inputs[1]), // 0=monster, 1=your hero, 2=opponent hero
        x,
        y,
        shieldLife: parseInt(inputs[4]), // Ignore for this league; Count down until shield spell fades
        isControlled: parseInt(inputs[5]), // Ignore for this league; Equals 1 when this entity is under a control spell
        health: parseInt(inputs[6]), // Remaining health of this monster
        vx: parseInt(inputs[7]), // Trajectory of this monster
        vy: parseInt(inputs[8]),
        nearBase: parseInt(inputs[9]), // 0=monster with no target yet, 1=monster targeting a base
        threatFor: parseInt(inputs[10]), // Given this monster's trajectory, is it a threat to 1=your base, 2=your opponent's base, 0=neither
      }
      switch (entity.type) {
        case 0:
          if (entity.health >= 16) {
            game.canAttack = true
          }
          game.spiders.push(new Spider(entity))
          break
        case 1:
          game.heroes.push(new Hero(entity))
          break
        case 2:
          game.enemies.push(new Hero(entity))
          break
        default:
          throw 'Wrong type'
      }
      game.enemiesInBase = game.enemies.filter(e => e.distance < 5400).length
      game.enemiesInEnemyBase = game.enemies.filter(
        e => e.enemyBaseDistance < 5400
      ).length
    }
  }
}

export default Inputs
