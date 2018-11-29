<template lang="pug">
.Settings(@contextmenu.prevent.stop="")
  scroll-box(ref="scrollBox")
    section
      h2 {{t('settings.general_title')}}
      .field(
        :opt-true="$store.state.nativeScrollbars"
        @click="toggleOpt('nativeScrollbars')")
        .label {{t('settings.native_scrollbars')}}
        .input
          .opt.-true {{t('settings.opt_true')}}
          .opt.-false {{t('settings.opt_false')}}
      .field(
        :opt-true="$store.state.activateLastTabOnPanelSwitching"
        @click="toggleOpt('activateLastTabOnPanelSwitching')")
        .label {{t('settings.activate_last_tab_on_panel_switching')}}
        .input
          .opt.-true {{t('settings.opt_true')}}
          .opt.-false {{t('settings.opt_false')}}
      .field(:opt-true="$store.state.createNewTabOnEmptyPanel", @click="toggleOpt('createNewTabOnEmptyPanel')")
        .label {{t('settings.create_new_tab_on_empty_panel')}}
        .input
          .opt.-true {{t('settings.opt_true')}}
          .opt.-false {{t('settings.opt_false')}}
      .field(:opt-true="$store.state.skipEmptyPanels", @click="toggleOpt('skipEmptyPanels')")
        .label {{t('settings.skip_empty_panels')}}
        .input
          .opt.-true {{t('settings.opt_true')}}
          .opt.-false {{t('settings.opt_false')}}
      .field(:opt-true="$store.state.showTabRmBtn", @click="toggleOpt('showTabRmBtn')")
        .label {{t('settings.show_tab_rm_btn')}}
        .input
          .opt.-true {{t('settings.opt_true')}}
          .opt.-false {{t('settings.opt_false')}}
      .field(:opt-true="$store.state.hScrollThroughPanels", @click="toggleOpt('hScrollThroughPanels')")
        .label {{t('settings.h_scroll_through_panels')}}
        .input
          .opt.-true {{t('settings.opt_true')}}
          .opt.-false {{t('settings.opt_false')}}
      .field(@mousedown="switchOpt($event, 'scrollThroughTabs')")
        .label {{t('settings.scroll_through_tabs')}}
        .input
          .opt(
            v-for="o in $store.state.scrollThroughTabsOpts"
            :opt-none="o === 'none'"
            :opt-true="o === $store.state.scrollThroughTabs") {{t('settings.scroll_tabs_' + o)}}
      .field(@mousedown="switchOpt($event, 'tabDoubleClick')")
        .label {{t('settings.tab_double_click')}}
        .input
          .opt(
            v-for="o in $store.state.tabDoubleClickOpts"
            :opt-none="o === 'none'"
            :opt-true="o === $store.state.tabDoubleClick") {{t('settings.tab_action_' + o)}}
      .field(@mousedown="switchOpt($event, 'tabLongLeftClick')")
        .label {{t('settings.tab_long_left_click')}}
        .input
          .opt(
            v-for="o in $store.state.tabLongLeftClickOpts"
            :opt-none="o === 'none'"
            :opt-true="o === $store.state.tabLongLeftClick") {{t('settings.tab_action_' + o)}}
      .field(@mousedown="switchOpt($event, 'tabLongRightClick')")
        .label {{t('settings.tab_long_right_click')}}
        .input
          .opt(
            v-for="o in $store.state.tabLongRightClickOpts"
            :opt-none="o === 'none'"
            :opt-true="o === $store.state.tabLongRightClick") {{t('settings.tab_action_' + o)}}
      .field(:opt-true="$store.state.noEmptyDefault", @click="toggleOpt('noEmptyDefault')")
        .label {{t('settings.no_empty_default')}}
        .input
          .opt.-true {{t('settings.opt_true')}}
          .opt.-false {{t('settings.opt_false')}}
      .field(:opt-true="$store.state.openBookmarkNewTab", @click="toggleOpt('openBookmarkNewTab')")
        .label {{t('settings.open_bookmark_new_tab')}}
        .input
          .opt.-true {{t('settings.opt_true')}}
          .opt.-false {{t('settings.opt_false')}}

    section
      h2 {{t('settings.appearance_title')}}
      .field(@mousedown="switchOpt($event, 'fontSize')")
        .label {{t('settings.font_size')}}
        .input
          .opt(
            v-for="o in $store.state.fontSizeOpts"
            :opt-true="o === $store.state.fontSize") {{t('settings.font_size_' + o)}}
      .field(@mousedown="switchOpt($event, 'theme')")
        .label {{t('settings.switch_theme')}}
        .input
          .opt(
            v-for="o in $store.state.themeOpts"
            :opt-true="o === $store.state.theme") {{t('settings.theme_' + o)}}
      .field(:opt-true="$store.state.bgNoise", @click="toggleOpt('bgNoise')")
        .label {{t('settings.bg_noise')}}
        .input
          .opt.-true {{t('settings.opt_true')}}
          .opt.-false {{t('settings.opt_false')}}
      .field(:opt-true="$store.state.animations", @click="toggleOpt('animations')")
        .label {{t('settings.animations')}}
        .input
          .opt.-true {{t('settings.opt_true')}}
          .opt.-false {{t('settings.opt_false')}}

    section
      h2 {{t('settings.snapshots_title')}}
      div
        .field.inline(:opt-true="snapshotPinned", @click="toggleSnapshotPinned")
          .label {{t('settings.snapshots_pinned_label')}}
          .input
            .opt.-true {{t('settings.opt_true')}}
            .opt.-false {{t('settings.opt_false')}}
        .field.inline(:opt-true="snapshotDefault", @click="toggleSnapshotDefault")
          .label {{t('settings.snapshots_default_label')}}
          .input
            .opt.-true {{t('settings.opt_true')}}
            .opt.-false {{t('settings.opt_false')}}
        .field.inline(
          v-for="(c, i) in snapshotContiners"
          :opt-true="c.active"
          @click="toggleSnapshotContainer(i, c.id)")
          .label(:style="{ color: c.color }") {{c.name}}
          .input
            .opt.-true {{t('settings.opt_true')}}
            .opt.-false {{t('settings.opt_false')}}

      .field(v-if="snapshotsIsON", @mousedown="switchOpt($event, 'snapshotsLimit')")
        .label {{t('settings.snapshots_limit_label')}}
        .input
          .opt(
            v-for="o in $store.state.snapshotsLimitOpts"
            :opt-true="o === $store.state.snapshotsLimit") {{t('settings.snapshot_limit_' + o)}}
      .box
        .snapshot(
          v-for="(s, i) in snapshots"
          :title="firstFiveUrls(s.tabs)"
          @click="applySnapshot(s)")
          .time {{uelapsed(s.time)}}
          .tabs.pinned {{tabsCount('pinned', s.tabs)}}
          .tabs {{tabsCount(null, s.tabs)}}
          .tabs(v-for="c in s.ctxs", :style="{color: c.colorCode}") {{tabsCount(c, s.tabs)}}
        .label-btn(
          v-if="snapshots.length"
          @click="viewAllSnapshots") {{t('settings.snapshots_view_all_label')}}
      .box
        .btn(@click="makeSnapshot") {{t('settings.make_snapshot')}}
        .btn.-warn(@click="removeAllSnapshots") {{t('settings.rm_all_snapshots')}}

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
      .box
        .btn(@click="resetKeybindings") {{t('settings.reset_kb')}}

    section
      h2 {{t('settings.help_title')}}

      .box
        .label {{t('settings.found_bug_label')}}
        a.btn(tabindex="-1", :href="issueLink") {{t('settings.repo_issue')}}

      .box
        .label Debug
        .btn(@click="copyDebugInfo") {{t('settings.cp_debug_info')}}
        textarea.hidden(ref="debugInfo", tabindex="-1")

      .field(@click="calcFaviCache")
        .label {{t('settings.cached_favics')}}
        .info {{faviCache}}

      .field(@click="calcSyncDataSize")
        .label {{t('settings.sync_data_size')}}
        .info {{syncDataSize}}

      .box
        .btn(@click="clearFaviCache(false)") {{t('settings.rm_unused_favi_cache')}}
        .btn.-warn(@click="resetSettings") {{t('settings.reset_settings')}}
        .btn.-warn(@click="clearFaviCache(true)") {{t('settings.rm_favi_cache')}}
        .btn.-warn(@click="clearSyncData") {{t('settings.rm_sync_data')}}

      a.github(tabindex="-1", href="https://github.com/mbnuqw/sidebery")
        svg: use(xlink:href="#icon_github")
