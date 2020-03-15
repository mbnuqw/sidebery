<template lang="pug">
.Settings(@scroll.passive="onScroll")
  section(ref="settings_general")
    h2 {{t('settings.general_title')}}
    toggle-field(
      label="settings.native_scrollbars"
      :value="$store.state.nativeScrollbars"
      @input="setOpt('nativeScrollbars', $event)")

  section(ref="settings_menu")
    h2 {{t('settings.ctx_menu_title')}}
    toggle-field(
      label="settings.ctx_menu_native"
      :value="$store.state.ctxMenuNative"
      @input="setOpt('ctxMenuNative', $event)")
    select-field(
      label="settings.autoHide_ctx_menu"
      optLabel="settings.autoHide_ctx_menu_"
      :inactive="$store.state.ctxMenuNative"
      :value="$store.state.autoHideCtxMenu"
      :opts="$store.state.autoHideCtxMenuOpts"
      @input="setOpt('autoHideCtxMenu', $event)")
    toggle-field(
      label="settings.ctx_menu_render_inact"
      :value="$store.state.ctxMenuRenderInact"
      @input="setOpt('ctxMenuRenderInact', $event)")
    .ctrls
      .btn(@click="switchView('menu_editor')") {{t('settings.ctx_menu_editor')}}

  section(ref="settings_nav")
    h2 {{t('settings.nav_title')}}
    select-field(
      label="settings.nav_bar_layout"
      optLabel="settings.nav_bar_layout_"
      :value="$store.state.navBarLayout"
      :opts="$store.state.navBarLayoutOpts"
      @input="switchNavBarLayout")
    .sub-fields
      toggle-field(
        label="settings.nav_bar_inline"
        :inactive="$store.state.navBarLayout === 'vertical'"
        :value="$store.state.navBarInline"
        @input="setOpt('navBarInline', $event)")
    toggle-field(
      label="settings.hide_add_btn"
      :value="$store.state.hideAddBtn"
      @input="setOpt('hideAddBtn', $event)")
    toggle-field(
      label="settings.hide_settings_btn"
      :value="$store.state.hideSettingsBtn"
      @input="setOpt('hideSettingsBtn', $event)")
    toggle-field(
      label="settings.nav_btn_count"
      :value="$store.state.navBtnCount"
      @input="setOpt('navBtnCount', $event)")
    toggle-field(
      label="settings.hide_empty_panels"
      :value="$store.state.hideEmptyPanels"
      @input="setOpt('hideEmptyPanels', $event)")
    select-field(
      label="settings.nav_mid_click"
      optLabel="settings.nav_mid_click_"
      :value="$store.state.navMidClickAction"
      :opts="$store.state.navMidClickActionOpts"
      @input="setOpt('navMidClickAction', $event)")
    toggle-field.-last(
      label="settings.nav_switch_panels_wheel"
      :value="$store.state.navSwitchPanelsWheel"
      @input="setOpt('navSwitchPanelsWheel', $event)")

  section(ref="settings_group")
    h2 {{t('settings.group_title')}}
    select-field.-last(
      label="settings.group_layout"
      optLabel="settings.group_layout_"
      :value="$store.state.groupLayout"
      :opts="$store.state.groupLayoutOpts"
      @input="setOpt('groupLayout', $event)")

  section(ref="settings_containers")
    h2 {{t('settings.containers_title')}}
    transition-group(name="panel" tag="div"): .panel-card(
      v-for="(container, id) in $store.state.containers"
      :key="container.id"
      :data-color="container.color")
      .panel-card-body(@click="$store.state.selectedContainer = container")
        .panel-card-icon: svg: use(:xlink:href="'#' + container.icon")
        .panel-card-name {{container.name}}
      .panel-card-ctrls
        .panel-card-ctrl.-rm(
          @click="removeContainer(container)")
          svg: use(xlink:href="#icon_remove")
    .panel-placeholder(v-if="!Object.keys($store.state.containers).length")
    .ctrls: .btn(@click="createContainer") {{t('settings.containers_create_btn')}}
    transition(name="panel-config")
      .panel-config-layer(
        v-if="$store.state.selectedContainer"
        @click="$store.state.selectedContainer = null")
        .panel-config-box(@click.stop="")
          container-config.dashboard(:conf="$store.state.selectedContainer")

  section(ref="settings_panels")
    h2 {{t('settings.panels_title')}}
    transition-group(name="panel" tag="div"): .panel-card(
      v-for="(panel, i) in $store.state.panels"
      :key="panel.id"
      :data-color="panel.color"
      :data-first="i === 0"
      :data-last="i === $store.state.panels.length - 1")
      .panel-card-body(@click="$store.state.selectedPanel = panel")
        .panel-card-icon
          img(v-if="panel.customIcon" :src="panel.customIcon")
          svg(v-else): use(:xlink:href="'#' + panel.icon")
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
          svg: use(xlink:href="#icon_remove")
    .ctrls: .btn(@click="createPanel") {{t('settings.panels_create_btn')}}
    transition(name="panel-config")
      .panel-config-layer(
        v-if="$store.state.selectedPanel"
        @click="$store.state.selectedPanel = null")
        .panel-config-box(@click.stop="")
          panel-config.dashboard(:conf="$store.state.selectedPanel")

  section(ref="settings_dnd")
    h2 {{t('settings.dnd_title')}}
    toggle-field(
      label="settings.dnd_tab_act"
      :value="$store.state.dndTabAct"
      @input="setOpt('dndTabAct', $event)")
    .sub-fields.-nosep
      num-field.-inline(
        label="settings.dnd_tab_act_delay"
        :inactive="!$store.state.dndTabAct"
        :value="$store.state.dndTabActDelay"
        :or="0"
        @input="setOpt('dndTabActDelay', $event[0])")
      select-field(
        label="settings.dnd_mod"
        optLabel="settings.dnd_mod_"
        :inactive="!$store.state.dndTabAct"
        :value="$store.state.dndTabActMod"
        :opts="$store.state.dndTabActModOpts"
        @input="setOpt('dndTabActMod', $event)")
    select-field(
      label="settings.dnd_exp"
      optLabel="settings.dnd_exp_"
      :value="$store.state.dndExp"
      :opts="$store.state.dndExpOpts"
      @input="setOpt('dndExp', $event)")
    .sub-fields.-nosep
      num-field.-inline(
        label="settings.dnd_exp_delay"
        :inactive="$store.state.dndExp === 'none'"
        :value="$store.state.dndExpDelay"
        :or="0"
        @input="setOpt('dndExpDelay', $event[0])")
      select-field(
        label="settings.dnd_mod"
        optLabel="settings.dnd_mod_"
        :inactive="$store.state.dndExp === 'none'"
        :value="$store.state.dndExpMod"
        :opts="$store.state.dndExpModOpts"
        @input="setOpt('dndExpMod', $event)")

  section(ref="settings_tabs")
    h2 {{t('settings.tabs_title')}}
    select-field(
      label="settings.state_storage"
      optLabel="settings.state_storage_"
      :note="t('settings.state_storage_desc')"
      :value="$store.state.stateStorage"
      :opts="$store.state.stateStorageOpts"
      @input="setOpt('stateStorage', $event)")
    select-field(
      label="settings.warn_on_multi_tab_close"
      optLabel="settings.warn_on_multi_tab_close_"
      :value="$store.state.warnOnMultiTabClose"
      :opts="$store.state.warnOnMultiTabCloseOpts"
      @input="setOpt('warnOnMultiTabClose', $event)")
    toggle-field(
      label="settings.tabs_rm_undo_note"
      :value="$store.state.tabsRmUndoNote"
      @input="setOpt('tabsRmUndoNote', $event)")
    toggle-field(
      label="settings.activate_on_mouseup"
      :value="$store.state.activateOnMouseUp"
      @input="setOpt('activateOnMouseUp', $event)")
    toggle-field(
      label="settings.activate_last_tab_on_panel_switching"
      :value="$store.state.activateLastTabOnPanelSwitching"
      @input="setOpt('activateLastTabOnPanelSwitching', $event)")
    toggle-field(
      label="settings.skip_empty_panels"
      :value="$store.state.skipEmptyPanels"
      @input="setOpt('skipEmptyPanels', $event)")
    toggle-field(
      label="settings.show_tab_rm_btn"
      :value="$store.state.showTabRmBtn"
      @input="setOpt('showTabRmBtn', $event)")
    toggle-field(
      label="settings.show_tab_ctx"
      :value="$store.state.showTabCtx"
      @input="setOpt('showTabCtx', $event)")
    toggle-field(
      label="settings.hide_inactive_panel_tabs"
      :value="$store.state.hideInact"
      @input="toggleHideInact")
    select-field(
      label="settings.activate_after_closing"
      optLabel="settings.activate_after_closing_"
      :value="$store.state.activateAfterClosing"
      :opts="$store.state.activateAfterClosingOpts"
      @input="setOpt('activateAfterClosing', $event)")
    .sub-fields
      select-field(
        label="settings.activate_after_closing_prev_rule"
        optLabel="settings.activate_after_closing_rule_"
        :value="$store.state.activateAfterClosingPrevRule"
        :inactive="!activateAfterClosingNextOrPrev"
        :opts="$store.state.activateAfterClosingPrevRuleOpts"
        @input="setOpt('activateAfterClosingPrevRule', $event)")
      select-field.-last(
        label="settings.activate_after_closing_next_rule"
        optLabel="settings.activate_after_closing_rule_"
        :value="$store.state.activateAfterClosingNextRule"
        :inactive="!activateAfterClosingNextOrPrev"
        :opts="$store.state.activateAfterClosingNextRuleOpts"
        @input="setOpt('activateAfterClosingNextRule', $event)")
      toggle-field(
        label="settings.activate_after_closing_global"
        :inactive="$store.state.activateAfterClosing !== 'prev_act'"
        :value="$store.state.activateAfterClosingGlobal"
        @input="setOpt('activateAfterClosingGlobal', $event)")
      toggle-field(
        label="settings.activate_after_closing_no_folded"
        :inactive="$store.state.activateAfterClosing !== 'prev_act'"
        :value="$store.state.activateAfterClosingNoFolded"
        @input="setOpt('activateAfterClosingNoFolded', $event)")
      toggle-field(
        label="settings.activate_after_closing_no_discarded"
        :inactive="$store.state.activateAfterClosing === 'none'"
        :value="$store.state.activateAfterClosingNoDiscarded"
        @input="setOpt('activateAfterClosingNoDiscarded', $event)")
    toggle-field(
      label="settings.shift_selection_from_active"
      :value="$store.state.shiftSelAct"
      @input="setOpt('shiftSelAct', $event)")
    toggle-field(
      label="settings.ask_new_bookmark_place"
      :value="$store.state.askNewBookmarkPlace"
      @input="setOpt('askNewBookmarkPlace', $event)")
    toggle-field(
      label="settings.native_highlight"
      :value="$store.state.nativeHighlight"
      @input="setOpt('nativeHighlight', $event)")

  section(ref="settings_new_tab_position")
    h2 {{t('settings.new_tab_position')}}
    select-field(
      label="settings.move_new_tab_pin"
      optLabel="settings.move_new_tab_pin_"
      :value="$store.state.moveNewTabPin"
      :opts="$store.state.moveNewTabPinOpts"
      @input="setOpt('moveNewTabPin', $event)")
    select-field(
      label="settings.move_new_tab_parent"
      optLabel="settings.move_new_tab_parent_"
      :value="$store.state.moveNewTabParent"
      :opts="$store.state.moveNewTabParentOpts"
      @input="setOpt('moveNewTabParent', $event)")
    .sub-fields
      toggle-field(
        label="settings.move_new_tab_parent_act_panel"
        :inactive="$store.state.moveNewTabParent === 'none'"
        :value="$store.state.moveNewTabParentActPanel"
        @input="setOpt('moveNewTabParentActPanel', $event)")
    select-field(
      label="settings.move_new_tab"
      optLabel="settings.move_new_tab_"
      :value="$store.state.moveNewTab"
      :opts="$store.state.moveNewTabOpts"
      @input="setOpt('moveNewTab', $event)")

  section(ref="settings_pinned_tabs")
    h2 {{t('settings.pinned_tabs_title')}}
    select-field(
      label="settings.pinned_tabs_position"
      optLabel="settings.pinned_tabs_position_"
      :value="$store.state.pinnedTabsPosition"
      :opts="pinnedTabsPositionOpts"
      @input="setOpt('pinnedTabsPosition', $event)")
    toggle-field.-last(
      label="settings.pinned_tabs_list"
      :inactive="$store.state.pinnedTabsPosition !== 'panel'"
      :value="$store.state.pinnedTabsList"
      @input="setOpt('pinnedTabsList', $event)")

  section(ref="settings_tabs_tree")
    h2 {{t('settings.tabs_tree_title')}}
    toggle-field(i
      label="settings.tabs_tree_layout"
      :value="$store.state.tabsTree"
      @input="setOpt('tabsTree', $event)")
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
    toggle-field(
      label="settings.hide_folded_tabs"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.hideFoldedTabs"
      @input="toggleHideFoldedTabs")
    toggle-field(
      label="settings.auto_fold_tabs"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.autoFoldTabs"
      @input="setOpt('autoFoldTabs', $event)")
    .sub-fields
      select-field(
        label="settings.auto_fold_tabs_except"
        optLabel="settings.auto_fold_tabs_except_"
        :inactive="!$store.state.tabsTree || !$store.state.autoFoldTabs"
        :value="$store.state.autoFoldTabsExcept"
        :opts="$store.state.autoFoldTabsExceptOpts"
        @input="setOpt('autoFoldTabsExcept', $event)")
    toggle-field(
      label="settings.auto_exp_tabs"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.autoExpandTabs"
      @input="setOpt('autoExpandTabs', $event)")
    select-field(
      label="settings.rm_child_tabs"
      optLabel="settings.rm_child_tabs_"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.rmChildTabs"
      :opts="$store.state.rmChildTabsOpts"
      @input="setOpt('rmChildTabs', $event)")
    toggle-field(
      label="settings.tabs_child_count"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.tabsChildCount"
      @input="setOpt('tabsChildCount', $event)")
    toggle-field(
      label="settings.tabs_lvl_dots"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.tabsLvlDots"
      @input="setOpt('tabsLvlDots', $event)")
    toggle-field(
      label="settings.discard_folded"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.discardFolded"
      @input="setOpt('discardFolded', $event)")
    .sub-fields
      num-field.-last(
        label="settings.discard_folded_delay"
        unitLabel="settings.discard_folded_delay_"
        :inactive="!$store.state.tabsTree || !$store.state.discardFolded"
        :value="$store.state.discardFoldedDelay"
        :or="0"
        :unit="$store.state.discardFoldedDelayUnit"
        :unitOpts="$store.state.discardFoldedDelayUnitOpts"
        @input="setOpt('discardFoldedDelay', $event[0]), setOpt('discardFoldedDelayUnit', $event[1])")
    toggle-field(
      label="settings.tabs_tree_bookmarks"
      :inactive="!$store.state.tabsTree"
      :value="$store.state.tabsTreeBookmarks"
      @input="setOpt('tabsTreeBookmarks', $event)")

  section(ref="settings_bookmarks")
    h2 {{t('settings.bookmarks_title')}}
    toggle-field(
      label="settings.bookmarks_panel"
      :value="$store.state.bookmarksPanel"
      @input="setOpt('bookmarksPanel', $event)")
    select-field(
      label="settings.warn_on_multi_bookmark_delete"
      optLabel="settings.warn_on_multi_bookmark_delete_"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.warnOnMultiBookmarkDelete"
      :opts="$store.state.warnOnMultiBookmarkDeleteOpts"
      @input="setOpt('warnOnMultiBookmarkDelete', $event)")
    toggle-field(
      label="settings.bookmarks_rm_undo_note"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.bookmarksRmUndoNote"
      @input="setOpt('bookmarksRmUndoNote', $event)")
    toggle-field(
      label="settings.open_bookmark_new_tab"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.openBookmarkNewTab"
      @input="setOpt('openBookmarkNewTab', $event)")
    select-field(
      label="settings.mid_click_bookmark"
      optLabel="settings.mid_click_bookmark_"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.midClickBookmark"
      :opts="$store.state.midClickBookmarkOpts"
      @input="setOpt('midClickBookmark', $event)")
    .sub-fields
      toggle-field(
        label="settings.act_mid_click_tab"
        :inactive="!$store.state.bookmarksPanel || $store.state.midClickBookmark !== 'open_new_tab'"
        :value="$store.state.actMidClickTab"
        @input="setOpt('actMidClickTab', $event)")
    toggle-field(
      label="settings.auto_close_bookmarks"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.autoCloseBookmarks"
      @input="setOpt('autoCloseBookmarks', $event)")
    toggle-field(
      label="settings.auto_rm_other"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.autoRemoveOther"
      @input="setOpt('autoRemoveOther', $event)")
    toggle-field(
      label="settings.show_bookmark_len"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.showBookmarkLen"
      @input="setOpt('showBookmarkLen', $event)")
    toggle-field(
      label="settings.highlight_open_bookmarks"
      :inactive="!$store.state.bookmarksPanel"
      :value="$store.state.highlightOpenBookmarks"
      @input="setOpt('highlightOpenBookmarks', $event)")
    .sub-fields
      toggle-field(
        label="settings.activate_open_bookmark_tab"
        :inactive="!$store.state.bookmarksPanel || !$store.state.highlightOpenBookmarks"
        :value="$store.state.activateOpenBookmarkTab"
        @input="setOpt('activateOpenBookmarkTab', $event)")
    .ctrls
      .fetch-progress(v-if="fetchingBookmarksFavs")
        .progress-bar: .progress-lvl(:style="{transform: `translateX(${fetchingBookmarksFavsPercent}%)`}")
        .progress-info
          .progress-done {{fetchingBookmarksFavsDone}}/{{fetchingBookmarksFavsAll}} {{t('settings.fetch_bookmarks_favs_done')}}
          .progress-errors {{fetchingBookmarksFavsErrors}} {{t('settings.fetch_bookmarks_favs_errors')}}
        .btn(v-if="fetchingBookmarksFavs" @click="stopFetchingBookmarksFavicons") {{t('settings.fetch_bookmarks_favs_stop')}}
      .btn(v-if="!fetchingBookmarksFavs" @click="fetchBookmarksFavicons") {{t('settings.fetch_bookmarks_favs')}}

  section(ref="settings_appearance")
    h2 {{t('settings.appearance_title')}}
    select-field(
      label="settings.font_size"
      optLabel="settings.font_size_"
      :value="$store.state.fontSize"
      :opts="$store.state.fontSizeOpts"
      @input="setOpt('fontSize', $event)")
    toggle-field(
      label="settings.animations"
      :value="$store.state.animations"
      @input="setOpt('animations', $event)")
    .sub-fields
      select-field(
        label="settings.animation_speed"
        optLabel="settings.animation_speed_"
        :inactive="!$store.state.animations"
        :value="$store.state.animationSpeed"
        :opts="$store.state.animationSpeedOpts"
        @input="setOpt('animationSpeed', $event)")
    toggle-field(
      label="settings.bg_noise"
      :value="$store.state.bgNoise"
      @input="toggleNoiseBg($event)")
    select-field(
      label="settings.theme"
      optLabel="settings.theme_"
      :value="$store.state.theme"
      :opts="$store.state.themeOpts"
      @input="setOpt('theme', $event)")
    select-field(
      label="settings.switch_style"
      optLabel="settings.style_"
      :value="$store.state.style"
      :opts="$store.state.styleOpts"
      @input="setOpt('style', $event)")
    .note-field
      .label {{t('settings.appearance_notes_title')}}
      .note {{t('settings.appearance_notes')}}
    .ctrls
      .btn(@click="switchView('styles_editor')") {{t('settings.edit_styles')}}

  section(ref="settings_mouse")
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
    .sub-fields
      toggle-field(
        label="settings.scroll_through_visible_tabs"
        :value="$store.state.scrollThroughVisibleTabs"
        :inactive="!$store.state.tabsTree || $store.state.scrollThroughTabs === 'none'"
        @input="setOpt('scrollThroughVisibleTabs', $event)")
      toggle-field(
        label="settings.scroll_through_tabs_skip_discarded"
        :value="$store.state.scrollThroughTabsSkipDiscarded"
        :inactive="$store.state.scrollThroughTabs === 'none'"
        @input="setOpt('scrollThroughTabsSkipDiscarded', $event)")
      toggle-field(
        label="settings.scroll_through_tabs_except_overflow"
        :value="$store.state.scrollThroughTabsExceptOverflow"
        :inactive="$store.state.scrollThroughTabs === 'none'"
        @input="setOpt('scrollThroughTabsExceptOverflow', $event)")
      toggle-field(
        label="settings.scroll_through_tabs_cyclic"
        :value="$store.state.scrollThroughTabsCyclic"
        :inactive="$store.state.scrollThroughTabs === 'none'"
        @input="setOpt('scrollThroughTabsCyclic', $event)")
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

  section(ref="settings_keybindings")
    h2 {{t('settings.kb_title')}}
    .keybinding(
      v-for="(k, i) in $store.state.keybindings" :key="k.name"
      :is-focused="k.focus"
      :data-disabled="!k.active")
      .label(@click="changeKeybinding(k, i)") {{k.description}}
      .value(@click="changeKeybinding(k, i)") {{normalizeShortcut(k.shortcut)}}
      input(
        type="text"
        ref="keybindingInputs"
        tabindex="-1"
        @blur="onKBBlur(k, i)"
        @keydown.prevent.stop="onKBKey($event, k, i)"
        @keyup.prevent.stop="onKBKeyUp($event, k, i)")
      toggle-input(
        v-if="k.name !== '_execute_sidebar_action'"
        v-model="k.active"
        @input="toggleKeybinding")
    .ctrls
      .btn(@click="resetKeybindings") {{t('settings.reset_kb')}}
      .btn(@click="toggleKeybindings") {{t('settings.toggle_kb')}}

  section(ref="settings_permissions")
    h2 {{t('settings.permissions_title')}}

    .permission(
      ref="all_urls"
      :data-highlight="$store.state.highlightedField === 'all_urls'"
      @click="onHighlighClick('all_urls')")
      toggle-field(
        label="settings.all_urls_label"
        :value="$store.state.permAllUrls"
        :note="t('settings.all_urls_info')"
        @input="togglePermAllUrls")

    .permission(
      ref="tab_hide"
      :data-highlight="$store.state.highlightedField === 'tab_hide'"
      @click="onHighlighClick('tab_hide')")
      toggle-field(
        label="settings.tab_hide_label"
        :value="$store.state.permTabHide"
        :note="t('settings.tab_hide_info')"
        @input="togglePermTabHide")

    .permission(
      ref="clipboard_write"
      :data-highlight="$store.state.highlightedField === 'clipboard_write'"
      @click="onHighlighClick('clipboard_write')")
      toggle-field(
        label="settings.clipboard_write_label"
        :value="$store.state.permClipboardWrite"
        :note="t('settings.clipboard_write_info')"
        @input="togglePermClipboardWrite")

    .permission(
      ref="web_request_blocking"
      :data-highlight="$store.state.highlightedField === 'web_request_blocking'"
      @click="onHighlighClick('web_request_blocking')")
      toggle-field(
        label="settings.web_request_blocking_label"
        :value="$store.state.permWebRequestBlocking"
        :note="t('settings.web_request_blocking_info')"
        @input="togglePermWebRequestBlocking")

  section(ref="settings_snapshots")
    h2 {{t('settings.snapshots_title')}}
    toggle-field(
      label="settings.snap_notify"
      :value="$store.state.snapNotify"
      @input="setOpt('snapNotify', $event)")
    toggle-field(
      label="settings.snap_exclude_private"
      :value="$store.state.snapExcludePrivate"
      @input="setOpt('snapExcludePrivate', $event)")
    num-field(
      label="settings.snap_interval"
      unitLabel="settings.snap_interval_"
      :value="$store.state.snapInterval"
      :or="'none'"
      :unit="$store.state.snapIntervalUnit"
      :unitOpts="$store.state.snapIntervalUnitOpts"
      @input="setOpt('snapInterval', $event[0]), setOpt('snapIntervalUnit', $event[1])")
    num-field(
      label="settings.snap_limit"
      unitLabel="settings.snap_limit_"
      :value="$store.state.snapLimit"
      :or="'none'"
      :unit="$store.state.snapLimitUnit"
      :unitOpts="$store.state.snapLimitUnitOpts"
      @input="setOpt('snapLimit', $event[0]), setOpt('snapLimitUnit', $event[1])")
    .ctrls
      .btn(@click="switchView('snapshots')") {{t('settings.snapshots_view_label')}}
      .btn(@click="createSnapshot") {{t('settings.make_snapshot')}}

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
      .btn.-warn(@click="clearStorage") {{t('settings.clear_storage_info')}}

  section(ref="settings_sync")
    h2 {{t('settings.sync_title')}}
    text-field(
      label="settings.sync_name"
      :or="t('settings.sync_name_or')"
      v-model="$store.state.syncName"
      v-debounce:input.321="setSyncName")
    toggle-field(
      label="settings.sync_save_settings"
      :value="$store.state.syncSaveSettings"
      @input="setOpt('syncSaveSettings', $event)")
    toggle-field(
      label="settings.sync_save_ctx_menu"
      :value="$store.state.syncSaveCtxMenu"
      @input="setOpt('syncSaveCtxMenu', $event), saveSyncCtxMenu()")
    toggle-field(
      label="settings.sync_save_styles"
      :value="$store.state.syncSaveStyles"
      @input="setOpt('syncSaveStyles', $event), saveSyncStyles()")
    .sync-data(v-if="syncedSettings")
      .sync-title {{t('settings.sync_settings_title')}}
      .sync-list
        .sync-item(v-for="item in syncedSettings")
          .sync-info {{item.info}}
          .btn.sync-btn(@click.stop="applySyncData(item.value)") {{t('settings.sync_apply_btn')}}
          .btn.sync-btn.-warn(@click.stop="deleteSyncData(item.id)") {{t('settings.sync_delete_btn')}}
    .sync-data(v-if="syncedCtxMenu")
      .sync-title {{t('settings.sync_ctx_menu_title')}}
      .sync-list
        .sync-item(v-for="item in syncedCtxMenu")
          .sync-info {{item.info}}
          .btn.sync-btn(@click.stop="applySyncData(item.value)") {{t('settings.sync_apply_btn')}}
          .btn.sync-btn.-warn(@click.stop="deleteSyncData(item.id)") {{t('settings.sync_delete_btn')}}
    .sync-data(v-if="syncedStyles")
      .sync-title {{t('settings.sync_styles_title')}}
      .sync-list
        .sync-item(v-for="item in syncedStyles")
          .sync-info {{item.info}}
          .btn.sync-btn(@click.stop="applySyncData(item.value)") {{t('settings.sync_apply_btn')}}
          .btn.sync-btn.-warn(@click.stop="deleteSyncData(item.id)") {{t('settings.sync_delete_btn')}}
    .ctrls
      .btn(@click="loadSyncedData") {{t('settings.sync_update_btn')}}

  section(ref="settings_help")
    h2 {{t('settings.help_title')}}

    .ctrls
      a.btn(@click="$store.state.exportConfig = true") {{t('settings.help_exp_data')}}
      .btn(type="file")
        .label {{t('settings.help_imp_data')}}
        input(type="file" ref="importData" accept="application/json" @input="importData")

    transition(name="panel-config")
      .panel-config-layer(
        v-if="$store.state.exportConfig"
        @click="$store.state.exportConfig = false")
        .panel-config-box(@click.stop="")
          ExportConfig.dashboard(:conf="$store.state.exportConfig")

    transition(name="panel-config")
      .panel-config-layer(
        v-if="$store.state.importConfig"
        @click="$store.state.importConfig = false")
        .panel-config-box(@click.stop="")
          ImportConfig.dashboard(:conf="$store.state.importConfig")

    .ctrls
      .btn(@click="showDbgDetails") {{t('settings.debug_info')}}
      a.btn(
        tabindex="-1"
        href="https://github.com/mbnuqw/sidebery/issues/new?template=Bug_report.md") {{t('settings.repo_bug')}}
      a.btn(
        tabindex="-1"
        href="https://github.com/mbnuqw/sidebery/issues/new?template=Feature_request.md") {{t('settings.repo_feature')}}

    .ctrls
      .btn.-warn(@click="reloadAddon") {{t('settings.reload_addon')}}
      .btn.-warn(@click="resetSettings") {{t('settings.reset_settings')}}

    .ctrls
      .info(v-if="$store.state.osInfo") OS: {{$store.state.osInfo.os}}
      .info(v-if="$store.state.ffInfo") Firefox: {{$store.state.ffInfo.version}}
      .info Addon: {{$store.state.version}}

  .details-box(v-if="dbgDetails" @wheel="onDbgWheel")
    .box
      .btn(@click="copyDebugDetail") {{t('settings.ctrl_copy')}}
      .btn.-warn(@click="dbgDetails = ''") {{t('settings.ctrl_close')}}
    .json {{dbgDetails}}

  footer-section
