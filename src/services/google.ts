import { Logs } from './_services'
import { Settings } from './settings'

export * as Drive from './google.drive'

const CLIENT_ID = '644274995501-tnqg2kd1kpmdku1hni7qgv17fmvkjdl1.apps.googleusercontent.com'
const SCOPES = {
  'drive.appdata': 'https://www.googleapis.com/auth/drive.appdata',
}

export let accessToken: string | null = null
let accessTokenTimeout: number | undefined

export function getRedirectURI() {
  const redirectURL = browser.identity.getRedirectURL()
  const redirIdStart = redirectURL.indexOf('/') + 2
  const redirIdEnd = redirectURL.indexOf('.')
  const redirId = redirectURL.slice(redirIdStart, redirIdEnd)
  return `http://127.0.0.1/mozoauth2/${redirId}/`
}

export async function loadAccessToken(force = false): Promise<void> {
  if (!force && accessToken) {
    return
  }

  // Get clientId
  let clientId
  if (Settings.state.syncUseGoogleDriveApi) {
    clientId = Settings.state.syncUseGoogleDriveApiClientId.trim()
  }
  if (!clientId) clientId = CLIENT_ID

  // Get redirect URL
  const loopbackRedirURL = getRedirectURI()

  // Create auth URL
  const authURL = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authURL.searchParams.append('client_id', clientId)
  authURL.searchParams.append('redirect_uri', loopbackRedirURL)
  authURL.searchParams.append('response_type', 'token')
  authURL.searchParams.append('scope', SCOPES['drive.appdata'])
  authURL.searchParams.append('include_granted_scopes', 'true')
  authURL.searchParams.append('enable_granular_consent', 'true')
  authURL.searchParams.append('prompt', 'none') // Without user consent.
  const authURLStr = authURL.toString()

  // Try to get OAuth2 token without user consent
  let authRawAns = null
  try {
    authRawAns = await browser.identity.launchWebAuthFlow({ url: authURLStr, interactive: false })
  } catch (err) {
    Logs.err('Google.loadAccessToken: Cannot get access token (without consent):', err)
  }

  // Parse token answer (if any)
  let authAnsParams: Record<string, string> | null = null
  if (authRawAns) authAnsParams = parseRawAuthAnswer(authRawAns)

  // Try to get OAuth2 token with user consent
  if (!authRawAns || !authAnsParams || authAnsParams['error'] === 'interaction_required') {
    Logs.warn(
      'Google.loadAccessToken(): Cannot get token without consent, trying to get it with consent'
    )
    authURL.searchParams.set('prompt', 'consent') // Prompt the user for consent.
    const authURLStr = authURL.toString()
    try {
      authRawAns = await browser.identity.launchWebAuthFlow({ url: authURLStr, interactive: true })
    } catch (err) {
      Logs.err('Google.loadAccessToken: Cannot get access token (with consent):', err)
    }
  }

  // Got nothing
  if (!authRawAns) {
    Logs.err('Google.loadAccessToken(): Got nothing...')
    return
  }

  // Parse token answer
  authAnsParams = parseRawAuthAnswer(authRawAns)
  if (!authAnsParams) return

  // Check for error
  if (authAnsParams['error']) {
    Logs.err(
      'Google.loadAccessToken(): Cannot get access_token from response: got error:',
      authAnsParams['error']
    )
    return
  }

  // Set token answer
  accessToken = getAccessTokenParam(authAnsParams)

  // Set expiring timeout
  const expiresInSec = getExpiresInParam(authAnsParams)
  if (expiresInSec) {
    if (accessTokenTimeout) clearTimeout(accessTokenTimeout)
    accessTokenTimeout = setTimeout(
      () => {
        accessToken = null
      },
      (expiresInSec - 1) * 1_000
    )
  }
}

function parseRawAuthAnswer(rawAuthAns: string): Record<string, string> | null {
  const tokenContainingURL = new URL(rawAuthAns)
  const hash = tokenContainingURL.hash.slice(1)
  if (!hash) {
    Logs.err('Cannot get access_token from response: no hash fragment')
    return null
  }

  const authAnsParams = hash.split('&').reduce(
    (a, v) => {
      const pair = v.split('=')
      if (pair.length === 2) a[pair[0]] = pair[1]
      return a
    },
    {} as Record<string, string>
  )
  return authAnsParams
}

function getAccessTokenParam(params: Record<string, string>): string | null {
  const accessToken = params['access_token']
  if (!accessToken) {
    Logs.err('Cannot get access_token from response')
    return null
  }

  return accessToken
}

function getExpiresInParam(params: Record<string, string>): number | null {
  const expiresInStr = params['expires_in']
  let expiresInSec
  try {
    expiresInSec = parseInt(expiresInStr)
  } catch {
    Logs.err('Cannot get expires_in from response')
    return null
  }
  if (!expiresInSec) {
    Logs.err('no expires_in (or zero)')
    return null
  }

  return expiresInSec
}
