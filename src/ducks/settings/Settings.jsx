import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'cozy-ui/react/I18n'
import { Topbar } from 'ducks/commons'
import { Tabs, TabPanels, TabPanel, TabList, Tab } from 'cozy-ui/react'
import styles from './Settings.styl'
import { withRouter } from 'react-router'

const tabNames = ['accounts', 'groups', 'notifications']

const Settings = ({ t, groups, accounts, children, router }) => {
  let defaultTab = router.location.pathname.replace('/settings/', '')
  if (tabNames.indexOf(defaultTab) === -1) defaultTab = 'accounts'

  const goTo = url => () => {
    router.push(url)
  }
  return (
    <div>
      <Topbar>
        <h2>{t('Settings.title')}</h2>
      </Topbar>
      <Tabs className={styles['bnk-tabs']} initialActiveTab={defaultTab}>
        <TabList className={styles['bnk-coz-tab-list']}>
          <Tab name={tabNames[0]} onClick={goTo('/settings/accounts')}>
            {t('Settings.accounts')}
          </Tab>
          <Tab name={tabNames[1]} onClick={goTo('/settings/groups')}>
            {t('Settings.groups')}
          </Tab>
          <Tab name={tabNames[2]} onClick={goTo('/settings/notifications')}>
            {t('Settings.notifications')}
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel active>
            {children}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  )
}

const mapStateToProps = state => ({
  groups: state.groups,
  accounts: state.accounts
})

export default withRouter(connect(mapStateToProps, null)(translate()(Settings)))
