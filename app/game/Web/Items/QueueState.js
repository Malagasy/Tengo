import React from 'react'

class QueueState extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isSearching: false
    }

    this.launchQueue = this.launchQueue.bind(this)
  }

  componentDidMount () {
  }
  launchQueue () {
    const {onLaunchQueue} = this.props
    const {isSearching} = this.state

    if (onLaunchQueue) {
      let type = isSearching ? 'unsearch' : 'search'
      onLaunchQueue(type)
      this.setState({isSearching: !isSearching})
    }
  }
  render () {
    const {state} = this.props
    const {isSearching} = this.state

    let content = ''
    if (state === 'SEARCHING') {
      content = (

        <p>Searching for a game... <img src="/images/loading.gif" /></p>

      )
    }
    if (state === 'WAITING') {
      content = (<p>{"You can't start playing until your partner has answered."}</p>)
    }

    return (<div className="queustate">
      <div className="queuestate__item">{content}</div>

      <button type="submit" className="btn" onClick={this.launchQueue.bind(this)}>{
        isSearching ? 'Cancel' : 'Play'}</button>
    </div>)
  }
}
export default QueueState
