import React from 'react'
import _ from 'lodash'

import ScrollBox from './Components/ScrollBox'

class Lobby extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      messages: [],
      text: '',
      users: [],
      character: '',
      isLocked: false,
      game: {},
      showCharacters: false
    }

    this.handleLock = this.handleLock.bind(this)
    this.onChangeCharacter = this.onChangeCharacter.bind(this)
    this.toggleCharactersList = this.toggleCharactersList.bind(this)

    this.characters = [
      {id: 'sorceress', label: 'Sorcière'}
    ]
  }

  componentDidMount () {
    const _this = this
    const { socket } = this.props

    if (!socket) { return }

    // socket.emit('on_room');

    socket.emit('on_lobby')

    socket.on('allusers', function (users) {
      _this.setState({users})
    })

    socket.on('new_user', function (user) {
      const {users} = _this.state

      let newUsers = _.clone(users)
      newUsers.push(user)
      _this.setState({users: _.uniqBy(newUsers, 'id')})
    })

    socket.on('lockedcharacter', function (lock) {
      const {characters} = _this
      const {user} = _this.props
      let newUsers = _.clone(_this.state.users)

      let idx = _.findIndex(newUsers, {id: lock.id})

      if (idx !== -1) {
        let {character} = lock

        newUsers[idx].character = _.find(characters, {id: character.toLowerCase()})

        let isLocked = !!(_this.state.isLocked || user.id === lock.id)

        _this.setState({isLocked, users: newUsers})
      }
    })

    socket.on('left_lobby', function () {
      _this.props.onUserLeave()
    })

    socket.on('game_launching', function () {
      let newGame = _.clone(_this.state.game)
      newGame.ready = true
      _this.setState({game: newGame})
    })

    socket.on('launch_game', function () {
      const { onLaunchGame } = _this.props
      onLaunchGame()
    })

    socket.on('new_message', function (name, message) {
      let { messages } = _this.state
      messages.push({name, message})
      _this.setState({messages})
    })
  }

  componentWillUnmount () {
    const { socket } = this.props

    socket.off('allusers')
    socket.off('new_user')
    socket.off('lockedcharacter')
    socket.off('left_lobby')
    socket.off('game_launching')
    socket.off('launch_game')
    socket.off('new_message')
  }

  handleSubmit (e) {
    if (e.key !== 'Enter') { return }

    const { socket, user } = this.props

    let { text } = this.state

    let { name } = user

    text = text.trim()

    if (!text) { return }

    socket.emit('new_message', text)
    this.setState({text: ''})

    let { messages } = this.state
    messages.push({name, message: text})
    this.setState({messages})
  }

  onChangeCharacter (character) {
    const {user} = this.props
    let newUsers = _.clone(this.state.users)
    let idx = _.findIndex(newUsers, {id: user.id})
    console.log(character)
    if (idx !== -1) {
      newUsers[idx].character = character
      this.setState({character, users: newUsers})
    }
  }

  toggleCharactersList (clickedUserId) {
    const {user} = this.props
    const {isLocked} = this.state
    let showCharacters = !this.state.showCharacters

    if (!isLocked && user.id === clickedUserId) { this.setState({showCharacters}) }
  }

  handleLock () {
    const { characters } = this
    let { character } = this.state
    let { socket } = this.props

    if (!character) { return }

    let charExist = _.findIndex(characters, {id: character.id})
    if (charExist === -1) { return }

    socket.emit('lockcharacter', character.id)
  }

  render () {
    const { characters } = this
    const { user } = this.props
    let { users, game, isLocked, showCharacters } = this.state

    const teams = _.map(_.uniqBy(users, 'game.team'), 'game.team')
    const teamsJSX = []
    for (let team of teams) {
      let usersInTeam = _.filter(users, u => u.game.team === team)
      let usersInTeamJSX = usersInTeam.map(userIn => {
        let character = userIn.character ? <span>{userIn.character.label}</span> : ''
        let currentPlayerClass = userIn.id === user.id && !isLocked ? 'current' : ''
        let charactersJSX = ''
        let showCharactersClass = showCharacters ? 'active' : ''

        if (currentPlayerClass === 'current') {
          let c = characters.map(char => {
            return (<div key={char.id + '-' + userIn.id} className={'character__list__item'} onClick={() => this.onChangeCharacter(char)}>{char.label}</div>)
          })
          charactersJSX = (
            <div key={'list-' + userIn.id} className={'character__list'}>
              {c}
            </div>
          )
        }

        return (<div className={'looby__team--player ' + currentPlayerClass + ' ' + showCharactersClass} key={'player-' + userIn.id}><div className="team__player--name">{userIn.name}</div><div onClick={() => this.toggleCharactersList(userIn.id)} className="team__player--character">{character}

          {charactersJSX}</div>
        </div>)
      })

      teamsJSX.push(<div key={team} className="lobby__team">{usersInTeamJSX}</div>)
    }

    let lockedBtnClass = isLocked ? 'active' : ''

    let gameInfo = game.ready ? <h1>Game is about to launch</h1> : null
    const messagesList = this.state.messages.map(msg => {
      if (msg.name) { return <div className="lobby__chat__item"><span>{'<' + msg.name + '>'} </span>{msg.message}</div> } else { return <div className="lobby__chat__item"><span><em>{msg.message}</em></span></div> }
    })

    return (
      <div className="Lobby bloc__center">
        {gameInfo}

        <div className="teams">
          {teamsJSX}
        </div>

        <button className={'lobby__button__ready ' + lockedBtnClass} onClick={this.handleLock}>Ready</button>

        <div className="lobby__chat">
          <ScrollBox height={200} forceBottom={true} boxClass="lobby__chat__message">
            {messagesList}
          </ScrollBox>
          <input
            className="input lobby__chat__input"
            type="text" value={this.state.text}
            onChange={e => this.setState({text: e.target.value})}
            onKeyPress={this.handleSubmit.bind(this)}
          />
        </div>

      </div>

    )
  }
}

export default Lobby
