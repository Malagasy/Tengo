var _ = require('lodash');
var htmlspecialchars = require('htmlspecialchars');
var path = require('path');
var utils = require('./utils');
var async = require('async');

const mongoose = require('mongoose');

const GameModel = require('./Models/Game');
const Constants = require('./Constants');


var shortid = require('shortid');

class Room{


	constructor(nsp){
		this.nsp = nsp;
		this.mainRoom = 'general';
	}

	init(socket){
		const {nsp,mainRoom} = this;
		const _this = this;

		socket.on('on_room',function(){
			socket.join(mainRoom,err=>{
				if( err ){
					console.error(err);
				}else{

					const {_user} = socket.client;
					if( !_user ){
						console.log( __filename + ' : on_room : _user does not exist.' );
						return;
					}
					_user.status = 'room';
					socket.broadcast.to(mainRoom).emit('room_new_user',_user);
					let users = _.map( utils.getAllUsersNamespace(nsp,mainRoom) , 'client._user' );
					socket.emit('room_user_list', users );

				}
			});
		});

		socket.on('room_new_message',function(message){
			let { name } = socket.client._user;
			socket.broadcast.to(mainRoom).emit('room_new_message',name, message );
		});

		socket.on('disconnect',function(){
			const {_user} = socket.client;
			if( !_user ){
				console.log('_user is null on "disconnect"');
				return;
			}
			nsp.emit('room_user_leave',_user.id);

			if( _user.game.id ) _this.removePlayerFromGame( _user.id , _user.game.id )

				if( _user.group )
					socket.broadcast.to('group-'+_user.group).emit('user_left_group',_user.name);
			});

		socket.on('leave_group',function(){
			const {_user} = socket.client;

			if(_user.group){
				
				socket.to('group-'+_user.group).emit('user_left_group',_user.name);

				if( _user.groupLeader == true ){
					socket.broadcast.to('group-'+_user.group).emit('dismiss_group');

					nsp.in('group-'+_user.group).clients((error,clientIds)=>{
						
						for( let clientId of clientIds )
						{
							let socketInRoom = nsp.connected[clientId];
							const {client} = socketInRoom;
							socketInRoom.leave('group-'+_user.group);
							client._user.group = null;
							client._user.groupLeader = false;
						}
					});
				}

				
				_user.group = null;
			}
		});

		socket.on('ask_group',function(partnerId){
			const socketAsked = utils.getUserNamespace(nsp,partnerId);
			if( !socketAsked )
				return;
			const { _user } = socket.client;
			if( !_user.group ){
				_user.group = shortid.generate();
				_user.groupLeader = true;
				socket.join('group-'+_user.group);
			}

			socketAsked.emit('ask_group_2', _user.id);

		});

		socket.on('cancel_group',function(partnerId){

			const socketAsked = utils.getUserNamespace(nsp,partnerId);
			if( !socketAsked )
				return;
			socketAsked.emit('cancel_group');
		});

		socket.on('answer_group',function(askerId,answer){
			const sockets = utils.getAllUsersNamespace(nsp,mainRoom);
			/*
			const socketAsker = _.find(users, ['id',askerId]);*/
			let socketAsker = null;
			for( let i = 0 ; i < sockets.length ; i++ )
			{
				if( sockets[i].client._user.id == askerId )
				{
					socketAsker = sockets[i];
					break;
				}
			}
			if( !socketAsker )
			{
				console.error("askerId="+askerId);
				return;
			}
			socketAsker.emit('answer_group_2',answer);

			if( answer == true ){

				// check if in group before
				if( socket.client._user.group ){
					socket.broadcast.to('group-'+socket.client._user.group).emit('user_left_group',socket.client._user.name);
					socket.leave('group-'+socket.client._user.group);
				}

				const users = _.map( sockets , 'client._user' );
				let {group} = socketAsker.client._user;
				if( !group ){
					console.error(__filename + ' : answer_group : the socketAsker has not group : ' + JSON.stringify(socketAsker.client._user) );
					
					return;
				}
				socket.client._user.group = group;
				socket.client._user.groupLeader = false;
				socket.join('group-'+group);

				const usersInGroup = _.filter( users , ['group',group] );

				nsp.to('group-'+group).emit('refresh_group',usersInGroup);
			}

		});

		socket.on('user_leave_queue',function(){

			const {_user} = socket.client;

			if( !_user ) return

				if( _user.game.id ) {
					socket.leave( _user.getLobby() )
					_this.removePlayerFromGame( _user.id , _user.game.id )
					_user.game = {}
				}


			})

		socket.on('user_enter_queue',function(){

			const {_user} = socket.client;

			if( !_user ) return

			if( _user.game.id ){
				console.error(__filename + ' : user_enter_queue : user "'+_user.name+'" has already a game. => ' + JSON.stringify(_user.game) );
				return;
			}

			console.log( __filename + ' : user_enter_queue : ' + JSON.stringify(_user) );	

			let { group, groupLeader } = socket.client._user;
			let nbNeededPlaces = 1;

			let socketsInGroup = []
			if( group ) {
				if( groupLeader === false )
					return
				socketsInGroup = utils.getAllUsersNamespace(nsp,'group-'+group)

				nbNeededPlaces = !Array.isArray(socketsInGroup) ? 1 : socketsInGroup.length

			}

			let playersPerTeam = 1

			GameModel
			.findOne({
				started:false,
				playersPerTeam,
				$where: `function () {
					for( let data of this.data ){
						if( (this.playersPerTeam-data.members.length) >= ${nbNeededPlaces} )
							return true
					}
					return false
				}`
			})
			.sort({creationDate:1})
			.exec(function(err,game){

				// populate data
				if( !game )
				{

					let numberOfTeams = 2;
					let data = [];
					for( let i = 0 ; i < numberOfTeams ; i++ ){
						data.push({
							team: Constants.TEAM_LETTER_CONSTANTS[i],
							score: 0,
							members: []
						});
					}

					game = new GameModel({
						numberOfTeams,
						playersPerTeam,
						creationDate:Date.now(),
						started: false,
						data
					});
					game.save();
				}
				let pushedInGame = false;

				for( let i = 0 ; i < game['data'].length ; i++ ){
					
					if( (game.playersPerTeam-game['data'][i].members.length) >= nbNeededPlaces )
					{
						game['data'][i].members.push(socket.client._user.id);
						pushedInGame = game['data'][i].team;
						if( socketsInGroup.length > 1 ) {
							let users = _.map( socketsInGroup , 'client._user' )
							_.filter( users , u => u.id === socket.client._user.id )
							users.forEach( user => {
								game['data'][i].members.push( user.id )
							})
						}
						break;
					}
				};


				if( pushedInGame === false ) {
					return
				}

				let numberOfPlayersGame = 0;
				_.forEach( game['data'] , function(team){
					numberOfPlayersGame += team.members.length;
				});

				if( numberOfPlayersGame == game.playersPerTeam*game.numberOfTeams ){
					game.started = true;
				}

				//GameModel.update({ _id: game._id } )		
				game.markModified('data');
				game.save(function(err){
					if( err ) {
						console.error( err )
						return
					}

					let _sockets = socketsInGroup.length ? socketsInGroup : [ socket ]

					async.mapSeries( _sockets , function( s , callback ){
						s.client._user.game.id = game._id
						s.client._user.game.team = pushedInGame

						let lobbyName = s.client._user.getLobby()
						s.join(lobbyName,err=>{
							if( err ){
								console.log(__filename + ' : user_enter_queue : user joined game but could not join lobby...');
								callback( s.client._user.id , false )
								return;
							}

							callback( null , true )
						})
					}, function(err, rdm) {
						if( err ) {
							console.error(`User ${err} couldn't join the lobby`)
							return
						}
						if( game.started == true ){
							let lobbyName = 'lobby-'+game.id
							nsp.to(lobbyName).emit('start_lobby')
							let sockets = utils.getAllUsersNamespace(nsp,lobbyName);
							for( let s of sockets ){
								s.leave(mainRoom);
								s.leave(lobbyName);
							}

						}
					})
				});

			});

		});

	}

	removePlayerFromGame( userId , gameId ){
		GameModel.findOne({_id:gameId}, null, function(err,game) {

			if( !game ) return

				let numberOfPlayersGame = 0
			let newGameData = _.cloneDeep( game.data )
			console.log(newGameData);
				//for( let data of newGameData ) {
					for( let i = 0 ; i < newGameData.length ; i++ ) {
						let data = newGameData[i]
						if( data.members.indexOf( userId ) !== -1 )
							_.remove( data.members , d => d === userId )

						numberOfPlayersGame += data.members.length
					}

					if( numberOfPlayersGame === 0 ) {
						GameModel.remove({_id:gameId},err=> {
							if( err ) console.log( err )
						})
					}else{
						game.data = newGameData

						game.markModified('data');

						game.save ( (err,updGame)=> {
							if( err ) console.error(err)
						})
					}
				})

	}
}



module.exports = Room;