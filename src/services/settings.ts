import Utils from 'src/utils'
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as SettingsActions from 'src/services/settings.actions'

export const Settings = {
  reactive: Utils.cloneObject(DEFAULT_SETTINGS),

  ...SettingsActions,
}
