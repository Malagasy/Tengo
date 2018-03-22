const glob = require('glob');
const read = require('read-file');
const fileExists = require('file-exists');
const utils = require('./utils');

class CharacterLoader{

	constructor(root){
		this.root = root;
		this.characters = [];
	}

	getCharacter(character){
		character = utils.capitalizeFirstLetter( character );

		for( let char of this.characters )
			if( char.name == character )
				return char;

		return null;

	}

	isLoaded(character){
		return this.getCharacter(character) ? true : false;
	}
	
	load(character){
		character = utils.capitalizeFirstLetter( character );
		
		let path = this.root + '/game/Data/Characters/' + character;

		if( !fileExists.sync( path + '/data.json' ) )
			return false;

		let data = JSON.parse(read.sync(path + '/data.json', 'utf8') );

		this.characters.push(data);
		return true;
	
	}

}

module.exports = CharacterLoader;