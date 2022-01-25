import * as PermissionsActions from 'src/services/permissions.actions'

export interface PermissionsState {
  webData: boolean
  bookmarks: boolean
  tabHide: boolean
  clipboardWrite: boolean
  history: boolean
  downloads: boolean
}

export const Permissions = {
  reactive: {
    webData: false,
    bookmarks: false,
    tabHide: false,
    clipboardWrite: false,
    history: false,
    downloads: false,
  } as PermissionsState,

  ...PermissionsActions,
}
