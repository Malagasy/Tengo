const glob = require('glob');
const read = require('read-file')
const utils = require('./utils');

class spellLoader{

	constructor(root){
		this.root = root;
		this.spells = [];
	}

	getSpell( id ){
		for( let spell of this.spells )
		{
			if( spell.id == id )
				return spell.spell;
		}

		return null;
	}
	
	load(character){
		character = utils.capitalizeFirstLetter( character );
		
		let dirs = glob.sync( './game/Data/Spells/'+ character + '/*/' , {cwd:this.root} );
		console.log(dirs);
		if( dirs.length )
		{
			for( let dir of dirs )
			{
				let path = this.root + '/' + dir;
				let directory = utils.dirname(path);
				let data = JSON.parse(read.sync(path + '/data.json', 'utf8') );
				
				this.spells.push({
					id: character + '/' + directory,
					spell: data
				});
			}
		}

	}

}

module.exports = spellLoader;