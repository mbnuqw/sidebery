<template lang="pug">
.MenuEditor(@click="resetSelection" @scroll.passive="onScroll")

  section(ref="menuEditorTabsEl" @click.stop @wheel="moveSelected($event, 'tabs')")
    h2 {{translate('menu.editor.tabs_title')}}

    .menu-group(v-for="group in tabsMenu" :data-type="group.type")
      TextInput.group-title(
        v-if="group.type === 'sub'"
        :value="group.name"
        :line="true"
        :or="translate('menu.editor.inline_group_title')"
        @update:value="onSubMenuNameInput('tabs', group.i, $event)")
      Option(
        v-for="opt in group.options"
        type="tabs"
        :title="translate(TABS_MENU_OPTS[opt])"
        :selected="state.selected === opt"
        :isTopLvl="group.type === 'list'"
        :option="opt"
        :groupTitle="group.name"
        @select="select"
        @createSubMenu="createSubMenu"
        @downOpt="downOpt"
        @upOpt="upOpt"
        @disableOpt="disableOpt")

    .menu-group.-dis(v-if="disabledTabsMenu.length")
      .opt(
        v-for="opt in disabledTabsMenu"
        :title="translate(TABS_MENU_OPTS[opt])"
        @click="restoreOption('tabs', opt)")
        .opt-title {{translate(TABS_MENU_OPTS[opt])}}

    .ctrls
      .btn(@click="resetTabsMenu") {{translate('menu.editor.reset')}}
      .btn(@click="createSeparator('tabs')") {{translate('menu.editor.create_separator')}}

  section(ref="menuEditorTabsPanelEl" @click.stop @wheel="moveSelected($event, 'tabsPanel')")
    h2 {{translate('menu.editor.tabs_panel_title')}}

    .menu-group(v-for="group in tabsPanelMenu" :data-type="group.type")
      TextInput.group-title(
        v-if="group.type === 'sub'"
        :value="group.name"
        :or="translate('menu.editor.inline_group_title')"
        @update:value="onSubMenuNameInput('tabs', group.i, $event)")
      Option(
        v-for="opt in group.options"
        type="tabsPanel"
        :title="translate(TABS_PANEL_MENU_OPTS[opt])"
        :selected="state.selected === opt"
        :isTopLvl="group.type === 'list'"
        :option="opt"
        @select="select"
        @createSubMenu="createSubMenu"
        @downOpt="downOpt"
        @upOpt="upOpt"
        @disableOpt="disableOpt")

    .menu-group.-dis(v-if="disabledTabsPanelMenu.length")
      .opt(
        v-for="opt in disabledTabsPanelMenu"
        :title="translate(TABS_PANEL_MENU_OPTS[opt])"
        @click="restoreOption('tabsPanel', opt)")
        .opt-title {{translate(TABS_PANEL_MENU_OPTS[opt])}}

    .ctrls
      .btn(@click="resetTabsPanelMenu") {{translate('menu.editor.reset')}}
      .btn(@click="createSeparator('tabsPanel')") {{translate('menu.editor.create_separator')}}

  section(ref="menuEditorBookmarksEl" @click.stop @wheel="moveSelected($event, 'bookmarks')")
    h2 {{translate('menu.editor.bookmarks_title')}}

    .menu-group(v-for="(group, i) in bookmarksMenu" :data-type="group.type")
      TextInput.group-title(
        v-if="group.type === 'sub'"
        :value="group.name"
        :or="translate('menu.editor.inline_group_title')"
        @update:value="onSubMenuNameInput('bookmarks', group.i, $event)")
      Option(
        v-for="opt in group.options"
        type="bookmarks"
        :title="translate(BOOKMARKS_MENU_OPTS[opt])"
        :selected="state.selected === opt"
        :isTopLvl="group.type === 'list'"
        :option="opt"
        @select="select"
        @createSubMenu="createSubMenu"
        @downOpt="downOpt"
        @upOpt="upOpt"
        @disableOpt="disableOpt")

    .menu-group.-dis(v-if="disabledBookmarksMenu.length")
      .opt(
        v-for="opt in disabledBookmarksMenu"
        :title="translate(BOOKMARKS_MENU_OPTS[opt])"
        @click="restoreOption('bookmarks', opt)")
        .opt-title {{translate(BOOKMARKS_MENU_OPTS[opt])}}

    .ctrls
      .btn(@click="resetBookmarksMenu") {{translate('menu.editor.reset')}}
      .btn(@click="createSeparator('bookmarks')") {{translate('menu.editor.create_separator')}}
  
  section(ref="menuEditorBookmarksPanelEl" @click.stop @wheel="moveSelected($event, 'bookmarksPanel')")
    h2 {{translate('menu.editor.bookmarks_panel_title')}}

    .menu-group(v-for="(group, i) in bookmarksPanelMenu" :data-type="group.type")
      TextInput.group-title(
        v-if="group.type === 'sub'"
        :value="group.name"
        :or="translate('menu.editor.inline_group_title')"
        @update:value="onSubMenuNameInput('bookmarksPanel', group.i, $event)")
      Option(
        v-for="opt in group.options"
        type="bookmarksPanel"
        :title="translate(BOOKMARKS_PANEL_MENU_OPTS[opt])"
        :selected="state.selected === opt"
        :isTopLvl="group.type === 'list'"
        :option="opt"
        @select="select"
        @createSubMenu="createSubMenu"
        @downOpt="downOpt"
        @upOpt="upOpt"
        @disableOpt="disableOpt")

    .menu-group.-dis(v-if="disabledBookmarksPanelMenu.length")
      .opt(
        v-for="opt in disabledBookmarksPanelMenu"
        :title="translate(BOOKMARKS_PANEL_MENU_OPTS[opt])"
        @click="restoreOption('bookmarksPanel', opt)")
        .opt-title {{translate(BOOKMARKS_PANEL_MENU_OPTS[opt])}}

    .ctrls
      .btn(@click="resetBookmarksPanelMenu") {{translate('menu.editor.reset')}}
      .btn(@click="createSeparator('bookmarksPanel')") {{translate('menu.editor.create_separator')}}

  FooterSection
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import Utils from 'src/utils'
import { translate } from 'src/dict'
import { TABS_MENU, BOOKMARKS_MENU } from 'src/defaults'
import { TABS_PANEL_MENU, BOOKMARKS_PANEL_MENU } from 'src/defaults'
import { MenuConf } from 'src/types'
import { Menu } from 'src/services/menu'
import { SetupPage } from 'src/services/setup-page'
import TextInput from '../../components/text-input.vue'
import FooterSection from './footer-section.vue'
import Option from './menu-editor.option.vue'

