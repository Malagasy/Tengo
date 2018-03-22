import Spell from '../../../../Spell'

class Rotator extends Spell {
  constructor () {
    super()
  }

  configure (sprite, x=0, y=0) {
    // only work with one sprite
    sprite.body.addRectangle(200, 40, 0, 0)
    sprite.body.static = true

	    return sprite
  }

  perform (sprite, moveX, moveY) {
    if (sprite.body) {
      sprite.alpha = 1
      sprite.body.fixedRotation = false
      sprite.body.rotateLeft(500)
	        sprite.body.moveRight(moveX)
	        sprite.body.moveDown(moveY)
	        let timer = sprite.game.time.create()
	        timer.add(1000, function () {
	        	sprite.body.moveRight(0)
	        	sprite.body.moveDown(0)
	        }, this, sprite)
	        timer.start()
	    }
  }

  hit (sprite=null) {
  }
}

const rotator = new Rotator()

rotator.init('Sorceress/Rotator')

export default rotator
