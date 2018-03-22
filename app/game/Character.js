import Utils from './utils'
import CollisionInterface from './CollisionInterface'
import CurrentPlayer from './CurrentPlayer'

class Character {
  constructor (name) {
    this.name = name
    this.spells = []
    this.baseStats = {
      life: 1000,
      fwr: 0,
      fhr: 0,
      fcr: 0
    }
  }

  configure () {}

  bindSpell (spell, spellEvent) {
    this.spells.push({spell, spellEvent})
  }

  getSpellByEvent( event ){
    for( let i = 0 ; i < this.spells.length ; i++ )
      if ( this.spells[i].spellEvent === event )
        return this.spells[i].spell

    return null
  }

  getSpellByName (name) {
    for (let i = 0; i < this.spells.length; i++) {
      if (name == this.spells[i].spell.name) { return this.spells[i].spell }
    }

    return null
  }

  getFirstSpell () {
    if (this.spells.length) { return this.spells[0].spell }

    return null
  }

  init (game, x, y, Player) {
    const sprite = game.add.sprite(x, y, this.name)

    game.physics.p2.enable(sprite, true)

    sprite.body.clearShapes()
    sprite.body.addRectangle( 40,40,0,40)
    //let characterShape = sprite.body.addCircle(20,0,40)
    //let hitboxShape = sprite.body.addCapsule(55, 15, 0, 5, Utils.degToRad(90))
 //   sprite.body.addCapsule(55,10,0,0,1,5708);
    sprite.body.collideWorldBounds = true
    sprite.body.fixedRotation = true

    let playerCG = CollisionInterface.get('player')
    let allyCG = CollisionInterface.get('ally')
    let obstacleCG = CollisionInterface.get('obstacle')
    let enemySpellCG = CollisionInterface.get('enemySpell')
    let enemyCG = CollisionInterface.get('enemy')
    let allySpellCG = CollisionInterface.get('allySpell')

    sprite.body.setCollisionGroup(playerCG)
    sprite.body.collides( [obstacleCG])

    let hitbox = game.add.sprite(0,0)

    game.physics.p2.enable(hitbox, true)

    hitbox.body.clearShapes()
    hitbox.body.addCapsule(55, 15, 0, 5, Utils.degToRad(90))
    //hitbox.body.kinematic = true
    //sprite.addChild(hitbox)
    hitbox.body.fixedRotation = true

    let constraint = game.physics.p2.createLockConstraint(sprite,hitbox)

    sprite.data.hitbox = hitbox
    hitbox._constraint = constraint


    if( CurrentPlayer.id === Player.id ) {
      hitbox.body.setCollisionGroup(allyCG)
      hitbox.body.collides([enemySpellCG])
    }
    else {

      if (Player.ally === true) {
        hitbox.body.setCollisionGroup(allyCG)
        hitbox.body.collides([enemySpellCG])
      } else {
        hitbox.body.setCollisionGroup(enemyCG)
        hitbox.body.collides([allySpellCG])
      }

    }


    sprite.data.owner = Player
    hitbox.data.owner = Player

    this.configure(sprite)

    return sprite
  }
}

export default Character
