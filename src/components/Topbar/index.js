/* global cozy */

import React from 'react'
import styles from 'components/Topbar/styles.styl'
import { withBreakpoints } from 'cozy-ui/transpiled/react'

const { BarCenter } = cozy.bar

const Topbar = ({ children, breakpoints: { isMobile } }) => {
  const title = <div className={styles['Topbar']}>{children}</div>
  return isMobile ? <BarCenter>{title}</BarCenter> : title
}

export default withBreakpoints()(Topbar)
