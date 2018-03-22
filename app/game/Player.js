import Phaser from 'phaser-ce'

class Player {
  constructor (id) {
    this.id = id
    this.username = null
    this.character = ''
    this.team = ''
    this.isIddle = false
    this.isHitted = false
    this.sprite = null
    this.isAlive = true
    this.life = null
    this.initialLife = null
    this.timeout = null // used for updateposition

    this.lockOn = null // user got lock on a player
    this.spellCount = 0

    this.onSpellCasting = new Phaser.Signal()
    this.onSpellTouchEnemy = new Phaser.Signal()
    this.onHitted = new Phaser.Signal()
    this.onKilled = new Phaser.Signal()
    this.onLockLost = new Phaser.Signal()
    this.onLock = new Phaser.Signal()
    this.onFootStep = new Phaser.Signal()
    this.onSpellChange = new Phaser.Signal()

    this.onRunning = new Phaser.Signal()
    this.loopFootstep = 0

    this.targetMove = null

    this.stats = {
      latency: 0,
      kill: 0,
      death: 0
    }

    this.baseData = {}
    this.bonusData = {}
  }

  getBaseData (type) {
    return this.data[type] ? this.data[type] : 0
  }
  setBaseData (data) {
    this.data = data
    return this
  }

  getTotalData (type) { // it counts base data + bonus data
    return this.getBaseData(type)
  }

  kill () {
    const {hitbox} = this.sprite.data
    this.isAlive = false
    this.life = 0

    this.sprite.kill()
    if( hitbox._constraint )
    {
      hitbox.game.physics.p2.removeConstraint(hitbox._constraint)
      hitbox._constraint = null
    }
    this.sprite.destroy()
    hitbox.destroy()

  }

  removeSignal(){

    this.clearRunningSound()

    this.onSpellCasting.removeAll()
    this.onSpellTouchEnemy.removeAll()
    this.onHitted.removeAll()
    this.onKilled.removeAll()
    this.onLockLost.removeAll()
    this.onSpellChange.removeAll()

  }
  damage (dmg) {
    this.life -= dmg
    this.onHitted.dispatch() // remaining life in %

    if (this.life <= 0) {
      this.onKilled.dispatch()
      this.kill()
    }
  }

  currentLifePercent () {
    return this.life * 100 / this.initialLife
  }

  getSpriteDirection () {
    const { frameName } = this.sprite
    const matches = frameName.match(/[a-z]{1,}_([A-Z]+)/)

    return !matches[1] ? null : matches[1]
  }

  stopMove () {
    const player = this.sprite

    const { frameName } = player

    const { body } = player


    if( !body )
      return

    let {x, y} = body.velocity
    x = Math.round(x)
    y = Math.round(y)
    if (x != 0 || y != 0) {
	        body.setZeroVelocity()
	        player.animations.stop(false)
          let { hitbox } = player.data
          hitbox.body.setZeroVelocity()
    }

    if (frameName && frameName.indexOf('idle') !== -1) { return }

    if (this.isIddle) { return }

    let direction = this.getSpriteDirection()

    player.animations.play('idle_' + direction)
    this.clearRunningSound()
  }

  clearRunningSound(){
    clearInterval( this.loopFootstep )
    this.loopFootstep = 0
  }

  runningSound(framePerAnim, fps){
    
    if( this.loopFootstep !== 0 ) return
    this.loopFootstep = setInterval( () => {
      this.onFootStep.dispatch()
    },(framePerAnim/1.6)*1000/fps)
  }
}

export default Player
