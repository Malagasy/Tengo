class Hotkeys {

	constructor(){

	}

	remove( key ) {
		window.localStorage.removeItem( key )
	}

	getKey( value ){
		let lsKeys = Object.keys( window.localStorage )

		if( !lsKeys.length ) return null

		for( let i = 0 ; i < lsKeys.length ; i++ ){
			if( window.localStorage[ lsKeys[i] ] == value )
				return lsKeys[i]
		}

		return null
	}

	get( key ) {
		let value = window.localStorage.getItem(key)
		if( value === null ) return null
		return isNaN( value ) ? value : Number(value)
	}

	set (key, value) {
		window.localStorage.setItem( key , value)
		return this
	}

	setIfEmpty( key , value ){
		if( this.get( key ) === null )
			this.set( key , value )
	}

	setMultipleIfEmpty ( obj ) {
		this.setMultiple( obj , true )
	}

	setMultiple( obj , checkEmpty = false ){

		let keys = Object.keys(obj)

		if( keys.length === 0 ) return

		for( let key of keys ) {
			if( checkEmpty === true ) this.setIfEmpty( key , obj[key] )
			else this.set( key , obj[key] )
		}
	
	}
}

export default (new Hotkeys())