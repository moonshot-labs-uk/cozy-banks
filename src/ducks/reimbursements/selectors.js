import groupBy from 'lodash/groupBy'
import flag from 'cozy-flags'
import { getHealthExpensesByPeriod } from 'ducks/filters'
import { createSelector } from 'reselect'
import {
  isFullyReimbursed,
  getReimbursementStatus
} from 'ducks/transactions/helpers'

const groupHealthExpenses = healthExpenses => {
  const reimbursementTagFlag = flag('reimbursements.tag')

  const groupedTransactions = groupBy(
    healthExpenses,
    reimbursementTagFlag ? getReimbursementStatus : isFullyReimbursed
  )

  const reimbursed =
    (reimbursementTagFlag
      ? groupedTransactions.reimbursed
      : groupedTransactions.true) || []

  const pending =
    (reimbursementTagFlag
      ? groupedTransactions.pending
      : groupedTransactions.false) || []

  return {
    reimbursed,
    pending
  }
}

export const getGroupedHealthExpensesByPeriod = createSelector(
  [getHealthExpensesByPeriod],
  groupHealthExpenses
)
