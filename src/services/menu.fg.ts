import * as T from 'src/types'
import { MenuType } from 'src/enums'
import * as D from 'src/defaults'
import { translate, LANG } from 'src/dict'
import * as Utils from 'src/utils'
import { menuOptions } from 'src/services/menu.fg.options'
import * as Settings from 'src/services/settings'
import * as Selection from 'src/services/selection.fg'
import * as Store from 'src/services/storage.fg'
import * as Mouse from 'src/services/mouse.fg'
import * as Containers from 'src/services/containers'
import * as Search from 'src/services/search.fg'
import * as Preview from 'src/services/tabs.fg.preview'
import * as Sync from 'src/services/sync.fg'
import * as Logs from 'src/services/logs'
import * as Notifications from 'src/services/notifications.fg'

import * as Menu from 'src/services/menu.fg'

export let isOpen = false
export let tabsConf: T.MenuConf = []
export const setTabsConf = (m: T.MenuConf) => (tabsConf = m)
export let bookmarksConf: T.MenuConf = []
export const setBookmarksConf = (m: T.MenuConf) => (bookmarksConf = m)
export let tabsPanelConf: T.MenuConf = []
export const setTabsPanelConf = (m: T.MenuConf) => (tabsPanelConf = m)
export let bookmarksPanelConf: T.MenuConf = []
export const setBookmarksPanelConf = (m: T.MenuConf) => (bookmarksPanelConf = m)
export let ctxMenuIgnoreContainersRules: Record<string, boolean> = {}

export type OpenCallback = (blocks: T.MenuBlock[], x?: number, y?: number) => void

const openCallbacks: OpenCallback[] = []
const closeCallbacks: (() => void)[] = []
const xmlSerializer = new XMLSerializer()
let ctxMenuBlockTimeout: number | undefined

/**
 * Load custom context menu
 */
export async function loadCtxMenu(): Promise<void> {
  // prettier-ignore
  let storage = await browser.storage.managed.get<T.Stored>('contextMenu').catch(() => {})
  if (!storage?.contextMenu) {
    storage = await browser.storage.local.get<T.Stored>('contextMenu')
  }

  setCtxMenu(storage.contextMenu)
}

export function getCtxMenuConf() {
  const contextMenu: T.MenuConfs = {}

  if (Menu.tabsConf) contextMenu.tabs = Menu.tabsConf
  if (Menu.tabsPanelConf) contextMenu.tabsPanel = Menu.tabsPanelConf
  if (Menu.bookmarksConf) contextMenu.bookmarks = Menu.bookmarksConf
  if (Menu.bookmarksPanelConf) contextMenu.bookmarksPanel = Menu.bookmarksPanelConf

  return Utils.cloneObject(contextMenu)
}

export async function saveCtxMenu(delay?: number) {
  const storage: T.Stored = { contextMenu: getCtxMenuConf() }
  await Store.set(storage, delay)

  if (Settings.state.syncSaveCtxMenu) await saveCtxMenuToSync()
}

export async function saveCtxMenuToSync(): Promise<void> {
  const contextMenu = getCtxMenuConf()
  await Sync.save(Sync.SyncedEntryType.CtxMenu, contextMenu)
}

export async function importSyncedCtxMenu(entry: Sync.SyncedEntry) {
  Logs.info('Menu.importSyncedCtxMenu(): entry:', entry)

  const prevCtxMenu = getCtxMenuConf()
  const ctxMenu = await Sync.getData<T.MenuConfs>(entry)
  if (!ctxMenu) {
    Logs.err('Menu.importSyncedCtxMenu(): No data')
    return
  }

  await importCtxMenu(ctxMenu)

  Notifications.notify({
    icon: '#icon_sync',
    title: translate('sync.success.import_menu'),
    ctrl: translate('notif.undo_ctrl'),
    callback: () => importCtxMenu(prevCtxMenu),
  })
}