interface MenuEditorGroup {
  type?: 'list' | 'sub'
  name?: string
  options: string[]
  i: number
}

const TABS_MENU_OPTS: Record<string, string> = {
  undoRmTab: 'menu.tab.undo',
  pin: 'menu.tab.pin',
  reload: 'menu.tab.reload',
  bookmark: 'menu.tab.bookmark',
  moveToNewWin: 'menu.tab.move_to_new_window',
  moveToWin: 'menu.tab.move_to_window_',
  moveToPanel: 'menu.tab.move_to_panel_label',
  moveToNewPanel: 'menu.tab.move_to_new_panel',
  reopenInNewWin: 'menu.tab.reopen_in_new_window',
  reopenInWin: 'menu.tab.reopen_in_window',
  reopenInCtr: 'menu.tab.reopen_in_ctr_',
  reopenInNewCtr: 'menu.tab.reopen_in_new_container',
  mute: 'menu.tab.mute',
  duplicate: 'menu.tab.duplicate',
  discard: 'menu.tab.discard',
  copyTabsUrls: 'menu.copy_urls',
  copyTabsTitles: 'menu.copy_titles',
  group: 'menu.tab.group',
  flatten: 'menu.tab.flatten',
  clearCookies: 'menu.tab.clear_cookies',
  closeDescendants: 'menu.tab.close_descendants',
  close: 'menu.tab.close',
  closeTabsAbove: 'menu.tab.close_above',
  closeTabsBelow: 'menu.tab.close_below',
  closeOtherTabs: 'menu.tab.close_other',
}

