import Character from '../../Character';
import Phaser from 'phaser-ce';

import Fireball from '../Spells/Sorceress/Fireball';
import MultipleFireball from '../Spells/Sorceress/MultipleFireball';
import Barrier from '../Spells/Sorceress/Barrier';
import Rotator from '../Spells/Sorceress/Rotator';

class Cowboy extends Character{

	constructor(){
		super('cowboy');
		this.bindSpell(Fireball, Phaser.KeyCode.A);
		this.bindSpell(MultipleFireball,Phaser.KeyCode.Z);
		this.bindSpell(Barrier,Phaser.KeyCode.E);
		this.bindSpell(Rotator,Phaser.KeyCode.R);
	}

	configure(player){

	    player.animations.add('right', Phaser.Animation.generateFrameNames('cowboy_',0,8,'.png',0) , 10, true);
	    player.animations.add('left', ['cowboy_14.png' ].concat( Phaser.Animation.generateFrameNames('cowboy_',22,16,'.png',0) ) , 10, true);
	    player.animations.add('up', Phaser.Animation.generateFrameNames('cowboy_',70,78,'.png',0) , 10, true);
	    player.animations.add('down', Phaser.Animation.generateFrameNames('cowboy_',126,134,'.png',0) , 10, true);

	    player.animations.add('upRight', Phaser.Animation.generateFrameNames('cowboy_',56,64,'.png',0) , 10, true);
	    player.animations.add('upLeft', Phaser.Animation.generateFrameNames('cowboy_',84,92,'.png',0) , 10, true);
	    player.animations.add('downRight', Phaser.Animation.generateFrameNames('cowboy_',31,37,'.png',0) , 10, true);
	    player.animations.add('downLeft', Phaser.Animation.generateFrameNames('cowboy_',112,118,'.png',0) , 10, true);

	}


}

export default Cowboy;