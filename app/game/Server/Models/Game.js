var mongoose = require('mongoose');

let gameSchema = mongoose.Schema({
	playersPerTeam: Number,
	creationDate: Date,
	numberOfTeams: Number,
	started: Boolean,
	data: {type: Array}
});


module.exports = mongoose.model('Game',gameSchema);