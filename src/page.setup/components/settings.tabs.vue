<template lang="pug">
section(ref="el")
  h2 {{translate('settings.tabs_title')}}
  span.header-shadow
  SelectField(
    label="settings.warn_on_multi_tab_close"
    optLabel="settings.warn_on_multi_tab_close_"
    dbg="warnOnMultiTabClose"
    v-model:value="Settings.state.warnOnMultiTabClose"
    :default="DEFAULT_SETTINGS.warnOnMultiTabClose"
    :opts="Settings.getOpts('warnOnMultiTabClose')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.tabs_rm_undo_note"
    dbg="tabsRmUndoNote"
    v-model:value="Settings.state.tabsRmUndoNote"
    :default="DEFAULT_SETTINGS.tabsRmUndoNote"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.activate_last_tab_on_panel_switching"
    dbg="activateLastTabOnPanelSwitching"
    :value="Settings.state.activateLastTabOnPanelSwitching"
    :default="DEFAULT_SETTINGS.activateLastTabOnPanelSwitching"
    @update:value="toggleActivateLastTabOnPanelSwitching")
  .sub-fields
    ToggleField(
      label="settings.activate_last_tab_on_panel_switching_loaded_only"
      dbg="activateLastTabOnPanelSwitchingLoadedOnly"
      v-model:value="Settings.state.activateLastTabOnPanelSwitchingLoadedOnly"
      :default="DEFAULT_SETTINGS.activateLastTabOnPanelSwitchingLoadedOnly"
      @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.switch_panel_after_switching_tab"
    optLabel="settings.switch_panel_after_switching_tab_"
    dbg="switchPanelAfterSwitchingTab"
    v-model:value="Settings.state.switchPanelAfterSwitchingTab"
    :default="DEFAULT_SETTINGS.switchPanelAfterSwitchingTab"
    :folded="true"
    :opts="Settings.getOpts('switchPanelAfterSwitchingTab')"
    @update:value="toggleSwitchPanelAfterSwitchingTab")
  SelectField(
    label="settings.scroll_panel_after_switching_tab"
    optLabel="settings.scroll_panel_after_switching_tab_"
    dbg="scrollPanelAfterSwitchingTab"
    v-model:value="Settings.state.scrollPanelAfterSwitchingTab"
    :default="DEFAULT_SETTINGS.scrollPanelAfterSwitchingTab"
    :folded="true"
    :opts="Settings.getOpts('scrollPanelAfterSwitchingTab')"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.tab_rm_btn"
    optLabel="settings.tab_rm_btn_"
    dbg="tabRmBtn"
    v-model:value="Settings.state.tabRmBtn"
    :default="DEFAULT_SETTINGS.tabRmBtn"
    :folded="true"
    :opts="Settings.getOpts('tabRmBtn')"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.activate_after_closing"
    optLabel="settings.activate_after_closing_"
    dbg="activateAfterClosing"
    v-model:value="Settings.state.activateAfterClosing"
    :default="DEFAULT_SETTINGS.activateAfterClosing"
    :folded="true"
    :opts="Settings.getOpts('activateAfterClosing')"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.activate_after_closing_stay_in_panel"
      dbg="activateAfterClosingStayInPanel"
      v-model:value="Settings.state.activateAfterClosingStayInPanel"
      :default="DEFAULT_SETTINGS.activateAfterClosingStayInPanel"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.activate_after_closing_global"
      dbg="activateAfterClosingGlobal"
      v-model:value="Settings.state.activateAfterClosingGlobal"
      :default="DEFAULT_SETTINGS.activateAfterClosingGlobal"
      :inactive="Settings.state.activateAfterClosing !== 'prev_act'"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.activate_after_closing_no_folded"
      dbg="activateAfterClosingNoFolded"
      v-model:value="Settings.state.activateAfterClosingNoFolded"
      :default="DEFAULT_SETTINGS.activateAfterClosingNoFolded"
      :inactive="Settings.state.activateAfterClosing !== 'prev_act'"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.activate_after_closing_no_discarded"
      dbg="activateAfterClosingNoDiscarded"
      v-model:value="Settings.state.activateAfterClosingNoDiscarded"
      :default="DEFAULT_SETTINGS.activateAfterClosingNoDiscarded"
      :inactive="Settings.state.activateAfterClosing === 'none'"
      @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.tabs_unread_mark"
    dbg="tabsUnreadMark"
    v-model:value="Settings.state.tabsUnreadMark"
    :default="DEFAULT_SETTINGS.tabsUnreadMark"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.tabs_update_mark"
    optLabel="settings.tabs_update_mark_"
    dbg="tabsUpdateMark"
    v-model:value="Settings.state.tabsUpdateMark"
    :default="DEFAULT_SETTINGS.tabsUpdateMark"
    :opts="Settings.getOpts('tabsUpdateMark')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.tabs_update_mark_first"
      dbg="tabsUpdateMarkFirst"
      v-model:value="Settings.state.tabsUpdateMarkFirst"
      :default="DEFAULT_SETTINGS.tabsUpdateMarkFirst"
      @update:value="Settings.saveDebounced(150)")
  CountField.-inline(
    label="settings.tabs_reload_limit"
    dbg="tabsReloadLimit"
    v-model:value="Settings.state.tabsReloadLimit"
    :default="DEFAULT_SETTINGS.tabsReloadLimit"
    :min="1"
    @update:value="Settings.saveDebounced(500)")
  .sub-fields
    ToggleField(
      label="settings.tabs_reload_limit_notif"
      dbg="tabsReloadLimitNotif"
      v-model:value="Settings.state.tabsReloadLimitNotif"
      :default="DEFAULT_SETTINGS.tabsReloadLimitNotif"
      :inactive="!(Settings.state.tabsReloadLimit > 0)"
      @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.tabs_panel_switch_act_move"
    dbg="tabsPanelSwitchActMove"
    :value="Settings.state.tabsPanelSwitchActMove"
    :default="DEFAULT_SETTINGS.tabsPanelSwitchActMove"
    @update:value="toggleTabsPanelSwitchActMove")
  ToggleField(
    label="settings.tabs_panel_switch_act_move_auto"
    dbg="tabsPanelSwitchActMoveAuto"
    :value="Settings.state.tabsPanelSwitchActMoveAuto"
    :default="DEFAULT_SETTINGS.tabsPanelSwitchActMoveAuto"
    @update:value="toggleTabsPanelSwitchActMoveAuto")
  SelectField(
    label="settings.tabs_url_in_tooltip"
    optLabel="settings.tabs_url_in_tooltip_"
    dbg="tabsUrlInTooltip"
    v-model:value="Settings.state.tabsUrlInTooltip"
    :default="DEFAULT_SETTINGS.tabsUrlInTooltip"
    :opts="Settings.getOpts('tabsUrlInTooltip')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.tabs_container_in_tooltip"
    dbg="tabsContainerInTooltip"
    v-model:value="Settings.state.tabsContainerInTooltip"
    :default="DEFAULT_SETTINGS.tabsContainerInTooltip"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.show_new_tab_btns"
    dbg="showNewTabBtns"
    v-model:value="Settings.state.showNewTabBtns"
    :default="DEFAULT_SETTINGS.showNewTabBtns"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    SelectField(
      label="settings.new_tab_bar_position"
      optLabel="settings.new_tab_bar_position_"
      dbg="newTabBarPosition"
      v-model:value="Settings.state.newTabBarPosition"
      :default="DEFAULT_SETTINGS.newTabBarPosition"
      :inactive="!Settings.state.showNewTabBtns"
      :opts="Settings.getOpts('newTabBarPosition')"
      @update:value="Settings.saveDebounced(150)")
  //- ToggleField(
  //-   label="settings.tab_warmup_on_hover"
  //-   v-model:value="Settings.state.tabWarmupOnHover"
  //-   @update:value="Settings.saveDebounced(150)")
  NumField.-inline(
    label="settings.tabs_switch_delay"
    dbg="tabSwitchDelay"
    v-model:value="Settings.state.tabSwitchDelay"
    :default="DEFAULT_SETTINGS.tabSwitchDelay"
    :or="0"
    @update:value="Settings.saveDebounced(500)")

  .wrapper(ref="newTabPosEl")
    .sub-title: .text {{translate('settings.nav_settings_new_tab_position')}}
    SelectField.-no-separator(
      label="settings.move_new_tab_pin"
      optLabel="settings.move_new_tab_pin_"
      dbg="moveNewTabPin"
      v-model:value="Settings.state.moveNewTabPin"
      :default="DEFAULT_SETTINGS.moveNewTabPin"
      :opts="Settings.getOpts('moveNewTabPin')"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.pinned_auto_group"
      :inactive="!Settings.state.tabsTree"
      dbg="pinnedAutoGroup"
      v-model:value="Settings.state.pinnedAutoGroup"
      :default="DEFAULT_SETTINGS.pinnedAutoGroup"
      @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.move_new_tab_parent"
      optLabel="settings.move_new_tab_parent_"
      dbg="moveNewTabParent"
      v-model:value="Settings.state.moveNewTabParent"
      :default="DEFAULT_SETTINGS.moveNewTabParent"
      :opts="Settings.getOpts('moveNewTabParent')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      ToggleField(
        v-if="Settings.state.moveNewTabParent === 'default' && Settings.state.tabsTree"
        label="settings.move_new_tab_parent_indent"
        dbg="moveNewTabParentIndent"
        v-model:value="Settings.state.moveNewTabParentIndent"
        :default="DEFAULT_SETTINGS.moveNewTabParentIndent"
        @update:value="Settings.saveDebounced(150)")
      ToggleField(
        v-else
        label="settings.move_new_tab_parent_indent"
        :inactive="true"
        v-bind:value="Settings.state.tabsTree && (Settings.state.moveNewTabParent === 'first_child' || Settings.state.moveNewTabParent === 'last_child')")
      ToggleField(
        label="settings.move_new_tab_parent_act_panel"
        :inactive="Settings.state.moveNewTabParent === 'none'"
        dbg="moveNewTabParentActPanel"
        v-model:value="Settings.state.moveNewTabParentActPanel"
        :default="DEFAULT_SETTINGS.moveNewTabParentActPanel"
        @update:value="Settings.saveDebounced(150)")
    //- Place new tab (from New Tab button). options are reused from moveNewTab
    SelectField(
      label="settings.move_new_tab_button"
      optLabel="settings.move_new_tab_"
      dbg="moveNewTabButton"
      v-model:value="Settings.state.moveNewTabButton"
      :default="DEFAULT_SETTINGS.moveNewTabButton"
      :opts="Settings.getOpts('moveNewTab')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      SelectField(
        :inactive="!newTabBtnPosRelativeToActiveTab"
        label="settings.move_new_tab_active_pin"
        optLabel="settings.move_new_tab_pin_"
        dbg="moveNewTabButtonActivePin"
        v-model:value="Settings.state.moveNewTabButtonActivePin"
        :default="DEFAULT_SETTINGS.moveNewTabButtonActivePin"
        :opts="Settings.getOpts('moveNewTabActivePin')"
        @update:value="Settings.saveDebounced(150)")
    //- Place new tab (general rule)
    SelectField(
      label="settings.move_new_tab"
      optLabel="settings.move_new_tab_"
      dbg="moveNewTab"
      v-model:value="Settings.state.moveNewTab"
      :default="DEFAULT_SETTINGS.moveNewTab"
      :opts="Settings.getOpts('moveNewTab')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      SelectField(
        :inactive="!newTabPosRelativeToActiveTab"
        label="settings.move_new_tab_active_pin"
        optLabel="settings.move_new_tab_pin_"
        dbg="moveNewTabActivePin"
        v-model:value="Settings.state.moveNewTabActivePin"
        :default="DEFAULT_SETTINGS.moveNewTabActivePin"
        :opts="Settings.getOpts('moveNewTabActivePin')"
        @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.auto_scroll_to_new_tab"
      dbg="autoScrollToNewTab"
      v-model:value="Settings.state.autoScrollToNewTab"
      :default="DEFAULT_SETTINGS.autoScrollToNewTab"
      @update:value="Settings.saveDebounced(150)")

  .wrapper(ref="pinTabsEl")
    .sub-title: .text {{translate('settings.nav_settings_pinned_tabs')}}
    SelectField.-no-separator(
      dbg="pinnedTabsPosition"
      v-model:value="Settings.state.pinnedTabsPosition"
      :default="DEFAULT_SETTINGS.pinnedTabsPosition"
      label="settings.pinned_tabs_position"
      optLabel="settings.pinned_tabs_position_"
      :opts="Settings.getOpts('pinnedTabsPosition')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.pinned_tabs_list"
      :inactive="Settings.state.pinnedTabsPosition !== 'panel' && Settings.state.pinnedTabsPosition!== 'top'"
      dbg="pinnedTabsList"
      v-model:value="Settings.state.pinnedTabsList"
      :default="DEFAULT_SETTINGS.pinnedTabsList"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.pinned.no_unload"
      dbg="pinnedNoUnload"
      v-model:value="Settings.state.pinnedNoUnload"
      :default="DEFAULT_SETTINGS.pinnedNoUnload"
      @update:value="Settings.saveDebounced(150)")

  .wrapper(ref="tabsTreeEl")
    .sub-title: .text {{translate('settings.nav_settings_tabs_tree')}}
    ToggleField.-no-separator(
      label="settings.tabs_tree_layout"
      dbg="tabsTree"
      v-model:value="Settings.state.tabsTree"
      :default="DEFAULT_SETTINGS.tabsTree"
      @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.tabs_tree_limit"
      optLabel="settings.tabs_tree_limit_"
      dbg="tabsTreeLimit"
      v-model:value="Settings.state.tabsTreeLimit"
      :default="DEFAULT_SETTINGS.tabsTreeLimit"
      :inactive="!Settings.state.tabsTree"
      :opts="Settings.getOpts('tabsTreeLimit')"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.auto_fold_tabs"
      :inactive="!Settings.state.tabsTree"
      dbg="autoFoldTabs"
      v-model:value="Settings.state.autoFoldTabs"
      :default="DEFAULT_SETTINGS.autoFoldTabs"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      SelectField(
        label="settings.auto_fold_tabs_except"
        optLabel="settings.auto_fold_tabs_except_"
        dbg="autoFoldTabsExcept"
        v-model:value="Settings.state.autoFoldTabsExcept"
        :default="DEFAULT_SETTINGS.autoFoldTabsExcept"
        :inactive="!Settings.state.tabsTree || !Settings.state.autoFoldTabs"
        :opts="Settings.getOpts('autoFoldTabsExcept')"
        @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.auto_exp_tabs"
      dbg="autoExpandTabs"
      v-model:value="Settings.state.autoExpandTabs"
      :default="DEFAULT_SETTINGS.autoExpandTabs"
      :inactive="!Settings.state.tabsTree"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.auto_exp_tabs_on_new"
      dbg="autoExpandTabsOnNew"
      v-model:value="Settings.state.autoExpandTabsOnNew"
      :default="DEFAULT_SETTINGS.autoExpandTabsOnNew"
      :inactive="!Settings.state.tabsTree"
      @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.rm_child_tabs"
      optLabel="settings.rm_child_tabs_"
      dbg="rmChildTabs"
      v-model:value="Settings.state.rmChildTabs"
      :default="DEFAULT_SETTINGS.rmChildTabs"
      :inactive="!Settings.state.tabsTree"
      :opts="Settings.getOpts('rmChildTabs')"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.tabs_lvl_dots"
      dbg="tabsLvlDots"
      v-model:value="Settings.state.tabsLvlDots"
      :default="DEFAULT_SETTINGS.tabsLvlDots"
      :inactive="!Settings.state.tabsTree"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.discard_folded"
      dbg="discardFolded"
      v-model:value="Settings.state.discardFolded"
      :default="DEFAULT_SETTINGS.discardFolded"
      :inactive="!Settings.state.tabsTree"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      NumField.-last(
        label="settings.discard_folded_delay"
        unitLabel="settings.discard_folded_delay_"
        dbg="discardFoldedDelay"
        v-model:value="Settings.state.discardFoldedDelay"
        v-model:unit="Settings.state.discardFoldedDelayUnit"
        :default="DEFAULT_SETTINGS.discardFoldedDelay"
        :default-unit="DEFAULT_SETTINGS.discardFoldedDelayUnit"
        :or="0"
        :inactive="!Settings.state.tabsTree || !Settings.state.discardFolded"
        :unitOpts="SETTINGS_OPTIONS.discardFoldedDelayUnit"
        @update:value="Settings.saveDebounced(500)"
        @update:unit="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.tabs_tree_bookmarks"
      :inactive="!Settings.state.tabsTree"
      dbg="tabsTreeBookmarks"
      v-model:value="Settings.state.tabsTreeBookmarks"
      :default="DEFAULT_SETTINGS.tabsTreeBookmarks"
      @update:value="Settings.saveDebounced(150)")
    SelectField(
      label="settings.tree_rm_outdent"
      optLabel="settings.tree_rm_outdent_"
      dbg="treeRmOutdent"
      v-model:value="Settings.state.treeRmOutdent"
      :default="DEFAULT_SETTINGS.treeRmOutdent"
      :inactive="!Settings.state.tabsTree"
      :opts="Settings.getOpts('treeRmOutdent')"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.auto_group_on_close"
      :inactive="!Settings.state.tabsTree"
      v-model:value="Settings.state.autoGroupOnClose"
      dbg="autoGroupOnClose"
      :default="DEFAULT_SETTINGS.autoGroupOnClose"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      ToggleField(
        label="settings.auto_group_on_close_0_lvl"
        :inactive="!Settings.state.tabsTree || !Settings.state.autoGroupOnClose"
        v-model:value="Settings.state.autoGroupOnClose0Lvl"
        dbg="autoGroupOnClose0Lvl"
        :default="DEFAULT_SETTINGS.autoGroupOnClose0Lvl"
        @update:value="Settings.saveDebounced(150)")
      ToggleField(
        label="settings.auto_group_on_close_mouse_only"
        :inactive="!Settings.state.tabsTree || !Settings.state.autoGroupOnClose"
        v-model:value="Settings.state.autoGroupOnCloseMouseOnly"
        dbg="autoGroupOnCloseMouseOnly"
        :default="DEFAULT_SETTINGS.autoGroupOnCloseMouseOnly"
        @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.ignore_folded_parent"
      :inactive="!Settings.state.tabsTree"
      v-model:value="Settings.state.ignoreFoldedParent"
      dbg="ignoreFoldedParent"
      :default="DEFAULT_SETTINGS.ignoreFoldedParent"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.show_new_group_conf"
      :inactive="!Settings.state.tabsTree"
      v-model:value="Settings.state.showNewGroupConf"
      dbg="showNewGroupConf"
      :default="DEFAULT_SETTINGS.showNewGroupConf"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.sort_groups_first"
      :inactive="!Settings.state.tabsTree"
      v-model:value="Settings.state.sortGroupsFirst"
      dbg="sortGroupsFirst"
      :default="DEFAULT_SETTINGS.sortGroupsFirst"
      @update:value="Settings.saveDebounced(150)")

  .wrapper(ref="tabsColorEl")
    .sub-title: .text {{translate('settings.nav_settings_tabs_colorization')}}
    ToggleField.-no-separator(
      label="settings.colorize_tabs"
      v-model:value="Settings.state.colorizeTabs"
      dbg="colorizeTabs"
      :default="DEFAULT_SETTINGS.colorizeTabs"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      SelectField(
        label="settings.colorize_tabs_src"
        optLabel="settings.colorize_tabs_src_"
        v-model:value="Settings.state.colorizeTabsSrc"
        dbg="colorizeTabsSrc"
        :default="DEFAULT_SETTINGS.colorizeTabsSrc"
        :inactive="!Settings.state.colorizeTabs"
        :opts="Settings.getOpts('colorizeTabsSrc')"
        @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.colorize_branches"
      :inactive="!Settings.state.tabsTree"
      v-model:value="Settings.state.colorizeTabsBranches"
      dbg="colorizeTabsBranches"
      :default="DEFAULT_SETTINGS.colorizeTabsBranches"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      SelectField(
        label="settings.colorize_branches_src"
        optLabel="settings.colorize_branches_src_"
        v-model:value="Settings.state.colorizeTabsBranchesSrc"
        dbg="colorizeTabsBranchesSrc"
        :default="DEFAULT_SETTINGS.colorizeTabsBranchesSrc"
        :inactive="!Settings.state.tabsTree || !Settings.state.colorizeTabsBranches"
        :opts="Settings.getOpts('colorizeTabsBranchesSrc')"
        @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.tabs.inherit_custom_color"
      :inactive="!Settings.state.tabsTree"
      v-model:value="Settings.state.inheritCustomColor"
      dbg="inheritCustomColor"
      :default="DEFAULT_SETTINGS.inheritCustomColor"
      @update:value="Settings.saveDebounced(150)")

  .wrapper(ref="tabsPreviewEl")
    .sub-title: .text {{translate('settings.nav_settings_tabs_preview')}}
    ToggleField.-no-separator(
      label="settings.tabs.preview"
      :value="Settings.state.previewTabs"
      dbg="previewTabs"
      :default="DEFAULT_SETTINGS.previewTabs"
      @update:value="togglePreviewTabs")
    SelectField(
      label="settings.tabs.preview_mode"
      optLabel="settings.tabs.preview_mode_"
      v-model:value="Settings.state.previewTabsMode"
      dbg="previewTabsMode"
      :default="DEFAULT_SETTINGS.previewTabsMode"
      :inactive="!Settings.state.previewTabs"
      :opts="Settings.getOpts('previewTabsMode')"
      :folded="true"
      @update:value="Settings.saveDebounced(150)")
    .sub-fields
      SelectField(
        label="settings.tabs.preview_page_mode_fallback"
        optLabel="settings.tabs.preview_mode_"
        v-model:value="Settings.state.previewTabsPageModeFallback"
        dbg="previewTabsPageModeFallback"
        :default="DEFAULT_SETTINGS.previewTabsPageModeFallback"
        :inactive="!Settings.state.previewTabs || Settings.state.previewTabsMode !== 'p'"
        :opts="Settings.getOpts('previewTabsPageModeFallback')"
        :folded="true"
        @update:value="Settings.saveDebounced(150)")
    NumField.-inline(
      label="settings.tabs.preview_delay"
      v-model:value="Settings.state.previewTabsDelay"
      dbg="previewTabsDelay"
      :default="DEFAULT_SETTINGS.previewTabsDelay"
      :or="0"
      :inactive="!Settings.state.previewTabs"
      @update:value="Settings.saveDebounced(500)")
    NumField.-inline(
      label="settings.tabs.preview_inline_height"
      v-model:value="Settings.state.previewTabsInlineHeight"
      dbg="previewTabsInlineHeight"
      :default="DEFAULT_SETTINGS.previewTabsInlineHeight"
      :or="0"
      :inactive="!Settings.state.previewTabs || (Settings.state.previewTabsMode !== 'i' && Settings.state.previewTabsPageModeFallback !== 'i')"
      @update:value="Settings.saveDebounced(500)")
    NumField.-inline(
      label="settings.tabs.preview_popup_width"
      v-model:value="Settings.state.previewTabsPopupWidth"
      dbg="previewTabsPopupWidth"
      :default="DEFAULT_SETTINGS.previewTabsPopupWidth"
      :or="0"
      :inactive="!Settings.state.previewTabs || Settings.state.previewTabsMode === 'i'"
      @update:value="Settings.saveDebounced(500)")

    NumField.-inline(
      label="settings.tabs.preview_title"
      v-model:value="Settings.state.previewTabsTitle"
      dbg="previewTabsTitle"
      :default="DEFAULT_SETTINGS.previewTabsTitle"
      :or="0"
      :allowNegative="false"
      :inactive="!Settings.state.previewTabs || Settings.state.previewTabsMode === 'i'"
      @update:value="Settings.saveDebounced(500)")
    NumField.-inline(
      label="settings.tabs.preview_url"
      v-model:value="Settings.state.previewTabsUrl"
      dbg="previewTabsUrl"
      :default="DEFAULT_SETTINGS.previewTabsUrl"
      :or="0"
      :allowNegative="false"
      :inactive="!Settings.state.previewTabs || Settings.state.previewTabsMode === 'i'"
      @update:value="Settings.saveDebounced(500)")

    SelectField(
      label="settings.tabs.preview_side"
      optLabel="settings.tabs.preview_side_"
      v-model:value="Settings.state.previewTabsSide"
      dbg="previewTabsSide"
      :default="DEFAULT_SETTINGS.previewTabsSide"
      :inactive="!Settings.state.previewTabs || Settings.state.previewTabsMode === 'i'"
      :opts="Settings.getOpts('previewTabsSide')"
      @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.tabs.preview_follow_mouse"
      v-model:value="Settings.state.previewTabsFollowMouse"
      dbg="previewTabsFollowMouse"
      :default="DEFAULT_SETTINGS.previewTabsFollowMouse"
      :inactive="!Settings.state.previewTabs || Settings.state.previewTabsMode === 'i'"
      @update:value="Settings.saveDebounced(150)")
    NumField.-inline(
      label="settings.tabs.preview_win_offset_y"
      v-model:value="Settings.state.previewTabsWinOffsetY"
      dbg="previewTabsWinOffsetY"
      :default="DEFAULT_SETTINGS.previewTabsWinOffsetY"
      :allowNegative="true"
      :or="0"
      :inactive="!Settings.state.previewTabs || (Settings.state.previewTabsMode !== 'w' && Settings.state.previewTabsPageModeFallback !== 'w')"
      @update:value="Settings.saveDebounced(500)")
    NumField.-inline(
      label="settings.tabs.preview_win_offset_x"
      v-model:value="Settings.state.previewTabsWinOffsetX"
      dbg="previewTabsWinOffsetX"
      :default="DEFAULT_SETTINGS.previewTabsWinOffsetX"
      :allowNegative="true"
      :or="0"
      :inactive="!Settings.state.previewTabs || (Settings.state.previewTabsMode !== 'w' && Settings.state.previewTabsPageModeFallback !== 'w')"
      @update:value="Settings.saveDebounced(500)")
    NumField.-inline(
      label="settings.tabs.preview_in_page_offset_y"
      v-model:value="Settings.state.previewTabsInPageOffsetY"
      dbg="previewTabsInPageOffsetY"
      :default="DEFAULT_SETTINGS.previewTabsInPageOffsetY"
      :allowNegative="true"
      :or="0"
      :inactive="!Settings.state.previewTabs || Settings.state.previewTabsMode !== 'p'"
      @update:value="Settings.saveDebounced(500)")
    NumField.-inline(
      label="settings.tabs.preview_in_page_offset_x"
      v-model:value="Settings.state.previewTabsInPageOffsetX"
      dbg="previewTabsInPageOffsetX"
      :default="DEFAULT_SETTINGS.previewTabsInPageOffsetX"
      :allowNegative="true"
      :or="0"
      :inactive="!Settings.state.previewTabs || Settings.state.previewTabsMode !== 'p'"
      @update:value="Settings.saveDebounced(500)")
    NumField.-inline(
      label="settings.tabs.preview_crop_right"
      v-model:value="Settings.state.previewTabsCropRight"
      dbg="previewTabsCropRight"
      :default="DEFAULT_SETTINGS.previewTabsCropRight"
      :or="0"
      :inactive="!Settings.state.previewTabs || Settings.state.previewTabsMode !== 'p'"
      @update:value="Settings.saveDebounced(500)")

  .wrapper(ref="nativeTabsEl")
    .sub-title: .text {{translate('settings.nav_settings_tabs_native')}}
    ToggleField.-no-separator(
      label="settings.hide_inactive_panel_tabs"
      :value="Settings.state.hideInact"
      dbg="hideInact"
      :default="DEFAULT_SETTINGS.hideInact"
      @update:value="toggleHideInact")
    ToggleField(
      label="settings.hide_folded_tabs"
      :inactive="!Settings.state.tabsTree"
      :value="Settings.state.hideFoldedTabs"
      dbg="hideFoldedTabs"
      :default="DEFAULT_SETTINGS.hideFoldedTabs"
      @update:value="toggleHideFoldedTabs")
    .sub-fields
      SelectField(
        label="settings.hide_folded_parent"
        optLabel="settings.hide_folded_parent_"
        v-model:value="Settings.state.hideFoldedParent"
        dbg="hideFoldedParent"
        :default="DEFAULT_SETTINGS.hideFoldedParent"
        :inactive="!Settings.state.hideFoldedTabs"
        :opts="Settings.getOpts('hideFoldedParent')"
        @update:value="Settings.saveDebounced(150)")
    ToggleField(
      label="settings.hide_unloaded_tabs"
      :inactive="!Settings.state.tabsTree"
      :value="Settings.state.hideUnloadedTabs"
      dbg="hideUnloadedTabs"
      :default="DEFAULT_SETTINGS.hideUnloadedTabs"
      @update:value="toggleHideUnloadedTabs")
    ToggleField(
      label="settings.native_highlight"
      :note="translate('settings.native_highlight_note')"
      v-model:value="Settings.state.nativeHighlight"
      dbg="nativeHighlight"
      :default="DEFAULT_SETTINGS.nativeHighlight"
      @update:value="Settings.saveDebounced(150)")
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { translate } from 'src/dict'
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from 'src/defaults'
import * as Settings from 'src/services/settings.fg'
import * as Permissions from 'src/services/permissions.fg'
import * as SetupPage from 'src/services/setup-page.fg'
import CountField from '../../components/count-field.vue'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'
import NumField from '../../components/num-field.vue'

const el = ref<HTMLElement | null>(null)
const newTabPosEl = ref<HTMLElement | null>(null)
const pinTabsEl = ref<HTMLElement | null>(null)
const tabsTreeEl = ref<HTMLElement | null>(null)
const tabsColorEl = ref<HTMLElement | null>(null)
const tabsPreviewEl = ref<HTMLElement | null>(null)
const nativeTabsEl = ref<HTMLElement | null>(null)

const newTabPosRelativeToActiveTab = computed<boolean>(() => {
  return (
    Settings.state.moveNewTab === 'after' ||
    Settings.state.moveNewTab === 'before' ||
    Settings.state.moveNewTab === 'first_child' ||
    Settings.state.moveNewTab === 'last_child'
  )
})

const newTabBtnPosRelativeToActiveTab = computed<boolean>(() => {
  return (
    Settings.state.moveNewTabButton === 'after' ||
    Settings.state.moveNewTabButton === 'before' ||
    Settings.state.moveNewTabButton === 'first_child' ||
    Settings.state.moveNewTabButton === 'last_child'
  )
})

function toggleActivateLastTabOnPanelSwitching(): void {
  Settings.state.activateLastTabOnPanelSwitching = !Settings.state.activateLastTabOnPanelSwitching

  if (!Settings.state.activateLastTabOnPanelSwitching && Settings.state.hideInact) {
    Settings.state.hideInact = false
  }

  Settings.saveDebounced(150)
}

async function toggleHideInact(): Promise<void> {
  if (!Settings.state.hideInact && !Permissions.reactive.tabHide) {
    const result = await Permissions.request('tabHide')
    if (!result) return
  }

  Settings.state.hideInact = !Settings.state.hideInact

  if (Settings.state.hideInact && !Settings.state.activateLastTabOnPanelSwitching) {
    Settings.state.activateLastTabOnPanelSwitching = true
  }

  if (Settings.state.hideInact && !Settings.state.tabsPanelSwitchActMove) {
    Settings.state.tabsPanelSwitchActMove = true
  }

  const notAlwaysSwitch = Settings.state.switchPanelAfterSwitchingTab !== 'always'
  if (Settings.state.hideInact && notAlwaysSwitch) {
    Settings.state.switchPanelAfterSwitchingTab = 'always'
  }

  Settings.saveDebounced(150)
}

function toggleTabsPanelSwitchActMove(): void {
  Settings.state.tabsPanelSwitchActMove = !Settings.state.tabsPanelSwitchActMove

  if (!Settings.state.tabsPanelSwitchActMove && Settings.state.hideInact) {
    Settings.state.hideInact = false
  }

  Settings.saveDebounced(150)
}

function toggleTabsPanelSwitchActMoveAuto(): void {
  Settings.state.tabsPanelSwitchActMoveAuto = !Settings.state.tabsPanelSwitchActMoveAuto

  if (!Settings.state.tabsPanelSwitchActMoveAuto && Settings.state.hideInact) {
    Settings.state.hideInact = false
  }

  Settings.saveDebounced(150)
}

async function toggleHideFoldedTabs(): Promise<void> {
  if (!Settings.state.hideInact && !Permissions.reactive.tabHide) {
    const result = await Permissions.request('tabHide')
    if (!result) return
  }

  Settings.state.hideFoldedTabs = !Settings.state.hideFoldedTabs

  Settings.saveDebounced(150)
}

async function toggleHideUnloadedTabs() {
  if (!Settings.state.hideInact && !Permissions.reactive.tabHide) {
    const result = await Permissions.request('tabHide')
    if (!result) return
  }

  Settings.state.hideUnloadedTabs = !Settings.state.hideUnloadedTabs

  Settings.saveDebounced(150)
}

function toggleSwitchPanelAfterSwitchingTab() {
  const notAlways = Settings.state.switchPanelAfterSwitchingTab !== 'always'

  if (notAlways && Settings.state.hideInact) {
    Settings.state.hideInact = false
  }

  Settings.saveDebounced(150)
}

async function togglePreviewTabs() {
  if (!Settings.state.previewTabs && !Permissions.reactive.webData) {
    const result = await Permissions.request('<all_urls>')
    if (!result) return
  }

  Settings.state.previewTabs = !Settings.state.previewTabs

  Settings.saveDebounced(150)
}

onMounted(() => {
  SetupPage.registerEl('settings_tabs', el.value)
  SetupPage.registerEl('settings_new_tab_position', newTabPosEl.value)
  SetupPage.registerEl('settings_pinned_tabs', pinTabsEl.value)
  SetupPage.registerEl('settings_tabs_tree', tabsTreeEl.value)
  SetupPage.registerEl('settings_tabs_colorization', tabsColorEl.value)
  SetupPage.registerEl('settings_tabs_preview', tabsPreviewEl.value)
  SetupPage.registerEl('settings_tabs_native', nativeTabsEl.value)
})
</script>
