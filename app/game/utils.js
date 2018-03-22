import Constants from './Constants'

class Utils {
  radToDeg (radian) {
    return radian * (180 / Math.PI)
  }
  degToRad (degree) {
    return degree * (Math.PI / 180)
  }

  rangeAnimation (start, length) {
    if (isNaN(start)) { start = 0 }

    let arr = []
    for (let i = 0; i < length; i++) { arr.push(start + i) }

    return arr
  }

  distTwoPoints (a, b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
  }

  getRadianUserMove (origin, target) {
    // +100 is very important, never forget it
    let base = {x: origin.x + 100, y: origin.y}

    let lenOriginTarget = this.distTwoPoints(origin, target)
    let lenOrigineBase = this.distTwoPoints(origin, base)
    let lenTargetBase = this.distTwoPoints(base, target)

    return Math.acos((Math.pow(lenOriginTarget, 2) + Math.pow(lenOrigineBase, 2) - Math.pow(lenTargetBase, 2)) / (2 * lenOrigineBase * lenOriginTarget))
  }

  playerDirectionPosition (playerPosition, radian, goingUp) {
    const coord = {}

    let moveX = Math.cos(radian) * Constants.CHARACTER_MOVE_PPS
    let moveY = Math.sin(radian) * Constants.CHARACTER_MOVE_PPS

    if (goingUp) { moveY *= -1 }

    coord.x = playerPosition.x + moveX / Constants.CHARACTER_FACTOR_VIEW
    coord.y = playerPosition.y + moveY / Constants.CHARACTER_FACTOR_VIEW

    return coord
  }

  between (n, x, y) {
    return n >= x && n <= y
  }

  capitalizeFirstLetter (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  findDirection (moveY, degree) {
    let direction = ''


    if (moveY <= 0) {
      if (this.between(degree, 0, 11)) direction = 'E'
      if (this.between(degree, 11, 33)) direction = 'ENE'
      if (this.between(degree, 33, 55)) direction = 'NE'
      if (this.between(degree, 55, 79)) direction = 'NNE'
      if (this.between(degree, 79, 90)) direction = 'N'
      if (this.between(degree, 90, 101)) direction = 'N'
      if (this.between(degree, 101, 124)) direction = 'NNW'
      if (this.between(degree, 124, 146)) direction = 'NW'
      if (this.between(degree, 146, 169)) direction = 'WNW'
      if (this.between(degree, 169, 180)) direction = 'W'
    } else if (moveY > 0) {
      if (this.between(degree, 0, 11)) direction = 'E'
      if (this.between(degree, 11, 33)) direction = 'ESE'
      if (this.between(degree, 33, 55)) direction = 'SE'
      if (this.between(degree, 55, 80)) direction = 'SSE'
      if (this.between(degree, 80, 89)) direction = 'S'
      if (this.between(degree, 89, 101)) direction = 'S'
      if (this.between(degree, 101, 124)) direction = 'SSW'
      if (this.between(degree, 124, 146)) direction = 'SW'
      if (this.between(degree, 146, 169)) direction = 'WSW'
      if (this.between(degree, 169, 180)) direction = 'W'
    }

    return direction
  }

  findShortestPath (start, end) {
    const directions = Constants.DIRECTIONS

    const indexOfStart = directions.indexOf(start)
    const indexOfEnd = directions.indexOf(end)

    if (indexOfStart === indexOfEnd) { return null }

    let dist1 = Math.abs(indexOfStart - indexOfEnd)

    let breakpoint1 = indexOfStart > indexOfEnd ? directions.length : 0
    let breakpoint2 = indexOfStart > indexOfEnd ? 0 : directions.length

    let dist2 = Math.abs(indexOfStart - breakpoint1) + Math.abs(indexOfEnd - breakpoint2)

    let path = []
    if (dist1 >= dist2) {
      if (indexOfStart >= breakpoint1) {
        for (let i = indexOfStart; i >= breakpoint1; i--) { path.push(directions[i]) }
        for (let i = breakpoint2 - 1; i >= indexOfEnd; i--) { path.push(directions[i]) }
      }
      if (indexOfStart <= breakpoint1) {
        for (let i = indexOfStart; i <= breakpoint1 - 1; i++) { path.push(directions[i]) }
        for (let i = breakpoint2; i <= indexOfEnd; i++) { path.push(directions[i]) }
      }
    }
    if (dist1 < dist2) {
      if (indexOfStart > indexOfEnd) {
        for (let i = indexOfStart; i >= indexOfEnd; i--) { path.push(directions[i]) }
      }
      if (indexOfStart < indexOfEnd) {
        for (let i = indexOfStart; i <= indexOfEnd; i++) { path.push(directions[i]) }
      }
    }

    return path.length ? path : null
  }
}
export default (new Utils())