export async function importCtxMenu(ctxMenu: T.MenuConfs) {
  Logs.info('Menu.importCtxMenu(): ctxMenu:', ctxMenu)

  await Store.set({ contextMenu: ctxMenu })
  Menu.setCtxMenu(ctxMenu)
}

function onMenuHiddenFg(): void {
  Selection.resetSelection()
}

export function setCtxMenu(conf?: T.MenuConfs) {
  if (!conf) conf = {}
  if (conf.tabs?.length) tabsConf = conf.tabs
  else tabsConf = Utils.cloneArray(D.TABS_MENU)
  if (conf.tabsPanel?.length) tabsPanelConf = conf.tabsPanel
  else tabsPanelConf = Utils.cloneArray(D.TABS_PANEL_MENU)
  if (conf.bookmarks?.length) bookmarksConf = conf.bookmarks
  else bookmarksConf = Utils.cloneArray(D.BOOKMARKS_MENU)
  if (conf.bookmarksPanel?.length) bookmarksPanelConf = conf.bookmarksPanel
  else bookmarksPanelConf = Utils.cloneArray(D.BOOKMARKS_PANEL_MENU)
}

export function setupListeners(): void {
  browser.menus.onHidden.addListener(onMenuHiddenFg)
  Store.onKeyChange('contextMenu', menuConfigs => setCtxMenu(menuConfigs))
}

export function resetListeners(): void {
  browser.menus.onHidden.removeListener(onMenuHiddenFg)
}

export function isBlocked(): boolean {
  return !!ctxMenuBlockTimeout
}

/**
 * Open context menu
 */
export function open(type: MenuType, x?: number, y?: number, customForced?: boolean): void {
  if (!Selection.isSet()) return
  if (Mouse.isLocked()) return Mouse.resetClickLock()
  if (!type) return

  let nodeType: browser.menus.ContextType = 'all'
  let blocks: T.MenuBlock[] | undefined
  if (type === MenuType.Tabs) {
    nodeType = 'tab'
    blocks = createMenuBlocks(Menu.tabsConf, customForced)
    if (Settings.state.previewTabs) Preview.closePreview()
  } else if (type === MenuType.Bookmarks) {
    nodeType = 'bookmark'
    blocks = createMenuBlocks(Menu.bookmarksConf, customForced)
  } else if (type === MenuType.History) {
    blocks = createMenuBlocks(D.HISTORY_MENU, customForced)
  } else if (type === MenuType.NewTab) {
    blocks = createMenuBlocks(D.NEW_TAB_MENU, customForced)
  } else if (type === MenuType.TabsPanel) {
    blocks = createMenuBlocks(Menu.tabsPanelConf, customForced)
  } else if (type === MenuType.BookmarksPanel) {
    blocks = createMenuBlocks(Menu.bookmarksPanelConf, customForced)
  } else if (type === MenuType.Panel) {
    blocks = createMenuBlocks(D.OTHER_PANELS_MENU, customForced)
  }
  if (!blocks?.length) return

  isOpen = true

  if (Settings.state.ctxMenuNative && !customForced) {
    for (const block of blocks) {
      for (const opt of block.opts) {
        if (opt.sub && opt.sub.length && opt.label) {
          const parentId = createNativeSubMenuOption(opt.label, nodeType)
          for (const subOpt of opt.sub) {
            createNativeOption(nodeType, subOpt, parentId)
          }
        } else {
          createNativeOption(nodeType, opt)
        }
      }
    }

    resetNativeMenu(120)
    return
  }

  for (const cb of openCallbacks) {
    cb(blocks, x, y)
  }
}

function createOption(
  optName: string,
  prevOpt: T.MenuOption | undefined
): T.MenuOption | T.MenuOption[] | undefined {
  const gen = menuOptions[optName]
  if (gen) return gen()
  else if (optName.startsWith('separator')) {
    if (prevOpt?.type === 'separator') return
    return { type: 'separator' }
  }
}

