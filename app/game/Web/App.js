import React from 'react'
import Login from './Login'
import Room from './Room'
import Lobby from './Lobby'
import { Howl } from 'howler'

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = ({gameState: 4, user: {}
    })

    this.onLaunchGame = this.onLaunchGame.bind(this)
    this.onUserLeave = this.onUserLeave.bind(this)
    this.toggleAudio = this.toggleAudio.bind(this)

    // 1 for login
  }

  componentDidMount () {
    const _this = this
    const { SocketMain, SocketRoom } = this.props

    new Howl({
      src: ['/audio/game.mp3'],
      volume : 0.1,
      loop: true,
      onload: function(){
        _this.setState({audio:this})
        
        if( _this.state.gameState === 1 ) this.play()
      }
    })

    SocketMain.on('connect', function () {
      SocketMain.on('authenticated', function (user) {
			 	_this.setState({gameState: 2, user}) // room

			 	SocketRoom.on('start_lobby', function () {
			 		_this.setState({gameState: 3})
			 		// window.initGame();
			 	})
      })
    })
  }

  toggleAudio () {
    const { audio } = this.state

    if( audio.playing() ) audio.pause()
    else audio.play()

    this.setState({audio})

  }

  onUserLeave () {
    this.setState({gameState: 2})
  }

  onLaunchGame () {
 		this.setState({gameState: 4})
 		window.initGame()
  }

  render () {
    const { gameState, user, audio} = this.state
    const {SocketMain, SocketRoom, SocketLobby} = this.props

    let component = ''
    if (gameState == 1) component = <Login socket={SocketMain} />
    if (gameState == 2) component = <Room socket={SocketRoom} user={user} />
    if (gameState == 3) component = <Lobby socket={SocketLobby} user={user} onUserLeave={this.onUserLeave} onLaunchGame={this.onLaunchGame}/>

    let audioClass = audio && audio.playing() ? '' : 'mute'

    let audioJSX = "";
    if( audio ) {
      if( gameState === 1 || gameState === 2 ||gameState === 3 ) {
        audioJSX = <img src="/images/speaker.png" className={"app__audio "+audioClass} onClick={this.toggleAudio}/>
      } else {
        audio.stop()
      }
    }

    return (
      <div className="App">
        {component}

        {audioJSX}
      </div>)
  }
}

export default App
