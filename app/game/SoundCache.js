import { Howl } from 'howler'

class SoundCache{

	constructor() {
		this.sound = {}

	}

	add(type, key, url, volume=1, loop = false) {
		if( !Array.isArray( url ) ) url = [ url ]

		let sound = new Howl({
			src: url,
			autoplay: false,
			volume,
			loop
		})

		if( !this.sound[type] ) this.sound[type] = {}

		this.sound[type][key] = sound
	}

	get ( type, key ) {
		return this.sound[type][key]
 	}

 	play( type, key, volume = null ) {
 		let sound = this.get( type, key )
 		if( volume !== null ) sound.volume(volume)
 		return sound.play()
 	}


}

export default (new SoundCache())