</template>


<script>
import { mapGetters } from 'vuex'
import Utils from '../../libs/utils'
import EventBus from '../event-bus'
import Store from '../store'
import State from '../store.state'
import ScrollBox from './scroll-box'
import TextInput from './input.text'

const VALID_SHORTCUT_62 = /^((Ctrl|Alt|Command|MacCtrl)\+)(Shift\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?(Shift\+)?(F\d\d?)$/
const VALID_SHORTCUT = /^((Ctrl|Alt|Command|MacCtrl)\+)((Shift|Alt)\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?((Shift|Alt)\+)?(F\d\d?)$/
const SPEC_KEYS = /^(Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|F\d\d?)$/
const ISSUE_URL = 'https://github.com/mbnuqw/sidebery/issues/new'

export default {
  components: {
    ScrollBox,
    TextInput,
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

    snapshots() {
      return State.snapshots
    },

    snapshotsIsON() {
      return State.snapshotsTargets.reduce((a, s) => a || s, false)
    },

    snapshotPinned() {
      return !!State.snapshotsTargets[0]
    },

    snapshotDefault() {
      return !!State.snapshotsTargets[1]
    },

    snapshotContiners() {
      return State.ctxs.map((c, i) => {
        return {
          id: c.cookieStoreId,
          name: c.name,
          color: c.colorCode,
          active: !!State.snapshotsTargets[i + 2]
        }
      })
    },
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

    toggleOpt(optName) {
      const opt = State[optName]
      if (opt === undefined) return
      Store.commit('setSetting', { key: optName, val: !opt })
      Store.dispatch('saveSettings')
    },

    // --- Keybinding ---
    changeKeybinding(k, i) {
      this.$refs.keybindingInputs[i].focus()
      this.lastShortcut = State.keybindings[i]
      State.keybindings.splice(i, 1, {...k, shortcut: 'Press new shortcut', focus: true})
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
        State.keybindings.splice(i, 1, {...k, shortcut, focus: false})
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
    toggleSnapshotPinned() {
      State.snapshotsTargets[0] = !State.snapshotsTargets[0]
      State.snapshotsTargets = [...State.snapshotsTargets]
      Store.dispatch('saveSettings')
    },
    toggleSnapshotDefault() {
      State.snapshotsTargets[1] = !State.snapshotsTargets[1]
      State.snapshotsTargets = [...State.snapshotsTargets]
      Store.dispatch('saveSettings')
    },
    toggleSnapshotContainer(i, name) {
      if (State.snapshotsTargets[i + 2]) State.snapshotsTargets[i + 2] = false
      else State.snapshotsTargets[i + 2] = name
      State.snapshotsTargets = [...State.snapshotsTargets]
      Store.dispatch('saveSettings')
    },

    viewAllSnapshots() {
      EventBus.$emit('toggle-snapshots-list')
    },

    tabsCount(ctx, tabs) {
      if (ctx === 'pinned') return tabs.filter(t => t.pinned).length
      if (!ctx) return tabs.filter(t => {
        return t.cookieStoreId === this.defaultCtxId
          && !t.pinned
      }).length
      return tabs.filter(t => t.cookieStoreId === ctx.cookieStoreId).length
    },

    /**
     * Get string containing urls of tabs.
     */
    firstFiveUrls(tabs) {
      if (!tabs) return ''
      let out = tabs.length > 7 ? tabs.slice(0, 7) : tabs
      let outStr = out.map(t => {
        if (t.url.length <= 36) return t.url
        else return t.url.slice(0, 36) + '...'
      }).join('\n')
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

    // --- Help ---
    copyDebugInfo() {
      if (!this.$refs.debugInfo) return
      this.$refs.debugInfo.value = this.$root.copyDebugInfo()
      this.$refs.debugInfo.select()
      document.execCommand('copy')
      this.$refs.debugInfo.value = ''
    },

    calcFaviCache() {
      const size = Utils.StrSize(JSON.stringify(State.favicons))
      const count = Object.keys(State.favicons).length
      this.faviCache = count + ': ' + size
    },

    async calcSyncDataSize() {
      const ans = await browser.storage.sync.get()
      this.syncDataSize = Utils.StrSize(JSON.stringify(ans))
    },

    /**
     * Set default values for settings and save.
     */
    resetSettings() {
      Store.commit('resetSettings')
      Store.dispatch('saveSettings')
    },

    /**
     * Clear cached favicons.
     */
    clearFaviCache(all) {
      Store.dispatch('clearFaviCache', { all })
    },

    /**
     * Clear all data for syncing
     */
    clearSyncData() {
      Store.dispatch('clearSyncData')
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.Settings section
  box(relative)
  padding: 2px 0 8px

.Settings section > h2
  box(relative)
  text(s: rem(24), w: 400)
  color: var(--c-title-fg)
  padding: 8px 12px 10px
  margin: 0

.Settings .field
  box(relative)
  margin: 0 12px 12px 16px
  cursor: pointer
  &:hover
    > .label
      color: var(--settings-label-fg-hover)
  &:active
    > .label
      transition: none
      color: var(--c-label-fg-active)
  &[opt-true]
    .opt
      color: var(--settings-opt-active-fg)
    .opt.-true
      color: var(--settings-opt-true-fg)
    .opt.-false
      color: var(--settings-opt-inactive-fg)

.Settings .field > .label
  box(relative)
  text(s: rem(14))
  color: var(--settings-label-fg)
  transition: color var(--d-fast)

.Settings .field.inline
  box(flex)
  margin: 0 12px 2px 16px
  justify-content: space-between
  align-items: center
  &:last-of-type
    margin: 0 12px 12px 16px
  >.input
    flex-shrink: 0
  >.label
    margin-right: 12px
    overflow: hidden
    text-overflow: ellipsis

.Settings .field > .input
  box(relative, flex)
  flex-wrap: wrap

.Settings .field > .info
  box(relative)
  text(s: rem(14))
  color: var(--settings-opt-active-fg)

.Settings .opt
  box(relative)
  text(s: rem(14))
  margin: 0 7px 0 0
  color: var(--settings-opt-inactive-fg)
  transition: color var(--d-fast)
  &.-false
    color: var(--settings-opt-false-fg)
  &[opt-true]
    color: var(--settings-opt-active-fg)
    &[opt-none]
      color: var(--settings-opt-false-fg)

// --- Container ---
.Settings .box
  box(relative, flex)
  flex-direction: column
  flex-wrap: wrap
  justify-content: flex-start
  align-items: flex-start
  margin: 0 16px 5px

.Settings .box > .label
  box(relative)
  text(s: rem(14))
  color: var(--settings-label-fg)
  margin: 0 0 5px

// --- Snapshots ---
.Settings .snapshot
  box(relative, flex)
  text(s: rem(13))
  size(100%)
  color: var(--settings-label-fg)
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

.Settings .label-btn
  box(relative)
  text(s: rem(14))
  size(100%)
  margin: 2px 0 8px
  text-align: center
  color: var(--settings-label-btn-fg)
  cursor: pointer
  transition: opacity var(--d-fast)
  &:hover
    color: var(--settings-label-btn-fg-hover)
  &:active
    transition: none
    color: var(--settings-label-btn-fg-active)

// --- Keybindings ---
.Settings .keybinding
  box(relative, flex)
  flex-direction: column
  align-items: flex-start
  margin: 0 8px 12px 16px
  cursor: pointer
  &:hover
    > .label
      color: var(--settings-label-fg-hover)
  &[is-focused]
    > .value
      color: var(--settings-shortcut-fg-focus)
      box-shadow: var(--settings-shortcut-shadow-focus)
    > .label
      color: var(--settings-label-fg-hover)
  + .box
    padding-top: 8px

.Settings .keybinding > .label
  box(relative)
  text(s: rem(14))
  color: var(--settings-label-fg)
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
  margin: 18px auto 16px
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
