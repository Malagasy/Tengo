import Phaser from 'phaser-ce'

class SpellInterface {
  // character in order to load the correct spell;
  constructor (game) {
    this.game = game
    this.onSpellChange = new Phaser.Signal()
  }

  bind (character) {
    for (let i = 0; i < character.spells.length; i++) {
      let spellHandler = character.spells[i]

      this.game.input.keyboard.addKey(spellHandler.keyCode).onDown.add(function (key, spell) {
        this.onSpellChange.dispatch(spell, key)
      }, this, null, spellHandler.spell)
    }
  }
}

export default SpellInterface
