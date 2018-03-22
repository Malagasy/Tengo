import React from 'react'

import './tooltip.scss'

class Tooltip extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  componentDidMount () {
  }

  onClickAction (type) {
    const {onAction} = this.props
    if (onAction) onAction(type)
  }

  render () {
    const { visible, actions } = this.props

    if (!visible) { return (null) }

    const JSXActions = []
    for (let action of actions) {
      JSXActions.push(<li key={action.type} onClick={() => this.onClickAction(action.type)}>{action.label}</li>)
    }
    return (
      <ul className="tooltip__container">
        {JSXActions}
      </ul>)
  }
}
export default Tooltip
