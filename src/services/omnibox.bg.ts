import * as T from 'src/types'
import * as E from 'src/enums'
import * as D from 'src/defaults'
import { translate } from 'src/dict'
import * as Containers from 'src/services/containers'
import * as Logs from 'src/services/logs'
import * as Utils from 'src/utils'
import * as Tabs from 'src/services/tabs.bg'
import * as Sidebar from 'src/services/sidebar.bg'
import * as WebReq from 'src/services/web-req.bg'
import * as Windows from 'src/services/windows.bg'
import * as Settings from 'src/services/settings'
import * as IPC from 'src/services/ipc'
import * as Store from 'src/services/storage.bg'

interface OmniCmd {
  type: E.OmniCmdType
  name: string
  value: string
  searchValue: string
  prefixLen: number
  matchWeight: number
  containerId?: string
  panelId?: ID
  tabId?: ID
}

const ALL_TYPES: E.OmniCmdType[] = [
  E.OmniCmdType.ReopenInContainer,
  E.OmniCmdType.MoveToPanel,
  E.OmniCmdType.SwitchToPanel,
  E.OmniCmdType.MoveToGroup,
]
const MAX_TYPES_HISTORY_LEN = 4
const MAX_CMDS_HISTORY_LEN = 10

let commands: OmniCmd[] = []
let filtered: Readonly<OmniCmd>[] | null = null
let history: T.OmniboxHistory = {
  types: [],
  cmds: [],
}

export async function load() {
  const stored = await browser.storage.local.get<T.Stored>('omnibox')
  if (stored.omnibox) history = stored.omnibox

  browser.omnibox.setDefaultSuggestion({
    description: translate('omnibox.default_suggestion'),
  })

  updateCommandsDebounced(500)
}

function updateHistory(cmd: OmniCmd) {
  const tIndex = history.types.indexOf(cmd.type)
  if (tIndex !== -1) history.types.splice(tIndex, 1)
  history.types.unshift(cmd.type)
  if (history.types.length > MAX_TYPES_HISTORY_LEN) {
    history.types = history.types.slice(0, MAX_TYPES_HISTORY_LEN)
  }

  const cIndex = history.cmds.indexOf(cmd.value)
  if (cIndex !== -1) history.cmds.splice(cIndex, 1)
  history.cmds.unshift(cmd.value)
  if (history.cmds.length > MAX_CMDS_HISTORY_LEN) {
    history.cmds = history.cmds.slice(0, MAX_CMDS_HISTORY_LEN)
  }
}

async function saveHistory() {
  try {
    await Store.set({ omnibox: history })
  } catch (err) {
    Logs.err('Omnibox.saveHistory: Cannot save history:', err)
  }
}

function updateCommands() {
  const ts = performance.now()
  commands = []

  const types = [...ALL_TYPES]

  // Recently used types first
  for (const recentType of history.types) {
    appendCmds(recentType, commands)

    const i = types.indexOf(recentType)
    if (i !== -1) types.splice(i, 1)
  }

  // The rest types
  for (const type of types) {
    appendCmds(type, commands)
  }

  Logs.info('Omnibox.updateCommands: Done:', performance.now() - ts)
  Logs.info('Omnibox.updateCommands: Count of commands:', commands.length)
}
export const updateCommandsDebounced = Utils.debounce(updateCommands)

function appendCmds(type: E.OmniCmdType, commands: OmniCmd[]) {
  switch (type) {
    case E.OmniCmdType.ReopenInContainer:
      return appendReopenInCtrCmds(commands)
    case E.OmniCmdType.MoveToPanel:
      return appendMoveToPanelCmds(commands)
    case E.OmniCmdType.SwitchToPanel:
      return appendSwitchToPanelCmds(commands)
    case E.OmniCmdType.MoveToGroup:
      return appendMoveToGroupCmds(commands)
  }
}

function appendReopenInCtrCmds(commands: OmniCmd[]) {
  if (!Settings.state.omniReopenInCtr) return

  const reopenCmds: OmniCmd[] = []
  const prefix = Settings.state.omniReopenInCtrPrefix.trim()
  const defaultCtrName = translate('omnibox.reopen_in_ctr.default_ctr_name')
  reopenCmds.push({
    type: E.OmniCmdType.ReopenInContainer,
    name: translate('omnibox.reopen_in_ctr', defaultCtrName),
    value: `${defaultCtrName} (id: ${D.DEFAULT_CONTAINER_ID})`,
    searchValue: prefix + defaultCtrName.toLowerCase(),
    prefixLen: prefix.length,
    matchWeight: 0,
    containerId: D.DEFAULT_CONTAINER_ID,
  })
  for (const container of Object.values(Containers.reactive.byId)) {
    reopenCmds.push({
      type: E.OmniCmdType.ReopenInContainer,
      name: translate('omnibox.reopen_in_ctr', container.name),
      value: `(id: ${container.id})`,
      searchValue: prefix + container.name.toLowerCase(),
      prefixLen: prefix.length,
      matchWeight: 0,
      containerId: container.id,
    })
  }

  // Recent first
  for (const recentCmdValue of history.cmds) {
    const i = reopenCmds.findIndex(c => c.value === recentCmdValue)
    if (i !== -1) commands.push(...reopenCmds.splice(i, 1))
  }

  commands.push(...reopenCmds)
}

