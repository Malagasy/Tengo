import Utils from '../utils'
import Constants from '../Constants'
import _ from 'lodash'

const movement = {}

movement.calculateMove = function (origin, target, moveVelocity = Constants.CHARACTER_MOVE_PPS) {
  let radian = Utils.getRadianUserMove(origin, target)

  let degree = radian / (Math.PI / 180)

  let moveX = Math.cos(radian) * moveVelocity
  let moveY = Math.sin(radian) * (moveVelocity)

  if (target.y < origin.y) {
    // on monte
    moveY *= -1
  }
  return {degree, moveX, moveY}
}
movement.moveCharacter = function (player, moveX, moveY, degree) {
  const Player = player.data.owner


  let neededDirection = Utils.findDirection(moveY, degree)

  let direction = Player.getSpriteDirection()

  let shortestPath = Utils.findShortestPath(direction, neededDirection)

  const { frameName } = player

  const {x, y} = player.body.velocity
  if (x != 0 || y != 0) {
    player.body.setZeroVelocity()
  }

  let i = 1
  if (shortestPath) {
    shortestPath.pop()
    shortestPath.shift()
  }

  if (shortestPath && shortestPath.length && !Player.isIddle) {
    let matches = frameName.match(/[a-z_]{1,}(\d{2})/i)
    let frameNumber = frameName.indexOf('run_') != -1 ? parseInt(matches[1], 10) : 0

    Player.isIddle = true
    Player.sprite.animations.stop()
    for (i = 0; i < shortestPath.length; i++) {
      player.game.time.events.add(20 * i, function (ind) {
        this.sprite.frameName = 'run_' + shortestPath[ind] + '_' + _.padStart(frameNumber, 2, '0')
        if (ind == shortestPath.length - 1) Player.isIddle = false
      }, Player, i)
    }
  } else {
    let runningSpeedAnimation = ((2.5 * 10) * Math.sqrt(Math.pow(moveX, 2) + Math.pow(moveY, 2))) / Constants.CHARACTER_MOVE_PPS
    runningSpeedAnimation = Math.round( runningSpeedAnimation )

    Player.runningSound(10,runningSpeedAnimation)


    if (direction != neededDirection) {
      let matches = frameName.match(/[a-z_]{1,}(\d{2})/i)
      let frameNumber = parseInt(matches[1], 10)
      Player.sprite.animations.play('run_' + neededDirection, runningSpeedAnimation)
      Player.sprite.animations.next(frameNumber+1)
    } else {
      Player.sprite.animations.play('run_' + neededDirection, runningSpeedAnimation)

    }




    Player.sprite.body.moveRight(moveX)
    Player.sprite.body.moveDown(moveY)
  }
}

movement.avoiding = function (origin, target, degree, obstacles, moveY, viewDistance = 100 , degrees = [1, 45, 90, -45, -90] ) {
  const game = this

  let solution = null
  let obsFound = false

  if (!obstacles.length) { return {solution, obsFound} }

  for (let shift of degrees) {

    let x = Math.cos((degree + shift) * (Math.PI / 180)) * viewDistance
    let y = Math.sin((degree + shift) * (Math.PI / 180)) * viewDistance
    if (moveY < 0) { y *= -1 }

    x = Math.round(x)
    y = Math.round(y)

    let obs = game.physics.p2.hitTest({x: origin.x + x, y: origin.y + y}, obstacles)

    if (obs.length) {
      obsFound = true
      continue
    }

    if (!solution) {
      solution = {
        x,
        y,
        distance: Utils.distTwoPoints({x: target.x, y: target.y}, {x: origin.x + x, y: origin.y + y}),
        degree: (degree + shift)
      }
    } else {
      let distance = Utils.distTwoPoints({x: target.x, y: target.y}, {x: origin.x + x, y: origin.y + y})
      if (distance < solution.distance) {
        solution.x = x
        solution.y = y
        solution.distance = distance
        solution.degree = (degree + shift)
      }
    }
  }

  if( solution && solution.degree > 180 ) solution.degree = 180

  return {solution, obsFound}
}

export default movement