</template>

<script>
import { translate } from '../../addon/locales/dict'
import { DEFAULT_SETTINGS } from '../../addon/defaults'
import { TABS_PANEL } from '../../addon/defaults'
import EventBus from '../event-bus'
import State from './store/state'
import Actions from './actions'
import ToggleField from '../components/toggle-field'
import ToggleInput from '../components/toggle-input'
import SelectField from '../components/select-field'
import TextField from '../components/text-field'
import NumField from '../components/num-field'
import ContainerConfig from './components/container-config'
import PanelConfig from './components/panel-config'
import ExportConfig from './components/export-config'
import ImportConfig from './components/import-config'
import FooterSection from './components/footer'

const VALID_SHORTCUT = /^((Ctrl|Alt|Command|MacCtrl)\+)((Shift|Alt)\+)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right|F\d\d?)$|^((Ctrl|Alt|Command|MacCtrl)\+)?((Shift|Alt)\+)?(F\d\d?)$/
const SPEC_KEYS = /^(Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|F\d\d?)$/
const SECTIONS = [
  'settings_general',
  'settings_menu',
  'settings_nav',
  'settings_group',
  'settings_containers',
  'settings_panels',
  'settings_dnd',
  'settings_tabs',
  'settings_new_tab_position',
  'settings_pinned_tabs',
  'settings_tabs_tree',
  'settings_bookmarks',
  'settings_appearance',
  'settings_mouse',
  'settings_keybindings',
  'settings_permissions',
  'settings_snapshots',
  'settings_storage',
  'settings_sync',
  'settings_help',
]

