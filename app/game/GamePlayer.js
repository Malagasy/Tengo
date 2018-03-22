import GamePlayerMovement from './Player/Movement'
import Utils from './utils'
import Constants from './Constants'
import CurrentPlayer from './CurrentPlayer'
import Spell from './Player/Spell'
import CollisionInterface from './CollisionInterface'

const GamePlayer = {}

GamePlayer.castingOther = function (game, Player, spell, target) {
  	let collideWith = null
  let spellCG = null
  if (Player.ally == true) {
    spellCG = CollisionInterface.get('allySpell')
    collideWith = CollisionInterface.getMultiple(['enemy', 'obstacle'])
  } else {
    spellCG = CollisionInterface.get('enemySpell')
    collideWith = CollisionInterface.getMultiple(['ally', 'obstacle'])
  }
  let latency = CurrentPlayer.stats.latency + Player.stats.latency
  Player.stopMove()
  Spell.generateSpell(game, Player, spell, target, spellCG, collideWith, latency)
}

GamePlayer.casting = function (spritePlayersInGame) {
  let { game } = this

  if (game.input.mousePointer.rightButton.isDown && CurrentPlayer.isIddle === false) {
    CurrentPlayer.stopMove()
    CurrentPlayer.targetMove = null

    let spell = CurrentPlayer.activeSpell

    if (CurrentPlayer.isSpellCooldown(spell.name) === true) {
      return null;
    }

    CurrentPlayer.addSpellCooldown(spell)

    //let playersInGame = _.filter(window.client.players.list, ['isAlive', true])
    

    let target = {}

    target.x = game.input.mousePointer.worldX
    target.y = game.input.mousePointer.worldY

    if (spritePlayersInGame.length) {
      let bodies = game.physics.p2.hitTest(target, spritePlayersInGame)
      if (bodies.length) {
        let locked = bodies[0].parent.sprite.data.owner
        if( locked.ally === false ) {
          CurrentPlayer.lockOn = locked
          CurrentPlayer.onLock.dispatch(CurrentPlayer.lockOn)
        }
      }
    }

    if ( CurrentPlayer.lockOn && CurrentPlayer.lockOn.isAlive ) {
      target.x = CurrentPlayer.lockOn.sprite.body.x
      target.y = CurrentPlayer.lockOn.sprite.body.y
    }

    if (CurrentPlayer.onSpellCasting) { CurrentPlayer.onSpellCasting.dispatch(spell, target) }

    let spellCG = CollisionInterface.get('allySpell')
    let collideWith = CollisionInterface.getMultiple(['enemy', 'obstacle'])

    Spell.generateSpell(game, CurrentPlayer, spell, target, spellCG, collideWith)
  } else if (game.input.mousePointer.rightButton.justReleased(Constants.MS_BEFORE_UNLOCK)) {
    if (CurrentPlayer.lockOn !== null) { CurrentPlayer.onLockLost.dispatch() }
    CurrentPlayer.lockOn = null
  }
}

GamePlayer.movementOther = function (game, Player, target) {
  if (Player.isIddle) { return }

  let player = Player.sprite
  // let bodies = game.physics.p2.hitTest( target , [player] );
  let origin = {x: player.centerX, y: player.centerY }
  let distance = Utils.distTwoPoints(target, origin)

  // player.body.setZeroVelocity();

  if (distance > 30) {
	    let isDesynch = distance > 200
    let latency = CurrentPlayer.stats.latency + Player.stats.latency + Constants.REFRESH_POSITION / 2

	    if (!isDesynch && latency < Constants.MS_BEFORE_STOP) {
		    let { degree, moveX, moveY } = GamePlayerMovement.calculateMove(origin, target, Player.getTotalData('fwr') + Constants.CHARACTER_MOVE_PPS)

      let MS_BEFORE_STOP_LAG = Constants.MS_BEFORE_STOP - latency
      if (MS_BEFORE_STOP_LAG <= 0) MS_BEFORE_STOP_LAG = 1

      let ratio = Constants.MS_BEFORE_STOP / MS_BEFORE_STOP_LAG

      GamePlayerMovement.moveCharacter(player, moveX * ratio, moveY * ratio, degree)

      // moveX is in px/sec, convert to px/msec
      let calculatedMove = {x: moveX * MS_BEFORE_STOP_LAG / 1000, y: moveY * MS_BEFORE_STOP_LAG / 1000}
      let desiredMove = {x: target.x - origin.x, y: target.y - origin.y}

      let calculatedDistance = Utils.distTwoPoints({x: 0, y: 0}, calculatedMove)
      let desiredDistance = Utils.distTwoPoints({x: 0, y: 0}, desiredMove)

      let MS_BEFORE_STOP = desiredDistance < calculatedDistance ? desiredDistance * MS_BEFORE_STOP_LAG / calculatedDistance : MS_BEFORE_STOP_LAG

      clearTimeout(Player.timeout)
      Player.timeout = setTimeout(function () {
			    Player.stopMove()
      }, MS_BEFORE_STOP) // extrapolation
    } else {
      player.body.x = target.x
      player.body.y = target.y
    }
  }
}

