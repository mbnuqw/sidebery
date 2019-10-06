<template lang="pug">
.Settings(
  v-noise:300.g:12:af.a:0:42.s:0:9=""
  @scroll.passive="onScroll")
  section(ref="settings_general")
    h2 {{t('settings.general_title')}}
    ToggleField.-first.-last(
      label="settings.native_scrollbars"
      :inline="true"
      :value="$store.state.nativeScrollbars"
      @input="setOpt('nativeScrollbars', $event)")

  section(ref="settings_menu")
    h2 {{t('settings.ctx_menu_title')}}
    ToggleField.-first(
      label="settings.ctx_menu_native"
      :inline="true"
      :value="$store.state.ctxMenuNative"
      @input="setOpt('ctxMenuNative', $event)")
    //- .separator
    select-field(
      label="settings.autoHide_ctx_menu"
      optLabel="settings.autoHide_ctx_menu_"
      :inactive="$store.state.ctxMenuNative"
      :value="$store.state.autoHideCtxMenu"
      :opts="$store.state.autoHideCtxMenuOpts"
      @input="setOpt('autoHideCtxMenu', $event)")
    //- .separator
    ToggleField.-last(
      label="settings.ctx_menu_render_inact"
      :inline="true"
      :value="$store.state.ctxMenuRenderInact"
      @input="setOpt('ctxMenuRenderInact', $event)")
    //- .separator
    .ctrls
      .btn(@click="switchView('menu_editor')") {{t('settings.ctx_menu_editor')}}

  section(ref="settings_nav")
    h2 {{t('settings.nav_title')}}
    toggle-field(
      label="settings.nav_bar_inline"
      :inline="true"
      :value="$store.state.navBarInline"
      @input="setOpt('navBarInline', $event)")
    //- .separator
    toggle-field(
      label="settings.hide_settings_btn"
      :inline="true"
      :value="$store.state.hideSettingsBtn"
      @input="setOpt('hideSettingsBtn', $event)")
    //- .separator
    toggle-field(
      label="settings.nav_btn_count"
      :inline="true"
      :value="$store.state.navBtnCount"
      @input="setOpt('navBtnCount', $event)")
    //- .separator
    toggle-field(
      label="settings.hide_empty_panels"
      :inline="true"
      :value="$store.state.hideEmptyPanels"
      @input="setOpt('hideEmptyPanels', $event)")
    //- .separator
    select-field(
      label="settings.nav_mid_click"
      optLabel="settings.nav_mid_click_"
      :value="$store.state.navMidClickAction"
      :opts="$store.state.navMidClickActionOpts"
      @input="setOpt('navMidClickAction', $event)")
    //- .separator
    toggle-field.-last(
      label="settings.nav_switch_panels_wheel"
      :inline="true"
      :value="$store.state.navSwitchPanelsWheel"
      @input="setOpt('navSwitchPanelsWheel', $event)")

  section(ref="settings_group")
    h2 {{t('settings.group_title')}}
    //- .separator
    select-field.-last(
      label="settings.group_layout"
      optLabel="settings.group_layout_"
      :value="$store.state.groupLayout"
      :opts="$store.state.groupLayoutOpts"
      @input="setOpt('groupLayout', $event)")

  section(ref="settings_panels")
    h2 {{t('settings.panels_title')}}
    transition-group(name="panel" tag="div"): .panel-card(
      v-for="(panel, i) in $store.state.panels"
      :key="panel.cookieStoreId || panel.type"
      :data-color="panel.color"
      :data-first="i === 0"
      :data-last="i === $store.state.panels.length - 1")
      .panel-card-body(@click="$store.state.selectedPanel = panel")
        .panel-card-icon: svg: use(:xlink:href="'#' + panel.icon")
        .panel-card-name {{panel.name}}
      .panel-card-ctrls
        .panel-card-ctrl.-down(
          :data-inactive="i === $store.state.panels.length - 1"
          @click="movePanel(panel, 1)")
          svg: use(xlink:href="#icon_expand")
        .panel-card-ctrl.-up(
          :data-inactive="i === 0"
          @click="movePanel(panel, -1)")
          svg: use(xlink:href="#icon_expand")
        .panel-card-ctrl.-rm(
          :data-inactive="panel.type === 'bookmarks' || panel.type === 'default'"
          @click="removePanel(panel)")
          svg: use(xlink:href="#icon_delete")
    .ctrls: .btn(@click="createPanel") Create panel
    transition(name="panel-config")
      .panel-config-layer(
        v-if="$store.state.selectedPanel"
        @click="$store.state.selectedPanel = null")
        .panel-config-box(@click.stop="")
          panel-config.dashboard(:conf="$store.state.selectedPanel")

  section(ref="settings_tabs")
    h2 {{t('settings.tabs_title')}}
    toggle-field(
      label="settings.activate_last_tab_on_panel_switching"
      :inline="true"
      :value="$store.state.activateLastTabOnPanelSwitching"
      @input="setOpt('activateLastTabOnPanelSwitching', $event)")
    //- .separator
    toggle-field(
      label="settings.skip_empty_panels"
      :inline="true"
      :value="$store.state.skipEmptyPanels"
      @input="setOpt('skipEmptyPanels', $event)")
    //- .separator
    toggle-field(
      label="settings.show_tab_rm_btn"
      :inline="true"
      :value="$store.state.showTabRmBtn"
      @input="setOpt('showTabRmBtn', $event)")
    //- .separator
    toggle-field(
      label="settings.hide_inactive_panel_tabs"
      :inline="true"
      :value="$store.state.hideInact"
      @input="toggleHideInact")
    //- .separator
    select-field(
      label="settings.activate_after_closing"
      optLabel="settings.activate_after_closing_"
      :value="$store.state.activateAfterClosing"
      :opts="$store.state.activateAfterClosingOpts"
      @input="setOpt('activateAfterClosing', $event)")
    .sub-fields
      //- .separator
      select-field(
        label="settings.activate_after_closing_prev_rule"
        optLabel="settings.activate_after_closing_rule_"
        :value="$store.state.activateAfterClosingPrevRule"
        :inactive="!activateAfterClosingNextOrPrev"
        :opts="$store.state.activateAfterClosingPrevRuleOpts"
        @input="setOpt('activateAfterClosingPrevRule', $event)")
      //- .separator
      select-field.-last(
        label="settings.activate_after_closing_next_rule"
        optLabel="settings.activate_after_closing_rule_"
        :value="$store.state.activateAfterClosingNextRule"
        :inactive="!activateAfterClosingNextOrPrev"
        :opts="$store.state.activateAfterClosingNextRuleOpts"
        @input="setOpt('activateAfterClosingNextRule', $event)")

  section(ref="settings_pinned_tabs")
    h2 {{t('settings.pinned_tabs_title')}}
    select-field(
      label="settings.pinned_tabs_position"
      optLabel="settings.pinned_tabs_position_"
      :value="$store.state.pinnedTabsPosition"
      :opts="$store.state.pinnedTabsPositionOpts"
      @input="setOpt('pinnedTabsPosition', $event)")
    //- .separator
    toggle-field.-last(
      label="settings.pinned_tabs_list"
      :inline="true"
      :inactive="$store.state.pinnedTabsPosition !== 'panel'"
      :value="$store.state.pinnedTabsList"
      @input="setOpt('pinnedTabsList', $event)")

  section(ref="settings_tabs_tree")
    h2 {{t('settings.tabs_tree_title')}}
    toggle-field(i
      label="settings.tabs_tree_layout"
      :inline="true"
      :value="$store.state.tabsTree"
      @input="setOpt('tabsTree', $event)")
    //- .separator
    toggle-field(
      label="settings.group_on_open_layout"
      :inline="true"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.groupOnOpen"
      @input="setOpt('groupOnOpen', $event)")
    //- .separator
    select-field(
      label="settings.tabs_tree_limit"
      optLabel="settings.tabs_tree_limit_"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.tabsTreeLimit"
      :opts="$store.state.tabsTreeLimitOpts"
      @input="setOpt('tabsTreeLimit', $event)")
    //- .separator
    toggle-field(
      label="settings.hide_folded_tabs"
      :inline="true"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.hideFoldedTabs"
      @input="toggleHideFoldedTabs")
    //- .separator
    toggle-field(
      label="settings.auto_fold_tabs"
      :inline="true"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.autoFoldTabs"
      @input="setOpt('autoFoldTabs', $event)")
    //- .separator
    toggle-field(
      label="settings.auto_exp_tabs"
      :inline="true"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.autoExpandTabs"
      @input="setOpt('autoExpandTabs', $event)")
    //- .separator
    select-field(
      label="settings.rm_child_tabs"
      optLabel="settings.rm_child_tabs_"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.rmChildTabs"
      :opts="$store.state.rmChildTabsOpts"
      @input="setOpt('rmChildTabs', $event)")
    //- .separator
    toggle-field(
      label="settings.tabs_child_count"
      :inline="true"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.tabsChildCount"
      @input="setOpt('tabsChildCount', $event)")
    //- .separator
    toggle-field(
      label="settings.tabs_lvl_dots"
      :inline="true"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.tabsLvlDots"
      @input="setOpt('tabsLvlDots', $event)")
    //- .separator
    toggle-field(
      label="settings.discard_folded"
      :inline="true"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.discardFolded"
      @input="setOpt('discardFolded', $event)")
    .sub-fields
      //- .separator
      num-field.-last(
        label="settings.discard_folded_delay"
        unitLabel="settings.discard_folded_delay_"
        :inactive="!$store.state.tabsTree || !$store.state.discardFolded"
        :value="$store.state.discardFoldedDelay"
        :or="0"
        :unit="$store.state.discardFoldedDelayUnit"
        :unitOpts="$store.state.discardFoldedDelayUnitOpts"
        @input="setOpt('discardFoldedDelay', $event[0]), setOpt('discardFoldedDelayUnit', $event[1])")

  section(ref="settings_bookmarks")
    h2 {{t('settings.bookmarks_title')}}
    toggle-field(
      label="settings.bookmarks_panel"
      :inline="true"
      :value="$store.state.bookmarksPanel"
      @input="setOpt('bookmarksPanel', $event)")
    //- .separator
    toggle-field(
      label="settings.open_bookmark_new_tab"
      :inline="true"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.openBookmarkNewTab"
      @input="setOpt('openBookmarkNewTab', $event)")
    //- .separator
    toggle-field(
      label="settings.auto_close_bookmarks"
      :inline="true"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.autoCloseBookmarks"
      @input="setOpt('autoCloseBookmarks', $event)")
    //- .separator
    toggle-field(
      label="settings.auto_rm_other"
      :inline="true"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.autoRemoveOther"
      @input="setOpt('autoRemoveOther', $event)")
    //- .separator
    toggle-field(
      label="settings.show_bookmark_len"
      :inline="true"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.showBookmarkLen"
      @input="setOpt('showBookmarkLen', $event)")
    //- .separator
    toggle-field(
      label="settings.highlight_open_bookmarks"
      :inline="true"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.highlightOpenBookmarks"
      @input="setOpt('highlightOpenBookmarks', $event)")
    .sub-fields
      //- .separator
      toggle-field.-last(
        label="settings.activate_open_bookmark_tab"
        :inline="true"
        :inactive="!$store.state.bookmarksPanel || !$store.state.highlightOpenBookmarks"
        :value="$store.state.activateOpenBookmarkTab"
        @input="setOpt('activateOpenBookmarkTab', $event)")

  section(ref="settings_appearance")
    h2 {{t('settings.appearance_title')}}
    select-field(
      label="settings.font_size"
      optLabel="settings.font_size_"
      :value="$store.state.fontSize"
      :opts="$store.state.fontSizeOpts"
      @input="setOpt('fontSize', $event)")
    //- .separator
    toggle-field(
      label="settings.animations"
      :inline="true"
      :value="$store.state.animations"
      @input="setOpt('animations', $event)")
    //- .separator
    toggle-field(
      label="settings.bg_noise"
      :inline="true"
      :value="$store.state.bgNoise"
      @input="setOpt('bgNoise', $event)")
    //- .separator
    select-field(
      label="settings.theme"
      optLabel="settings.theme_"
      :value="$store.state.theme"
      :opts="$store.state.themeOpts"
      @input="setOpt('theme', $event)")
    //- .separator
    select-field.-last(
      label="settings.switch_style"
      optLabel="settings.style_"
      :value="$store.state.style"
      :opts="$store.state.styleOpts"
      @input="setOpt('style', $event)")
    //- .separator
    .ctrls
      .btn(@click="switchView('styles_editor')") {{t('settings.edit_styles')}}

  section(ref="settings_mouse")
    h2 {{t('settings.mouse_title')}}
    toggle-field(
      label="settings.h_scroll_through_panels"
      :inline="true"
      :value="$store.state.hScrollThroughPanels"
      @input="setOpt('hScrollThroughPanels', $event)")
    //- .separator
    select-field(
      label="settings.scroll_through_tabs"
      optLabel="settings.scroll_through_tabs_"
      :value="$store.state.scrollThroughTabs"
      :opts="$store.state.scrollThroughTabsOpts"
      @input="setOpt('scrollThroughTabs', $event)")
    .sub-fields
      //- .separator
      toggle-field(
        label="settings.scroll_through_visible_tabs"
        :inline="true"
        :value="$store.state.scrollThroughVisibleTabs"
        :inactive="!$store.state.tabsTree || $store.state.scrollThroughTabs === 'none'"
        @input="setOpt('scrollThroughVisibleTabs', $event)")
      //- .separator
      toggle-field(
        label="settings.scroll_through_tabs_except_overflow"
        :inline="true"
        :value="$store.state.scrollThroughTabsExceptOverflow"
        :inactive="$store.state.scrollThroughTabs === 'none'"
        @input="setOpt('scrollThroughTabsExceptOverflow', $event)")
    //- .separator
    select-field(
      label="settings.tab_double_click"
      optLabel="settings.tab_action_"
      :value="$store.state.tabDoubleClick"
      :opts="$store.state.tabDoubleClickOpts"
      @input="setOpt('tabDoubleClick', $event)")
    //- .separator
    select-field(
      label="settings.tab_long_left_click"
      optLabel="settings.tab_action_"
      :value="$store.state.tabLongLeftClick"
      :opts="$store.state.tabLongLeftClickOpts"
      @input="setOpt('tabLongLeftClick', $event)")
    //- .separator
    select-field(
      label="settings.tab_long_right_click"
      optLabel="settings.tab_action_"
      :value="$store.state.tabLongRightClick"
      :opts="$store.state.tabLongRightClickOpts"
      @input="setOpt('tabLongRightClick', $event)")
    //- .separator
    select-field(
      label="settings.tabs_panel_left_click_action"
      optLabel="settings.tabs_panel_action_"
      :value="$store.state.tabsPanelLeftClickAction"
      :opts="$store.state.tabsPanelLeftClickActionOpts"
      @input="setOpt('tabsPanelLeftClickAction', $event)")
    //- .separator
    select-field(
      label="settings.tabs_panel_double_click_action"
      optLabel="settings.tabs_panel_action_"
      :inactive="$store.state.tabsPanelLeftClickAction !== 'none'"
      :value="$store.state.tabsPanelDoubleClickAction"
      :opts="$store.state.tabsPanelDoubleClickActionOpts"
      @input="setOpt('tabsPanelDoubleClickAction', $event)")
    //- .separator
    select-field.-last(
      label="settings.tabs_panel_right_click_action"
      optLabel="settings.tabs_panel_action_"
      :value="$store.state.tabsPanelRightClickAction"
      :opts="$store.state.tabsPanelRightClickActionOpts"
      @input="setOpt('tabsPanelRightClickAction', $event)")

  section(ref="settings_keybindings")
    h2 {{t('settings.kb_title')}}
    .keybinding(
      v-for="(k, i) in $store.state.keybindings", :key="k.name"
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
    .ctrls: .btn(@click="resetKeybindings") {{t('settings.reset_kb')}}

  section(ref="settings_permissions")
    h2 {{t('settings.permissions_title')}}

    .permission(
      ref="all_urls"
      :data-highlight="$store.state.highlightedField === 'all_urls'"
      @click="onHighlighClick('all_urls')")
      toggle-field(
        label="settings.all_urls_label"
        :inline="true"
        :value="$store.state.permAllUrls"
        :note="t('settings.all_urls_info')"
        @input="togglePermAllUrls")

    .permission(
      ref="tab_hide"
      :data-highlight="$store.state.highlightedField === 'tab_hide'"
      @click="onHighlighClick('tab_hide')")
      toggle-field(
        label="settings.tab_hide_label"
        :inline="true"
        :value="$store.state.permTabHide"
        :note="t('settings.tab_hide_info')"
        @input="togglePermTabHide")

  section(ref="settings_snapshots")
    h2 {{t('settings.snapshots_title')}}
    num-field(
      label="settings.snap_interval"
      unitLabel="settings.snap_interval_"
      :value="$store.state.snapInterval"
      :or="'none'"
      :unit="$store.state.snapIntervalUnit"
      :unitOpts="$store.state.snapIntervalUnitOpts"
      @input="setOpt('snapInterval', $event[0]), setOpt('snapIntervalUnit', $event[1])")
    //- .separator
    num-field(
      label="settings.snap_limit"
      unitLabel="settings.snap_limit_"
      :value="$store.state.snapLimit"
      :or="'none'"
      :unit="$store.state.snapLimitUnit"
      :unitOpts="$store.state.snapLimitUnitOpts"
      @input="setOpt('snapLimit', $event[0]), setOpt('snapLimitUnit', $event[1])")
    //- .separator
    .ctrls
      .btn(@click="switchView('snapshots')") {{t('settings.snapshots_view_label')}}

  section(ref="settings_storage")
    h2 {{t('settings.storage_title')}} (~{{storageOveral}})
    .storage-section
      .storage-prop(v-for="info in storedProps")
        .name {{info.name}}
        .size ~{{info.sizeStr}}
        .del-btn(@click="deleteStoredData(info.name)") {{t('settings.storage_delete_prop')}}
        .open-btn(@click="openStoredData(info.name)") {{t('settings.storage_open_prop')}}
    .ctrls
      .btn(@click="calcStorageInfo") {{t('settings.update_storage_info')}}

  section(ref="settings_help")
    h2 {{t('settings.help_title')}}

    .ctrls
      a.btn(ref="exportData" @mouseenter="genExportData") {{t('settings.help_exp_data')}}
      .btn(type="file")
        .label {{t('settings.help_imp_data')}}
        input(type="file" ref="importData" accept="application/json" @input="importData")

    .ctrls
      .btn(@click="showDbgDetails") {{t('settings.debug_info')}}
      a.btn(
        tabindex="-1"
        href="https://github.com/mbnuqw/sidebery/issues/new/choose") {{t('settings.repo_bug')}}
      .btn.-warn(@click="resetSettings") {{t('settings.reset_settings')}}

    //- .separator

    .ctrls
      .info(v-if="$store.state.osInfo") OS: {{$store.state.osInfo.os}}
      .info(v-if="$store.state.ffInfo") Firefox: {{$store.state.ffInfo.version}}
      .info Addon: {{$store.state.version}}

  .details-box(
    v-if="dbgDetails"
    v-noise:300.g:12:af.a:0:42.s:0:9=""
    @scroll.stop="")
    .box
      .btn(@click="copyDebugDetail") {{t('settings.ctrl_copy')}}
      .btn.-warn(@click="dbgDetails = ''") {{t('settings.ctrl_close')}}
    .json {{dbgDetails}}

  footer-section
</template>


<script>
import Utils from '../utils'
import { translate } from '../mixins/dict'
import { DEFAULT_SETTINGS } from '../defaults'
import { DEFAULT_CTX_TABS_PANEL } from '../defaults'
import State from './store/state'
import Actions from './actions'
import ToggleField from '../components/toggle-field'
import SelectField from '../components/select-field'
import NumField from '../components/num-field'
import PanelConfig from './components/panel-config'
import FooterSection from './components/footer'

const VALID_SHORTCUT = /^((Ctrl|Alt|Command|MacCtrl)\+)((Shift|Alt)\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?((Shift|Alt)\+)?(F\d\d?)$/
const SPEC_KEYS = /^(Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|F\d\d?)$/
const SECTIONS = [
  'settings_general',
  'settings_menu',
  'settings_nav',
  'settings_group',
  'settings_panels',
  'settings_tabs',
  'settings_pinned_tabs',
  'settings_tabs_tree',
  'settings_bookmarks',
  'settings_appearance',
  'settings_mouse',
  'settings_keybindings',
  'settings_permissions',
  'settings_snapshots',
  'settings_storage',
  'settings_help',
]

export default {
  components: {
    ToggleField,
    SelectField,
    NumField,
    FooterSection,
    PanelConfig,
  },

  data() {
    return {
      dbgDetails: '',
      scrollY: 0,
      faviCache: null,
      winCount: 0,
      ctrCount: 0,
      tabsCount: 0,
      storageSize: 0,
      storedProps: [],
      storageOveral: '-',
    }
  },

  computed: {
    activateAfterClosingNextOrPrev() {
      return State.activateAfterClosing === 'next' || State.activateAfterClosing === 'prev'
    },
  },

  mounted() {
    State.settingsRefs = this.$refs
    this.calcStorageInfo()
  },

  activated() {
    if (this.scrollY) this.$el.scrollTop = this.scrollY
  },

  methods: {
    /**
     * Handle scroll event
     */
    onScroll(e) {
      this.scrollY = e.target.scrollTop

      if (State.navLock) return

      for (let name, i = SECTIONS.length; i--;) {
        name = SECTIONS[i]
        if (!this.$refs[name]) break

        if (e.target.scrollTop >= this.$refs[name].offsetTop - 8) {
          State.activeSection = name
          break
        }
      }
    },

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
     * Reset settings
     */
    resetSettings() {
      Actions.resetSettings()
      Actions.saveSettings()
    },

    /**
     * Handle click on highlighed area
     */
    onHighlighClick(name) {
      if (State.highlightedField === name) {
        history.replaceState({}, '', location.origin + location.pathname)
      }
      State.highlightedField = ''
    },

    /**
     * Generate export addon data
     */
    async genExportData() {
      let data = await browser.storage.local.get({
        settings: {},
        snapshots: [],
        panels: [],
        cssVars: {},
        sidebarCSS: '',
        groupCSS: '',
        settingsCSS: '',
        tabsMenu: [],
        bookmarksMenu: [],
      })
      data.ver = browser.runtime.getManifest().version
      let dataJSON = JSON.stringify(data)
      let file = new Blob([dataJSON], { type: 'application/json' })
      let now = Date.now()
      let date = Utils.uDate(now, '.')
      let time = Utils.uTime(now, '.')

      this.$refs.exportData.href = URL.createObjectURL(file)
      this.$refs.exportData.download = `sidebery-data-${date}-${time}.json`
      this.$refs.exportData.title = `sidebery-data-${date}-${time}.json`
    },

    /**
     * Import addon data
     */
    importData(importEvent) {
      let file = importEvent.target.files[0]
      let reader = new FileReader()
      reader.onload = fileEvent => {
        this.applyImportedData(fileEvent.target.result)
      }
      reader.readAsText(file)
    },

    /**
     * Parse imported data
     */
    applyImportedData(dataJSON) {
      let data = JSON.parse(dataJSON)

      // ...check version and do format convertation if needed

      let toStore = {}
      if (data.settings) toStore.settings = data.settings
      if (data.snapshots) toStore.snapshots = data.snapshots
      if (data.panels) toStore.panels = data.panels
      if (data.cssVars) toStore.cssVars = data.cssVars
      if (data.sidebarCSS) toStore.sidebarCSS = data.sidebarCSS
      if (data.groupCSS) toStore.groupCSS = data.groupCSS
      if (data.settingsCSS) toStore.settingsCSS = data.settingsCSS
      if (data.tabsMenu) toStore.tabsMenu = data.tabsMenu
      if (data.bookmarksMenu) toStore.bookmarksMenu = data.bookmarksMenu
      browser.storage.local.set(toStore)
    },

    /**
     * Show debug details
     */
    async showDbgDetails() {
      let dbg = {}

      dbg.settings = {}
      for (let prop of Object.keys(DEFAULT_SETTINGS)) {
        dbg.settings[prop] = State[prop]
      }

      try {
        dbg.permissions = {
          allUrls: State.permAllUrls,
          tabHide: State.permTabHide,
          actualAllUrls: await browser.permissions.contains({ origins: ['<all_urls>'] }),
          actualTabHide: await browser.permissions.contains({ permissions: ['tabHide'] }),
        }
      } catch (err) {
        dbg.permissions = err.toString()
      }

      try {
        let stored = await browser.storage.local.get()
        dbg.storage = {
          size: Utils.strSize(JSON.stringify(stored)),
          props: {},
        }
        for (let prop of Object.keys(stored)) {
          dbg.storage.props[prop] = Utils.strSize(JSON.stringify(stored[prop]))
        }
      } catch (err) {
        dbg.storage = err.toString()
      }

      try {
        let { panels } = await browser.storage.local.get('panels')
        dbg.panels = []
        for (let panel of panels) {
          let clone = Utils.cloneObject(panel)
          if (clone.name) clone.name = clone.name.length
          if (clone.icon) clone.icon = '...'
          if (clone.color) clone.color = '...'
          if (clone.includeHosts) clone.includeHosts = clone.includeHosts.length
          if (clone.excludeHosts) clone.excludeHosts = clone.excludeHosts.length
          if (clone.proxy) clone.proxy = '...'
          dbg.panels.push(clone)
        }
      } catch (err) {
        dbg.panels = err.toString()
      }

      try {
        let { cssVars } = await browser.storage.local.get('cssVars')
        dbg.cssVars = {}
        for (let prop of Object.keys(cssVars)) {
          if (cssVars[prop]) dbg.cssVars[prop] = cssVars[prop]
        }
      } catch (err) {
        dbg.cssVars = err.toString()
      }

      try {
        let { sidebarCSS, groupCSS } = await browser.storage.local.get(['sidebarCSS', 'groupCSS'])
        dbg.sidebarCSSLen = sidebarCSS.length
        dbg.groupCSSLen = groupCSS.length
      } catch (err) {
        // nothing...
      }

      try {
        let windows = await browser.windows.getAll({ populate: true })
        dbg.windows = []
        for (let w of windows) {
          dbg.windows.push({
            state: w.state,
            incognito: w.incognito,
            tabsCount: w.tabs.length,
            logs: await browser.runtime.sendMessage({
              windowId: w.id,
              action: 'getLogs',
            }),
          })
        }
      } catch (err) {
        dbg.windows = err.toString()
      }

      try {
        let ans = await browser.storage.local.get(['tabsMenu', 'bookmarksMenu'])
        dbg.tabsMenu = ans.tabsMenu
        dbg.bookmarksMenu = ans.bookmarksMenu
      } catch (err) {
        dbg.tabsMenu = err.toString()
        dbg.bookmarksMenu = err.toString()
      }

      try {
        let bookmarks = await browser.bookmarks.getTree()
        let bookmarksCount = 0
        let foldersCount = 0
        let separatorsCount = 0
        let lvl = 0,
          maxDepth = 0
        let walker = nodes => {
          if (lvl > maxDepth) maxDepth = lvl
          for (let node of nodes) {
            if (node.type === 'bookmark') bookmarksCount++
            if (node.type === 'folder') foldersCount++
            if (node.type === 'separator') separatorsCount++
            if (node.children) {
              lvl++
              walker(node.children)
              lvl--
            }
          }
        }
        walker(bookmarks[0].children)

        dbg.bookmarks = {
          bookmarksCount,
          foldersCount,
          separatorsCount,
          maxDepth,
        }
      } catch (err) {
        dbg.bookmarks = err.toString()
      }

      this.dbgDetails = JSON.stringify(dbg, null, 2)
    },

    /**
     * Copy debug info
     */
    copyDebugDetail() {
      if (!this.dbgDetails) return
      navigator.clipboard.writeText(this.dbgDetails)
    },

    /**
     * Calculate storage info
     */
    async calcStorageInfo() {
      let stored
      try {
        stored = await browser.storage.local.get()
      } catch (err) {
        return
      }

      this.storageOveral = Utils.strSize(JSON.stringify(stored))
      this.storedProps = Object.keys(stored)
        .map(key => {
          let value = stored[key]
          let size = new Blob([JSON.stringify(value)]).size
          return {
            name: key,
            size,
            sizeStr: Utils.strSize(JSON.stringify(value)),
          }
        })
        .sort((a, b) => b.size - a.size)
    },

    /**
     * Show stored data
     */
    async openStoredData(prop) {
      let ans = await browser.storage.local.get(prop)
      if (ans && ans[prop] !== undefined) {
        this.dbgDetails = JSON.stringify(ans[prop], null, 2)
      }
    },

    /**
     * Delete stored data
     */
    async deleteStoredData(prop) {
      if (window.confirm(translate('settings.storage_delete_confirm') + `"${prop}"?`)) {
        await browser.storage.local.remove(prop)
        browser.runtime.reload()
      }
    },

    /**
     * Remove panel
     */
    async removePanel(panel) {
      if (!panel || !panel.name) return
      if (panel.type !== 'ctx') return

      let preMsg = translate('settings.panel_remove_confirm_1')
      let postMsg = translate('settings.panel_remove_confirm_2')
      if (window.confirm(preMsg + panel.name + postMsg)) {
        if (panel.cookieStoreId) {
          await browser.contextualIdentities.remove(panel.cookieStoreId)
        }
        let index = State.panels.findIndex(p => {
          return p.cookieStoreId === panel.cookieStoreId
        })
        if (index > -1) State.panels.splice(index, 1)
      }
    },

    /**
     * Move panel
     */
    movePanel(panel, dir) {
      Actions.movePanel(panel.cookieStoreId || panel.id, dir)
    },

    /**
     * Create panel-container
     */
    async createPanel() {
      const details = {
        name: 'New Panel ' + (State.panels.length - 1),
        color: 'blue',
        icon: 'fingerprint',
      }
      let container = await browser.contextualIdentities.create(details)
      State.panels.push({
        ...DEFAULT_CTX_TABS_PANEL,
        ...container,
        id: container.cookieStoreId,
        cookieStoreId: container.cookieStoreId,
        name: container.name,
        icon: container.icon,
        color: container.color,
      })

      State.selectedPanel = State.panels[State.panels.length - 1]
    },
  },
}
</script>
