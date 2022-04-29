import Entity, { EntityInfo } from './Entity'
import Spider from './Spider'
import { computeDistance } from './utils'

class Hero extends Entity {
  spiders: Spider[] = []
  constructor(info: EntityInfo) {
    super(info)
  }

  setSpiders(spiders: Spider[]) {
    this.spiders = spiders.filter(
      spider => computeDistance(this.position, spider.position) < 2200
    )
  }
}

export default Hero
