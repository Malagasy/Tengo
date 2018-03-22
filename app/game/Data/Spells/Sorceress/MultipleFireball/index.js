import Spell from '../../../../Spell'
import Utils from '../../../../utils'

class MultipleFireball extends Spell {
  constructor () {
    super()
  }

  configure (sprites) {
    // only work with one sprite

    for (let sprite of sprites) { sprite.body.addRectangle(60, 60) }

	    return sprites
  }

  perform (sprites, moveX, moveY, degree) {
    for (let sprite of sprites) { sprite.alpha = 1 }

	    let dist = Utils.distTwoPoints({x: 0, y: 0}, {x: moveX, y: moveY})
    const calcXY = function (shift) {
		    let x = Math.cos((degree + shift) * (Math.PI / 180)) * dist
		    let y = Math.sin((degree + shift) * (Math.PI / 180)) * dist
		    if (moveY < 0) { y *= -1 }
		    return {x, y}
    }
    const shifts = [10, 20, 0, -20, -40]
    let shiftNumber = 0

    for (let sprite of sprites) {
      if (!sprite.body) { continue }
      let coord = calcXY(shifts[shiftNumber])
      shiftNumber++
      sprite.body.moveRight(coord.x)
      sprite.body.moveDown(coord.y)
    }
  }

  hit (sprite, hit) {
    sprite.destroy()
  }
}

const multipleFireball = new MultipleFireball()

multipleFireball.init('Sorceress/MultipleFireball')

export default multipleFireball
