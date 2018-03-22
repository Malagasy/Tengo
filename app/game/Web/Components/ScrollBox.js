import React from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'

import './scrollbox.scss'

class ScrollBox extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      innerTranslateY: 0,
      scrollTranslateY: 0,
      scrollSize: props.height / 2,
      dragging: false,
      scrollLastPos: 0
    }

    this.handleScroll = this.handleScroll.bind(this)
    this.onClickScrollBar = this.onClickScrollBar.bind(this)

    this.onMouseDownScrollBarBox = this.onMouseDownScrollBarBox.bind(this)
    this.onMouseUpScrollBarBox = this.onMouseUpScrollBarBox.bind(this)

    this.domScrollBox = null
    this.domScrollBoxBar = null
    this.domScrollBoxInner = null

    this.__eventOnWheel = this.__eventOnWheel.bind(this)
    this.__eventOnMouseup = this.__eventOnMouseup.bind(this)
    this.__eventOnMousemove = this.__eventOnMousemove.bind(this)
  }

  componentDidUpdate (prevProps) {
    const { forceBottom, children } = this.props
    if (prevProps.children !== children) { this.__calculateScrollSize() }
    if (forceBottom && prevProps.children !== children) { this.__scrollToBottom() }
  }

  __eventOnWheel (e) {
    const { clientX, clientY, deltaY } = e

    const parent = this.__getScrollBoxRect()

    if (!parent) { return }

    if (
      clientX >= parent.left && clientX <= parent.right &&
        clientY >= parent.top && clientY <= parent.bottom
    ) {
      e.preventDefault()

      if (deltaY > 0) { this.scroll('down') }

      if (deltaY < 0) { this.scroll('up') }
    }
  }
  __eventOnMouseup (e) {
    const { dragging } = this.state

    if (dragging) { this.onMouseUpScrollBarBox(e) }
  }

  __eventOnMousemove (e) {
    let { dragging, scrollLastPos } = this.state

    if (dragging !== false) {
      let shift = dragging - e.clientY
      this.scrollBar(scrollLastPos + shift)
    }
  }

  componentWillUnmount () {
    window.removeEventListener('wheel', this.__eventOnWheel)
    window.removeEventListener('mouseup', this.__eventOnMouseup)
    window.removeEventListener('mousemove', this.__eventOnMousemove)
  }

  componentDidMount () {
    const { forceBottom } = this.props

    if (forceBottom === true) { this.__scrollToBottom() }

    this.__calculateScrollSize()

    window.addEventListener('wheel', this.__eventOnWheel)

    document.addEventListener('mouseup', this.__eventOnMouseup)

    document.addEventListener('mousemove', this.__eventOnMousemove)
  }

  scrollBar (scrollTranslateY) {
    const { scrollSize } = this.state
    const { height } = this.props

    const childHeight = this.__getMaximumTranslateY()
    const innerHeight = childHeight + height
    const ratio = innerHeight / height

    let innerTranslateY = scrollTranslateY * ratio
    scrollTranslateY = this.__controlScrollBarPosition(scrollTranslateY, height, scrollSize)

    innerTranslateY = this.__controlScrollInnerPosition(innerTranslateY, childHeight)

    this.setState({innerTranslateY, scrollTranslateY})
  }

  onMouseDownScrollBarBox (e) {
    e.preventDefault()

    if (this.props.startDrag) { this.props.startDrag(e) }

    this.setState({dragging: e.clientY})
  }

  onMouseUpScrollBarBox (e) {
    const { scrollTranslateY } = this.state
    if (this.props.endDrag) { this.props.endDrag(e) }
    this.setState({dragging: false, scrollLastPos: scrollTranslateY})
  }

  onClickScrollBar (e) {
    const { nativeEvent } = e
    e.preventDefault()

    const rectBar = this.domScrollBoxBar.getBoundingClientRect()

    let rectBarCenterrY = (rectBar.top + rectBar.top + rectBar.height) / 2

    if (nativeEvent.clientY > rectBarCenterrY) { this.scroll('down') }
    if (nativeEvent.clientY < rectBarCenterrY) { this.scroll('up') }
  }

  scroll (direction) {
    let { innerTranslateY, scrollSize } = this.state
    const { height, scrollStrength } = this.props

    const childHeight = this.__getMaximumTranslateY()
    const innerHeight = childHeight + height
    const ratio = innerHeight / height

    if (innerHeight <= height) { return }

    if (direction == 'down') { innerTranslateY -= scrollStrength }

    if (direction == 'up') { innerTranslateY += scrollStrength }

    let scrollTranslateY = innerTranslateY / ratio

    scrollTranslateY = this.__controlScrollBarPosition(scrollTranslateY, height, scrollSize)
    innerTranslateY = this.__controlScrollInnerPosition(innerTranslateY, childHeight)

    this.setState({innerTranslateY, scrollTranslateY, scrollLastPos: scrollTranslateY})
  }

  __controlScrollInnerPosition (innerTranslateY, childHeight) {
    if (innerTranslateY < -1 * childHeight) innerTranslateY = -1 * childHeight
    if (innerTranslateY > 0) innerTranslateY = 0

    return innerTranslateY
  }

  __controlScrollBarPosition (scrollTranslateY, height, scrollSize) {
    if (-1 * scrollTranslateY > height - scrollSize) { scrollTranslateY = -1 * Math.floor(height - scrollSize) + 1 }
    if (scrollTranslateY >= 0) { scrollTranslateY = -1 }

    return scrollTranslateY
  }

  __calculateScrollSize () {
    setTimeout(function () {
      const {height} = this.props
      const innerHeight = this.__getMaximumTranslateY() + height // quick hack
      const ratio = innerHeight / height
      const scrollSize = ratio <= 1 ? 0 : height / ratio
      this.setState({scrollSize})
    }.bind(this), 10)
  }

  __getScrollBoxRect () {
    const {domScrollBox} = this

    return domScrollBox ? domScrollBox.getBoundingClientRect() : null
  }

  __getMaximumTranslateY () {
    const parent = this.__getScrollBoxRect()
    if (!parent) { return parent }
    return this.domScrollBoxInner.offsetHeight - parent.height
  }
  __scrollToBottom () {
    setTimeout(function () {
      this.scrollBar(-9999)
    }.bind(this), 1)

    setTimeout(function () {
      this.scrollBar(-9999)
    }.bind(this), 100)
  }

  handleScroll (e) {
    const { onScroll } = this.props

    if (onScroll) { onScroll(e) }
  }

  render () {
    const { children, height, hideScrollBar } = this.props
    const { innerTranslateY, scrollTranslateY, scrollSize} = this.state
    const { boxClass, scrollClass } = this.props

    let scrollBar = hideScrollBar ? null : <div className={scrollClass} style={{height: scrollSize}}></div>
    return (

      <div className={'simple-scrollbox ' + boxClass} style={{height, overflow: 'hidden', position: 'relative'}} ref={el => this.domScrollBox = findDOMNode(el)}>
        <div className="simple-scrollbox--inner" style={{
          transform: `translateY(${innerTranslateY}px) translateZ(0)`
        }} onScroll={this.handleScroll} ref={el => this.domScrollBoxInner = findDOMNode(el)}>
          {children}
        </div>
        <div style={{
          position: 'absolute',
          bottom: 0,
          top: 0,
          right: 0,
          zIndex: 11
        }} onClick={this.onClickScrollBar}>
          <div className="simple-scrollbox--scroll" style={{
            transform: `translateY(${-1 * scrollTranslateY}px) translateZ(0)`
          }}
          ref={el => this.domScrollBoxBar = findDOMNode(el)}
          onClick={e => { e.preventDefault(); e.stopPropagation() }}
          onMouseDown={this.onMouseDownScrollBarBox}>
            {scrollBar}
          </div>
        </div>
      </div>)
  }
}

ScrollBox.defaultProps =
{
  scrollStrength: 40,
  forceBottom: false,
  hideScrollBar: false
}

ScrollBox.propTypes =
{
  scrollStrength: PropTypes.number,
  onScroll: PropTypes.func,
  forceBottom: PropTypes.bool,
  hideScrollBar: PropTypes.bool,
  startDrag: PropTypes.func,
  endDrag: PropTypes.func
}

export default ScrollBox
