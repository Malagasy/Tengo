import Utils from './utils'
import CurrentPlayer from './CurrentPlayer'
import Phaser from 'phaser-ce'

class Minimap {
  constructor (game) {
    this.game = game
    let minimap = new Phaser.Graphics(game,0,0)
    minimap.beginFill(0x000000, .5)
    minimap.drawRect(0,0,250,200)
    minimap.endFill()
    this.minimap = game.add.image( 700, 20, minimap.generateTexture() )
    this.minimap.fixedToCamera = true

    this.playersImage = {}

    this.heightCoefficient = game.world.height / this.minimap.height
    this.widthCoefficient = game.world.width / this.minimap.width
  }

  getPlayerPoint (id) {
    return this.playersImage[id]
    //return this.minimapDOM.find('span#' + id)
  }

  addPlayerOther (player) {
    let playerType = player.ally === true ? 1 : 2

    this.addPlayer(player, playerType)
  }

  addPlayerCurrent (player) {
    this.addPlayer(player, 0)
  }

  addPlayer (player, playerType = 0) {

    const { game, minimap, playersImage } = this

    let playerGraphics = new Phaser.Graphics(game,0,0)

    // 0 current
    // 1 ally
    // 2 enemy
    let color
    if (playerType === 0) { color = 0xdbebfa } else if (playerType == 1) { color = 0x3be8b0 } else if (playerType == 2) { color = 0xff322e }

    playerGraphics.beginFill(color, .4)
    playerGraphics.drawCircle(0,0,10)
    playerGraphics.endFill()

    const playerImage = new Phaser.Image(game,0,0, playerGraphics.generateTexture() )

    minimap.addChild(playerImage)
    playersImage[player.id] = playerImage


  }

  updatePosition (player) {

    // check for coordinates
    const playerImage = this.getPlayerPoint(player.id)
    const newX = player.sprite.body.x / this.widthCoefficient
    const newY = player.sprite.body.y / this.heightCoefficient

    if (CurrentPlayer.id === player.id || player.ally === true) {
        playerImage.left = newX
        playerImage.top = newY
    } else {
      let currentPlayerImage = this.getPlayerPoint(CurrentPlayer.id)
      let playerPosition = {x: currentPlayerImage.left, y: currentPlayerImage.top }
      let isTooFar = Utils.distTwoPoints(playerPosition, {x: newX, y: newY}) > 100

      if (isTooFar && CurrentPlayer.isAlive ) {
        playerImage.exists = false
      } else {
        playerImage.exists = true
        playerImage.left = newX
        playerImage.top = newY
      }
    }
  }

  deletePosition (id) {
    this.getPlayerPoint(id).destroy(true)
  }

  reset(){
    this.minimap.destroy(true)
  }

  offsetMinimap(x=0,y=0){
    this.minimap.cameraOffset.x += x
    this.minimap.cameraOffset.y += y
  }
}/*
class Minimap {
  constructor (game) {
    this.game = game
    this.minimapDOM = jQuery('#minimap')
    this.heightCoefficient = game.world.height / this.minimapDOM.height()
    this.widthCoefficient = game.world.width / this.minimapDOM.width()
  }

  getPlayerPoint (id) {
    return this.minimapDOM.find('span#' + id)
  }

  addPlayerOther (player) {
    let playerType = player.ally === true ? 1 : 2

    this.addPlayer(player, playerType)
  }

  addPlayerCurrent (player) {
    this.addPlayer(player, 0)
  }

  addPlayer (player, playerType = 0) {
    // 0 current
    // 1 ally
    // 2 enemy
    let color
    if (playerType === 0) { color = 'player' } else if (playerType == 1) { color = 'ally' } else if (playerType == 2) { color = 'enemy' }

    this.minimapDOM.append('<span id="' + player.id + '" class="' + color + '"></span>')

    this.updatePosition(player)
  }

  updatePosition (player) {
    // check for coordinates
    if (!(player.sprite.body.x && player.sprite.body.y)) { return }
    const spanDOM = this.getPlayerPoint(player.id)
    const newX = player.sprite.body.x / this.widthCoefficient
    const newY = player.sprite.body.y / this.heightCoefficient

    if (CurrentPlayer.id == player.id || player.ally == true) {
        spanDOM.css('transform', `translate(${newX}px,${newY}px) rotate(45deg)`)
    } else {
      let spanPlayerDOM = this.getPlayerPoint(CurrentPlayer.id)
      let playerPosition = {x: parseInt(spanPlayerDOM.css('left'), 10), y: parseInt(spanPlayerDOM.css('top'), 10) }
      let isTooFar = Utils.distTwoPoints(playerPosition, {x: newX, y: newY}) > 150

      if (isTooFar) {
        spanDOM.hide()
      } else {
        spanDOM.show()
        spanDOM.css('transform', `translate(${newX}px,${newY}px) rotate(45deg)`)
      }
    }
  }

  deletePosition (id) {
    this.getPlayerPoint(id).hide()
  }

  reset(){
    this.minimapDOM.html('');
  }
}*/

export default Minimap
