import Phaser from 'phaser-ce'

const csts = {}

csts.CHARACTER_MOVE_PPS = 400
csts.CHARACTER_FACTOR_VIEW = 5
csts.CHARACTER_AVOIDANCE_FACTOR = 350
csts.MS_BEFORE_STOP = 300
csts.MS_BEFORE_UNLOCK = 100
csts.REFRESH_POSITION = 50
csts.SPELL_DELAY = 400
csts.FHR_DELAY = 100
csts.DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
csts.DEFAULT_HK = {
	'spell_1':{
		code:Phaser.KeyCode.A,
		label: 'Activate spell 1'
	},
	'spell_2':{
		code:Phaser.KeyCode.Z,
		label: 'Activate spell 2'
	},
	'spell_3':{
		code:Phaser.KeyCode.E,
		label: 'Activate spell 3'
	},
	'spell_4':{
		code:Phaser.KeyCode.R,
		label: 'Activate spell 4'
	},
  'clear_message':{
  	code:Phaser.KeyCode.C,
  	label: 'Clear chat messages'
  },
  'toggle_score': {
  	code:Phaser.KeyCode.TAB,
  	label: 'Show/hide table score'
  },
  'switch_player': {
  	code: Phaser.KeyCode.S,
  	label: 'Switch player view (if dead)'
  }
}
csts.MAX_VOL_OTHERS_FOOTSTEP = 0.07

export default csts
