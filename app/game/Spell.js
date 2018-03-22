import Request from 'request'
import Utils from './utils'

class Spell {
  constructor () {
    this.duration = null
    this.velocity = null
    this.name = null
    this.sprite = null
    this.damage = null
    this.numberOfSprites = null
    this.cooldown = null

    this.spellInitied = false
    this.path = null
  }

  init (path) {
    this.path = path
    Request(window.location.href + 'spell/' + path + '/data.json', (error, response, body) => {
      if (error == null) {
        let data = JSON.parse(body)
        this.duration = data.duration
        this.velocity = data.velocity
        this.name = data.name
        this.sprite = data.sprite
        this.damage = data.damage
        this.numberOfSprites = data.numberOfSprites
        this.cooldown = data.cooldown
        this.cross = data.cross

        this.spellInitied = true
      } else {
        console.log('err')
        console.log(error)
      }
    })
  }

  configure () {}
  perform () {}
  hit (hit=null) {}
  castBeforePerform (Player, castSpellDelay, degree, moveX, moveY) {
    const player = Player.sprite
    let direction = Player.getSpriteDirection()

    let neededDirection = Utils.findDirection(moveY, degree)

    let shortestPath = Utils.findShortestPath(direction, neededDirection)

    let nbSpriteAnimation = 12
    if( castSpellDelay <= 100 ) castSpellDelay = 100;
    let spellDelayBased = nbSpriteAnimation / (castSpellDelay / 1000)

    let i = 1
    let gameTimer = player.game.time.events
    if (shortestPath) {
      	Player.sprite.animations.stop()
    	for (i = 1; i < shortestPath.length; i++) {
	    	gameTimer.add(10 * i, function (ind) {
		    		player.frameName = 'cast_' + shortestPath[ind] + '_00'
		    }, Player, i)
    	}
    }

  	gameTimer.add(10 * (i - 1), function () {
  		
  		if( !this.isHitted ) player.animations.play('cast_' + neededDirection, spellDelayBased)

	    setTimeout(function () {
	    	this.sprite.tint = 0xFFFFFF
	    	this.isIddle = false
	        this.stopMove()
	    }.bind(Player), castSpellDelay-20) // Make more fluid
  	}, Player)

  	return 10 * (i-1) + castSpellDelay
  }

  delete (sprite) {
    sprite.destroy()
  }

  animate (spell, moveX, moveY, degree) {
	    if (moveY < 0) {
	        // on monte
	        if (degree >= 70 && degree <= 110) {
	            spell.animations.play('up')
	        } else if (degree <= 70 && degree >= 20) {
	            spell.animations.play('upRight')
	        } else if (degree >= 110 && degree <= 160) {
	            spell.animations.play('upLeft')
	        } else if (degree >= 0 && degree <= 20) {
	            spell.animations.play('right')
	        } else if (degree <= 180 && degree >= 160) {
	            spell.animations.play('left')
	        }

	        spell.body.moveRight(moveX)
	        spell.body.moveDown(moveY)
	    } else if (moveY > 0) {
	        // on descend
	        if (degree >= 70 && degree <= 110) {
	            spell.animations.play('down')
	        } else if (degree <= 70 && degree >= 20) {
	            spell.animations.play('downRight')
	        } else if (degree >= 110 && degree <= 160) {
	            spell.animations.play('downLeft')
	        } else if (degree >= 0 && degree <= 20) {
	            spell.animations.play('right')
	        } else if (degree <= 180 && degree >= 160) {
	            spell.animations.play('left')
	        }

	        spell.body.moveRight(moveX)
	        spell.body.moveDown(moveY)
	    }

    spell.alpha = 1
  }
}

export default Spell
