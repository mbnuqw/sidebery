<template lang="pug">
.Settings: .wrapper(v-noise:300.g:12:af.a:0:42.s:0:9="")
  h1 Settings
  section
    h2 {{t('settings.general_title')}}
    ToggleField(
      label="settings.native_scrollbars"
      :value="$store.state.nativeScrollbars"
      @input="setOpt('nativeScrollbars', $event)")
    .separator
    select-field(
      label="settings.autoHide_ctx_menu"
      optLabel="settings.autoHide_ctx_menu_"
      :value="$store.state.autoHideCtxMenu"
      :opts="$store.state.autoHideCtxMenuOpts"
      @input="setOpt('autoHideCtxMenu', $event)")
    .separator
    .ctrls
      .btn(@click="switchView('menu-editor')") {{t('settings.ctx_menu_editor')}}

  section
    h2 {{t('settings.nav_title')}}
    toggle-field(
      label="settings.nav_bar_inline"
      :value="$store.state.navBarInline"
      @input="setOpt('navBarInline', $event)")
    .separator
    toggle-field(
      label="settings.hide_settings_btn"
      :value="$store.state.hideSettingsBtn"
      @input="setOpt('hideSettingsBtn', $event)")
    .separator
    toggle-field(
      label="settings.hide_add_btn"
      :value="$store.state.hideAddBtn"
      @input="setOpt('hideAddBtn', $event)")

  section
    h2 {{t('settings.tabs_title')}}
    toggle-field(
      label="settings.activate_last_tab_on_panel_switching"
      :value="$store.state.activateLastTabOnPanelSwitching"
      @input="setOpt('activateLastTabOnPanelSwitching', $event)")
    .separator
    toggle-field(
      label="settings.skip_empty_panels"
      :value="$store.state.skipEmptyPanels"
      @input="setOpt('skipEmptyPanels', $event)")
    .separator
    toggle-field(
      label="settings.show_tab_rm_btn"
      :value="$store.state.showTabRmBtn"
      @input="setOpt('showTabRmBtn', $event)")
    .separator
    toggle-field(
      label="settings.hide_inactive_panel_tabs"
      :value="$store.state.hideInact"
      @input="toggleHideInact")
    .separator
    select-field(
      label="settings.activate_after_closing"
      optLabel="settings.activate_after_closing_"
      :value="$store.state.activateAfterClosing"
      :opts="$store.state.activateAfterClosingOpts"
      @input="setOpt('activateAfterClosing', $event)")
    .sub-fields
      .separator
      select-field(
        label="settings.activate_after_closing_prev_rule"
        optLabel="settings.activate_after_closing_rule_"
        :value="$store.state.activateAfterClosingPrevRule"
        :inactive="!activateAfterClosingNextOrPrev"
        :opts="$store.state.activateAfterClosingPrevRuleOpts"
        @input="setOpt('activateAfterClosingPrevRule', $event)")
      .separator
      select-field(
        label="settings.activate_after_closing_next_rule"
        optLabel="settings.activate_after_closing_rule_"
        :value="$store.state.activateAfterClosingNextRule"
        :inactive="!activateAfterClosingNextOrPrev"
        :opts="$store.state.activateAfterClosingNextRuleOpts"
        @input="setOpt('activateAfterClosingNextRule', $event)")

  section
    h2 {{t('settings.pinned_tabs_title')}}
    select-field(
      label="settings.pinned_tabs_position"
      optLabel="settings.pinned_tabs_position_"
      :value="$store.state.pinnedTabsPosition"
      :opts="$store.state.pinnedTabsPositionOpts"
      @input="setOpt('pinnedTabsPosition', $event)")
    .separator
    toggle-field(
      label="settings.pinned_tabs_list"
      :inactive="$store.state.pinnedTabsPosition !== 'panel'"
      :value="$store.state.pinnedTabsList"
      @input="setOpt('pinnedTabsList', $event)")

  section
    h2 {{t('settings.tabs_tree_title')}}
    toggle-field(i
      label="settings.tabs_tree_layout"
      :value="$store.state.tabsTree"
      @input="setOpt('tabsTree', $event)")
    .separator
    toggle-field(
      label="settings.group_on_open_layout"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.groupOnOpen"
      @input="setOpt('groupOnOpen', $event)")
    .separator
    select-field(
      label="settings.tabs_tree_limit"
      optLabel="settings.tabs_tree_limit_"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.tabsTreeLimit"
      :opts="$store.state.tabsTreeLimitOpts"
      @input="setOpt('tabsTreeLimit', $event)")
    .separator
    toggle-field(
      label="settings.hide_folded_tabs"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.hideFoldedTabs"
      @input="toggleHideFoldedTabs")
    .separator
    toggle-field(
      label="settings.auto_fold_tabs"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.autoFoldTabs"
      @input="setOpt('autoFoldTabs', $event)")
    .separator
    toggle-field(
      label="settings.auto_exp_tabs"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.autoExpandTabs"
      @input="setOpt('autoExpandTabs', $event)")
    .separator
    toggle-field(
      label="settings.rm_folded_tabs"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.rmFoldedTabs"
      @input="setOpt('rmFoldedTabs', $event)")
    .separator
    toggle-field(
      label="settings.tabs_child_count"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.tabsChildCount"
      @input="setOpt('tabsChildCount', $event)")
    .separator
    toggle-field(
      label="settings.tabs_lvl_dots"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.tabsLvlDots"
      @input="setOpt('tabsLvlDots', $event)")

  section
    h2 {{t('settings.bookmarks_title')}}
    toggle-field(
      label="settings.bookmarks_panel"
      :value="$store.state.bookmarksPanel"
      @input="setOpt('bookmarksPanel', $event)")
    .separator
    toggle-field(
      label="settings.open_bookmark_new_tab"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.openBookmarkNewTab"
      @input="setOpt('openBookmarkNewTab', $event)")
    .separator
    toggle-field(
      label="settings.auto_close_bookmarks"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.autoCloseBookmarks"
      @input="setOpt('autoCloseBookmarks', $event)")
    .separator
    toggle-field(
      label="settings.auto_rm_other"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.autoRemoveOther"
      @input="setOpt('autoRemoveOther', $event)")
    .separator
    toggle-field(
      label="settings.highlight_open_bookmarks"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.highlightOpenBookmarks"
      @input="setOpt('highlightOpenBookmarks', $event)")
    .sub-fields
      .separator
      toggle-field(
        label="settings.activate_open_bookmark_tab"
        :inactive="!$store.state.bookmarksPanel || !$store.state.highlightOpenBookmarks"
        :value="$store.state.activateOpenBookmarkTab"
        @input="setOpt('activateOpenBookmarkTab', $event)")

  section
    h2 {{t('settings.appearance_title')}}
    select-field(
      label="settings.font_size"
      optLabel="settings.font_size_"
      :value="$store.state.fontSize"
      :opts="$store.state.fontSizeOpts"
      @input="setOpt('fontSize', $event)")
    .separator
    toggle-field(
      label="settings.animations"
      :value="$store.state.animations"
      @input="setOpt('animations', $event)")
    .separator
    toggle-field(
      label="settings.bg_noise"
      :value="$store.state.bgNoise"
      @input="setOpt('bgNoise', $event)")
    .separator
    select-field(
      label="settings.theme"
      optLabel="settings.theme_"
      :value="$store.state.theme"
      :opts="$store.state.themeOpts"
      @input="setOpt('theme', $event), reinitTheme()")
    .separator
    select-field(
      label="settings.switch_style"
      optLabel="settings.style_"
      :value="$store.state.style"
      :opts="$store.state.styleOpts"
      @input="setOpt('style', $event)")
    .separator
    .ctrls
      .btn(@click="switchView('styles-editor')") {{t('settings.edit_styles')}}

  section
    h2 {{t('settings.mouse_title')}}
    toggle-field(
      label="settings.h_scroll_through_panels"
      :value="$store.state.hScrollThroughPanels"
      @input="setOpt('hScrollThroughPanels', $event)")
    .separator
    select-field(
      label="settings.scroll_through_tabs"
      optLabel="settings.scroll_through_tabs_"
      :value="$store.state.scrollThroughTabs"
      :opts="$store.state.scrollThroughTabsOpts"
      @input="setOpt('scrollThroughTabs', $event)")
    .sub-fields
      .separator
      toggle-field(
        label="settings.scroll_through_visible_tabs"
        :value="$store.state.scrollThroughVisibleTabs"
        :inactive="!$store.state.tabsTree || $store.state.scrollThroughTabs === 'none'"
        @input="setOpt('scrollThroughVisibleTabs', $event)")
    .separator
    select-field(
      label="settings.tab_double_click"
      optLabel="settings.tab_action_"
      :value="$store.state.tabDoubleClick"
      :opts="$store.state.tabDoubleClickOpts"
      @input="setOpt('tabDoubleClick', $event)")
    .separator
    select-field(
      label="settings.tab_long_left_click"
      optLabel="settings.tab_action_"
      :value="$store.state.tabLongLeftClick"
      :opts="$store.state.tabLongLeftClickOpts"
      @input="setOpt('tabLongLeftClick', $event)")
    .separator
    select-field(
      label="settings.tab_long_right_click"
      optLabel="settings.tab_action_"
      :value="$store.state.tabLongRightClick"
      :opts="$store.state.tabLongRightClickOpts"
      @input="setOpt('tabLongRightClick', $event)")
    .separator
    select-field(
      label="settings.tabs_panel_left_click_action"
      optLabel="settings.tabs_panel_action_"
      :value="$store.state.tabsPanelLeftClickAction"
      :opts="$store.state.tabsPanelLeftClickActionOpts"
      @input="setOpt('tabsPanelLeftClickAction', $event)")
    .separator
    select-field(
      label="settings.tabs_panel_double_click_action"
      optLabel="settings.tabs_panel_action_"
      :inactive="$store.state.tabsPanelLeftClickAction !== 'none'"
      :value="$store.state.tabsPanelDoubleClickAction"
      :opts="$store.state.tabsPanelDoubleClickActionOpts"
      @input="setOpt('tabsPanelDoubleClickAction', $event)")
    .separator
    select-field(
      label="settings.tabs_panel_right_click_action"
      optLabel="settings.tabs_panel_action_"
      :value="$store.state.tabsPanelRightClickAction"
      :opts="$store.state.tabsPanelRightClickActionOpts"
      @input="setOpt('tabsPanelRightClickAction', $event)")

  section
    h2 {{t('settings.kb_title')}}
    .hm(v-for="(k, i) in $store.state.keybindings", :key="k.name")
      .keybinding(
        :is-focused="k.focus"
        @click="changeKeybinding(k, i)")
        .label {{t('settings.' + k.description)}}
        .value {{normalizeShortcut(k.shortcut)}}
        input(
          type="text"
          ref="keybindingInputs"
          tabindex="-1"
          @blur="onKBBlur(k, i)"
          @keydown.prevent.stop="onKBKey($event, k, i)"
          @keyup.prevent.stop="onKBKeyUp($event, k, i)")
      .separator
    .ctrls: .btn(@click="resetKeybindings") {{t('settings.reset_kb')}}

  section
    h2 {{t('settings.permissions_title')}}

    .permission(
      ref="allUrls"
      :data-highlight="$store.state.highlight.allUrls"
      @click="onHighlighClick('allUrls')")
      toggle-field(
        label="settings.all_urls_label"
        :inline="true"
        :value="$store.state.permAllUrls"
        @input="togglePermAllUrls")
      .box: .info {{t('settings.all_urls_info')}}

    .separator

    .permission(
      ref="tabHide"
      :data-highlight="$store.state.highlight.tabHide"
      @click="onHighlighClick('tabHide')")
      toggle-field(
        label="settings.tab_hide_label"
        :inline="true"
        :value="$store.state.permTabHide"
        @input="togglePermTabHide")
      .box: .info {{t('settings.tab_hide_info')}}

  section
    h2 {{t('settings.snapshots_title')}}
    num-field(
      label="settings.snap_interval"
      unitLabel="settings.snap_interval_"
      :value="$store.state.snapInterval"
      :or="'none'"
      :unit="$store.state.snapIntervalUnit"
      :unitOpts="$store.state.snapIntervalUnitOpts"
      @input="setOpt('snapInterval', $event[0]), setOpt('snapIntervalUnit', $event[1])")
    .separator
    .ctrls
      .btn(@click="switchView('snapshots')") {{t('settings.snapshots_view_label')}}
      //- .btn.-warn(@click="removeAllSnapshots") {{t('settings.rm_all_snapshots')}}

  //- section
  //-   h2 {{t('settings.favi_title')}}
  //-   info-field(
  //-     label="settings.cached_favics"
  //-     :value="faviCache"
  //-     @click="calcFaviCache")
  //-   .ctrls
  //-     .btn(@click="clearFaviCache(false)") {{t('settings.rm_unused_favi_cache')}}
  //-     .btn.-warn(@click="clearFaviCache(true)") {{t('settings.rm_favi_cache')}}

  section
    h2 {{t('settings.help_title')}}

    .ctrls
      .btn(@click="switchView('debug')") {{t('settings.debug_info')}}
      a.btn(tabindex="-1", :href="issueLink") {{t('settings.repo_bug')}}
      .btn.-warn(@click="resetSettings") {{t('settings.reset_settings')}}

  footer-section
