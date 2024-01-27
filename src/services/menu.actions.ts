import * as Utils from 'src/utils'
import { RGB_COLORS } from 'src/defaults'
import { menuOptions } from './menu.options'
import { Menu } from 'src/services/menu'
import { Stored, ContextMenuConfig_v4, MenuConf } from 'src/types'
import { MenuBlock, MenuOption, MenuType, ContextMenuComponent, MenuConfs } from 'src/types'
import { Settings } from 'src/services/settings'
import { Selection } from 'src/services/selection'
import { Store } from 'src/services/storage'
import { Info } from 'src/services/info'
import { Mouse } from 'src/services/mouse'
import { Containers } from 'src/services/containers'
import { TABS_MENU, TABS_PANEL_MENU } from 'src/defaults/menu'
import { BOOKMARKS_MENU, BOOKMARKS_PANEL_MENU } from 'src/defaults/menu'
import { HISTORY_MENU, NEW_TAB_MENU } from 'src/defaults/menu'
import { OTHER_PANELS_MENU } from 'src/defaults/menu'
import { Snapshots } from './snapshots'
import { translate, LANG } from 'src/dict'
import { Search } from 'src/services/search'

export type OpenCallback = (blocks: MenuBlock[], x?: number, y?: number) => void

const openCallbacks: OpenCallback[] = []
const closeCallbacks: (() => void)[] = []
const xmlSerializer = new XMLSerializer()
let ctxMenuBlockTimeout: number | undefined

/**
 * Load custom context menu
 */
export async function loadCtxMenu(): Promise<void> {
  // prettier-ignore
  const storage = await browser.storage.local.get<Stored>('contextMenu')

  if (storage.contextMenu?.tabs?.length) {
    Menu.tabsConf = storage.contextMenu.tabs
  } else {
    Menu.tabsConf = Utils.cloneArray(TABS_MENU)
  }

  if (storage.contextMenu?.tabsPanel?.length) {
    Menu.tabsPanelConf = storage.contextMenu.tabsPanel
  } else {
    Menu.tabsPanelConf = Utils.cloneArray(TABS_PANEL_MENU)
  }

  if (storage.contextMenu?.bookmarks?.length) {
    Menu.bookmarksConf = storage.contextMenu.bookmarks
  } else {
    Menu.bookmarksConf = Utils.cloneArray(BOOKMARKS_MENU)
  }

  if (storage.contextMenu?.bookmarksPanel?.length) {
    Menu.bookmarksPanelConf = storage.contextMenu.bookmarksPanel
  } else {
    Menu.bookmarksPanelConf = Utils.cloneArray(BOOKMARKS_PANEL_MENU)
  }
}

export function upgradeMenuConf(oldConf: ContextMenuConfig_v4): MenuConf {
  const conf: MenuConf = []
  for (const oldOpt of oldConf) {
    if (typeof oldOpt === 'string') {
      conf.push(oldOpt)
    } else {
      let name = ''
      const opts: string[] = []
      oldOpt.forEach(opt => {
        if (typeof opt === 'string') opts.push(opt)
        else if (opt.name) name = opt.name
      })
      conf.push({ name, opts })
    }
  }
  return conf
}

export function saveCtxMenu(delay?: number): void {
  const storage: Stored = {
    contextMenu: {
      tabs: Utils.cloneArray(Menu.tabsConf),
      tabsPanel: Utils.cloneArray(Menu.tabsPanelConf),
      bookmarks: Utils.cloneArray(Menu.bookmarksConf),
      bookmarksPanel: Utils.cloneArray(Menu.bookmarksPanelConf),
    },
  }
  Store.set(storage, delay)

  if (Settings.state.syncSaveCtxMenu) saveCtxMenuToSync()
}

export async function saveCtxMenuToSync(): Promise<void> {
  const contextMenu: MenuConfs = {}

  if (Menu.tabsConf) contextMenu.tabs = Menu.tabsConf
  if (Menu.tabsPanelConf) contextMenu.tabsPanel = Menu.tabsPanelConf
  if (Menu.bookmarksConf) contextMenu.bookmarks = Menu.bookmarksConf
  if (Menu.bookmarksPanelConf) contextMenu.bookmarksPanel = Menu.bookmarksPanelConf

  const value: Stored = Utils.cloneObject({ contextMenu })
  await Store.sync('ctxMenu', value)
}

