import Character from '../../../Character'
import Phaser from 'phaser-ce'

import Fireball from '../../Spells/Sorceress/Fireball'
import MultipleFireball from '../../Spells/Sorceress/MultipleFireball'
import Barrier from '../../Spells/Sorceress/Barrier'
import Rotator from '../../Spells/Sorceress/Rotator'


class Sorceress extends Character {
  constructor () {
    super('sorceress')
    this.bindSpell(Fireball, 'spell_1' )
    this.bindSpell(MultipleFireball, 'spell_2' )
    this.bindSpell(Barrier, 'spell_3' )
    this.bindSpell(Rotator, 'spell_4' )

  }

  configure (player) {
    const directions = ['E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N', 'NNE', 'NE', 'NNE', 'NE', 'ENE']

    for (let direction of directions) {
      player.animations.add('idle_' + direction, Phaser.Animation.generateFrameNames('idle_' + direction + '_', 0, 14, '', 2), 10, true)
      player.animations.add('cast_' + direction, Phaser.Animation.generateFrameNames('cast_' + direction + '_', 0, 11, '', 2), 30, false)
      player.animations.add('hit_' + direction, Phaser.Animation.generateFrameNames('hit_' + direction + '_', 0, 7, '', 2), 30, false)
      player.animations.add('run_' + direction, Phaser.Animation.generateFrameNames('run_' + direction + '_', 0, 9, '', 2), 20, true)
    }
  }
}

export default Sorceress
