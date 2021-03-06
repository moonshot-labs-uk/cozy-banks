import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Modal, useI18n } from 'cozy-ui/transpiled/react'

const Confirmation = ({ onConfirm, title, children, description }) => {
  const { t } = useI18n()
  const [confirming, setConfirming] = useState(false)

  const handleRequestConfirmation = ev => {
    ev.preventDefault()
    setConfirming(true)
  }

  const handleCancel = ev => {
    ev.preventDefault()
    setConfirming(false)
  }

  return (
    <>
      {React.cloneElement(children, { onClick: handleRequestConfirmation })}
      {confirming ? (
        <Modal
          size="xsmall"
          primaryText={t('Confirmation.ok')}
          secondaryText={t('Confirmation.cancel')}
          primaryType="danger"
          primaryAction={onConfirm}
          secondaryAction={handleCancel}
          dismissAction={handleCancel}
          title={title}
          description={description}
        />
      ) : null}
    </>
  )
}

Confirmation.propTypes = {
  children: PropTypes.element.isRequired
}

export default Confirmation
