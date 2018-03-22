import Phaser from 'phaser-ce'
import Player from './Player'

class CurrentPlayer extends Player {
  constructor () {
    super(null)
    this.activeSpell = null
    this.cooldowns = new Phaser.ArraySet()

    this.refreshPositionInterval = "";
    this.latencyInterval = "";
  }

  isSpellCooldown (spellname) {
    let spell = this.cooldowns.getByKey('name', spellname)
    if (spell) {
      if (Date.now() > spell.time) { return false }

      return true
    }

    return false
  }

  addSpellCooldown (spell) {
    let { name, cooldown } = spell
    let time = Date.now() + cooldown

    let _spell = this.cooldowns.getByKey('name', name)
    if (_spell) { this.cooldowns.remove(_spell) }

    this.cooldowns.add({name, time})
  }
}
export default (new CurrentPlayer())
