import Entity, { EntityInfo } from './Entity'

class Spider extends Entity {
  threat: number = 0
  constructor(info: EntityInfo) {
    super(info)
  }
}

export default Spider
