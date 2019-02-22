<template lang="pug">
.Settings(@contextmenu.prevent.stop="")
  scroll-box(ref="scrollBox")
    section
      h2 {{t('settings.general_title')}}
      toggle-field(
        label="settings.native_scrollbars"
        :value="$store.state.nativeScrollbars"
        @input="setOpt('nativeScrollbars', $event)")

    section
      h2 {{t('settings.tabs_title')}}
      toggle-field(
        label="settings.activate_last_tab_on_panel_switching"
        :value="$store.state.activateLastTabOnPanelSwitching"
        @input="setOpt('activateLastTabOnPanelSwitching', $event)")
      toggle-field(
        label="settings.create_new_tab_on_empty_panel"
        :value="$store.state.createNewTabOnEmptyPanel"
        @input="setOpt('createNewTabOnEmptyPanel', $event)")
      toggle-field(
        label="settings.skip_empty_panels"
        :value="$store.state.skipEmptyPanels"
        @input="setOpt('skipEmptyPanels', $event)")
      toggle-field(
        label="settings.show_tab_rm_btn"
        :value="$store.state.showTabRmBtn"
        @input="setOpt('showTabRmBtn', $event)")
      toggle-field(
        v-if="$store.state.ffVer >= 61"
        label="settings.hide_inactive_panel_tabs"
        :value="$store.state.hideInact"
        @input="toggleHideInact")
      select-field(
        label="settings.pinned_tabs_position"
        optLabel="settings.pinned_tabs_position_"
        :value="$store.state.pinnedTabsPosition"
        :opts="$store.state.pinnedTabsPositionOpts"
        @input="setOpt('pinnedTabsPosition', $event)")

      toggle-field(
        label="settings.tabs_tree_layout"
        :value="$store.state.tabsTree"
        @input="toggleTabsTree")
      toggle-field(
        label="settings.group_on_open_layout"
        :inactive="!$store.state.tabsTree"
        :value="$store.state.groupOnOpen"
        @input="setOpt('groupOnOpen', $event)")
      select-field(
        label="settings.tabs_tree_limit"
        optLabel="settings.tabs_tree_limit_"
        :inactive="!$store.state.tabsTree"
        :value="$store.state.tabsTreeLimit"
        :opts="$store.state.tabsTreeLimitOpts"
        @input="setOpt('tabsTreeLimit', $event)")

    section
      h2 {{t('settings.bookmarks_title')}}
      toggle-field(
        label="settings.bookmarks_panel"
        :value="$store.state.bookmarksPanel"
        @input="toggleBookmarksPanel")
      toggle-field(
        label="settings.open_bookmark_new_tab"
        :inactive="!$store.state.bookmarksPanel"
        :value="$store.state.openBookmarkNewTab"
        @input="setOpt('openBookmarkNewTab', $event)")
      toggle-field(
        label="settings.auto_close_bookmarks"
        :inactive="!$store.state.bookmarksPanel"
        :value="$store.state.autoCloseBookmarks"
        @input="setOpt('autoCloseBookmarks', $event)")

    section
      h2 {{t('settings.appearance_title')}}
      select-field(
        label="settings.font_size"
        optLabel="settings.font_size_"
        :value="$store.state.fontSize"
        :opts="$store.state.fontSizeOpts"
        @input="setOpt('fontSize', $event)")
      select-field(
        label="settings.switch_theme"
        optLabel="settings.theme_"
        :value="$store.state.theme"
        :opts="$store.state.themeOpts"
        @input="setOpt('theme', $event)")
      toggle-field(
        label="settings.bg_noise"
        :value="$store.state.bgNoise"
        @input="setOpt('bgNoise', $event)")
      toggle-field(
        label="settings.animations"
        :value="$store.state.animations"
        @input="setOpt('animations', $event)")
      .buttons: .btn(@click="openStylesEditor") {{t('settings.edit_styles')}}

    section
      h2 {{t('settings.snapshots_title')}}
      .inline-fields
        toggle-field(
          label="settings.snapshots_pinned_label"
          :inline="true"
          :value="snapshotPinned"
          @input="toggleSnapshots('pinned')")
        toggle-field(
          label="settings.snapshots_default_label"
          :inline="true"
          :value="snapshotDefault"
          @input="toggleSnapshots('default')")
        toggle-field(
          v-for="c in snapshotContainers"
          :label="c.name"
          :color="c.color"
          :inline="true"
          :value="c.active"
          @input="toggleSnapshots(c.id)")
      .buttons
        .btn(@click="viewAllSnapshots") {{t('settings.snapshots_view_label')}}
        .btn(@click="makeSnapshot") {{t('settings.make_snapshot')}}
        .btn.-warn(@click="removeAllSnapshots") {{t('settings.rm_all_snapshots')}}

    section
      h2 {{t('settings.mouse_title')}}
      toggle-field(
        label="settings.h_scroll_through_panels"
        :value="$store.state.hScrollThroughPanels"
        @input="setOpt('hScrollThroughPanels', $event)")
      select-field(
        label="settings.scroll_through_tabs"
        optLabel="settings.scroll_through_tabs_"
        :value="$store.state.scrollThroughTabs"
        :opts="$store.state.scrollThroughTabsOpts"
        @input="setOpt('scrollThroughTabs', $event)")
      select-field(
        label="settings.tab_double_click"
        optLabel="settings.tab_action_"
        :value="$store.state.tabDoubleClick"
        :opts="$store.state.tabDoubleClickOpts"
        @input="setOpt('tabDoubleClick', $event)")
      select-field(
        label="settings.tab_long_left_click"
        optLabel="settings.tab_action_"
        :value="$store.state.tabLongLeftClick"
        :opts="$store.state.tabLongLeftClickOpts"
        @input="setOpt('tabLongLeftClick', $event)")
      select-field(
        label="settings.tab_long_right_click"
        optLabel="settings.tab_action_"
        :value="$store.state.tabLongRightClick"
        :opts="$store.state.tabLongRightClickOpts"
        @input="setOpt('tabLongRightClick', $event)")
      select-field(
        label="settings.tabs_panel_left_click_action"
        optLabel="settings.tabs_panel_action_"
        :value="$store.state.tabsPanelLeftClickAction"
        :opts="$store.state.tabsPanelLeftClickActionOpts"
        @input="setOpt('tabsPanelLeftClickAction', $event)")
      select-field(
        label="settings.tabs_panel_double_click_action"
        optLabel="settings.tabs_panel_action_"
        :inactive="$store.state.tabsPanelLeftClickAction !== 'none'"
        :value="$store.state.tabsPanelDoubleClickAction"
        :opts="$store.state.tabsPanelDoubleClickActionOpts"
        @input="setOpt('tabsPanelDoubleClickAction', $event)")
      select-field(
        label="settings.tabs_panel_right_click_action"
        optLabel="settings.tabs_panel_action_"
        :value="$store.state.tabsPanelRightClickAction"
        :opts="$store.state.tabsPanelRightClickActionOpts"
        @input="setOpt('tabsPanelRightClickAction', $event)")

    section
      h2 {{t('settings.kb_title')}}
      .keybinding(
        v-for="(k, i) in $store.state.keybindings"
        :key="k.name"
        :is-focused="k.focus"
        @click="changeKeybinding(k, i)")
        .label {{t(k.description, 'settings')}}
        .value {{normalizeShortcut(k.shortcut)}}
        input(
          type="text"
          ref="keybindingInputs"
          tabindex="-1"
          @blur="onKBBlur(k, i)"
          @keydown.prevent.stop="onKBKey($event, k, i)"
          @keyup.prevent.stop="onKBKeyUp($event, k, i)")
      .buttons
        .btn(@click="resetKeybindings") {{t('settings.reset_kb')}}

    section
      h2 {{t('settings.permissions_title')}}

      div
        toggle-field(
          label="settings.all_urls_label"
          :inline="true"
          :value="$store.state.permAllUrls"
          @input="togglePermAllUrls")
        .box: .info {{t('settings.all_urls_info')}}

      div
        toggle-field(
          label="settings.tab_hide_label"
          :inline="true"
          :value="$store.state.permTabHide"
          @input="togglePermTabHide")
        .box: .info {{t('settings.tab_hide_info')}}

    section
      h2 {{t('settings.favi_title')}}
      info-field(
        label="settings.cached_favics"
        :value="faviCache"
        @click="calcFaviCache")
      .buttons
        .btn(@click="clearFaviCache(false)") {{t('settings.rm_unused_favi_cache')}}
        .btn.-warn(@click="clearFaviCache(true)") {{t('settings.rm_favi_cache')}}

    section
      h2 {{t('settings.sync_title')}}
      info-field(
        label="settings.sync_data_size"
        :value="syncDataSize"
        @click="calcSyncDataSize")
      .buttons
        .btn.-warn(@click="clearSyncData") {{t('settings.rm_sync_data')}}

    section
      h2 {{t('settings.help_title')}}

      .buttons
        a.btn(tabindex="-1", :href="issueLink") {{t('settings.repo_bug')}}
        a.btn(tabindex="-1", :href="featureReqLink") {{t('settings.repo_req')}}
        .btn.-warn(@click="resetSettings") {{t('settings.reset_settings')}}

      a.github(tabindex="-1", href="https://github.com/mbnuqw/sidebery")
        svg: use(xlink:href="#icon_github")