function appendMoveToPanelCmds(commands: OmniCmd[]) {
  if (!Settings.state.omniMoveToPanel) return

  const moveCmds: OmniCmd[] = []
  const prefix = Settings.state.omniMoveToPanelPrefix.trim()

  for (const panelConfig of Sidebar.panelConfigs) {
    if (!Utils.isTabsPanel(panelConfig)) continue

    moveCmds.push({
      type: E.OmniCmdType.MoveToPanel,
      name: translate('omnibox.move_to_panel', panelConfig.name),
      value: `(id: mv${panelConfig.id})`,
      searchValue: prefix + panelConfig.name.toLowerCase(),
      prefixLen: prefix.length,
      matchWeight: 0,
      panelId: panelConfig.id,
    })
  }

  // Recent first
  for (const recentCmdValue of history.cmds) {
    const i = moveCmds.findIndex(c => c.value === recentCmdValue)
    if (i !== -1) commands.push(...moveCmds.splice(i, 1))
  }

  commands.push(...moveCmds)
}

function appendSwitchToPanelCmds(commands: OmniCmd[]) {
  if (!Settings.state.omniSwitchToPanel) return

  const switchCmds: OmniCmd[] = []
  const prefix = Settings.state.omniSwitchToPanelPrefix.trim()

  for (const panelConfig of Sidebar.panelConfigs) {
    if (!Utils.isTabsPanel(panelConfig)) continue

    switchCmds.push({
      type: E.OmniCmdType.SwitchToPanel,
      name: translate('omnibox.switch_to_panel', panelConfig.name),
      value: `(id: sw${panelConfig.id})`,
      searchValue: prefix + panelConfig.name.toLowerCase(),
      prefixLen: prefix.length,
      matchWeight: 0,
      panelId: panelConfig.id,
    })
  }

  // Recent first
  for (const recentCmdValue of history.cmds) {
    const i = switchCmds.findIndex(c => c.value === recentCmdValue)
    if (i !== -1) commands.push(...switchCmds.splice(i, 1))
  }

  commands.push(...switchCmds)
}

function appendMoveToGroupCmds(commands: OmniCmd[]) {
  if (!Settings.state.omniMoveToGroup) return

  const moveCmds: OmniCmd[] = []
  const prefix = Settings.state.omniMoveToGroupPrefix.trim()

  for (const tab of Object.values(Tabs.byId)) {
    if (tab.pinned) continue
    if (!tab.isGroup) continue

    moveCmds.push({
      type: E.OmniCmdType.MoveToGroup,
      name: translate('omnibox.move_to_tab', tab.title),
      value: `(id: mv${tab.id})`,
      searchValue: prefix + tab.title.toLowerCase(),
      prefixLen: prefix.length,
      matchWeight: 0,
      tabId: tab.id,
    })
  }

  commands.push(...moveCmds)
}

function filterCmds(input: string): Readonly<OmniCmd>[] {
  input = input.trim()

  const focusedWindow = Windows.byId.get(Windows.lastFocusedId ?? D.NOID)
  if (!focusedWindow) return []

  const activeTab = Tabs.byId[focusedWindow.activeTabId ?? D.NOID]
  if (!activeTab) return []

  const lowerCaseInput = input.toLowerCase()
  const inputChars = lowerCaseInput.split('')
  const filtered: OmniCmd[] = []

  if (!lowerCaseInput) return []

  // Filter useless commands and calc match weight for sorting
  for (const cmd of commands) {
    // Reset cmd.matchWeight
    cmd.matchWeight = 0

    // Reopen in container
    if (cmd.type === E.OmniCmdType.ReopenInContainer && cmd.containerId !== undefined) {
      if (activeTab.incognito) continue
      if (activeTab.cookieStoreId === cmd.containerId) continue
    }
    // TODO: Move to panel: skip panel of active tab
    // TODO: Switch to panel: skip active panel

    cmd.matchWeight = calcMatchWeight(cmd.searchValue, inputChars, cmd.prefixLen)
    if (cmd.matchWeight < inputChars.length) continue

    filtered.push(cmd)
  }

  // Sort
  filtered.sort((a, b) => b.matchWeight - a.matchWeight)

  // Limit to 10
  return filtered.slice(0, 10)
}