export default {
  components: {
    ToggleField,
    ToggleInput,
    SelectField,
    TextField,
    NumField,
    FooterSection,
    ContainerConfig,
    PanelConfig,
    ExportConfig,
    ImportConfig,
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
      syncedSettings: null,
      syncedCtxMenu: null,
      syncedCtxMenuInfo: null,
      syncedStyles: null,
      syncedStylesInfo: null,
      fetchingBookmarksFavs: false,
      fetchingBookmarksFavsDone: 0,
      fetchingBookmarksFavsAll: 0,
      fetchingBookmarksFavsErrors: 0,
      fetchingBookmarksFavsPercent: 0,
    }
  },

  computed: {
    activateAfterClosingNextOrPrev() {
      return State.activateAfterClosing === 'next' || State.activateAfterClosing === 'prev'
    },

    pinnedTabsPositionOpts() {
      let isNavVertical = State.navBarLayout === 'vertical'
      return State.pinnedTabsPositionOpts.filter(o => {
        if (isNavVertical && o === 'left') return false
        if (isNavVertical && o === 'right') return false
        return true
      })
    },
  },

  mounted() {
    State.settingsRefs = this.$refs
    this.calcStorageInfo()
    this.loadSyncedData()
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

      for (let name, i = SECTIONS.length; i--; ) {
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
     * Switch layout of nav-bar.
     */
    switchNavBarLayout(value) {
      State.navBarLayout = value
      if (value === 'vertical') {
        if (State.navBarInline) State.navBarInline = false
        if (State.pinnedTabsPosition === 'left' || State.pinnedTabsPosition === 'right') {
          State.pinnedTabsPosition = 'panel'
        }
      }
      Actions.saveSettings()
    },

    toggleNoiseBg(value) {
      State.bgNoise = value
      if (State.bgNoise) Actions.applyNoiseBg()
      else Actions.removeNoiseBg()
      Actions.saveSettings()
    },

    /**
     * Start changing of keybingding
     */
    changeKeybinding(k, i) {
      if (!k.active) return

      this.$refs.keybindingInputs[i].focus()
      this.lastShortcut = State.keybindings[i]
      State.keybindings.splice(i, 1, { ...k, shortcut: 'Press new shortcut', focus: true })
    },

    /**
     * Normalize (system-wise) shortcut label
     */
    normalizeShortcut(s) {
      if (!s) return '---'
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

    toggleKeybinding() {
      Actions.saveKeybindings()
    },

    /**
     * Reset all keybindings
     */
    resetKeybindings() {
      Actions.resetKeybindings()
    },

    toggleKeybindings() {
      let test = State.keybindings[1]
      if (!test) return

      let state = test.active
      for (let k of State.keybindings) {
        if (k.name === '_execute_sidebar_action') continue
        k.active = !state
      }

      Actions.saveKeybindings()
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

    async togglePermClipboardWrite() {
      if (State.permClipboardWrite) {
        await browser.permissions.remove({ permissions: ['clipboardWrite'] })
        browser.runtime.sendMessage({ action: 'loadPermissions' })
        Actions.loadPermissions()
      } else {
        const request = { origins: [], permissions: ['clipboardWrite'] }
        browser.permissions.request(request).then(allowed => {
          browser.runtime.sendMessage({ action: 'loadPermissions' })
          State.permClipboardWrite = allowed
        })
      }
    },

    async togglePermWebRequestBlocking() {
      if (State.permWebRequestBlocking) {
        await browser.permissions.remove({ permissions: ['webRequest', 'webRequestBlocking'] })
        browser.runtime.sendMessage({ action: 'loadPermissions' })
        Actions.loadPermissions()
      } else {
        const request = {
          origins: ['<all_urls>'],
          permissions: ['webRequest', 'webRequestBlocking'],
        }
        browser.permissions.request(request).then(allowed => {
          browser.runtime.sendMessage({ action: 'loadPermissions' })
          State.permWebRequestBlocking = allowed
          State.permAllUrls = allowed
        })
      }
    },

    /**
     * Remove snapshot
     */
    removeAllSnapshots() {
      browser.storage.local.set({ snapshots_v4: [] })
    },

    /**
     * Create snapshot
     */
    async createSnapshot() {
      const snapshot = await browser.runtime.sendMessage({
        instanceType: 'bg',
        windowId: -1,
        action: 'createSnapshot',
      })

      EventBus.$emit('snapshotCreated', snapshot)
    },

    /**
     * Reset settings
     */
    resetSettings() {
      if (window.confirm(translate('settings.reset_confirm'))) {
        Actions.resetSettings()
        Actions.saveSettings()
      }
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
     * Import addon data
     */
    importData(importEvent) {
      let file = importEvent.target.files[0]
      let reader = new FileReader()
      reader.onload = fileEvent => {
        let jsonStr = fileEvent.target.result
        if (!jsonStr) return

        let importedData
        try {
          importedData = JSON.parse(jsonStr)
        } catch (err) {
          // nothing
        }

        if (!importedData) return
        State.importConfig = importedData
      }
      reader.readAsText(file)
    },

    /**
     * Get debug details
     */
    async getDbgDetails() {
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
        let { panels_v4 } = await browser.storage.local.get('panels_v4')
        dbg.panels = []
        for (let panel of panels_v4) {
          let clone = Utils.cloneObject(panel)
          if (clone.name) clone.name = clone.name.length
          if (clone.icon) clone.icon = '...'
          if (clone.color) clone.color = '...'
          if (clone.includeHosts) clone.includeHosts = clone.includeHosts.length
          if (clone.excludeHosts) clone.excludeHosts = clone.excludeHosts.length
          if (clone.proxy) clone.proxy = '...'
          if (clone.customIconSrc) clone.customIconSrc = '...'
          if (clone.customIcon) clone.customIcon = '...'
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

      return dbg
    },

    /**
     * Show debug details
     */
    async showDbgDetails() {
      let dbg = await this.getDbgDetails()
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
     * Remove container
     */
    async removeContainer(container) {
      let preMsg = translate('settings.contianer_remove_confirm_prefix')
      let postMsg = translate('settings.contianer_remove_confirm_postfix')
      if (window.confirm(preMsg + container.name + postMsg)) {
        await browser.contextualIdentities.remove(container.id)
        for (let panel of State.panels) {
          if (panel.newTabCtx === container.id) panel.newTabCtx = 'none'
          if (panel.moveTabCtx === container.id) panel.moveTabCtx = 'none'
        }
        Actions.loadContainers()
        Actions.savePanels()
      }
    },

    /**
     * Remove panel
     */
    async removePanel(panel) {
      if (!panel || !panel.name) return
      if (panel.type === 'bookmarks') return
      if (panel.type === 'default') return

      let preMsg = translate('settings.panel_remove_confirm_1')
      let postMsg = translate('settings.panel_remove_confirm_2')
      if (window.confirm(preMsg + panel.name + postMsg)) {
        let index = State.panels.findIndex(p => p.id === panel.id)
        if (index > -1) State.panels.splice(index, 1)
        delete State.panelsMap[panel.id]
        Actions.savePanels()
      }
    },

    /**
     * Move panel
     */
    movePanel(panel, dir) {
      Actions.movePanel(panel.id, dir)
    },

    /**
     * Create container
     */
    async createContainer() {
      let containersCount = Object.keys(State.containers).length
      await browser.contextualIdentities.create({
        name: 'New Container ' + (containersCount + 1),
        color: 'blue',
        icon: 'fingerprint',
      })
      Actions.loadContainers()
    },

    /**
     * Create panel-container
     */
    async createPanel() {
      let panel = Utils.cloneObject(TABS_PANEL)
      panel.id = Utils.uid()
      panel.name = 'New Panel ' + (State.panels.length + 1)
      State.panels.push(panel)
      State.panelsMap[panel.id] = panel
      Actions.savePanels()
    },

    async clearStorage() {
      if (window.confirm(translate('settings.clear_storage_confirm'))) {
        await browser.storage.local.clear()
        browser.runtime.reload()
      }
    },

    reloadAddon() {
      browser.runtime.reload()
    },

    async loadSyncedData() {
      let [syncStorage, profileId] = await Promise.all([
        browser.storage.sync.get(),
        Actions.getProfileId(),
      ])
      let toRemove = []
      let data = {}

      for (let syncKey of Object.keys(syncStorage)) {
        let syncData = syncStorage[syncKey]
        let [syncProfileId, syncPropName] = syncKey.split('::')

        if (!syncData || !syncProfileId || !syncPropName) {
          toRemove.push(syncKey)
          continue
        }

        syncData.id = syncKey
        syncData.info = this.getSyncDataInfoString(syncData, syncProfileId)
        syncData.sameProfile = profileId === syncProfileId
        if (!data[syncPropName]) data[syncPropName] = []
        data[syncPropName].push(syncData)
      }

      if (data.settings) this.syncedSettings = data.settings
      else this.syncedSettings = null
      if (data.ctxMenu) this.syncedCtxMenu = data.ctxMenu
      else this.syncedCtxMenu = null
      if (data.styles) this.syncedStyles = data.styles
      else this.syncedStyles = null

      if (toRemove.length) {
        browser.storage.sync.remove(toRemove)
      }
    },

    getSyncDataInfoString(info, profileId) {
      let name = info.name || profileId
      let date = Utils.uDate(info.time)
      let time = Utils.uTime(info.time)
      let dataJSON = JSON.stringify(info)

      return `${name} - ${date} - ${time} - ${Utils.strSize(dataJSON)}`
    },

    async applySyncData(data) {
      if (window.confirm(translate('settings.sync_apply_confirm'))) {
        // Keep sync settings
        if (data.settings) {
          data.settings.syncName = State.syncName
          data.settings.syncSaveSettings = State.syncSaveSettings
          data.settings.syncSaveCtxMenu = State.syncSaveCtxMenu
          data.settings.syncSaveStyles = State.syncSaveStyles
          data.settings.syncAutoApply = State.syncAutoApply
        }

        await browser.storage.local.set(Utils.cloneObject(data))

        if (data.settings) Actions.loadSettings()
        if (data.tabsMenu) Actions.loadCtxMenu()
        if (data.tabsPanelMenu) Actions.loadCtxMenu()
        if (data.bookmarksMenu) Actions.loadCtxMenu()
        if (data.bookmarksPanelMenu) Actions.loadCtxMenu()
        if (data.cssVars) Actions.loadCSSVars()
      }
    },

    async deleteSyncData(key) {
      await browser.storage.sync.remove(key)
      this.loadSyncedData()
    },

    setSyncName() {
      this.setOpt('syncName', State.syncName)
    },

    saveSyncCtxMenu() {
      if (!State.syncSaveCtxMenu) return
      Actions.saveCtxMenu()
    },

    async saveSyncStyles() {
      if (!State.syncSaveStyles) return

      let [cssVars, sidebarCSS, groupCSS] = await Promise.all([
        Actions.getCSSVars(),
        Actions.getCustomCSS('sidebar'),
        Actions.getCustomCSS('group'),
      ])

      if (sidebarCSS) State.sidebarCSS = sidebarCSS
      if (groupCSS) State.groupCSS = groupCSS

      Actions.saveStylesToSync(cssVars)
    },

    async fetchBookmarksFavicons() {
      if (!State.permAllUrls) {
        location.hash = 'all-urls'
        return
      }

      this.fetchingBookmarksFavs = true

      const bookmarksRoot = await browser.bookmarks.getTree()
      const bookmarksUrls = []
      const hWalk = nodes => {
        for (let n of nodes) {
          if (n.url) bookmarksUrls.push(n.url)
          if (n.children) hWalk(n.children)
        }
      }
      hWalk(bookmarksRoot[0].children)

      let hosts = {}
      for (let url of bookmarksUrls) {
        if (!url.startsWith('http')) continue

        let urlInfo
        try {
          urlInfo = new URL(url)
        } catch (err) {
          continue
        }

        let protoHost = urlInfo.protocol + '//' + urlInfo.host
        if (!hosts[protoHost]) hosts[protoHost] = []
        hosts[protoHost].push(url)
      }

      this.fetchingBookmarksFavsAll = Object.keys(hosts).length
      let perc = 100 / this.fetchingBookmarksFavsAll

      for (let host of Object.keys(hosts)) {
        if (!this.fetchingBookmarksFavs) break

        let icon
        try {
          icon = await Utils.loadBinAsBase64(host + '/favicon.ico')
        } catch (err) {
          this.fetchingBookmarksFavsErrors++
          this.fetchingBookmarksFavsPercent += perc
          this.fetchingBookmarksFavsDone++
          continue
        }
        if (!icon || !icon.startsWith('data:image') || icon[icon.length - 1] === ',') {
          this.fetchingBookmarksFavsErrors++
          this.fetchingBookmarksFavsPercent += perc
          this.fetchingBookmarksFavsDone++
          continue
        }

        this.fetchingBookmarksFavsPercent += perc
        this.fetchingBookmarksFavsDone++
        hosts[host].forEach(u => Actions.setFavicon(u, icon))
      }

      this.stopFetchingBookmarksFavicons()
    },

    stopFetchingBookmarksFavicons() {
      this.fetchingBookmarksFavs = false
      this.fetchingBookmarksFavsAll = 0
      this.fetchingBookmarksFavsDone = 0
      this.fetchingBookmarksFavsErrors = 0
      this.fetchingBookmarksFavsPercent = 0

      setTimeout(() => {
        browser.runtime.sendMessage({
          instanceType: 'sidebar',
          action: 'loadFavicons',
        })
      }, 1500)
    },

    /**
     * Block scrolling the main page when debug info showed.
     */
    onDbgWheel(e) {
      let scrollOffset = e.target.parentNode.scrollTop
      let maxScrollOffset = e.target.scrollHeight - e.target.parentNode.offsetHeight
      if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
      if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
    },
  },
}
</script>
