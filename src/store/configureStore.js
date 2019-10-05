/* global __DEV__ */
import { compose, createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'
import flag from 'cozy-flags'
import {
  shouldEnableTracking,
  getTracker,
  createTrackerMiddleware
} from 'cozy-ui/react/helpers/tracker'
import { isSentryEnabled, getSentryMiddleware } from 'lib/sentry'

import appReducers from 'reducers'

const configureStore = (cozyClient, persistedState) => {
  // Enable Redux dev tools
  const composeEnhancers =
    (__DEV__ && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

  // middlewares
  const middlewares = [thunkMiddleware]
  if (shouldEnableTracking() && getTracker()) {
    middlewares.push(createTrackerMiddleware())
  }
  if (flag('logs') && __DEV__) { // eslint-disable-line
    // must be the last middleware in chain https://git.io/vHQpt
    const loggerMiddleware = createLogger()
    middlewares.push(loggerMiddleware)
  }
  if (isSentryEnabled()) {
    middlewares.push(getSentryMiddleware(cozyClient))
  }

  const store = createStore(
    appReducers,
    persistedState,
    composeEnhancers(applyMiddleware.apply(null, middlewares))
  )

  return store
}

export default configureStore
