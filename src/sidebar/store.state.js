import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from './settings.js'
import Manifest from '../../addon/manifest.json'

export default {
  localID: '',
  version: Manifest.version,
  osInfo: null,
  os: null,
  ffInfo: null,
  ffVer: null,
  private: browser.extension.inIncognitoContext,
  windowId: 0,
  windowFocused: true,

  // --- Global State
  ctxMenu: null,
  winChoosing: false,
  activePanel: 3,
  syncPanels: [],
  lastSyncPanels: null,

  // --- Settings
  ...SETTINGS_OPTIONS,
  ...DEFAULT_SETTINGS,
  settingsLoaded: false,
  keybindings: [],
  dragTabToPanels: false,

  // --- Cached
  favicons: {},
}