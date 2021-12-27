import { DEFAULT_SETTINGS } from '../../../addon/defaults'
import { DEFAULT_TABS_MENU } from '../../../addon/defaults'
import { DEFAULT_BOOKMARKS_MENU } from '../../../addon/defaults'
import { DEFAULT_TABS_PANEL_MENU } from '../../../addon/defaults'
import { BOOKMARKS_PANEL_MENU } from '../../../addon/defaults'

export default {
  private: browser.extension.inIncognitoContext,
  windowId: 0,
  windowFocused: true,
  otherWindows: [],

  width: 250,
  tabHeight: 30,
  navBtnWidth: 34,
  pinnedTabWith: 34,

  tabsMenu: Utils.cloneArray(DEFAULT_TABS_MENU),
  bookmarksMenu: Utils.cloneArray(DEFAULT_BOOKMARKS_MENU),
  tabsPanelMenu: Utils.cloneArray(DEFAULT_TABS_PANEL_MENU),
  bookmarksPanelMenu: Utils.cloneArray(BOOKMARKS_PANEL_MENU),

  ctxMenu: null,
  winChoosing: false,
  hiddenPanelsBar: false,
  selected: [],
  wheelBlockTimeout: null,
  dragMode: false,
  dropParent: null,

  lastPanelIndex: 1,
  panelIndex: 1,

  containers: {},
  panels: [],
  tabs: [],

  bookmarks: [],
  bookmarksCount: 0,
  bookmarkEditor: false,
  bookmarkEditorTarget: null,
  bookmarkSearchQuery: '',
  ...DEFAULT_SETTINGS,

  snapshots: [],
  keybindings: [],
  permAllUrls: false,
  permTabHide: false,
  permClipboardWrite: false,

  favicons: [],
  favUrls: {},

  confirm: null,
  selectBookmarkFolder: null,

  notifications: [],
}
