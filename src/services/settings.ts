import * as Utils from 'src/utils'
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as SettingsActions from 'src/services/settings.actions'

export const Settings = {
  state: Utils.cloneObject(DEFAULT_SETTINGS),

  updateWinPrefaceOnPanelSwitch: false,

  ...SettingsActions,
}