</template>


<script>
import { mapGetters } from 'vuex'
import Utils from '../../../libs/utils'
import Store from '../../store'
import State from '../../store.state'
import ScrollBox from '../scroll-box'
import ToggleField from '../fields/toggle'
import SelectField from '../fields/select'
import InfoField from '../fields/info'

const VALID_SHORTCUT_62 = /^((Ctrl|Alt|Command|MacCtrl)\+)(Shift\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?(Shift\+)?(F\d\d?)$/
const VALID_SHORTCUT = /^((Ctrl|Alt|Command|MacCtrl)\+)((Shift|Alt)\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?((Shift|Alt)\+)?(F\d\d?)$/
const SPEC_KEYS = /^(Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|F\d\d?)$/
const ISSUE_URL = 'https://github.com/mbnuqw/sidebery/issues/new'

export default {
  components: {
    ScrollBox,
    ToggleField,
    SelectField,
    InfoField,
  },

  data() {
    return {
      faviCache: this.t('settings.cached_favics_unknown'),
      syncDataSize: this.t('settings.sync_data_size_unknown'),
    }
  },

  computed: {
    ...mapGetters(['defaultCtxId']),

    issueLink() {
      if (!State.osInfo || !State.ffInfo) return ISSUE_URL

      let body = `\n\n\n> OS: ${State.osInfo.os} ${State.osInfo.arch}  \n`
      body += `> Firefox: ${State.ffInfo.version}  \n`
      body += `> Extension: ${State.version}  \n`
      return ISSUE_URL + '?body=' + encodeURIComponent(body)
    },

    featureReqLink() {
      return ISSUE_URL
    },

    snapshots() {
      return State.snapshots
    },

    snapshotsIsON() {
      return Object.values(State.snapshotsTargets)
        .reduce((a, s) => a || s, false)
    },

    snapshotPinned() {
      return State.snapshotsTargets.pinned
    },

    snapshotDefault() {
      return State.snapshotsTargets.default
    },

    snapshotContainers() {
      return State.ctxs.map(c => {
        return {
          id: c.cookieStoreId,
          name: c.name,
          color: c.colorCode,
          active: !!State.snapshotsTargets[c.cookieStoreId],
        }
      })
    },
  },

  async mounted() {
    // Get permissions state
    State.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })
    State.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })
    if (State.hideInact) Store.dispatch('hideInactPanelsTabs')
  },

  methods: {
    switchOpt(e, optName) {
      const opt = State[optName]
      const opts = State[optName + 'Opts']
      if (opt === undefined || opts === undefined) return

      let i = opts.indexOf(opt)
      if (e.button === 0) i++
      if (e.button === 2) i--
      if (i >= opts.length) i = 0
      if (i < 0) i = opts.length - 1
      Store.commit('setSetting', { key: optName, val: opts[i] })
      Store.dispatch('saveSettings')
    },

    setOpt(key, val) {
      Store.commit('setSetting', { key, val })
      Store.dispatch('saveSettings')
    },

    toggleOpt(optName) {
      const opt = State[optName]
      if (opt === undefined) return
      Store.commit('setSetting', { key: optName, val: !opt })
      Store.dispatch('saveSettings')
    },

    // --- Tabs ---
    async toggleHideInact() {
      State.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })
      if (State.hideInact) {
        Store.dispatch('showAllTabs')
      } else {
        if (!State.permTabHide) {
          const url = browser.runtime.getURL('permissions/tab-hide.html')
          browser.tabs.create({ url })
          return
        }
        Store.dispatch('hideInactPanelsTabs')
      }

      this.toggleOpt('hideInact')
    },

    toggleTabsTree() {
      if (State.tabsTree) {
        State.tabs = State.tabs.map(t => {
          t.lvl = 0
          return t
        })
      } else {
        State.tabs = Utils.CalcTabsTreeLevels(State.tabs)
      }
      this.toggleOpt('tabsTree')
    },

    // --- Bookmarks ---
    toggleBookmarksPanel() {
      if (State.bookmarksPanel) State.bookmarks = []
      else Store.dispatch('loadBookmarks')
      this.toggleOpt('bookmarksPanel')
    },

    // --- Appearance ---
    openStylesEditor() {
      Store.commit('openStylesEditor')
    },

    // --- Keybinding ---
    changeKeybinding(k, i) {
      this.$refs.keybindingInputs[i].focus()
      this.lastShortcut = State.keybindings[i]
      State.keybindings.splice(i, 1, { ...k, shortcut: 'Press new shortcut', focus: true })
    },
    onKBBlur(k, i) {
      if (this.lastShortcut) {
        State.keybindings.splice(i, 1, this.lastShortcut)
        this.lastShortcut = null
        return
      }
    },
    onKBKey(e, k, i) {
      if (e.key === 'Escape') return this.$refs.keybindingInputs[i].blur()

      let shortcut = []
      if (e.ctrlKey) {
        if (State.os === 'mac') shortcut.push('MacCtrl')
        else shortcut.push('Ctrl')
      }
      if (e.altKey) shortcut.push('Alt')
      if (e.shiftKey && shortcut.length <= 1) shortcut.push('Shift')

      if (e.code.indexOf('Digit') === 0) shortcut.push(e.code[e.code.length - 1])
      else if (e.code.indexOf('Key') === 0) shortcut.push(e.code[e.code.length - 1])
      else if (e.code.indexOf('Arrow') === 0) shortcut.push(e.code.slice(5))
      else if (SPEC_KEYS.test(e.code)) shortcut.push(e.code)

      shortcut = shortcut.join('+')

      if (this.checkShortcut(shortcut)) {
        this.lastShortcut = null
        State.keybindings.splice(i, 1, { ...k, shortcut, focus: false })
        Store.dispatch('updateKeybinding', { name: k.name, shortcut })
        this.$refs.keybindingInputs[i].blur()
      }
    },
    onKBKeyUp(e, k, i) {
      this.$refs.keybindingInputs[i].blur()
    },
    checkShortcut(shortcut) {
      let exists = State.keybindings.find(k => k.shortcut === shortcut)
      if (State.ffVer > 62) return VALID_SHORTCUT.test(shortcut) && !exists
      else return VALID_SHORTCUT_62.test(shortcut) && !exists
    },
    resetKeybindings() {
      Store.dispatch('resetKeybindings')
    },
    normalizeShortcut(s) {
      if (State.os === 'mac') {
        return s.replace('Command', '⌘').replace('MacCtrl', 'Ctrl')
      }
      if (State.os === 'win') return s.replace('Command', 'Win')
      if (State.os === 'linux') return s.replace('Command', 'Super')
      return s
    },

    utime: Utils.UTime,
    uelapsed: Utils.UElapsed,

    // --- Snapshot ---
    toggleSnapshots(name) {
      const v = !State.snapshotsTargets[name]
      State.snapshotsTargets = { ...State.snapshotsTargets, [name]: v }
      Store.dispatch('saveSettings')
    },

    viewAllSnapshots() {
      Store.dispatch('openSnapshotsViewer')
    },

    tabsCount(ctx, tabs) {
      if (ctx === 'pinned') return tabs.filter(t => t.pinned).length
      if (!ctx) {
        return tabs.filter(t => {
          return t.cookieStoreId === this.defaultCtxId && !t.pinned
        }).length
      }
      return tabs.filter(t => t.cookieStoreId === ctx.cookieStoreId && !t.pinned).length
    },

    /**
     * Get string containing urls of tabs.
     */
    firstUrls(tabs) {
      if (!tabs) return ''
      let out = tabs.length > 7 ? tabs.slice(0, 7) : tabs
      let outStr = out
        .map(t => {
          if (t.url.length <= 64) return t.url
          else return t.url.slice(0, 64) + '...'
        })
        .join('\n')
      if (tabs.length > 7) outStr += '\n...'
      return outStr
    },

    /**
     * Apply snapshot
     */
    applySnapshot(snapshot) {
      Store.dispatch('applySnapshot', snapshot)
    },

    makeSnapshot() {
      Store.dispatch('makeSnapshot')
    },

    removeAllSnapshots() {
      Store.dispatch('removeAllSnapshot')
    },

    // --- Permissions ---
    async togglePermAllUrls() {
      State.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })

      if (State.permAllUrls) {
        await browser.permissions.remove({ origins: ['<all_urls>'] })
        State.proxiedPanels = {}
        State.containers.map(c => {
          if (c.proxy) c.proxy = null
        })
        State.permAllUrls = await browser.permissions.contains({ origins: ['<all_urls>'] })
      } else {
        browser.tabs.create({
          url: browser.runtime.getURL('permissions/all-urls.html'),
        })
      }
      Store.dispatch('saveSettings')
    },

    async togglePermTabHide() {
      State.permTabHide = await browser.permissions.contains({ permissions: ['tabHide'] })

      if (State.permTabHide) {
        await Store.dispatch('showAllTabs')
        await browser.permissions.remove({ permissions: ['tabHide'] })
        State.hideInact = false
        State.permTabHide = false
      } else {
        browser.tabs.create({
          url: browser.runtime.getURL('permissions/tab-hide.html'),
        })
      }
      Store.dispatch('saveSettings')
    },

    // --- Help ---
    calcFaviCache() {
      const size = Utils.StrSize(JSON.stringify(State.favicons))
      const count = Object.keys(State.favicons).length
      this.faviCache = count + ': ' + size
    },

    async calcSyncDataSize() {
      const ans = await browser.storage.sync.get()
      this.syncDataSize = Utils.StrSize(ans[State.localID] || '')
    },

    /**
     * Set default values for settings and save.
     */
    resetSettings() {
      Store.commit('resetSettings')
      Store.dispatch('saveSettings')
      Store.dispatch('saveState')
    },

    /**
     * Clear cached favicons.
     */
    clearFaviCache(all) {
      Store.dispatch('clearFaviCache', { all })
      if (!all) this.calcFaviCache()
    },

    /**
     * Clear all data for syncing
     */
    async clearSyncData() {
      await Store.dispatch('clearSyncData')
      this.calcSyncDataSize()
    },
  },
}
</script>