/**
 * Returns the match weight - sum of calculated points, where the one matched char is 1,
 * sequence of two matched chars is 2, three is 4 and so on... Matched chars preceding
 * the prefixLen get additional score.
 */
function calcMatchWeight(searchVal: string, inputChars: string[], prefixLen: number): number {
  let weight = 0
  let incr = 1
  let nextSearchFrom: number | undefined
  const len = inputChars.length
  for (let ii = 0; ii < len; ii++) {
    const ichar = inputChars[ii]
    const mi = searchVal.indexOf(ichar, nextSearchFrom)

    if (mi !== -1) {
      // Double incr if the prev char in searchVal is matched too or reset it
      if (nextSearchFrom !== undefined && mi === nextSearchFrom) incr = incr << 1
      else incr = 1
      // Increase weight for matching the prefix
      if (mi < prefixLen) weight += 1
      weight += incr
      nextSearchFrom = mi + 1
    } else {
      incr = 1
    }
  }
  return weight
}

async function runCmd(cmd: OmniCmd) {
  const activeTab = Tabs.getActiveTabInLastFocusedWindow()
  if (!activeTab) return Logs.warn('Omnibox.runCmd: Cannot find active tab')

  // Reopen in container
  if (cmd.type === E.OmniCmdType.ReopenInContainer && cmd.containerId !== undefined) {
    WebReq.disableAutoReopening(cmd.containerId, 1000)

    try {
      await Tabs.reopenTab(activeTab, activeTab.url, cmd.containerId)
    } catch (err) {
      Logs.warn('Omnibox.runCmd: failed to re-open tab', activeTab.id, cmd.containerId, err)
      return
    }
  }

  // Move to panel
  if (cmd.type === E.OmniCmdType.MoveToPanel && cmd.panelId !== undefined) {
    const windowId = activeTab.windowId
    const panelId = cmd.panelId
    try {
      await IPC.sidebar(windowId, 'moveTabToPanelViaOmnibox', activeTab.id, panelId)
    } catch (err) {
      Logs.warn('Omnibox.runCmd: failed to move tab', activeTab.id, cmd.panelId, err)
      return
    }
  }

  // Switch to panel
  if (cmd.type === E.OmniCmdType.SwitchToPanel && cmd.panelId !== undefined) {
    const windowId = activeTab.windowId
    const panelId = cmd.panelId
    try {
      await IPC.sidebar(windowId, 'switchToPanel', panelId, false, false)
    } catch (err) {
      Logs.warn('Omnibox.runCmd: failed to switch panel', panelId, err)
      return
    }
  }

  // Move to group tab
  if (cmd.type === E.OmniCmdType.MoveToGroup && cmd.tabId !== undefined) {
    const groupTab = Tabs.byId[cmd.tabId]
    if (!groupTab) return Logs.warn('Omnibox.runCmd: failed to move tab', activeTab.id, cmd.panelId)

    const dstWinId = groupTab.windowId
    const srcWinId = activeTab.windowId
    const tabInfo = {
      id: activeTab.id,
      pinned: activeTab.pinned,
    }
    try {
      await IPC.sidebar(dstWinId, 'moveTabToGroupViaOmnibox', tabInfo, srcWinId, cmd.tabId)
    } catch (err) {
      Logs.warn('Omnibox.runCmd: failed to move tab', activeTab.id, cmd.tabId, err)
      return
    }
  }

  updateHistory(cmd)
  saveHistory()
  updateCommands()
}

function onInputChanged(input: string, suggest: (s: browser.omnibox.SuggestResult[]) => void) {
  filtered = filterCmds(input)
  const suggestions = filtered.map(cmd => ({
    content: cmd.value,
    description: cmd.name,
    deletable: false,
  }))
  suggest(suggestions)
}

async function onInputEntered(input: string, newTabPos: browser.omnibox.OnInputEnteredDisposition) {
  if (!filtered?.length) return

  let targetCmd = filtered.find(cmd => cmd.value === input)
  if (!targetCmd) targetCmd = filtered[0]
  if (!targetCmd) return

  runCmd(targetCmd)
}

export function setupListeners() {
  browser.omnibox.onInputChanged.addListener(onInputChanged)
  browser.omnibox.onInputEntered.addListener(onInputEntered)
}

export const TESTING = {
  calcMatchWeight,
}