const TABS_PANEL_MENU_OPTS: Record<string, string> = {
  muteAllAudibleTabs: 'menu.tabs_panel.mute_all_audible',
  closeTabsDuplicates: 'menu.tabs_panel.dedup',
  undoRmTab: 'menu.tab.undo',
  reloadTabs: 'menu.tabs_panel.reload',
  discardTabs: 'menu.tabs_panel.discard',
  collapseInactiveBranches: 'menu.tabs_panel.collapse_inact_branches',
  closeTabs: 'menu.tabs_panel.close',
  openPanelConfig: 'menu.common.conf',
  removePanel: 'menu.tabs_panel.remove_panel',
  restoreFromBookmarks: 'menu.tabs_panel.restore_from_bookmarks',
  convertToBookmarksPanel: 'menu.tabs_panel.convert_to_bookmarks_panel',
}

const BOOKMARKS_MENU_OPTS: Record<string, string> = {
  openInNewWin: 'menu.bookmark.open_in_new_window',
  openInNewPrivWin: 'menu.bookmark.open_in_new_priv_window',
  openInNewPanel: 'menu.bookmark.open_in_new_panel',
  openInPanel: 'menu.bookmark.open_in_panel_',
  openInCtr: 'menu.bookmark.open_in_ctr_',
  openAsBookmarksPanel: 'menu.bookmark.open_as_bookmarks_panel',
  openAsTabsPanel: 'menu.bookmark.open_as_tabs_panel',
  createBookmark: 'menu.bookmark.create_bookmark',
  createFolder: 'menu.bookmark.create_folder',
  createSeparator: 'menu.bookmark.create_separator',
  sortByNameAscending: 'menu.bookmark.sort_by_name_asc',
  sortByNameDescending: 'menu.bookmark.sort_by_name_des',
  sortByLinkAscending: 'menu.bookmark.sort_by_link_asc',
  sortByLinkDescending: 'menu.bookmark.sort_by_link_des',
  sortByTimeAscending: 'menu.bookmark.sort_by_time_asc',
  sortByTimeDescending: 'menu.bookmark.sort_by_time_des',
  copyBookmarksUrls: 'menu.copy_urls',
  copyBookmarksTitles: 'menu.copy_titles',
  edit: 'menu.bookmark.edit_bookmark',
  delete: 'menu.bookmark.delete_bookmark',
  moveBookmarksTo: 'menu.bookmark.move_to',
}

const BOOKMARKS_PANEL_MENU_OPTS: Record<string, string> = {
  collapseAllFolders: 'menu.bookmark.collapse_all',
  switchViewMode: 'menu.bookmark.switch_view',
  unloadPanelType: 'menu.panels.unload',
  openPanelConfig: 'menu.common.conf',
  convertToTabsPanel: 'menu.bookmark.convert_to_tabs_panel',
  removePanel: 'menu.tabs_panel.remove_panel',
}

let menuNameTimeout: number

const menuEditorTabsEl = ref<HTMLElement | null>(null)
const menuEditorTabsPanelEl = ref<HTMLElement | null>(null)
const menuEditorBookmarksEl = ref<HTMLElement | null>(null)
const menuEditorBookmarksPanelEl = ref<HTMLElement | null>(null)
const state = reactive({
  selected: '',
  tabsConf: Utils.cloneArray(Menu.tabsConf),
  bookmarksConf: Utils.cloneArray(Menu.bookmarksConf),
  tabsPanelConf: Utils.cloneArray(Menu.tabsPanelConf),
  bookmarksPanelConf: Utils.cloneArray(Menu.bookmarksPanelConf),
})

const tabsMenu = computed<MenuEditorGroup[]>(() => parseMenuConf(state.tabsConf))
const disabledTabsMenu = computed<string[]>(() => {
  const all = Object.keys(TABS_MENU_OPTS)
  const active = state.tabsConf.reduce((a, v) => {
    return typeof v === 'string' ? a.concat(v) : a.concat(v.opts)
  }, [] as string[])
  return all.filter(option => !active.includes(option))
})

const tabsPanelMenu = computed<MenuEditorGroup[]>(() => parseMenuConf(state.tabsPanelConf))
const disabledTabsPanelMenu = computed<string[]>(() => {
  const all = Object.keys(TABS_PANEL_MENU_OPTS)
  const active = state.tabsPanelConf.reduce((a, v) => {
    return typeof v === 'string' ? a.concat(v) : a.concat(v.opts)
  }, [] as string[])
  return all.filter(option => !active.includes(option))
})

