
var Player = require('./Player');
var _ = require('lodash');
var htmlspecialchars = require('htmlspecialchars');
var charLoader = require('./CharacterLoader');
var path = require('path');
var utils = require('./utils');

const GameModel = require('./Models/Game');


class Lobby{

	constructor(nsp){
		this.nsp = nsp;
		this.characterLoader = new charLoader(path.resolve( __dirname+'/../../'));
	}

	init(socket){


		const { nsp , characterLoader} = this;
		const _this = this;


		socket.on('on_lobby',function(){
			const {_user} = socket.client;
			const { game } = _user;
			if( !_user )
			{
				console.error( __filename + ' : on_lobby : user has not _user' );
				return;
			}
			let lobbyName = _user.getLobby();
			socket.client.player = null;
			_user.status = 'lobby';

			socket.join(lobbyName,err=>{
				if(err){
					console.log( __filename + ' : on_lobby : user could not join lobby');
					console.log(err);
					return;
				}
				socket.emit('allusers',_.map( utils.getAllUsersNamespace(nsp,lobbyName) , 'client._user') );
				socket.broadcast.to(lobbyName).emit('new_user',socket.client._user);
			});
		});

		socket.on('disconnect',function(){
			const {_user} = socket.client;
			if( !_user ){
				console.error( __filename + ' : disconnect : _user does not exist.' );
				return;
			}
			let lobbyName = _user.getLobby();

			if( !lobbyName )
				return;

			nsp.to(lobbyName).emit('left_lobby');

			utils.getAllUsersNamespace(nsp,lobbyName).forEach(function(socket){
				let _u = socket.client._user;
				if( !_u ){
					console.log(path.basename(__filename) + ' => "on disconnect" : _u not exist."');
					return;
				}
				if( _u.game.id ){
					_u.game = {};
				}
				socket.leave(lobbyName);
			});

			GameModel.findByIdAndRemove(_user.game.id,function(err,game){
				if( err ){
					console.error(err);
					return;
				}
			});
		});
		
		socket.on('new_message',function(message){
			const {_user} = socket.client;

			socket.broadcast.to(_user.getLobby()).emit('new_message',_user.name, message );
		});

		socket.on('lockcharacter',function(character){

			// better check if character is valid
			const {_user}= socket.client;
			let { id , name , game } = _user;
			let lobby = _user.getLobby();

			if( socket.client.player )
				return;

			character = utils.capitalizeFirstLetter(character);
			
			if( !characterLoader.isLoaded(character) )
			{
				if( !characterLoader.load(character) )
					return;
			}

			socket.client.player = new Player(id);
			socket.client.player.username = name;
			socket.client.player.character = characterLoader.getCharacter(character);
			socket.client.player.team = game.team;

			//récupérer les données spécifiques du personnage
			nsp.to(lobby).emit('lockedcharacter', {id,character} );

			nsp.to(lobby).emit('new_message',null, name + " is ready !" );
			let allPlayers = utils.getAllUsersNamespace(nsp,lobby);
			let allUsersLocked = _.findIndex( _.map( allPlayers , 'client' ) , {player:null} ) == -1 ? true : false;

			if( allUsersLocked ){
				let secBeforeLaunch = 1;
				nsp.to(lobby).emit('game_launching', secBeforeLaunch );

				setTimeout(function(){
					nsp.to(lobby).emit('launch_game');
					allPlayers.forEach(function(socket){
						socket.leave(lobby);
					});
				},secBeforeLaunch*1000);

			}
			
		});
	}
}



module.exports = Lobby;