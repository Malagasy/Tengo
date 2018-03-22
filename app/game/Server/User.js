class User{

	constructor(name,id){
		this.name = name;
		this.id = id;
		this.game = {};
		this.status = "";
	}

	getLobby(){
		const {game} = this;
		return game.id ? 'lobby-'+game.id : null;
	}

}


module.exports = User;