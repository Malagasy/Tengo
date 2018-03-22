var express = require('express');
var uws = require('uws');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server,{wsEngine: 'uws'});
var path = require('path');
var utils = require('./game/Server/utils');
var htmlspecialchars = require('htmlspecialchars');
const _ = require('lodash');

/* db */
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/lone');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {});


/* web */
var User = require('./game/Server/User');
var shortid = require('shortid');
var lobby = require('./game/Server/Lobby');
var room = require('./game/Server/Room');
const lobbyNsp = io.of('/lobby');
const Lobby = new lobby(lobbyNsp);


/* game */
var socketIngame = require('./game/Server/SocketIngame');

var playNsp = io.of('/play');
SocketIngame = new socketIngame(playNsp);


app.use('/js' , express.static( __dirname + '/../dist') );
app.use('/css' , express.static( __dirname + '/css') );
app.use('/assets' , express.static( __dirname + '/assets') );
app.use('/spell' , express.static( __dirname + '/game/Data/Spells') );
app.use('/images' , express.static( __dirname + '/images') );
app.use('/audio' , express.static( __dirname + '/audio') );

app.get('/',function(req,res){
    res.sendFile( path.resolve( __dirname+'/index.html') );
});

const roomNsp = io.of('/room');
const Room = new room(roomNsp);


io.on('connection',function(socket){

	socket.on('authenticate',function(name){

		let error = "";
		const unallowedChars = ['/','\\', '<' , '>'];


		// validate user
		if( socket.client._user )
			error = "You seems to be already connected. Please reload.";
		else if( name.length > 20 )
			error = "Your name is too long."
		else if( name.length < 3 )
			error = "Your name is too short..."



		let idx = _.findIndex( _.map( utils.getAllUsersNamespace(io.of('/')) , 'client._user' ) , {name} );
		if( idx != -1 )
			error = "This name is already used.";

		for(let unallow of unallowedChars )
			if( name.indexOf(unallow) !== -1 )
				error = "Your name has not allowed character.";
		
		if( error ){
			socket.emit('authenticate_error','User already exist.');
			return;
		}

		name = htmlspecialchars( name );

		let id = shortid.generate();
		socket.client._user = new User(name,id);

		socket.emit('authenticated',socket.client._user);
	
	});
});

roomNsp.on('connection',function(socket){

	Room.init(socket);

});

lobbyNsp.on('connection',function(socket){


	let { _user } = socket.client;



	if( !_user )
	{
		console.log('undefined _user on "lobbynsp connection"');
	}

	Lobby.init(socket);


});

playNsp.on('connection',function(socket){


	let { _user } = socket.client;

	if( !_user ){
		_user = new User("toto",shortid.generate())
		_user.game = {id:"507f1f77bcf86cd799439011",team:"t"+shortid.generate()}
		socket.client._user = _user;
	}
	
	if( !_user )
	{
		console.log('undefined _user on "playNsp connection"');
	}

	SocketIngame.init(socket);

});



server.listen(8081,function(){ // Listens to port 8081
    console.log('Listening on '+server.address().port);
});