function createMenuBlocks(config: T.MenuConf, customForced?: boolean): T.MenuBlock[] {
  let blocks: T.MenuBlock[] = []
  let block: T.MenuBlock | undefined
  let prevOpt: T.MenuOption | undefined
  for (const optConf of config) {
    // Create plain list block
    if (typeof optConf === 'string') {
      if (!block) {
        block = { type: 'list', opts: [] }
        blocks.push(block)
      }
      const opt = createOption(optConf, prevOpt)
      if (opt) {
        block.opts = block.opts.concat(opt)
        prevOpt = block.opts[block.opts.length - 1]
      }
    } else {
      const opts = optConf.opts.reduce<T.MenuOption[]>((a, subOpt) => {
        const opt = createOption(subOpt, prevOpt)
        if (opt) {
          const aOpts = a.concat(opt)
          prevOpt = aOpts[aOpts.length - 1]
          return aOpts
        }
        return a
      }, [])

      // Create sub-menu or inline block
      if (optConf.name) {
        if (!block) {
          block = { type: 'list', opts: [] }
          blocks.push(block)
        }
        const name = optConf.name?.startsWith('%') ? translate(optConf.name.slice(1)) : optConf.name
        let allInactive = true
        for (const opt of opts) {
          // Shrink labels
          if (opt.label?.startsWith(name)) {
            opt.label = shrinkLabel(name, opt.label) ?? opt.label
          }

          // All inactive?
          if (allInactive && !opt.inactive && opt.type !== 'separator') allInactive = false
        }
        block.opts.push({ label: name, sub: opts, inactive: allInactive })
      } else {
        blocks.push({ type: 'inline', opts })
        block = undefined
      }
    }
  }

  if (!Settings.state.ctxMenuNative || customForced) {
    blocks = blocks.reduce<T.MenuBlock[]>((blocks, block) => {
      if (block.opts.length === 0) return blocks
      if (block.opts.length === 1 && block.opts[0].type === 'separator') return blocks
      if (block.type === 'list') {
        if (block.opts[0].type === 'separator') block.opts.shift()
        if (block.opts[block.opts.length - 1].type === 'separator') block.opts.pop()
      }
      blocks.push(block)
      return blocks
    }, [])
  }

  return blocks
}

export function shrinkLabel(parentLabel: string, label?: string): string | undefined {
  if (!label || label.length - parentLabel.length < 2 || LANG === 'zh') return

  const preLen = parentLabel.length
  let cutIndex = preLen
  let capitalizeNeeded = false

  if (label[cutIndex] === ':') cutIndex++
  if (label[cutIndex] === ' ') {
    cutIndex++
    capitalizeNeeded = true
  }

  if (capitalizeNeeded) {
    label = label[cutIndex].toUpperCase() + label.slice(cutIndex + 1)
  } else {
    label = label.slice(cutIndex).trim()
  }

  return label
}

const base64SvgIconsCache: Record<string, Record<string, string>> = {}
function getBase64SVGIcon(icon: string, rgbColor: string): string | undefined {
  let cachedIcons = base64SvgIconsCache[icon]
  if (!cachedIcons) {
    base64SvgIconsCache[icon] = {}
    cachedIcons = base64SvgIconsCache[icon]
  }

  const cached = cachedIcons[rgbColor]
  if (cached) return cached

  const svgIconEl = document.getElementById(icon)
  if (svgIconEl) {
    let svg = xmlSerializer.serializeToString(svgIconEl)
    svg = '<svg fill="' + rgbColor + '" ' + svg.slice(5)
    icon = 'data:image/svg+xml;base64,' + window.btoa(svg)

    cachedIcons[rgbColor] = icon

    return icon
  }
}

