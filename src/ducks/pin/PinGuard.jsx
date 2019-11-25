import React from 'react'

import PinTimeout from 'ducks/pin/PinTimeout.debug'
import PinAuth from 'ducks/pin/PinAuth'
import { pinSetting } from 'ducks/pin/queries'
import { queryConnect } from 'cozy-client'
import { isCollectionLoading } from 'ducks/client/utils'
import { lastInteractionStorage, pinSettingStorage } from './storage'

/**
 * Wraps an App and display a Pin screen after a period
 * of inactivity (touch events on document).
 */
class PinGuard extends React.Component {
  constructor(props) {
    super(props)
    this.initState()
    this.handleInteraction = this.handleInteraction.bind(this)
    this.handlePinSuccess = this.handlePinSuccess.bind(this)
    this.handleResume = this.handleResume.bind(this)
  }

  initState() {
    const savedLast = lastInteractionStorage.load()
    const last = savedLast || Date.now()
    const cachedPinSetting = pinSettingStorage.load()
    this.state = {
      last, // timestamp of last interaction
      showPin: this.isTooLate(last),
      cachedPinSetting
    }
  }

  componentDidMount() {
    document.addEventListener('touchstart', this.handleInteraction)
    document.addEventListener('click', this.handleInteraction)
    document.addEventListener('resume', this.handleResume)
    this.resetTimeout()
  }

  componentWillUnmount() {
    document.removeEventListener('touchstart', this.handleInteraction)
    document.removeEventListener('click', this.handleInteraction)
    document.removeEventListener('resume', this.handleResume)
    clearTimeout(this.timeout)
  }

  componentDidUpdate(prevProps) {
    if (this.props.pinSetting.data !== prevProps.pinSetting.data) {
      this.resetTimeout()
      pinSettingStorage.save(this.props.pinSetting.data)
    }
  }

  isTooLate(lastInteractionTimestamp) {
    return Date.now() - this.props.timeout > lastInteractionTimestamp
  }

  checkToShowPin() {
    const now = Date.now()
    if (this.isTooLate(now)) {
      this.showPin()
    }
  }

  handleResume() {
    // setTimeout might not work properly when the application is paused, do this
    // check to be sure that after resume, we display the pin if it
    // is needed
    this.checkToShowPin()
  }

  showPin() {
    this.setState({ showPin: true })
  }

  hidePin() {
    this.setState({ showPin: false })
  }

  handleInteraction() {
    const now = Date.now()
    this.setState({ last: now })
    lastInteractionStorage.save(now)
    this.resetTimeout()
  }

  resetTimeout() {
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      this.showPin()
    }, this.props.timeout)
  }

  handlePinSuccess() {
    // Delay a bit the success so that the user sees the success
    // effect
    setTimeout(() => {
      this.hidePin()
    }, 500)
  }

  render() {
    const { pinSetting, children, showTimeout, timeout } = this.props
    const { cachedPinSetting } = this.state
    const pinDoc = isCollectionLoading(pinSetting)
      ? cachedPinSetting
      : pinSetting.data

    if (!pinDoc || !pinDoc.pin) {
      return children
    }

    return (
      <React.Fragment>
        {children}
        {this.state.showPin ? (
          <PinAuth onSuccess={this.handlePinSuccess} />
        ) : null}
        {showTimeout ? (
          <PinTimeout start={this.state.last} duration={timeout} />
        ) : null}
      </React.Fragment>
    )
  }

  static defaultProps = {
    timeout: 60 * 1000
  }
}

export const DumbPinGuard = PinGuard

export default queryConnect({
  pinSetting
})(PinGuard)
