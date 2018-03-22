import Spell from '../../../../Spell'
import Utils from '../../../../utils'

class Fireball extends Spell {
  constructor () {
    super()
    this.spriteName = 'Fireball'
  }

  configure (sprite, moveX, moveY, degree) {
    // only work with one sprite

    sprite.body.addRectangle(50, 50)

    console.log(sprite)

    sprite.animations.add('left', Utils.rangeAnimation(0, 7), 10, true)
    sprite.animations.add('upLeft', Utils.rangeAnimation(8, 15), 10, true)
    sprite.animations.add('up', Utils.rangeAnimation(16, 23), 10, true)
    sprite.animations.add('upRight', Utils.rangeAnimation(24, 31), 10, true)
    sprite.animations.add('right', Utils.rangeAnimation(32, 39), 10, true)
    sprite.animations.add('downRight', Utils.rangeAnimation(40, 47), 10, true)
    sprite.animations.add('down', Utils.rangeAnimation(48, 55), 10, true)
    sprite.animations.add('downLeft', Utils.rangeAnimation(56, 64), 10, true)

	    return sprite
  }

  perform (sprite, moveX, moveY, degree) {
    if (sprite.body) {
	        this.animate(sprite, moveX, moveY, degree)
	    }
  }

  hit (sprite) {
    sprite.destroy()
  }
}

const fireball = new Fireball()

fireball.init('Sorceress/Fireball')

export default fireball