export function createSettingsMenu(): void {
  browser.menus.create({
    id: 'open_settings',
    title: translate('menu.browserAction.open_settings'),
    icons: { '16': 'assets/logo-native.svg' },
    onclick: () => browser.runtime.openOptionsPage(),
    contexts: ['browser_action'],
  })
  browser.menus.create({
    id: 'create_snapshot',
    title: translate('menu.browserAction.create_snapshot'),
    icons: { '16': 'assets/snapshot-native.svg' },
    onclick: () => Snapshots.createSnapshot(),
    contexts: ['browser_action'],
  })
}

function onMenuHiddenFg(): void {
  Selection.resetSelection()
}

function onMenuHiddenBg(): void {
  browser.menus.removeAll()
  createSettingsMenu()
}

export function setupListeners(): void {
  if (Info.isBg) {
    browser.menus.onHidden.addListener(onMenuHiddenBg)
  } else {
    browser.menus.onHidden.addListener(onMenuHiddenFg)
    Store.onKeyChange('contextMenu', menuConfigs => {
      if (menuConfigs?.tabs?.length) Menu.tabsConf = menuConfigs.tabs
      else Menu.tabsConf = Utils.cloneArray(TABS_MENU)
      if (menuConfigs?.tabsPanel?.length) Menu.tabsPanelConf = menuConfigs.tabsPanel
      else Menu.tabsPanelConf = Utils.cloneArray(TABS_PANEL_MENU)
      if (menuConfigs?.bookmarks?.length) Menu.bookmarksConf = menuConfigs.bookmarks
      else Menu.bookmarksConf = Utils.cloneArray(BOOKMARKS_MENU)
      if (menuConfigs?.bookmarksPanel?.length) Menu.bookmarksPanelConf = menuConfigs.bookmarksPanel
      else Menu.bookmarksPanelConf = Utils.cloneArray(BOOKMARKS_PANEL_MENU)
    })
  }
}

export function resetListeners(): void {
  if (Info.isBg) {
    browser.menus.onHidden.removeListener(onMenuHiddenBg)
  } else {
    browser.menus.onHidden.removeListener(onMenuHiddenFg)
  }
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
  let blocks: MenuBlock[] | undefined
  if (type === MenuType.Tabs) {
    nodeType = 'tab'
    blocks = createMenuBlocks(Menu.tabsConf, customForced)
  } else if (type === MenuType.Bookmarks) {
    nodeType = 'bookmark'
    blocks = createMenuBlocks(Menu.bookmarksConf, customForced)
  } else if (type === MenuType.History) {
    blocks = createMenuBlocks(HISTORY_MENU, customForced)
  } else if (type === MenuType.NewTab) {
    blocks = createMenuBlocks(NEW_TAB_MENU, customForced)
  } else if (type === MenuType.TabsPanel) {
    blocks = createMenuBlocks(Menu.tabsPanelConf, customForced)
  } else if (type === MenuType.BookmarksPanel) {
    blocks = createMenuBlocks(Menu.bookmarksPanelConf, customForced)
  } else if (type === MenuType.Panel) {
    blocks = createMenuBlocks(OTHER_PANELS_MENU, customForced)
  }
  if (!blocks?.length) return

  Menu.isOpen = true

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
  prevOpt: MenuOption | undefined
): MenuOption | MenuOption[] | undefined {
  const gen = menuOptions[optName]
  if (gen) return gen()
  else if (optName.startsWith('separator')) {
    if (prevOpt?.type === 'separator') return
    return { type: 'separator' }
  }
}

function createMenuBlocks(config: MenuConf, customForced?: boolean): MenuBlock[] {
  let blocks: MenuBlock[] = []
  let block: MenuBlock | undefined
  let prevOpt: MenuOption | undefined
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
      const opts = optConf.opts.reduce<MenuOption[]>((a, subOpt) => {
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
    blocks = blocks.reduce<MenuBlock[]>((blocks, block) => {
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
  option: MenuOption,
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
      const rgbColor = option.color ? RGB_COLORS[option.color] : '#686868' + alpha

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
    Search.stop()
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
  Menu.isOpen = false
}

const resetNativeMenu = Utils.debounce(() => {
  Menu.isOpen = false
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
  Menu.ctxMenuIgnoreContainersRules = {}
  if (!Settings.state.ctxMenuIgnoreContainers) return

  const rules = getContainersRules(Settings.state.ctxMenuIgnoreContainers)
  if (!rules) return

  for (const container of Object.values(Containers.reactive.byId)) {
    const ignore = checkCtxMenuContainer(container, rules)
    Menu.ctxMenuIgnoreContainersRules[container.id] = ignore
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

function checkCtxMenuContainer(
  container: browser.contextualIdentities.Container,
  rules: (string | RegExp)[]
): boolean {
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

let componentInstance: ContextMenuComponent | null = null
export function registerComponent(instance: ContextMenuComponent): void {
  componentInstance = instance
}