const bookmarksMenu = computed<MenuEditorGroup[]>(() => parseMenuConf(state.bookmarksConf))
const disabledBookmarksMenu = computed<string[]>(() => {
  const all = Object.keys(BOOKMARKS_MENU_OPTS)
  const active = state.bookmarksConf.reduce((a, v) => {
    return typeof v === 'string' ? a.concat(v) : a.concat(v.opts)
  }, [] as string[])
  return all.filter(option => !active.includes(option))
})

const bookmarksPanelMenu = computed<MenuEditorGroup[]>(() => {
  return parseMenuConf(state.bookmarksPanelConf)
})
const disabledBookmarksPanelMenu = computed<string[]>(() => {
  const all = Object.keys(BOOKMARKS_PANEL_MENU_OPTS)
  const active = state.bookmarksPanelConf.reduce((a, v) => {
    return typeof v === 'string' ? a.concat(v) : a.concat(v.opts)
  }, [] as string[])
  return all.filter(option => !active.includes(option))
})

onMounted(() => {
  SetupPage.registerEl('menu_editor_tabs', menuEditorTabsEl.value)
  SetupPage.registerEl('menu_editor_tabs_panel', menuEditorTabsPanelEl.value)
  SetupPage.registerEl('menu_editor_bookmarks', menuEditorBookmarksEl.value)
  SetupPage.registerEl('menu_editor_bookmarks_panel', menuEditorBookmarksPanelEl.value)

  state.tabsConf = Menu.tabsConf
  state.bookmarksConf = Menu.bookmarksConf
  state.tabsPanelConf = Menu.tabsPanelConf
  state.bookmarksPanelConf = Menu.bookmarksPanelConf
})

function parseMenuConf(conf: MenuConf): MenuEditorGroup[] {
  let out: MenuEditorGroup[] = []
  let group: MenuEditorGroup | null = null
  for (let i = 0; i < conf.length; i++) {
    let item = conf[i]
    if (typeof item === 'string') {
      if (!group) {
        group = { type: 'list', name: '', options: [], i }
        out.push(group)
      }
      group.options.push(item)
    } else {
      out.push({ type: 'sub', name: item.name, i, options: item.opts })
      group = null
    }
  }
  return out
}

/**
 * Handle scroll event
 */
function onScroll(e: Event): void {
  if (SetupPage.reactive.navLock) return
  SetupPage.updateActiveSection((e.target as HTMLElement).scrollTop)
}

/**
 * Select option
 */
function select(opt: string): void {
  if (state.selected === opt) state.selected = ''
  else state.selected = opt
}

/**
 * Reset selection
 */
function resetSelection(): void {
  state.selected = ''
}

/**
 * Move selected option
 */
function moveSelected(e: WheelEvent, type: string): void {
  if (!state.selected) return
  e.preventDefault()
  if (e.deltaY > 0) downOpt(type, state.selected)
  if (e.deltaY < 0) upOpt(type, state.selected)
}

/**
 * Reset tabs menu
 */
function resetTabsMenu(): void {
  Menu.tabsConf = Utils.cloneArray(TABS_MENU)
  state.tabsConf = Menu.tabsConf
  Menu.saveCtxMenu()
}
function resetTabsPanelMenu(): void {
  Menu.tabsPanelConf = Utils.cloneArray(TABS_PANEL_MENU)
  Menu.saveCtxMenu()
  state.tabsPanelConf = Menu.tabsPanelConf
}

/**
 * Reset bookmarks menu
 */
function resetBookmarksMenu(): void {
  Menu.bookmarksConf = Utils.cloneArray(BOOKMARKS_MENU)
  state.bookmarksConf = Menu.bookmarksConf
  Menu.saveCtxMenu()
}
function resetBookmarksPanelMenu(): void {
  Menu.bookmarksPanelConf = Utils.cloneArray(BOOKMARKS_PANEL_MENU)
  state.bookmarksPanelConf = Menu.bookmarksPanelConf
  Menu.saveCtxMenu()
}

/**
 * Restore option
 */
function restoreOption(type: string, opt: string): void {
  let menuConfig = getMenu(type)
  if (!menuConfig) return

  menuConfig.push(opt)
  Menu.saveCtxMenu()
}

/**
 * Disable option
 */
