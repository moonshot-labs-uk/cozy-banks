/* global cozy */

import iconBanks from 'targets/favicons/icon-banks.svg'

const getLang = () =>
  navigator && navigator.language ? navigator.language.slice(0, 2) : 'en'

const getAccessTokenFromClient = client => {
  return client.stackClient.token.accessToken
}
/**
 * Bar plugin for CozyClient
 *
 * Registers lifecycle handlers to
 *
 * - initialize the bar on login
 * - destroy it on logout
 * - refresh the bar's internal token
 */
export default client => {
  client.on('login', () => {
    cozy.bar.init({
      appNamePrefix: 'Cozy',
      appName: 'Banks',
      appEditor: 'Cozy',
      appSlug: 'banks',
      cozyClient: client,
      cozyURL: client.uri,
      token: getAccessTokenFromClient(client),
      iconPath: iconBanks,
      lang: getLang(),
      replaceTitleOnMobile: true
    })
  })

  client.on('logout', () => {
    if (document.getElementById('coz-bar')) {
      document.getElementById('coz-bar').remove()
      document.body.setAttribute('style', '')
    }
  })

  client.on('refreshToken', () => {
    cozy.bar.updateAccessToken(getAccessTokenFromClient(client))
  })
}
