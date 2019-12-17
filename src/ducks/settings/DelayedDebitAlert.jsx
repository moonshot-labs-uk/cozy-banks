import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'cozy-ui/react'
import { queryConnect, hasQueryBeenLoaded } from 'cozy-client'
import { connect } from 'react-redux'
import { accountsConn } from 'doctypes'
import {
  getAccountLabel,
  isCheckingsAccount,
  isCreditCardAccount
} from 'ducks/account/helpers'
import { Spinner } from 'cozy-ui/react'

import { SubSection } from 'ducks/settings/Sections'
import EditableSettingCard from './EditableSettingCard'
import { CHOOSING_TYPES } from 'components/EditionModal'
import { getAccountsById } from 'selectors'
import compose from 'lodash/flowRight'
import { getDocumentIdentity } from 'ducks/client/utils'

const makeAccountChoiceFromAccount = account => {
  return account ? getDocumentIdentity(account) : null
}

const getModalProps = ({ initialDoc, t }) => ({
  modalTitle: t('Notifications.editModal.title'),
  fieldOrder: ['creditCardAccount', 'checkingsAccount', 'value'],
  fieldLabels: {
    creditCardAccount: t(
      'Notifications.delayed_debit.fieldLabels.creditCardAccount'
    ),
    checkingsAccount: t(
      'Notifications.delayed_debit.fieldLabels.checkingsAccount'
    ),
    value: t('Notifications.delayed_debit.fieldLabels.days')
  },
  fieldSpecs: {
    creditCardAccount: {
      type: CHOOSING_TYPES.account,
      chooserProps: {
        canSelectAll: false,
        filter: isCreditCardAccount
      },
      getValue: initialDoc =>
        makeAccountChoiceFromAccount(initialDoc.creditCardAccount),
      updater: (doc, creditCardAccount) => ({
        ...doc,
        creditCardAccount: getDocumentIdentity(creditCardAccount)
      })
    },
    checkingsAccount: {
      type: CHOOSING_TYPES.account,
      chooserProps: {
        canSelectAll: false,
        filter: isCheckingsAccount
      },
      getValue: initialDoc =>
        makeAccountChoiceFromAccount(initialDoc.checkingsAccount),
      updater: (doc, checkingsAccount) => ({
        ...doc,
        checkingsAccount: getDocumentIdentity(checkingsAccount)
      })
    },
    value: {
      sectionProps: {
        unit: t('Notifications.delayed_debit.unit')
      },
      type: CHOOSING_TYPES.number,
      getValue: doc => doc.value,
      updater: (doc, value) => ({ ...doc, value })
    }
  },
  initialDoc
})

class DelayedDebitCard extends React.Component {
  static propTypes = {
    // TODO replace `PropTypes.object` with a shape coming from cozy-doctypes
    accounts: PropTypes.arrayOf(PropTypes.object).isRequired,
    enabled: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
  }

  getCreditCardDefaultValue() {
    const { accounts } = this.props
    const selectedAccount = (accounts.data || []).find(isCreditCardAccount)
    return selectedAccount ? selectedAccount : null
  }

  getCheckingsDefaultValue() {
    const selectedCreditCard = this.getCreditCardDefaultValue()
    return selectedCreditCard && selectedCreditCard.checkingsAccount
      ? selectedCreditCard.checkingsAccount.data
      : null
  }

  render() {
    const { doc, onToggle, onChangeDoc, t, accountsById, accounts } = this.props

    if (!hasQueryBeenLoaded(accounts)) {
      return <Spinner />
    }

    const value = doc.value

    const docCreditCardAccount = doc.creditCardAccount
      ? accountsById[doc.creditCardAccount._id]
      : null
    const docCheckingsAccount = doc.checkingsAccount
      ? accountsById[doc.checkingsAccount._id]
      : null

    const creditCardAccount =
      docCreditCardAccount || this.getCreditCardDefaultValue()
    const checkingsAccount =
      docCheckingsAccount || this.getCheckingsDefaultValue()

    const initialDoc = {
      creditCardAccount,
      checkingsAccount,
      value,
      enabled: doc.enabled
    }

    const creditCardLabel = creditCardAccount
      ? getAccountLabel(creditCardAccount)
      : '...'
    const checkingsLabel = checkingsAccount
      ? getAccountLabel(checkingsAccount)
      : '...'

    return (
      <EditableSettingCard
        onToggle={onToggle}
        onChangeDoc={onChangeDoc}
        editModalProps={getModalProps({ t, initialDoc })}
        shouldOpenOnToggle={() => {
          return !initialDoc.creditCardAccount || !initialDoc.checkingsAccount
        }}
        doc={doc}
        descriptionKey="Notifications.delayed_debit.description"
        descriptionProps={{
          creditCardLabel,
          checkingsLabel,
          value
        }}
      />
    )
  }
}

const DumbDelayedDebitSettingSection = props => {
  const { t } = props
  return (
    <SubSection title={t('Notifications.delayed_debit.settingTitle')}>
      <DelayedDebitCard {...props} />
    </SubSection>
  )
}

const DelayedDebitSettingSection = translate()(DumbDelayedDebitSettingSection)

const withAccounts = queryConnect({
  accounts: accountsConn
})
const withAccountsById = connect(state => ({
  accountsById: getAccountsById(state)
}))

export default compose(
  withAccounts,
  withAccountsById
)(DelayedDebitSettingSection)