GamePlayer.movement = function (obstacles, spriteAlivePlayers) {
  let { game } = this
  let player = CurrentPlayer.sprite
  const { activePointer } = game.input

  if (activePointer.leftButton.isDown || CurrentPlayer.targetMove) {
    let playerBody = player.body;
    // if( game.input.mousePointer.rightButton.isDown )
    let target = {}
    // +15 to be on the center of body
    let origin = {x: playerBody.x, y: playerBody.y+40 }
/*
    let graphics = game.add.graphics(0,0)
    graphics.beginFill(0xff0000);
    graphics.drawCircle(origin.x, origin.y+40,10);
    graphics.endFill();
*/

    if (activePointer.leftButton.isDown) {
      target.x = activePointer.worldX
      target.y = activePointer.worldY

      CurrentPlayer.targetMove = target
    } else {
      target.x = CurrentPlayer.targetMove.x
      target.y = CurrentPlayer.targetMove.y

      if (Utils.distTwoPoints(origin, CurrentPlayer.targetMove) < 20) {
        CurrentPlayer.targetMove = null
        CurrentPlayer.stopMove()
        return
      }
    }

    if (CurrentPlayer.isIddle === false /* && !bodies.length */) {
           	let { degree, moveX, moveY } = GamePlayerMovement.calculateMove(origin, target, (Constants.CHARACTER_MOVE_PPS + CurrentPlayer.getTotalData('fwr')))

      let solution = null
      let obsFound = null

      let firstSpriteContact = obstacles.concat(spriteAlivePlayers)

      if (firstSpriteContact.length) {
        // set back origin.x to center
       // origin.y = origin.y - player.height / 2
        const firstAvoiding = GamePlayerMovement.avoiding.call(game, origin, target, degree, firstSpriteContact, moveY, 40 )
        solution = firstAvoiding.solution
        obsFound = firstAvoiding.obsFound
      }
      

      if( !( solution && obsFound ) ){
     		let secondAvoiding = GamePlayerMovement.avoiding.call( game , origin , target , degree , obstacles, moveY , 150 );
     		solution = secondAvoiding.solution;
     		obsFound = secondAvoiding.obsFound;
     	}

      if (solution && obsFound) {
				 moveX = Math.cos(solution.degree * (Math.PI / 180)) * (Constants.CHARACTER_MOVE_PPS + CurrentPlayer.getTotalData('fwr'))
				 let _moveY = Math.sin(solution.degree * (Math.PI / 180)) * (Constants.CHARACTER_MOVE_PPS + CurrentPlayer.getTotalData('fwr'))
				 if (moveY < 0) { moveY = -1 * _moveY } else { moveY = _moveY }

          console.log('here');

        CurrentPlayer.isIddle = true

        const time = game.time.create(true)
        time.add(150, function () {
        	CurrentPlayer.isIddle = false
        })
        time.start()
        

        degree = Math.abs(solution.degree)
      }

      GamePlayerMovement.moveCharacter(player, moveX, moveY, degree)
    }
  } else {
    CurrentPlayer.stopMove()
  }
}

GamePlayer.cursor = function(hitboxs){
  let target = {}
  target.x = this.input.mousePointer.worldX
  target.y = this.input.mousePointer.worldY
  let bodies = this.physics.p2.hitTest(target, hitboxs)
  if( bodies.length )
  {
    let p = bodies[0].parent.sprite.data.owner
    if( p.ally === false )
      window.client.interfaceInstance.drawEnemyBarLife(p.username, p.life, p.initialLife)
  }
  else if( !CurrentPlayer.lockOn )
  {
    window.client.interfaceInstance.hideEnemyBarLife()
  }
}
export default GamePlayer
