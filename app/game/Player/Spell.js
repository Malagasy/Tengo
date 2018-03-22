import Utils from '../utils'
import CollisionInterface from '../CollisionInterface'
import Constants from '../Constants'

const spell = {}

spell.generateSpell = function (game, Player, spell, target, spellCG, collideWith, latency = 0) {
  if (!spell.spellInitied) {
    return
  }

  let player = Player.sprite
  Player.isIddle = true
  let origin = {x: player.centerX, y: player.centerY }

  let radian = Utils.getRadianUserMove(origin, target)
  let degree = radian / (Math.PI / 180)

  let moveX = Math.cos(radian) * (spell.velocity + 1)
  let moveY = Math.sin(radian) * (spell.velocity + 1)
  let startSpellX = Math.cos(radian) * 40
  let startSpellY = Math.sin(radian) * 40
  if (target.y < origin.y) {
    // on monte
    moveY *= -1
    startSpellY *= -1
  }

  // when a static spell
  if (spell.velocity === 0) {
    moveX = target.x
    moveY = target.y
  }

  const time = game.time.create(true)
  player.tint = 0x00ff00

  let spellSprite = []
  let spriteToPerform = null

  let castSpellDelay = Constants.SPELL_DELAY - latency - Player.getTotalData('fcr')
  if (castSpellDelay < 0) { castSpellDelay = 1 }

  	for (let i = 0; i < spell.numberOfSprites; i++) {
  		let sprite = game.add.sprite(player.centerX + startSpellX, player.centerY + startSpellY, spell.spriteName)
  		game.physics.p2.enable(sprite, true)

   		sprite.body.clearShapes()
      	sprite.body.fixedRotation = true

    sprite.data.owner = Player
    sprite.data.ID = Player.spellCount

  		spellSprite.push(sprite)
  	}

  if (spellSprite.length > 1) { spriteToPerform = spell.configure(spellSprite, moveX, moveY, degree) } else { spriteToPerform = spell.configure(spellSprite[0], moveX, moveY, degree) }

  if (!Array.isArray(spriteToPerform)) { spriteToPerform = [ spriteToPerform ] }

  	for (let sprite of spriteToPerform) {
  	    sprite.alpha = 0

  		// when a static spell
  		if (spell.velocity === 0) {
  			sprite.body.static = true
      let obstacleCG = CollisionInterface.get('obstacle')
      let collideWithAll = CollisionInterface.getMultiple(['ally', 'enemy', 'allySpell', 'enemySpell', 'obstacle'])

      sprite.body.setCollisionGroup(obstacleCG)
      sprite.body.collides(collideWithAll)
    } else {
      sprite.body.setCollisionGroup(spellCG)
      sprite.body.collides(collideWith)
    }

	    sprite.body.onBeginContact.add(function (collided) {
  			sprite.alpha = 1 // if sprite collide directly
        const spriteOwner = sprite.data.owner
        const collidedOwner = collided.sprite.data.owner

        if( !collidedOwner ){
          spell.hit(sprite,null)
          return
        }

      // possible bug : le collided est un spell enemi donc pas de owner
  	    if (spriteOwner.id 
          != collidedOwner.id) {
          // animate as hitted
          let fhrDelayLatency = Constants.FHR_DELAY
          if (fhrDelayLatency <= 0) fhrDelayLatency = 10

          let fhrTime = game.time.create(true)
          collidedOwner.isIddle = true
          collidedOwner.isHitted = true
          let direction = collidedOwner.getSpriteDirection()
          collidedOwner.stopMove()
          collidedOwner.sprite.animations.play('hit_' + direction, 8 / (fhrDelayLatency / 1000))
          // 8 sprite for fhr animation can be changed
          fhrTime.add(fhrDelayLatency, function () { // 20 tolerance
            collidedOwner.isIddle = false
            collidedOwner.isHitted = false
            collidedOwner.stopMove()
          })
          fhrTime.start()
    			Player.onSpellTouchEnemy.dispatch(spriteOwner.id, collidedOwner.id, spell, sprite.data.ID)
          spell.hit(sprite, collided.sprite)
  	    }
  		})

      if (spell.cross == true) {
        sprite.body.static = true
        sprite.body.onBeginContact.add(function (collided) {
          let { body } = collided.sprite
          body.static = true
        })
        sprite.body.onEndContact.add(function (collided) {
          let { body } = collided.sprite
          body.static = false
        })
      }

  		time.add(Constants.SPELL_DELAY + spell.duration, spell.delete.bind(this, sprite))
  	}

    // 03/11
    // check that the Caster is not iddle before performing


  let castSpellDelayMove = spell.castBeforePerform(Player, castSpellDelay, degree, moveX, moveY)

  if (spriteToPerform.length == 1) {
        time.add(castSpellDelayMove, ()=> {
          if( Player.isHitted ) return
          spell.perform.call(spell, spriteToPerform[0], moveX, moveY, degree)
        })
  } else {
        time.add(castSpellDelayMove, ()=>{
          if( Player.isHitted ) return
          spell.perform.call(spell, spriteToPerform, moveX, moveY, degree)
        })
  }

  time.start()

  return spriteToPerform
}

export default spell