function disableOpt(type: string, opt: string): void {
  let menuConfig = getMenu(type)
  if (!menuConfig) return

  for (let i = 0; i < menuConfig.length; i++) {
    const optConf = menuConfig[i]
    if (optConf === opt) {
      menuConfig.splice(i, 1)
      break
    }

    if (typeof optConf !== 'string') {
      const index = optConf.opts.indexOf(opt)
      if (index === -1) continue
      optConf.opts.splice(index, 1)
      break
    }
  }

  normalizeMenu(menuConfig)

  Menu.saveCtxMenu()
}

/**
 * Create sub-menu
 */
function createSubMenu(type: string, opt: string): void {
  const menuConfig = getMenu(type)
  if (!menuConfig) return

  for (let i = 0; i < menuConfig.length; i++) {
    if (menuConfig[i] === opt) {
      menuConfig.splice(i, 1, { name: '', opts: [opt] })
      break
    }
  }

  Menu.saveCtxMenu()
}

/**
 * Handle input of menu name
 */
function onSubMenuNameInput(type: string, i: number, value: string): void {
  let menuConfig = getMenu(type)
  if (!menuConfig) return

  let optConf = menuConfig[i]
  if (!optConf || typeof optConf === 'string') return

  optConf.name = value

  clearTimeout(menuNameTimeout)
  menuNameTimeout = setTimeout(() => {
    Menu.saveCtxMenu()
  }, 500)
}

/**
 * Move option down
 */
function downOpt(type: string, opt: string): void {
  let menuConfig = getMenu(type)
  if (!menuConfig) return

  if (menuConfig[menuConfig.length - 1] === opt) return

  for (let i = 0; i < menuConfig.length; i++) {
    let optConf = menuConfig[i]

    // Top lvl
    if (optConf === opt) {
      menuConfig.splice(i, 1)
      const nextOptConf = menuConfig[i]
      if (!nextOptConf) break
      if (typeof nextOptConf === 'string') menuConfig.splice(i + 1, 0, opt)
      else nextOptConf.opts.unshift(opt)
      break
    }

    // Sub lvl
    if (typeof optConf !== 'string') {
      let index = optConf.opts.indexOf(opt)
      if (index === -1) continue
      optConf.opts.splice(index, 1)
      if (!optConf.opts[index]) menuConfig.splice(i + 1, 0, opt)
      else optConf.opts.splice(index + 1, 0, opt)
      break
    }
  }

  normalizeMenu(menuConfig)
  Menu.saveCtxMenu(500)
}

/**
 * Move option up
 */
function upOpt(type: string, opt: string): void {
  let menuConfig = getMenu(type)
  if (!menuConfig) return

  if (menuConfig[0] === opt) return

  for (let i = 0; i < menuConfig.length; i++) {
    let optConf = menuConfig[i]

    // Top lvl
    if (optConf === opt) {
      menuConfig.splice(i, 1)
      optConf = menuConfig[i - 1]
      if (!optConf) break
      if (typeof optConf === 'string') menuConfig.splice(i - 1, 0, opt)
      else optConf.opts.push(opt)
      break
    }

    // Sub lvl
    if (typeof optConf !== 'string') {
      let index = optConf.opts.indexOf(opt)
      if (index === -1) continue
      optConf.opts.splice(index, 1)
      if (!optConf.opts[index - 1]) menuConfig.splice(i, 0, opt)
      else optConf.opts.splice(index - 1, 0, opt)
      break
    }
  }

  normalizeMenu(menuConfig)
  Menu.saveCtxMenu(500)
}

/**
 * Normalize menu (remove empty sub-menues)
 */
function normalizeMenu(menu: MenuConf): void {
  for (let i = 0; i < menu.length; i++) {
    const optConf = menu[i]
    if (typeof optConf !== 'string') {
      if (!optConf.opts.length) {
        menu.splice(i, 1)
        i--
        continue
      }
    }
  }
}

/**
 * Create separator
 */
function createSeparator(type: string): void {
  let menu = getMenu(type)
  if (!menu) return

  menu.push(String(Math.random()).replace('0.', 'separator-'))
}

function getMenu(type: string): MenuConf | null {
  if (type === 'tabs') return state.tabsConf
  else if (type === 'bookmarks') return state.bookmarksConf
  else if (type === 'tabsPanel') return state.tabsPanelConf
  else if (type === 'bookmarksPanel') return state.bookmarksPanelConf
  else return null
}
</script>