</template>


<script>
import State from './store/state'
import Actions from './actions'
import ToggleField from '../components/toggle-field'
import SelectField from '../components/select-field'
import NumField from '../components/num-field'
import InfoField from '../components/info-field'
import FooterSection from './components/footer'

const VALID_SHORTCUT = /^((Ctrl|Alt|Command|MacCtrl)\+)((Shift|Alt)\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?((Shift|Alt)\+)?(F\d\d?)$/
const SPEC_KEYS = /^(Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|F\d\d?)$/
const ISSUE_URL = 'https://github.com/mbnuqw/sidebery/issues/new'

export default {
  components: {
    ToggleField,
    SelectField,
    NumField,
    InfoField,
    FooterSection,
  },

  data() {
    return {
      faviCache: null,
    }
  },

  computed: {
    activateAfterClosingNextOrPrev() {
      return State.activateAfterClosing === 'next' || State.activateAfterClosing === 'prev'
    },

    issueLink() {
      if (!State.osInfo || !State.ffInfo) return ISSUE_URL

      let body = `\n\n\n> OS: ${State.osInfo.os} ${State.osInfo.arch}  \n`
      body += `> Firefox: ${State.ffInfo.version}  \n`
      body += `> Extension: ${State.version}  \n`
      return ISSUE_URL + '?body=' + encodeURIComponent(body)
    }
  },

  mounted() {
    const allUrlsField = this.$refs.allUrls
    const allUrlsGetter = Object.getOwnPropertyDescriptor(State.highlight, 'allUrls').get
    const tabHideField = this.$refs.tabHide
    const tabHideGetter = Object.getOwnPropertyDescriptor(State.highlight, 'tabHide').get
    const scrollConf = { behavior: 'smooth', block: 'center' }
    this.$watch(allUrlsGetter, (val) => {
      if (val) allUrlsField.scrollIntoView(scrollConf)
    })
    this.$watch(tabHideGetter, (val) => {
      if (val) tabHideField.scrollIntoView(scrollConf)
    })

    // Force auto scroll
    State.highlight.allUrls = false
    State.highlight.tabHide = false
    setTimeout(Actions.updateActiveView, 13)
  },

  methods: {
    /**
     * Set new value of option and save settings
     */
    setOpt(key, val) {
      Actions.setSetting(key, val)
      Actions.saveSettings()
    },

    /**
     * Open page as a child
     */
    async openPage(name) {
      let url = browser.runtime.getURL(name + '.html')
      const tab = await browser.tabs.getCurrent()
      const conf = { url, windowId: State.windowId }
      if (tab) {
        conf.openerTabId = tab.id
        conf.index = tab.index + 1
      }
      browser.tabs.create(conf)
    },

    /**
     * Switch to view of settings page
     * 
     * @param {string} name - url hash
     */
    switchView(name) {
      location.hash = name
    },

    /**
     * Check permissions and toggle 'hideInact' value
     */
    toggleHideInact() {
      if (!State.hideInact && !State.permTabHide) {
        location.hash = 'tab-hide'
        return
      }

      this.setOpt('hideInact', !State.hideInact)
    },

    /**
     * Check permissions and toggle 'hideFoldedTabs' value
     */
    toggleHideFoldedTabs() {
      if (!State.hideFoldedTabs && !State.permTabHide) {
        location.hash = 'tab-hide'
        return
      }

      this.setOpt('hideFoldedTabs', !State.hideFoldedTabs)
    },

    /**
     * Open page of theme editor
     */
    openThemeEditor() {
      const url = browser.runtime.getURL('theme/theme.html')
      browser.tabs.create({ url, windowId: State.windowId })
    },

    /**
     * Open page of styles editor
     */
    openStylesEditor() {
      const url = browser.runtime.getURL('styles/styles.html')
      browser.tabs.create({ url, windowId: State.windowId })
    },

    /**
     * Start changing of keybingding
     */
    changeKeybinding(k, i) {
      this.$refs.keybindingInputs[i].focus()
      this.lastShortcut = State.keybindings[i]
      State.keybindings.splice(i, 1, { ...k, shortcut: 'Press new shortcut', focus: true })
    },

    /**
     * Normalize (system-wise) shortcut label
     */
    normalizeShortcut(s) {
      if (State.os === 'mac') {
        return s.replace('Command', '⌘').replace('MacCtrl', 'Ctrl')
      }
      if (State.os === 'win') return s.replace('Command', 'Win')
      if (State.os === 'linux') return s.replace('Command', 'Super')
      return s
    },

    /**
     * Handle keybinding blur
     */
    onKBBlur(k, i) {
      if (!this.lastShortcut) return

      State.keybindings.splice(i, 1, this.lastShortcut)
      this.lastShortcut = null
    },

    /**
     * Handle keydown on keybinding
     */
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
        Actions.updateKeybinding(k.name, shortcut)
        this.$refs.keybindingInputs[i].blur()
      }
    },

    /**
     * Handle keyup on keybinding
     */
    onKBKeyUp(e, k, i) {
      this.$refs.keybindingInputs[i].blur()
    },

    /**
     * Validate shortcut
     */
    checkShortcut(shortcut) {
      let exists = State.keybindings.find(k => k.shortcut === shortcut)
      return VALID_SHORTCUT.test(shortcut) && !exists
    },

    /**
     * Reset all keybindings
     */
    resetKeybindings() {
      Actions.resetKeybindings()
    },

    /**
     * Toggle allUrls permission
     */
    async togglePermAllUrls() {
      if (State.permAllUrls) {
        await browser.permissions.remove({ origins: ['<all_urls>'] })
        browser.runtime.sendMessage({ action: 'loadPermissions' })
        Actions.loadPermissions()
      } else {
        const request = { origins: ['<all_urls>'], permissions: [] }
        browser.permissions.request(request).then(allowed => {
          browser.runtime.sendMessage({ action: 'loadPermissions' })
          State.permAllUrls = allowed
        })
      }
    },

    /**
     * Toggle tabHide permission
     */
    async togglePermTabHide() {
      if (State.permTabHide) {
        await browser.runtime.sendMessage({ action: 'showAllTabs' })
        await browser.permissions.remove({ permissions: ['tabHide'] })
        browser.runtime.sendMessage({ action: 'loadPermissions' })
        Actions.loadPermissions()
      } else {
        const request = { origins: [], permissions: ['tabHide'] }
        browser.permissions.request(request).then(allowed => {
          browser.runtime.sendMessage({ action: 'loadPermissions' })
          State.permTabHide = allowed
        })
      }
    },

    /**
     * Toggle snapshots
     */
    toggleSnapshots(name) {
      const v = !State.snapshotsTargets[name]
      State.snapshotsTargets = { ...State.snapshotsTargets, [name]: v }
      Actions.saveSettings()
    },

    /**
     * Update snapshots viewer
     */
    async viewAllSnapshots() {
      let url = browser.runtime.getURL('snapshots/snapshots.html')
      const tab = await browser.tabs.getCurrent()
      const conf = { url, windowId: State.windowId }
      if (tab) {
        conf.openerTabId = tab.id
        conf.index = tab.index + 1
      }
      browser.tabs.create(conf)
    },

    /**
     * Remove snapshot
     */
    removeAllSnapshots() {
      browser.storage.local.set({ snapshots: [] })
    },

    /**
     * Open debug info page
     */
    async openDebugInfo() {
      let url = browser.runtime.getURL('debug/debug.html')
      const tab = await browser.tabs.getCurrent()
      const conf = { url, windowId: State.windowId }
      if (tab) {
        conf.openerTabId = tab.id
        conf.index = tab.index + 1
      }
      browser.tabs.create(conf)
    },

    /**
     * Reset settings
     */
    resetSettings() {
      Actions.resetSettings()
      Actions.saveSettings()
    },

    /**
     * Reinit theme
     */
    reinitTheme() {
      if (State.theme === 'none') return
      Actions.initTheme()
    },

    /**
     * Handle click on highlighed area
     */
    onHighlighClick(name) {
      if (State.highlight[name]) {
        history.replaceState({}, '', location.origin + location.pathname)
      }
      this.$set(State.highlight, name, false)
    },
  },
}
</script>