function createNativeOption(
  ctx: browser.menus.ContextType,
  option: T.MenuOption,
  parentId?: string
): void {
  if (!ctx) ctx = 'all'
  if (option.type === 'separator') {
    browser.menus.create({ type: 'separator', contexts: [ctx], parentId })
    return
  }

  let icon
  if (Settings.state.ctxMenuRenderIcons) {
    if (option.img) {
      icon = option.img
    } else if (option.icon) {
      const alpha = option.inactive ? '64' : 'ff'
      const rgbColor = option.color ? D.RGB_COLORS[option.color] : '#686868' + alpha

      icon = getBase64SVGIcon(option.icon, rgbColor)
    }
  }

  const optProps: browser.menus.CreateProperties = {
    type: 'normal',
    contexts: [ctx],
    viewTypes: ['sidebar'],
    title: option.label,
  }

  if (parentId) optProps.parentId = parentId
  if (option.inactive) optProps.enabled = false
  if (icon) optProps.icons = { '16': icon }

  optProps.onclick = () => {
    if (option.onClick) option.onClick()
    Selection.resetSelection()
    if (!Settings.state.searchMenuTrig) Search.stop()
  }

  browser.menus.create(optProps)
}

function createNativeSubMenuOption(title: string, ctx?: browser.menus.ContextType): string {
  if (!ctx) ctx = 'all'
  const optProps: browser.menus.CreateProperties = {
    type: 'normal',
    contexts: [ctx],
    viewTypes: ['sidebar'],
    title: title,
  }
  return browser.menus.create(optProps)
}

/**
 * Close context menu
 */
export function close(): void {
  if (!Menu.isOpen) return
  closeCallbacks.forEach(cb => cb())
  isOpen = false
}

const resetNativeMenu = Utils.debounce(() => {
  isOpen = false
})

/**
 * Block ctx menu for 500ms
 */
export function blockCtxMenu(): void {
  if (ctxMenuBlockTimeout) {
    clearTimeout(ctxMenuBlockTimeout)
    ctxMenuBlockTimeout = undefined
  }
  ctxMenuBlockTimeout = setTimeout(() => {
    ctxMenuBlockTimeout = undefined
  }, 500)
}

export function onOpen(cb: OpenCallback): void {
  openCallbacks.push(cb)
}

export function onClose(cb: () => void): void {
  closeCallbacks.push(cb)
}

export function parseContainersRules(): void {
  ctxMenuIgnoreContainersRules = {}
  if (!Settings.state.ctxMenuIgnoreContainers) return

  const rules = getContainersRules(Settings.state.ctxMenuIgnoreContainers)
  if (!rules) return

  for (const container of Object.values(Containers.reactive.byId)) {
    const ignore = checkCtxMenuContainer(container, rules)
    ctxMenuIgnoreContainersRules[container.id] = ignore
  }
}

export function getContainersRules(value?: string): (string | RegExp)[] | null {
  if (!value) return null

  const rules: (string | RegExp)[] = []
  try {
    const rawRules = value.split(',')
    for (let rule of rawRules) {
      rule = rule.trim()
      if (!rule) continue
      if (rule.startsWith('/') && rule.endsWith('/')) rules.push(new RegExp(rule.slice(1, -1)))
      else rules.push(rule)
    }
  } catch (err) {
    return null
  }

  if (rules.length) return rules
  else return null
}

function checkCtxMenuContainer(container: T.Container, rules: (string | RegExp)[]): boolean {
  if (!container || !rules) return false

  let value = false
  for (const rule of rules) {
    if (Utils.isRegExp(rule)) value = rule.test(container.name)
    else value = rule === container.name
    if (value) return value
  }

  return value
}

export function selectOption(dir: number): void {
  if (componentInstance) componentInstance.selectOption(dir)
}

export function activateOption(): boolean | undefined {
  if (componentInstance) return componentInstance.activateOption()
}

let componentInstance: T.ContextMenuComponent | null = null
export function registerComponent(instance: T.ContextMenuComponent): void {
  componentInstance = instance
}
