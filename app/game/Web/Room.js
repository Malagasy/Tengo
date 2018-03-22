import React from 'react'
import _ from 'lodash'

import ScrollBox from './Components/ScrollBox'
import Tooltip from './Components/Tooltip'

import QueueState from './Items/QueueState'

class Room extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      messages: [],
      text: '',
      users: [],
      searchPlayer: '',
      tooltipPLayer: '',
      waitingGroup: false,
      askingGroup: false,
      group: [],
      queueState: ''
    }

    this.openTooltip = this.openTooltip.bind(this)
    this.onAction = this.onAction.bind(this)
    this.answerGroup = this.answerGroup.bind(this)
    this.cancelAskingGroup = this.cancelAskingGroup.bind(this)
    this.leaveGroup = this.leaveGroup.bind(this)
    this.onLaunchQueue = this.onLaunchQueue.bind(this)

    this.actions = []
    this.actions.push({type: 'ask_group', label: 'Invite to group'})
  }

  componentDidMount () {
    const _this = this
    const { socket } = this.props
    console.log('should emit "on_room"')
    socket.emit('on_room')
    socket.on('room_user_list', function (users) {
      _this.setState({users})
    })
    socket.on('room_new_user', function (user) {
      let users = _.cloneDeep(_this.state.users)
      users.push(user)

      users = _.uniqBy(users, 'id')

      _this.setState({users})
    })
    socket.on('room_user_leave', function (id) {
      let users = _.filter(_.clone(_this.state.users), user => user.id !== id)
      _this.setState({users})
    })

    socket.on('room_new_message', function (name, message) {
      let messages = _.clone(_this.state.messages)
      messages.push({name, message})
      _this.setState({messages})
    })

    socket.on('ask_group_2', function (askerId) {
      const {users} = _this.state
      const asker = _.find(users, ['id', askerId])

      if (asker) {
        _this.setState({askingGroup: asker})
      }
    })

    socket.on('cancel_group', function () {
      _this.setState({askingGroup: false})
    })

    socket.on('answer_group_2', function () {
      _this.setState({waitingGroup: false})
    })

    socket.on('refresh_group', function (members) {
      console.log(members)
      _this.setState({group: _.map(members, 'name')})
    })

    socket.on('user_left_group', function (name) {
      const group = _.filter(_.clone(_this.state.group), m => m !== name)
      _this.setState({group})
    })

    socket.on('dismiss_group', function () {
      _this.setState({group: []})
    })
  }
  componentWillUnmount () {
    const { socket } = this.props
    socket.off('room_user_list')
    socket.off('room_new_user')
    socket.off('room_user_leave')
    socket.off('room_new_message')
    socket.off('ask_group_2')
    socket.off('cancel_group')
    socket.off('answer_group_2')
    socket.off('refresh_group')
    socket.off('user_left_group')
    socket.off('dismiss_group')
  }

  handleSubmit (e) {
    if (e.key !== 'Enter') { return }

    const { socket, user } = this.props

    let { text } = this.state

    let { name } = user

    text = text.trim()

    if (!text) { return }

    socket.emit('room_new_message', text)
    this.setState({text: ''})

    let messages = _.cloneDeep(this.state.messages)
    messages.push({name, message: text})
    this.setState({messages})
  }

  onLaunchQueue (type) {
    const { socket } = this.props
    const {waitingGroup} = this.state

    if (type === 'search') {
      if (waitingGroup) {
        this.setState({queueState: 'WAITING'})
      } else {
        this.setState({queueState: 'SEARCHING'})
        socket.emit('user_enter_queue')
      }
    } else if (type === 'unsearch') {
      socket.emit('user_leave_queue')
      this.setState({queueState: ''})
    }
  }

  openTooltip (user) {
    let {tooltipPLayer} = this.state

    tooltipPLayer = user.id === tooltipPLayer ? '' : user.id
    this.setState({tooltipPLayer})
  }
  onAction (user, type) {
    const { socket } = this.props
    const currentUser = this.props.user

    if (type === 'ask_group') {
      const { users } = this.state
      const newUsers = _.clone(users)

      let idx = _.findIndex(users, ['id', currentUser.id])
      if (idx !== -1) {
        newUsers[idx].group = true
        this.setState({users: newUsers, waitingGroup: user.id})
        socket.emit('ask_group', user.id)
      }
    }

    this.setState({tooltipPLayer: ''})
  }
  answerGroup (answer) {
    const {socket} = this.props
    const {askingGroup} = this.state
    if (askingGroup) {
      socket.emit('answer_group', askingGroup.id, answer)
      this.setState({askingGroup: false})
    }
  }
  cancelAskingGroup () {
    const {socket} = this.props
    const {waitingGroup} = this.state

    console.log(waitingGroup)

    if (waitingGroup) {
      socket.emit('cancel_group', waitingGroup)
      this.setState({waitingGroup: false})
    }
  }
  leaveGroup () {
    const {socket} = this.props
    socket.emit('leave_group')
    this.setState({group: []})
  }
  render () {
    const { users, searchPlayer, messages, tooltipPLayer, waitingGroup, askingGroup, group, queueState } = this.state
    const currentUser = this.props.user
    const {actions} = this

    const lists = users.map(user => {
      if (!searchPlayer || (user.name.indexOf(searchPlayer) !== -1)) {
        let tooltipVisible = tooltipPLayer === user.id
        let tooltip = user.id !== currentUser.id ? <Tooltip visible={tooltipVisible} onAction={(type) => this.onAction(user, type)} actions={actions} /> : ''
        return (
          <div className="playerlist__item" key={user.id}>
            <span onClick={() => this.openTooltip(user)}>{user.name}</span>
            {tooltip}
          </div>
        )
      }
    })

    const messagesList = messages.map((msg, i) => <div className="chat__message__item" key={i} ><span>{'<' + msg.name + '>' }</span>{msg.message}</div>)

    let waitGroupMessage = waitingGroup ? <p>{"Asking for group. You have to wait your partner's answer before playing"}<br/><span onClick={this.cancelAskingGroup}>Cancel</span></p> : ''
    let askGroupMessage = askingGroup ? (
      <div>
        <p><strong>{askingGroup.name}</strong> invite you in his group.</p>
        <p>
          <span onClick={() => this.answerGroup(true)}>Accept</span><br/>
          <span onClick={() => this.answerGroup(false)}>Decline</span>
        </p>
      </div>) : ''

    let groupJsx = ''

    if (group.length) {
      let members = group.map(member => <li key={member}>{member}</li>)
      groupJsx = (
        <div className="room__group">
          <div className="room__group__title">Group</div>
          <ul>{members}</ul>
          <span onClick={this.leaveGroup}>Leave group</span>
        </div>)
    }

    return (
      <div className="grid Room bloc__center has-gutter">
        <div className="one-fifth">
          <QueueState state={queueState} onLaunchQueue={this.onLaunchQueue} />

          {waitGroupMessage}
          {askGroupMessage}
          {groupJsx}
        </div>
        <div className="room__chat">

          <ScrollBox height={350} forceBottom={true} boxClass="room__chat__message">
            {messagesList}
          </ScrollBox>

          <input placeholder="type here.." spellCheck={false} type="text" className="room__chat__input" value={this.state.text}
            onChange={e => this.setState({text: e.target.value})}
            onKeyPress={this.handleSubmit.bind(this)}
          />
        </div>
        <div className="one-fifth room__playerlist">
          <input placeholder="Search player" type="text" className="input small" value={searchPlayer}
            onChange={e => this.setState({searchPlayer: e.target.value})}
          />
          <ScrollBox height={350} boxClass="room__playerlist--box" scrollClass="room__playerlist--scroll">{lists}</ScrollBox>
        </div>
      </div>

    )
  }
}

export default Room