<style lang="stylus">
@import '../../../styles/mixins'

.Settings
  box(absolute)
  pos(0, 0)
  size(100%, same)

.Settings section
  box(relative, grid)
  padding: 2px 0 24px
  grid-gap: 8px 0

.Settings section > h2
  box(relative)
  text(s: rem(24), w: 400)
  color: var(--title-fg)
  padding: 0 12px
  margin: 8px 0 2px

// --- Container ---
.Settings .box
  box(relative, grid)
  grid-gap: 8px 0
  margin: 0 12px 0 16px

.Settings .box > .label
  box(relative)
  text(s: rem(14))
  color: var(--label-fg)
  margin: 0

.Settings .box > .info
  box(relative)
  text(s: rem(13)) 
  size(max-w: 100%)
  padding: 0 0 0 8px
  white-space: pre-wrap
  color: var(--info-fg)

.Settings .inline-fields
  box(relative, grid)
  grid-gap: 3px 0

.Settings .buttons
  box(relative, grid)
  grid-gap: 7px 0
  margin: 4px 16px 0 16px

// --- Snapshots ---
.Settings .snapshot
  box(relative, flex)
  text(s: rem(13))
  size(100%)
  color: var(--label-fg)
  margin: 0 0 3px
  cursor: pointer
  transition: opacity var(--d-fast)
  &:nth-child(1)
    opacity: .8
  &:nth-child(2)
    opacity: .7
  &:nth-child(3)
    opacity: .6
  &:nth-child(4)
    opacity: .5
  &:nth-child(5)
    opacity: .4
  &:hover
    opacity: 1
  &:active
    opacity: .7

  .time
    margin-right: auto
    white-space: nowrap

  .tabs
    size(min-w: 12px)
    text-align: right
    margin: 0 0 0 5px
    &.pinned
      color: var(--settings-snapshot-counter-pinned-fg)

