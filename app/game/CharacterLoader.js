import Sorceress from './Data/Characters/Sorceress'
import utils from './utils'

class CharacterLoader {
  constructor () {
    this.charactersMap = {Sorceress}
  }

  instanciateCharacter (character) {
    character = utils.capitalizeFirstLetter(character)

    let charClass = this.charactersMap[character]

    return new charClass()
  }
}

export default CharacterLoader
