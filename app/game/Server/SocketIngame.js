var Constants = require('./Constants');
var spellLoader = require('./SpellLoader');
var Constants = require('./Constants');
var Player = require('./Player');
var utils = require('./utils');
var path = require('path');
var async = require('async');
var _  = require('lodash');
var User = require('./User');
var charLoader = require('./CharacterLoader');

var htmlspecialchars = require('htmlspecialchars');


const GameModel = require('./Models/Game');

var SpellLoader = new spellLoader(path.resolve( __dirname+'/../../'));
SpellLoader.load('Sorceress');


class SocketIngame{


	constructor(ioPlay){
		this.nsp = ioPlay;
	}

	init(socket){

		const {nsp} = this;

		var ecart = 10;
		const _this = this;

		socket.on('on_play',function(){
			let {_user} = socket.client;

			
			


			if( !_user ){
				console.error( __filename + ' : on_play : _user does not exist.');
				return;
			}

			socket.client._user.status = 'play';

			socket.client.player = new Player(_user.id);
			socket.client.player.username = _user.name;
			let characterLoader = new charLoader(path.resolve( __dirname+'/../../'));
			characterLoader.load('sorceress') 
			socket.client.player.character = characterLoader.getCharacter('sorceress');
			socket.client.player.team = _user.game.team;

			const gameId = 'gameId-'+socket.client._user.game.id;
			socket.join( gameId, err => {

				socket.client.player.x = 600+ecart;
				socket.client.player.y = 600;
				socket.client.player.socketId = socket.id;
				socket.client.player.canPlay = true;

				ecart += 50;
				if( ecart > 300 )
					ecart = 0;

				socket.client.player.life += socket.client.player.character.life;

				// lui donner la liste des joueurs
				socket.emit('setupplayer',socket.client.player.getPublic() );
				
				
				let players = utils.getAllUsersNamespace(nsp,gameId);
				console.log('players found='+players.length);
				players = _.map( players , s=>s.client.player.getPublic() );

				socket.emit('allplayers',players);

				socket.broadcast.to(gameId).emit('newplayer', socket.client.player.getPublic() );
				
			});

			socket.on('disconnect',function(){
				//socket.emit('playerdisconnect',socket.player.id);
				socket.broadcast.to(gameId).emit('playerdisconnect',socket.client.player.id);
			});


			socket.on('ping_latency',function(sent){
				// make sur 'sent' is an integer
				socket.client.player.stats.latency = Date.now()-sent;

				if( socket.client.player.stats.latency < 0 )
					socket.client.player.stats.latency = 0;

				socket.broadcast.to(gameId).emit('ping_latency',socket.client.player.id,socket.client.player.stats.latency);
				socket.emit('ping_latency',null,socket.client.player.stats.latency);
			});

			socket.on('updateposition',function(player){

				if( !socket.client.player.isAlive || !socket.client.player.canPlay )
					return;

				let distance = utils.distTwoPoints(player,socket.client.player);

				let maxDistance = (Constants.CHARACTER_MOVE_PPS+socket.client.player.getTotalData('fwr'))*Constants.REFRESH_POSITION/1000 + 30; // +30 tolerance
				
				if( distance < maxDistance ){
					socket.client.player.x = player.x;
					socket.client.player.y = player.y;
					let {x , y} = player;
					socket.broadcast.to(gameId).emit('updateposition',{id:socket.client.player.id,x,y});
				}
					
				if( distance >= maxDistance ){
					let {x,y} = socket.client.player;
					socket.emit('setposition',{x,y});
				}
			});

			socket.on('castspell',function(spellPath,spellId,target){

				if( !socket.client.player.isAlive || !socket.client.player.canPlay )
					return;
				
				let spell = SpellLoader.getSpell(spellPath);

				if( spell == null )
					return;

				// some control
				let spellOk = true;
				let characterHasSpellReg = new RegExp( socket.client.player.character.name , 'i' );


				if( spell.cooldown && socket.client.player.isCooldown( spell.name ) )
				{
					spellOk = false;
				}
				else if( !spellPath.match(characterHasSpellReg) )
				{	
					spellOk = false;
				}

				if( spellOk == false )
				{
					return;
				}

				if( spell.cooldown )
					socket.client.player.addSpellCooldown(spell);


				socket.client.player.addCurrentSpell( spellId, Date.now()+spell.duration );

				socket.broadcast.to(gameId).emit('castspell',socket.client.player.id,spell.name,target);
				
				// should check that user is allowed to cast this spell
			});

			socket.on('newmessage',function(message){
				socket.broadcast.to(gameId).emit('newmessage',socket.client.player.username,htmlspecialchars(message));
			});
	       
			socket.on('enemyhit',function(id,position,spellPath,spellId){

				let hittedPlayer = _this.getPlayer(gameId,id);

				if( !hittedPlayer )
					return;

				let isTooFar = utils.distTwoPoints(hittedPlayer,position) > 50 ? true : false;

				if( !isTooFar )
				{
					let spell = SpellLoader.getSpell( spellPath );
					let currentSpell = socket.client.player.getCurrentSpell( spellId );

					if( !currentSpell )
						return;

					
					let maxRange = 0;

					if( spell.range )
						maxRange = spell.range;
					else
						maxRange = (spell.duration/1000)*spell.velocity+20; // +20px for tolerance 

					let hitRange = utils.distTwoPoints(position,currentSpell.origin);

					if( hitRange > maxRange )
						return;

					hittedPlayer.life -= spell.damage;
					const { id , life } = hittedPlayer;
					/*socket.emit('updatelife',{id,life});
					socket.broadcast.to(gameId).emit('updatelife',{id,life});*/
					nsp.to(gameId).emit('updatelife',{id,life});

					if( hittedPlayer.life <= 0 && hittedPlayer.isAlive )
					{
						hittedPlayer.life = 0;
						hittedPlayer.isAlive = false;
						socket.broadcast.to(gameId).emit('newmessage',null,'<strong>' + hittedPlayer.username + ' was slain by ' + socket.client.player.username + '.</strong>');

						hittedPlayer.stats.death++
						socket.client.player.stats.kill++

						nsp.to(gameId).emit('setStatistic',{
							kill: socket.client.player.id,
							death: hittedPlayer.id
						});

						let socketGame = socket.client._user.game;
						
						GameModel.findById(socketGame.id, function(err,game){
							if(err){
								console.error(err);
								return;
							}

							let { client } = socket;
							let teamsName = Constants.TEAM_LETTER_CONSTANTS.slice(0,game.numberOfTeams);

							async.mapSeries( teamsName , function( teamName , callback ){
								console.log('team name = ' + teamName );
								let idxTeam = _.findIndex( game.data , ['team',teamName] );
								if( idxTeam != -1 ){
									let team = game.data[idxTeam];
									
									
									let playersInTeam = _.filter(_this.getPlayer(gameId),{team:teamName});

									if( !playersInTeam.length )
									{
										console.error(__filename + ' : enemyhit : not members found in team.');
										return;
									}

									let playersArray = [];
									if( !Array.isArray( playersInTeam ) )
										playersArray.push( playersInTeam );
									else
										playersArray = playersInTeam;

									let teamAlive = false;
									for( let _player of playersArray ){
										console.log(_player);
										if( _player.isAlive == true ){
											teamAlive = true;
											break;
										}
									}
									callback( null , {team:teamName,teamAlive} );
									
								}
								else
								{
									callback( 'Team "'+teamName+'" does not exist' , null );
								}
							}, 
							function(err, teams){
								if( err )
								{
									console.error(err);
									return;
								}

								let listAliveTeams = _.filter( teams , ['teamAlive', true] );
								if( listAliveTeams.length == 1 )
								{
									let lastTeamAlive = listAliveTeams[0];

									let idxTeam = _.findIndex( game.data , ['team',lastTeamAlive.team] );
									if( idxTeam != -1 ){
										game.data[idxTeam].score++;
										game.save(function(err){

											// revive all others
											if( err ){
												console.error(err);
												return;
											}

											nsp.to(gameId).emit('setScore', {team:lastTeamAlive.team, score:game.data[idxTeam].score});


											if( game.data[idxTeam].score == 1 ){
												nsp.to(gameId).emit('newRound',lastTeamAlive.team);
												const sockets = _this.getSocketPlayer(gameId)

												setTimeout(function(){
													sockets.forEach(s=>{
														s.client.player.x = 600
														s.client.player.y = 600
														let np = s.client.player.reset().getPublic()
														
														s.emit('setupplayer',np)
														s.broadcast.to(gameId).emit('newplayer',np)
													})
												},6*1000);

											}
											
										});
									}else{
										console.error('team "'+lastTeamAlive.team+'" does not exist.');
									}
								}

							});




						});


					}
					

				}

				socket.client.player.clearCurrentSpell();

				
			});


	       
		});

	}

	getSocketPlayer(room,id=null){

		let {nsp} = this;
		let ids = null;
		let players = [];

		if( id ){
			if( !Array.isArray( id ) )
				ids = [ id ];
			else
				ids = id;
		}
		const {connected} = nsp;
		let socketInRooms = Object.keys(nsp.adapter.rooms[room].sockets);
	
		for( let sockId of socketInRooms ){
			if( ids ){
				if( ids.indexOf(connected[sockId].client.player.socketId) !== -1 )
					players.push( connected[sockId] );
			}else{
				players.push( connected[sockId] );
			}
		}
		if( !players.length )
			return null;

		return ids && ids.length === 1 ? players[0] : players;



	}

	// it's SOCKET id
	getPlayer(room,id=null){

		let sockets = this.getSocketPlayer(room,id);

		if( sockets === null )
			return null;

		if( !Array.isArray( sockets ) )
			sockets = [sockets]

		let socketsPlayer = _.map(sockets, 'client.player')

		return socketsPlayer.length === 1 ? socketsPlayer[0] : socketsPlayer;

	}
}

module.exports = SocketIngame;