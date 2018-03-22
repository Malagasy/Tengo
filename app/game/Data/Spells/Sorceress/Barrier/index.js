import Spell from '../../../../Spell'
import Utils from '../../../../utils'
import Phaser from 'phaser-ce'

class Barrier extends Spell {
  constructor () {
    super()
  }

  configure (sprite, x, y, degree) {
    // only work with one sprite
    degree -= 90
    if (sprite.body.y > y) { degree *= -1 }

    let radian = Utils.degToRad(degree)
    let graphics = new Phaser.Graphics(sprite.game)
    graphics.beginFill(0xff0000)
    let rect = graphics.drawRect(0, 0, 200, 40)
    rect.angle = degree
    graphics.endFill()
    sprite.addChild(rect)

    sprite.body.x = x
    sprite.body.y = y
    sprite.body.addRectangle(80, 200, 0, 0, radian)

	    return sprite
  }

  perform (sprite, moveX, moveY) {
    sprite.alpha = 1
  }

  hit (sprite) {
    console.log('here')
    // esprite.destroy();
  }
}

const barrier = new Barrier()
barrier.init('Sorceress/Barrier')

export default barrier