// --- Keybindings ---
.Settings .keybinding
  box(relative, flex)
  flex-direction: column
  align-items: flex-start
  padding: 2px 0
  margin: 0 8px 0 16px
  cursor: pointer
  &:hover
    > .label
      color: var(--label-fg-hover)
  &[is-focused]
    > .value
      color: var(--settings-shortcut-fg-focus)
      box-shadow: var(--settings-shortcut-shadow-focus)
    > .label
      color: var(--label-fg-hover)

.Settings .keybinding > .label
  box(relative)
  text(s: rem(14))
  color: var(--label-fg)
  margin: 0 6px 5px 0
  transition: color var(--d-fast)

.Settings .keybinding > .value
  box(relative)
  text(s: rem(12))
  padding: 1px 5px
  margin: 1px 0 0 0
  color: var(--settings-shortcut-fg)
  background-color: var(--settings-shortcut-bg)
  box-shadow: var(--settings-shortcut-shadow)
  border-radius: 4px
  white-space: nowrap

.Settings .keybinding > input
  box(absolute)
  size(0, same)
  pos(0, 0)
  opacity: 0
  z-index: -1

.Settings .github
  box(relative, block)
  size(23px, same)
  margin: 24px auto 8px
  padding: 0
  opacity: .5
  &:hover
    opacity: .8
  &:active
    opacity: .5
  > svg
    box(absolute)
    size(100%, same)
    fill: #646464
</style>
