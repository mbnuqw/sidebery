import { Container } from '../types/containers'

export const DEFAULT_CONTAINER: Container = {
  id: '',
  cookieStoreId: '',
  name: '',
  icon: 'fingerprint',
  color: 'blue',
  colorCode: '#37adff',
  proxified: false,
  proxy: null,
  reopenRulesActive: false,
  reopenRules: [],
  userAgentActive: false,
  userAgent: '',
}

export const DEFAULT_CONTAINER_ID = 'firefox-default'
export const PRIVATE_CONTAINER_ID = 'firefox-private'
export const CONTAINER_ID = browser.extension.inIncognitoContext
  ? PRIVATE_CONTAINER_ID
  : DEFAULT_CONTAINER_ID
