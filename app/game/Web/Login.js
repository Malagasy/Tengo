import React from 'react'

class Login extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      login: '',
      error: '',
      loading: false
    }
    // 1 for login
  }

  componentDidMount () {
    const _this = this
    const { socket } = this.props

    socket.on('authenticate_error', function (error) {
      _this.setState({error, loading: false})
    })
  }

  componentWillUnmount () {
    const {socket} = this.props
    socket.off('authenticate_error')
  }

  handleSubmit () {
    const { socket } = this.props
    const { login } = this.state

    let error = ''
    const unallowedChars = ['/', '\\', '<', '>']

    if( !login ) return

    if (login.length > 20) { error = 'Your name is too long.' } else if (login.length < 3) { error = 'Your name is too short...' }
    for (let unallow of unallowedChars) {
      if (login.indexOf(unallow) !== -1) { error = 'Your name has not allowed character.' }
    }

    if (error) { return this.setState({error}) }

    this.setState({error: '', loading: true})

    socket.emit('authenticate', login)
  }

  render () {
    const { loading } = this.state

    let button = loading ? <img src="/images/loading.gif"/> : <button type="submit" className="btn" onClick={this.handleSubmit.bind(this)}>play</button>

    return (
      <div className="Lobby bloc__center">
        <div className="lobby__message">
          <strong>{this.state.error}</strong>
        </div>
        <div className="lobby__form">
          <input placeholder="Enter your name" spellCheck={false} className="input" value={this.state.login} onChange={e => this.setState({login: e.target.value})} />
        </div>
        <p>
          {button}
        </p>
      </div>

    )
  }
}

export default Login
