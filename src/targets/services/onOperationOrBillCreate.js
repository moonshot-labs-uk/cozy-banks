import CozyClient from 'cozy-client'
import { cozyClient } from 'cozy-konnector-libs'
import logger from 'cozy-logger'
import flag from 'cozy-flags'
import { sendNotifications } from 'ducks/notifications/services'
import { Document } from 'cozy-doctypes'
import { Transaction, Bill, Settings } from 'models'
import isCreatedDoc from 'utils/isCreatedDoc'
import matchFromBills from 'ducks/billsMatching/matchFromBills'
import matchFromTransactions from 'ducks/billsMatching/matchFromTransactions'
import { logResult } from 'ducks/billsMatching/utils'
import { findAppSuggestions } from 'ducks/appSuggestions/services'
import { fetchChangesOrAll, getOptions } from './helpers'

const log = logger.namespace('onOperationOrBillCreate')

const doBillsMatching = async (setting, options = {}) => {
  // Bills matching
  log('info', 'Bills matching')
  const billsLastSeq =
    options.lastSeq || setting.billsMatching.billsLastSeq || '0'

  try {
    log('info', 'Fetching bills changes...')
    const billsChanges = await fetchChangesOrAll(Bill, billsLastSeq)
    billsChanges.documents = billsChanges.documents.filter(isCreatedDoc)

    setting.billsMatching.billsLastSeq = billsChanges.newLastSeq

    if (billsChanges.documents.length === 0) {
      log('info', '[matching service] No new bills since last execution')
    } else {
      log(
        'info',
        `[matching service] ${
          billsChanges.documents.length
        } new bills since last execution. Trying to find transactions for them`
      )

      const result = await matchFromBills(billsChanges.documents)
      logResult(result)
    }
  } catch (e) {
    log('error', `[matching service] ${e}`)
  }
}

const doTransactionsMatching = async (setting, options = {}) => {
  log('info', 'Do transaction matching...')
  const transactionsLastSeq =
    options.lastSeq || setting.billsMatching.transactionsLastSeq || '0'

  try {
    log('info', 'Fetching transactions changes...')
    const transactionsChanges = await fetchChangesOrAll(
      Transaction,
      transactionsLastSeq
    )

    setting.billsMatching.transactionsLastSeq = transactionsChanges.newLastSeq

    if (transactionsChanges.documents.length === 0) {
      log('info', '[matching service] No new operations since last execution')
    } else {
      log(
        'info',
        `[matching service] ${
          transactionsChanges.documents.length
        } new transactions since last execution. Trying to find bills for them`
      )

      const result = await matchFromTransactions(transactionsChanges.documents)
      logResult(result)
    }
  } catch (e) {
    log('error', `[matching service] ${e}`)
  }
}

const doSendNotifications = async (setting, notifChanges) => {
  log('info', 'Do send notifications...')
  try {
    const transactionsToNotify = notifChanges.documents
    await sendNotifications(setting, transactionsToNotify)
    setting.notifications.lastSeq = setting.billsMatching.transactionsLastSeq
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    log('warn', 'Error while sending notifications : ' + e)
  }
}

const doAppSuggestions = async setting => {
  log('info', 'Do apps suggestions...')
  try {
    await findAppSuggestions(setting)
  } catch (e) {
    log('warn', 'Error while finding app suggestions: ' + e)
  }
}

const updateSettings = async settings => {
  log('info', 'Updating settings...')
  const newSettings = await Settings.createOrUpdate(settings)
  log('info', 'Settings updated')
  return newSettings
}

const launchBudgetAlertService = async () => {
  log('info', 'Launching budget alert service...')
  const client = CozyClient.fromEnv(process.env)
  const jobs = client.collection('io.cozy.jobs')
  await jobs.create('service', {
    name: 'budgetAlerts',
    slug: 'banks'
  })
}

const setFlagsFromSettings = settings => {
  // The flag is needed to use local model when getting a transaction category ID
  flag('local-model-override', settings.community.localModelOverride.enabled)

  flag(
    'late-health-reimbursement-limit',
    settings.notifications.lateHealthReimbursement.value
  )
}

const onOperationOrBillCreate = async options => {
  log('info', `COZY_CREDENTIALS: ${process.env.COZY_CREDENTIALS}`)
  log('info', `COZY_URL: ${process.env.COZY_URL}`)
  log('info', `COZY_JOB_ID: ${process.env.COZY_JOB_ID}`)
  log('info', 'Fetching settings...')
  let setting = await Settings.fetchWithDefault()

  setFlagsFromSettings(setting)

  // We fetch the notifChanges before anything else because we need to know if
  // some transactions are totally new in `TransactionGreater` notification.
  // These transactions may be updated by the matching algorithm, and thus
  // may be missed by `TransactionGreater` because their `_rev` don't start with `1`
  const notifLastSeq = setting.notifications.lastSeq
  log('info', 'Fetching transaction changes...')

  const notifChanges = await fetchChangesOrAll(Transaction, notifLastSeq)

  if (options.billsMatching !== false) {
    await doBillsMatching(setting, options.billsMatching)
    setting = await updateSettings(setting)
  } else {
    log('info', 'Skip bills matching')
  }

  if (options.transactionsMatching !== false) {
    await doTransactionsMatching(setting, options.transactionsMatching)
    setting = await updateSettings(setting)
  } else {
    log('info', 'Skip transactions matching')
  }

  await doSendNotifications(setting, notifChanges)
  setting = await updateSettings(setting)

  await doAppSuggestions(setting)
  setting = await updateSettings(setting)

  await launchBudgetAlertService()
}

const attachProcessEventHandlers = () => {
  process.on('uncaughtException', err => {
    log('warn', JSON.stringify(err.stack))
  })

  process.on('unhandledRejection', err => {
    log('warn', JSON.stringify(err.stack))
  })
}

const main = async () => {
  attachProcessEventHandlers()
  Document.registerClient(cozyClient)
  const options = await getOptions(cozyClient)
  log('info', 'Options:')
  log('info', JSON.stringify(options))
  onOperationOrBillCreate(options)
}

main()
