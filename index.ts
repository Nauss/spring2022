import Game from './lib/Game'
import Inputs from './lib/Inputs'

// console.error = () => {}
Inputs.readInit()

// game loop
while (true) {
  Inputs.readTurn()

  const game = Game.get()
  game.play()
}
