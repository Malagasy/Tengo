const _ = require('lodash');

class Player{
	constructor(id){
		this.id = id;
		this.username = null;
		this.character = "";
		this.team = "";
		this.x = null;
		this.y = null;
		this.isAlive = true;
		this.life = 1000;
		this.initialLife = this.life;
		this.cooldowns = [];
		this.currentSpells = [];
		this.socketId = null;

		this.stats = {
			latency: 0,
			kill:10,
			death:0
		}; 
	}

	getTotalData(type){
		let baseData = this.character[type] ? this.character[type] : 0;
		return baseData;
	}

	getPublic(){
		let {id,x,y,life,isAlive,username,stats,character,team,socketId} = this;

		return {id,x,y,life,isAlive,username,stats,character,team,socketId} ;
	}

	isCooldown( name ){
		let spell = this.getSpellCooldown( name );
		if( spell )
		{	
			if( spell.time < Date.now() )
				return false;

			return true;
		}

		return false;
	}

	addSpellCooldown( spell ){
		let { name , cooldown } = spell;
		let time = Date.now()+cooldown-1000;

		let exist = this.getSpellCooldown( name );

		if( exist )
			_.remove( this.cooldowns , {name} );

		this.cooldowns.push({name,time});

	}
	getSpellCooldown( name ){
		let index = _.findIndex( this.cooldowns , {name} );

		return index === -1 ? null : this.cooldowns[index];
	}

	addCurrentSpell(  id , duration){
		let idx = _.findIndex( this.currentSpells , {id} );

		let {x,y} = this;

		if( idx == -1 )
			this.currentSpells.push({ id,duration,origin:{x,y} });
	}
	removeCurrentSpell( id ){
		return _.remove( this.currentSpells , {id} );
	}

	clearCurrentSpell(){
		_.remove( this.currentSpells , n => n.duration < Date.now() );
	}

	getCurrentSpell(  id ){
		let idx = _.findIndex( this.currentSpells , {id} );

		if( idx == -1 )
			return null;

		return this.currentSpells[idx];


	}

	reset(){
		this.isAlive = true;
		this.life = this.initialLife;
		this.cooldowns = [];
		this.currentSpells = [];
		return this;
	}
}

module.exports = Player;