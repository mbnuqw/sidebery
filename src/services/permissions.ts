import * as PermissionsActions from 'src/services/permissions.actions'

export interface PermissionsState {
  webData: boolean
  bookmarks: boolean
  tabHide: boolean
  clipboardWrite: boolean
  history: boolean
}

export const Permissions = {
  reactive: {
    webData: false,
    bookmarks: false,
    tabHide: false,
    clipboardWrite: false,
    history: false,
  } as PermissionsState,

  allUrls: false,
  webRequest: false,
  webRequestBlocking: false,
  proxy: false,

  bookmarks: false,
  tabHide: false,
  clipboardWrite: false,
  history: false,

  ...PermissionsActions,
}
