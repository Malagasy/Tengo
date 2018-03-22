import Phaser from 'phaser-ce'

class CollisionInterface {
  constructor () {
    this.groups = new Phaser.ArraySet()
  }

  addCollisionGroup (game, name) {
    let group = game.physics.p2.createCollisionGroup()
    this.groups.add({name, group})
    return group
  }

  get (name) {
    return this.groups.getByKey('name', name).group
  }

  getMultiple (names) {
    let groups = []
    for (let name of names) { groups.push(this.groups.getByKey('name', name).group) }

    return groups
  }
}

export default (new CollisionInterface())
