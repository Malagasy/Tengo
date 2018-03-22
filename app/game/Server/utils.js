const utils = {};

utils.distTwoPoints = (a,b)=>{
	return Math.sqrt( Math.pow( b.x - a.x , 2 ) + Math.pow( b.y - a.y , 2 ) );
}

utils.capitalizeFirstLetter = str => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

utils.dirname = path => {
	return path.match(/([^\/]*)\/*$/)[1];
}

utils.getAllUsersNamespace = function(nsp,room=null){
	let users = [];
	const {connected} = nsp;
	let socketKeys = [];

	if( room === null ){
		socketKeys = Object.keys(connected);
	}else{
		if( nsp.adapter.rooms[room] ) { socketKeys = Object.keys(nsp.adapter.rooms[room].sockets); }
		else { return [] }
	}

	socketKeys.forEach(function(socketId){
		let socket = connected[socketId];
		let {_user} = socket.client;
		if( _user ){
			if( room ){
				if( Object.values(socket.rooms).indexOf(room) !== -1 )
					users.push( socket );
			}
			else{
				users.push( socket );
			}	
		}
	});

	return users;
}

utils.getUserNamespace = function(nsp,id){
	let s = null;
	const {connected} = nsp;
	Object.keys(connected).forEach(function(socketId){
		let {_user} = connected[socketId].client;
		if( _user && _user.id == id )
			s = connected[socketId];
	});
	
	return s;
}
module.exports = utils;
