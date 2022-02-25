import { PlurFn } from 'src/types'

const dict: Record<string, PlurFn | string> = {
  // ---
  // -- Bookmarks editor
  // -
  'bookmarks_editor.name_bookmark_placeholder': 'Bookmark name...',
  'bookmarks_editor.name_folder_placeholder': 'Folder name...',
  'bookmarks_editor.url_placeholder': 'e.g. https://example.com',

  // ---
  // -- Buttons
  // -
  'btn.create': 'Create',
  'btn.save': 'Save',
  'btn.restore': 'Restore',
  'btn.update': 'Update',
  'btn.yes': 'Yes',
  'btn.ok': 'Ok',
  'btn.no': 'No',
  'btn.cancel': 'Cancel',
  'btn.stop': 'Stop',

  // ---
  // -- Search
  // -
  'bar.search.placeholder': 'Search...',

  // ---
  // -- Confirm dialogs
  // -
  'confirm.warn_title': 'Warning',
  'confirm.tabs_close_pre': 'Are you sure you want to close ',
  'confirm.tabs_close_post': ' tabs?',
  'confirm.bookmarks_delete': 'Are you sure you want to delete selected bookmarks?',

  // ---
  // -- Panel
  // -
  'panel.nothing_found': 'Nothing found',
  'panel.nothing': 'Nothing...',

  // ---
  // -- Tabs panel
  // -
  'panel.tabs.title': 'Tabs',

  // ---
  // -- Bookmarks panel
  // -
  'panel.bookmarks.title': 'Bookmarks',
  'panel.bookmarks.req_perm': 'Bookmarks panel requires "Bookmarks" permission.',

  // ---
  // -- History panel
  // -
  'panel.history.title': 'History',
  'panel.history.load_more': 'Scroll to load more',
  'panel.history.req_perm': 'History panel requires "History" permission.',

  // ---
  // -- Downloads panel
  // -
  'panel.downloads.title': 'Downloads',
  'panel.downloads.req_perm': 'Downloads panel requires "Downloads" permission.',
  'panel.downloads.left': n => {
    const ms = n as number
    if (!ms || ms === -1) return 'Soon...'
    if (ms < 60000) return `${Math.round(ms / 1000)} sec left`
    if (ms < 3600000) return `${Math.round(ms / 60000)} min left`
    if (ms < 86400000) return `${Math.round(ms / 3600000)} hr left`
    return 'Someday...'
  },
  'panel.downloads.bps': n => {
    const bps = n as number
    if (!n) return '? B/s'
    if (bps < 1024) return `${bps} B/s`
    if (bps < 1048576) return `${Math.round(bps / 1024)} KB/s`
    return `${Math.round(bps / 1048576)} MB/s`
  },

  // ---
  // -- Popups
  // -
  // - Bookmarks popup
  'popup.bookmarks.name_label': 'Name',
  'popup.bookmarks.location_label': 'Location',
  'popup.bookmarks.location_new_folder_placeholder': 'New folder name',
  'popup.bookmarks.recent_locations_label': 'Recent locations',
  'popup.bookmarks.save_in_bookmarks': 'Save in bookmarks',
  'popup.bookmarks.edit_bookmark': 'Edit bookmark',
  'popup.bookmarks.edit_folder': 'Edit folder',
  'popup.bookmarks.select_root_folder': 'Select root folder',
  'popup.bookmarks.create_bookmark': 'Create bookmark',
  'popup.bookmarks.create_folder': 'Create folder',
  'popup.bookmarks.move_to': 'Move to',
  'popup.bookmarks.move': 'Move',
  'popup.bookmarks.create_bookmarks': 'Create bookmark[s]',
  'popup.bookmarks.restore': 'Restore from bookmarks folder',
  'popup.bookmarks.convert_title': 'Convert to bookmarks',
  'popup.bookmarks.convert': 'Convert',
  // - Tabs panel removing
  'popup.tabs_panel_removing.title': 'Removing panel',
  'popup.tabs_panel_removing.attach': 'Attach tabs to neighbour panel',
  'popup.tabs_panel_removing.leave': 'Leave tabs untouched',
  'popup.tabs_panel_removing.save': 'Save panel to bookmarks and close tabs',
  'popup.tabs_panel_removing.close': 'Close tabs',
  'popup.tabs_panel_removing.other_win_note':
    'Note: Tabs of this panel in other windows will be moved to the neighbour panel or left',
  // - Container fast-config popup
  'panel.fast_conf.title': 'Container',
  // - Container config popup
  'container.name_placeholder': 'Name...',
  'container.icon_label': 'Icon',
  'container.color_label': 'Color',
  'container.proxy_label': 'Proxy',
  'container.proxy_host_placeholder': '---',
  'container.proxy_port_placeholder': '---',
  'container.proxy_username_placeholder': '---',
  'container.proxy_password_placeholder': '---',
  'container.proxy_dns_label': 'proxy DNS',
  'container.proxy_http': 'HTTP',
  'container.proxy_https': 'TLS',
  'container.proxy_socks4': 'SOCKS4',
  'container.proxy_socks': 'SOCKS5',
  'container.proxy_direct': 'none',
  'container.rules_include': 'Include URLs',
  'container.rules_include_tooltip':
    'Reopen tabs with matched URLs in this container.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
  'container.rules_exclude': 'Exclude URLs',
  'container.rules_exclude_tooltip':
    'Reopen tabs with matched URL in default container.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
  'container.user_agent': 'User Agent',
  'container.new_container_name': 'Container',
  // - Panel fast-config popup
  'panel.fast_conf.title_tabs': 'Tabs panel',
  'panel.fast_conf.title_bookmarks': 'Bookmarks panel',
  'panel.fast_conf.name': 'Name',
  'panel.fast_conf.icon': 'Icon',
  'panel.fast_conf.color': 'Color',
  'panel.fast_conf.btn_more': 'More options...',
  // - Panel config popup
  'panel.name_placeholder': 'Name...',
  'panel.icon_label': 'Icon',
  'panel.color_label': 'Color',
  'panel.lock_panel_label': 'Prevent auto-switching from this panel',
  'panel.temp_mode_label': 'Switch back to previously active tabs panel after mouse leave',
  'panel.lock_tabs_label': 'Prevent closing tabs on this panel',
  'panel.skip_on_switching': 'Skip this panel when switching panels',
  'panel.no_empty_label': 'Create new tab after the last one is closed',
  'panel.new_tab_ctx': 'Container of new tab',
  'panel.drop_tab_ctx': 'Reopen tab that was dropped to this panel in container:',
  'panel.move_tab_ctx': 'Move tab to this panel if it is opened in container:',
  'panel.move_tab_ctx_nochild': 'Except child tabs',
  'panel.ctr_tooltip_none': 'Not set',
  'panel.ctr_tooltip_default': 'No container',
  'panel.url_rules': 'Move tabs with matched URLs to this panel',
  'panel.auto_convert': 'Convert to source tabs panel on opening bookmark',
  'panel.custom_icon_note':
    'Base64, URL or text. Text values syntax: "text::color::CSS-font-value"',
  'panel.custom_icon': 'Custom icon',
  'panel.custom_icon_load': 'Load',
  'panel.custom_icon_placeholder': 'e.g. A::#000000ff::700 32px Roboto',
  'panel.url_label': 'URL',
  'panel.root_id_label': 'Root folder',
  'panel.root_id.choose': 'Choose folder',
  'panel.root_id.reset': 'Reset',
  'panel.bookmarks_view_mode': 'View mode',
  'panel.bookmarks_view_mode_tree': 'tree',
  'panel.bookmarks_view_mode_history': 'history',
  'panel.new_tab_custom_btns': 'Additional "New tab" buttons',
  'panel.new_tab_custom_btns_placeholder': 'Container name and/or URL',
  'panel.new_tab_custom_btns_note':
    'Note: List of button configs. Example:\n  Personal  (open new tab in "Personal" container)\n  https://example.com  (open provided URL)\n  Personal, https://example.com  (open provided URL in "Personal" container)',

  // ---
  // -- Drag and Drop tooltips
  // -
  'dnd.tooltip.bookmarks_panel': 'Bookmarks panel',
  'dnd.tooltip.tabs_panel': 'panel',
  'dnd.tooltip.tabs': 'tabs',
  'dnd.tooltip.bookmarks': 'bookmarks',

  // ---
  // -- Context menu
  // -
  // - Toolbar button (browserAction)
  'menu.browserAction.open_settings': 'Open settings',
  'menu.browserAction.create_snapshot': 'Create snapshot',
  // - New tab bar
  'menu.new_tab_bar.no_container': 'No Container',
  'menu.new_tab_bar.new_container': 'In New Container',
  'menu.new_tab_bar.manage_containers': 'Manage Containers',
  // - Bookmark
  'menu.bookmark.open_in_sub_menu_name': 'Open in',
  'menu.bookmark.open_in_new_window': 'Open in new normal window',
  'menu.bookmark.open_in_new_priv_window': 'Open in new private window',
  'menu.bookmark.open_in_new_panel': 'Open in new tabs panel',
  'menu.bookmark.open_in_panel_': 'Open in panel...',
  'menu.bookmark.open_in_ctr_': 'Open in container...',
  'menu.bookmark.open_in_default_ctr': 'Open in default container',
  'menu.bookmark.open_in_': 'Open in ',
  'menu.bookmark.create_bookmark': 'Create bookmark',
  'menu.bookmark.create_folder': 'Create folder',
  'menu.bookmark.create_separator': 'Create separator',
  'menu.bookmark.edit_bookmark': 'Edit',
  'menu.bookmark.delete_bookmark': 'Delete',
  'menu.bookmark.sort_sub_menu_name': 'Sort',
  'menu.bookmark.sort_by_name': 'Sort by name',
  'menu.bookmark.sort_by_name_asc': 'Sort by name (A-z)',
  'menu.bookmark.sort_by_name_des': 'Sort by name (z-A)',
  'menu.bookmark.sort_by_link': 'Sort by URL',
  'menu.bookmark.sort_by_link_asc': 'Sort by URL (A-z)',
  'menu.bookmark.sort_by_link_des': 'Sort by URL (z-A)',
  'menu.bookmark.sort_by_time': 'Sort by creation time',
  'menu.bookmark.sort_by_time_asc': 'Sort by time (Old-New)',
  'menu.bookmark.sort_by_time_des': 'Sort by time (New-Old)',
  'menu.bookmark.open_as_bookmarks_panel': 'Open as bookmarks panel',
  'menu.bookmark.open_as_tabs_panel': 'Open as tabs panel',
  'menu.bookmark.move_to': 'Move to...',
  // - Bookmarks panel
  'menu.bookmark.collapse_all': 'Collapse all folders',
  'menu.bookmark.switch_view': 'View mode',
  'menu.bookmark.switch_view_history': 'History view',
  'menu.bookmark.switch_view_tree': 'Tree view',
  'menu.bookmark.convert_to_tabs_panel': 'Convert to tabs panel',
  'menu.bookmark.remove_panel': 'Remove panel',
  // - Tab
  'menu.tab.undo': 'Undo close tab',
  'menu.tab.move_to_sub_menu_name': 'Move to',
  'menu.tab.move_to_new_window': 'Move to new window',
  'menu.tab.move_to_new_priv_window': 'Move to private window',
  'menu.tab.move_to_another_window': 'Move to another window',
  'menu.tab.move_to_window_': 'Move to window...',
  'menu.tab.move_to_panel_label': 'Move to panel...',
  'menu.tab.move_to_panel_': 'Move to ',
  'menu.tab.move_to_new_panel': 'Move to new panel',
  'menu.tab.reopen_in_new_window': 'Reopen in new window of another type',
  'menu.tab.reopen_in_new_norm_window': 'Reopen in new normal window',
  'menu.tab.reopen_in_new_priv_window': 'Reopen in new private window',
  'menu.tab.reopen_in_norm_window': 'Reopen in normal window',
  'menu.tab.reopen_in_priv_window': 'Reopen in private window',
  'menu.tab.reopen_in_window': 'Reopen in window of another type',
  'menu.tab.reopen_in_default_panel': 'Reopen in default container',
  'menu.tab.reopen_in_new_container': 'Reopen in new container',
  'menu.tab.reopen_in_sub_menu_name': 'Reopen in',
  'menu.tab.reopen_in_ctr_': 'Reopen in container...',
  'menu.tab.reopen_in_': 'Reopen in ',
  'menu.tab.reopen_in_window_': 'Reopen in window...',
  'menu.tab.group': 'Group',
  'menu.tab.flatten': 'Flatten',
  'menu.tab.pin': 'Pin',
  'menu.tab.unpin': 'Unpin',
  'menu.tab.mute': 'Mute',
  'menu.tab.unmute': 'Unmute',
  'menu.tab.clear_cookies': 'Clear cookies',
  'menu.tab.discard': 'Unload',
  'menu.tab.bookmark': 'Add to bookmarks',
  'menu.tab.bookmarks': 'Create bookmarks',
  'menu.tab.reload': 'Reload',
  'menu.tab.duplicate': 'Duplicate',
  'menu.tab.close': 'Close',
  'menu.tab.close_descendants': 'Close descendants',
  'menu.tab.close_above': 'Close tabs above',
  'menu.tab.close_below': 'Close tabs below',
  'menu.tab.close_other': 'Close other tabs',
  // - Tabs panel
  'menu.tabs_panel.mute_all_audible': 'Mute all audible tabs',
  'menu.tabs_panel.dedup': 'Close duplicate tabs',
  'menu.tabs_panel.reload': 'Reload tabs',
  'menu.tabs_panel.discard': 'Unload tabs',
  'menu.tabs_panel.close': 'Close tabs',
  'menu.tabs_panel.collapse_inact_branches': 'Collapse inactive branches',
  'menu.tabs_panel.remove_panel': 'Remove panel',
  'menu.tabs_panel.bookmark': 'Save to bookmarks',
  'menu.tabs_panel.restore_from_bookmarks': 'Restore from bookmarks',
  'menu.tabs_panel.convert_to_bookmarks_panel': 'Convert to bookmarks panel',
  // - History
  'menu.history.open': 'Open',
  // - Downloads
  'menu.download.open_file': 'Open file',
  'menu.download.open_page': 'Open download page',
  'menu.download.open_dir': 'Open folder',
  'menu.download.copy_full_path': 'Copy full path',
  'menu.download.copy_ref': 'Copy referrer URL',
  'menu.download.copy_url': 'Copy download URL',
  'menu.download.remove': 'Delete download',
  'menu.download.pause_all_active': 'Pause all active',
  'menu.download.resume_all_paused': 'Resume all paused',
  // - Common
  'menu.copy_urls': n => (n === 1 ? 'Copy URL' : 'Copy URLs'),
  'menu.copy_titles': n => (n === 1 ? 'Copy title' : 'Copy titles'),
  'menu.common.pin_panel': 'Pin panel',
  'menu.common.unpin_panel': 'Unpin panel',
  'menu.common.conf': 'Configure panel',
  'menu.common.conf_tooltip': 'Configure panel\nAlt: Basic panel config',
  'menu.panels.unload': 'Unload',
  // - Menu Editor
  'menu.editor.reset': 'Reset',
  'menu.editor.create_separator': 'Create separator',
  'menu.editor.create_sub_tooltip': 'Create sub-menu',
  'menu.editor.up_tooltip': 'Move up',
  'menu.editor.down_tooltip': 'Move down',
  'menu.editor.disable_tooltip': 'Disable',
  'menu.editor.tabs_title': 'Tabs',
  'menu.editor.tabs_panel_title': 'Tabs panel',
  'menu.editor.bookmarks_title': 'Bookmarks',
  'menu.editor.bookmarks_panel_title': 'Bookmarks panel',
  'menu.editor.inline_group_title': 'Sub-menu label...',
  'menu.editor.list_title': 'List',
  'menu.editor.disabled_title': 'Disabled',

  // ---
  // -- Navigation bar
  // -
  'nav.show_hidden_tooltip': 'Show hidden panels',
  'nav.btn_settings': 'Settings',
  'nav.btn_add_tp': 'Create tabs panel',
  'nav.btn_search': 'Search',
  'nav.btn_create_snapshot': 'Create snapshot',
  'nav.btn_remute_audio_tabs': 'Mute/Unmute audible tabs',

  // ---
  // -- Notifications
  // -
  'notif.hide_tooltip': 'Hide notification',
  'notif.undo_ctrl': 'Undo',
  'notif.tabs_rm_post': ' tabs closed',
  'notif.bookmarks_rm_post': n => (n === 1 ? ' bookmark removed' : ' bookmarks removed'),
  'notif.bookmarks_sort': 'Sorting bookmarks...',
  'notif.snapshot_created': 'Snapshot created',
  'notif.view_snapshot': 'View',
  'notif.tabs_err': 'Wrong tabs position detected',
  'notif.tabs_err_fix': 'Update tabs',
  'notif.tabs_reloading': 'Reloading tabs',
  'notif.tabs_reloading_stop': 'Stop',
  'notif.tabs_panel_saving_bookmarks': 'Saving to bookmarks...',
  'notif.tabs_panel_saved_bookmarks': 'Panel saved',
  'notif.tabs_panel_updated_bookmarks': 'Bookmarks updated',
  'notif.download_in': 'In:',
  'notif.download_from': 'From:',
  'notif.download_err': 'Error:',
  'notif.download_retry': 'Reload',
  'notif.download_retry_failed': 'Cannot reload download',
  'notif.download_open_file': 'Open file',
  'notif.download_open_dir': 'Open folder',
  'notif.converting': 'Converting...',
  'notif.tabs_panel_to_bookmarks_err': 'Cannot save tabs panel to bookmarks',
  'notif.tabs_panel_to_bookmarks_err.folder': 'Cannot create destination folder',
  'notif.tabs_panel_to_bookmarks_err.bookmarks': 'Cannot create bookmarks',
  'notif.restore_from_bookmarks_err': 'Cannot restore panel from bookmarks',
  'notif.restore_from_bookmarks_err.root': 'Root folder not found',
  'notif.restore_from_bookmarks_ok': 'Tabs panel was restored',
  'notif.done': 'Done',
  'notif.new_bookmark': 'New bookmark added',

  // ---
  // -- Settings
  // -
  'settings.opt_true': 'on',
  'settings.opt_false': 'off',
  'settings.nav_settings': 'Settings',
  'settings.nav_settings_general': 'General',
  'settings.nav_settings_menu': 'Menu',
  'settings.nav_settings_nav': 'Navigation bar',
  'settings.nav_settings_panels': 'Panels',
  'settings.nav_settings_controlbar': 'Control bar',
  'settings.nav_settings_group': 'Group page',
  'settings.nav_settings_containers': 'Containers',
  'settings.nav_settings_dnd': 'Drag and Drop',
  'settings.nav_settings_search': 'Search',
  'settings.nav_settings_tabs': 'Tabs',
  'settings.nav_settings_new_tab_position': 'Position of new tab',
  'settings.nav_settings_pinned_tabs': 'Pinned tabs',
  'settings.nav_settings_tabs_tree': 'Tabs tree',
  'settings.nav_settings_bookmarks': 'Bookmarks',
  'settings.nav_settings_downloads': 'Downloads',
  'settings.nav_settings_history': 'History',
  'settings.nav_settings_appearance': 'Appearance',
  'settings.nav_settings_snapshots': 'Snapshots',
  'settings.nav_settings_mouse': 'Mouse',
  'settings.nav_settings_keybindings': 'Keybindings',
  'settings.nav_settings_permissions': 'Permissions',
  'settings.nav_settings_storage': 'Storage',
  'settings.nav_settings_sync': 'Sync',
  'settings.nav_settings_help': 'Help',
  'settings.nav_menu_editor': 'Menu editor',
  'settings.nav_menu_editor_tabs': 'Tabs',
  'settings.nav_menu_editor_tabs_panel': 'Tabs panel',
  'settings.nav_menu_editor_bookmarks': 'Bookmarks',
  'settings.nav_menu_editor_bookmarks_panel': 'Bookmarks panel',
  'settings.nav_styles_editor': 'Styles editor',
  'settings.nav_snapshots': 'Snapshots viewer',

  // - Details controls
  'settings.ctrl_update': 'UPDATE',
  'settings.ctrl_copy': 'COPY',
  'settings.ctrl_close': 'CLOSE',

  // - General
  'settings.general_title': 'General',
  'settings.native_scrollbars': 'Use native scroll-bars',
  'settings.native_scrollbars_thin': 'Use thin scroll-bars',
  'settings.sel_win_screenshots': 'Show screenshots in the window selection menu',
  'settings.update_sidebar_title': "Use active panel's name as sidebar title",

  // - Context menu
  'settings.ctx_menu_title': 'Context menu',
  'settings.ctx_menu_native': 'Use native context menu',
  'settings.ctx_menu_render_inact': 'Render inactive options',
  'settings.ctx_menu_render_icons': 'Render icons',
  'settings.ctx_menu_ignore_ctr': 'Ignore containers',
  'settings.ctx_menu_ignore_ctr_or': 'e.g. /^tmp.+/, Google, Facebook',
  'settings.ctx_menu_ignore_ctr_note': 'Use comma-separated list of contaianers names or /regexp/',
  'settings.ctx_menu_editor': 'Edit context menu',

  // - Navigation bar
  'settings.nav_title': 'Navigation bar',
  'settings.nav_bar_layout': 'Layout',
  'settings.nav_bar_layout_horizontal': 'horizontal',
  'settings.nav_bar_layout_vertical': 'vertical',
  'settings.nav_bar_layout_hidden': 'hidden',
  'settings.nav_bar_inline': 'Show navigation bar in one line',
  'settings.nav_bar_side': 'Side',
  'settings.nav_bar_side_left': 'left',
  'settings.nav_bar_side_right': 'right',
  'settings.nav_btn_count': 'Show count of tabs/bookmarks',
  'settings.hide_empty_panels': 'Hide empty tabs panels',
  'settings.nav_act_tabs_panel_left_click': 'Left click on active tabs panel',
  'settings.nav_act_tabs_panel_left_click_new_tab': 'create tab',
  'settings.nav_act_tabs_panel_left_click_none': 'none',
  'settings.nav_act_bookmarks_panel_left_click': 'Left click on active bookmarks panel',
  'settings.nav_act_bookmarks_panel_left_click_scroll': 'scroll to start/end',
  'settings.nav_act_bookmarks_panel_left_click_none': 'none',
  'settings.nav_tabs_panel_mid_click': 'Middle click on tabs panel',
  'settings.nav_tabs_panel_mid_click_rm_act_tab': 'close active tab',
  'settings.nav_tabs_panel_mid_click_rm_all': 'close tabs',
  'settings.nav_tabs_panel_mid_click_discard': 'unload tabs',
  'settings.nav_tabs_panel_mid_click_bookmark': 'save panel to bookmarks',
  'settings.nav_tabs_panel_mid_click_convert': 'convert to bookmarks',
  'settings.nav_tabs_panel_mid_click_none': 'none',
  'settings.nav_bookmarks_panel_mid_click': 'Middle click on bookmarks panel',
  'settings.nav_bookmarks_panel_mid_click_convert': 'convert to tabs',
  'settings.nav_bookmarks_panel_mid_click_none': 'none',
  'settings.nav_switch_panels_wheel': 'Switch panels with mouse wheel',
  'settings.nav_bar_enabled': 'Enabled elements',
  'settings.nav_bar.no_elements': 'No elements',
  'settings.nav_bar.available_elements': 'Available elements',
  'settings.nav_bar_btn_tabs_panel': 'Tabs panel',
  'settings.nav_bar_btn_bookmarks_panel': 'Bookmarks panel',
  'settings.nav_bar_btn_sp': 'Space',
  'settings.nav_bar_btn_sd': 'Delimiter',
  'settings.nav_bar_btn_history': 'History panel',
  'settings.nav_bar_btn_downloads': 'Downloads panel',
  'settings.nav_bar_btn_settings': 'Settings',
  'settings.nav_bar_btn_add_tp': 'Create tabs panel',
  'settings.nav_bar_btn_search': 'Search',
  'settings.nav_bar_btn_create_snapshot': 'Create snapshot',
  'settings.nav_bar_btn_remute_audio_tabs': 'Mute/Unmute audible tabs',
  'settings.nav_rm_tabs_panel_confirm_pre': 'Delete "',
  'settings.nav_rm_tabs_panel_confirm_post':
    '" panel?\nAll tabs of this panel will be assigned to nearest tabs panel.',
  'settings.nav_rm_bookmarks_panel_confirm_pre': 'Delete "',
  'settings.nav_rm_bookmarks_panel_confirm_post': '" panel?',

  // - Group page
  'settings.group_title': 'Group page',
  'settings.group_layout': 'Layout of tabs',
  'settings.group_layout_grid': 'grid',
  'settings.group_layout_list': 'list',

  // - Containers
  'settings.containers_title': 'Containers',
  'settings.contianer_remove_confirm_prefix': 'Are you sure you want to delete "',
  'settings.contianer_remove_confirm_postfix': '" container?',
  'settings.containers_create_btn': 'Create container',

  // - Drag and drop
  'settings.dnd_title': 'Drag and Drop',
  'settings.dnd_tab_act': 'Activate tab on hover',
  'settings.dnd_tab_act_delay': 'With delay (ms)',
  'settings.dnd_mod': 'With pressed key',
  'settings.dnd_mod_alt': 'alt',
  'settings.dnd_mod_shift': 'shift',
  'settings.dnd_mod_ctrl': 'ctrl',
  'settings.dnd_mod_none': 'none',
  'settings.dnd_exp': 'Expand/Fold the branch on hovering over the',
  'settings.dnd_exp_pointer': "pointer's triangle",
  'settings.dnd_exp_hover': 'tab/bookmark',
  'settings.dnd_exp_none': 'none',
  'settings.dnd_exp_delay': 'With delay (ms)',

  // - Search
  'settings.search_title': 'Search',
  'settings.search_bar_mode': 'Search bar mode',
  'settings.search_bar_mode_static': 'always shown',
  'settings.search_bar_mode_dynamic': 'dynamic',
  'settings.search_bar_mode_none': 'inactive',

  // - Tabs
  'settings.tabs_title': 'Tabs',
  'settings.warn_on_multi_tab_close': 'Warn on trying to close multiple tabs',
  'settings.warn_on_multi_tab_close_any': 'any',
  'settings.warn_on_multi_tab_close_collapsed': 'collapsed',
  'settings.warn_on_multi_tab_close_none': 'none',
  'settings.activate_on_mouseup': 'Activate tab on mouse button release',
  'settings.activate_last_tab_on_panel_switching': 'Activate last active tab on panel switching',
  'settings.skip_empty_panels': 'Skip empty panels on switching',
  'settings.show_tab_rm_btn': 'Show close button on mouse hover',
  'settings.show_tab_ctx': 'Show colored mark of container',
  'settings.hide_inactive_panel_tabs': 'Hide native tabs of inactive panels',
  'settings.activate_after_closing': 'After closing current tab activate',
  'settings.activate_after_closing_next': 'next tab',
  'settings.activate_after_closing_prev': 'previous tab',
  'settings.activate_after_closing_prev_act': 'previously active tab',
  'settings.activate_after_closing_none': 'none',
  'settings.activate_after_closing_prev_rule': 'Previous tab rule',
  'settings.activate_after_closing_next_rule': 'Next tab rule',
  'settings.activate_after_closing_rule_tree': 'tree',
  'settings.activate_after_closing_rule_visible': 'visible',
  'settings.activate_after_closing_rule_any': 'any',
  'settings.activate_after_closing_global': 'Globally',
  'settings.activate_after_closing_no_folded': 'Ignore folded tabs',
  'settings.activate_after_closing_no_discarded': 'Ignore discarded tabs',
  'settings.shift_selection_from_active': 'Start shift+click selection from the active tab',
  'settings.ask_new_bookmark_place': 'Ask where to store bookmarks',
  'settings.tabs_rm_undo_note': 'Show undo notification on closing multiple tabs',
  'settings.native_highlight':
    'Highlight native tabs (in top horizontal bar) along with tabs in sidebar',
  'settings.tabs_unread_mark': 'Show mark on unread tabs',
  'settings.tabs_reload_limit': 'Limit the count of simultaneously reloading tabs',
  'settings.tabs_reload_limit_notif': 'Show notification with the reloading progress',
  'settings.tabs_panel_switch_act_move': 'Switch panel after moving active tab to another panel',
  'settings.show_new_tab_btns': 'Show new tab buttons',
  'settings.new_tab_bar_position': 'Position',
  'settings.new_tab_bar_position_after_tabs': 'after tabs',
  'settings.new_tab_bar_position_bottom': 'bottom',
  'settings.discard_inactive_panel_tabs_delay': 'Unload tabs of inactive panel after delay',
  'settings.discard_inactive_panel_tabs_delay_sec': n => (n === 1 ? 'second' : 'seconds'),
  'settings.discard_inactive_panel_tabs_delay_min': n => (n === 1 ? 'minute' : 'minutes'),
  'settings.tabs_second_click_act_prev': 'Backward activation when clicking on the active tab',

  // - New tab position
  'settings.new_tab_position': 'Position of new tab',
  'settings.move_new_tab_pin': 'Place new tab opened from pinned tab',
  'settings.move_new_tab_pin_start': 'panel start',
  'settings.move_new_tab_pin_end': 'panel end',
  'settings.move_new_tab_pin_none': 'none',
  'settings.move_new_tab_parent': 'Place new tab opened from another tab',
  'settings.move_new_tab_parent_before': 'before parent',
  'settings.move_new_tab_parent_sibling': 'after parent',
  'settings.move_new_tab_parent_first_child': 'first child',
  'settings.move_new_tab_parent_last_child': 'last child',
  'settings.move_new_tab_parent_start': 'panel start',
  'settings.move_new_tab_parent_end': 'panel end',
  'settings.move_new_tab_parent_default': 'default',
  'settings.move_new_tab_parent_none': 'none',
  'settings.move_new_tab_parent_act_panel': 'Only if panel of parent tab is active',
  'settings.move_new_tab': 'Place new tab (for the other cases)',
  'settings.move_new_tab_start': 'panel start',
  'settings.move_new_tab_end': 'panel end',
  'settings.move_new_tab_before': 'before active tab',
  'settings.move_new_tab_after': 'after active tab',
  'settings.move_new_tab_first_child': 'first child of active tab',
  'settings.move_new_tab_last_child': 'last child of active tab',
  'settings.move_new_tab_none': 'none',

  // - Pinned tabs
  'settings.pinned_tabs_title': 'Pinned tabs',
  'settings.pinned_tabs_position': 'Pinned tabs position',
  'settings.pinned_tabs_position_top': 'top',
  'settings.pinned_tabs_position_left': 'left',
  'settings.pinned_tabs_position_right': 'right',
  'settings.pinned_tabs_position_bottom': 'bottom',
  'settings.pinned_tabs_position_panel': 'panel',
  'settings.pinned_tabs_list': 'Show titles of pinned tabs',
  'settings.pinned_auto_group': 'Group tabs that were opened from a pinned tab',

  // - Tabs tree
  'settings.tabs_tree_title': 'Tabs tree',
  'settings.tabs_tree_layout': 'Tabs tree structure',
  'settings.group_on_open_layout': 'Create sub-tree on opening link in new tab',
  'settings.tabs_tree_limit': 'Tabs tree level limit',
  'settings.tabs_tree_limit_1': '1',
  'settings.tabs_tree_limit_2': '2',
  'settings.tabs_tree_limit_3': '3',
  'settings.tabs_tree_limit_4': '4',
  'settings.tabs_tree_limit_5': '5',
  'settings.tabs_tree_limit_none': 'none',
  'settings.hide_folded_tabs': 'Hide folded tabs',
  'settings.auto_fold_tabs': 'Auto fold tabs',
  'settings.auto_fold_tabs_except': 'Max count of open branches',
  'settings.auto_fold_tabs_except_1': '1',
  'settings.auto_fold_tabs_except_2': '2',
  'settings.auto_fold_tabs_except_3': '3',
  'settings.auto_fold_tabs_except_4': '4',
  'settings.auto_fold_tabs_except_5': '5',
  'settings.auto_fold_tabs_except_none': 'none',
  'settings.auto_exp_tabs': 'Auto expand tab on activation',
  'settings.rm_child_tabs': 'Close child tabs along with parent',
  'settings.rm_child_tabs_all': 'all',
  'settings.rm_child_tabs_folded': 'folded',
  'settings.rm_child_tabs_none': 'none',
  'settings.tabs_child_count': 'Show count of descendants on the folded tab',
  'settings.tabs_lvl_dots': 'Show marks to indicate tabs sub-tree levels',
  'settings.discard_folded': 'Unload folded tabs',
  'settings.discard_folded_delay': 'With delay',
  'settings.discard_folded_delay_sec': n => (n === 1 ? 'second' : 'seconds'),
  'settings.discard_folded_delay_min': n => (n === 1 ? 'minute' : 'minutes'),
  'settings.tabs_tree_bookmarks': 'Preserve tree on creating bookmarks',
  'settings.tree_rm_outdent': 'After closing parent tab, outdent',
  'settings.tree_rm_outdent_branch': 'whole branch',
  'settings.tree_rm_outdent_first_child': 'first child',

  // - Bookmarks
  'settings.bookmarks_title': 'Bookmarks',
  'settings.bookmarks_panel': 'Bookmarks panel',
  'settings.bookmarks_layout': 'Bookmarks layout',
  'settings.bookmarks_layout_tree': 'tree',
  'settings.bookmarks_layout_history': 'history',
  'settings.warn_on_multi_bookmark_delete': 'Warn on trying delete multiple bookmarks',
  'settings.warn_on_multi_bookmark_delete_any': 'any',
  'settings.warn_on_multi_bookmark_delete_collapsed': 'collapsed',
  'settings.warn_on_multi_bookmark_delete_none': 'none',
  'settings.open_bookmark_new_tab': 'Open bookmark in new tab',
  'settings.mid_click_bookmark': 'Middle click on the bookmark',
  'settings.mid_click_bookmark_open_new_tab': 'open in new tab',
  'settings.mid_click_bookmark_edit': 'edit',
  'settings.mid_click_bookmark_delete': 'delete',
  'settings.act_mid_click_tab': 'Activate tab',
  'settings.auto_close_bookmarks': 'Auto-close folders',
  'settings.auto_rm_other': 'Delete open bookmarks from "Other Bookmarks" folder',
  'settings.show_bookmark_len': 'Show folder size',
  'settings.highlight_open_bookmarks': 'Mark open bookmarks',
  'settings.activate_open_bookmark_tab': 'Go to open tab instead of opening new one',
  'settings.bookmarks_rm_undo_note': 'Show undo notification after deleting bookmarks',
  'settings.fetch_bookmarks_favs': 'Fetch favicons',
  'settings.fetch_bookmarks_favs_stop': 'Stop fetching',
  'settings.fetch_bookmarks_favs_done': 'done',
  'settings.fetch_bookmarks_favs_errors': 'errors',
  'settings.load_bookmarks_on_demand': 'Load bookmarks on demand',
  'settings.pin_opened_bookmarks_folder': 'Pin opened folder when scrolling',

  // - Downloads
  'settings.downloads_title': 'Downloads',
  'settings.load_downloads_on_demand': 'Load downloads on demand',
  'settings.show_notif_on_download_ok': 'Show notification of successful download',
  'settings.show_notif_on_download_err': 'Show notification of failed download',

  // - History
  'settings.history_title': 'History',
  'settings.load_history_on_demand': 'Load history on demand',

  // - Appearance
  'settings.appearance_title': 'Appearance',
  'settings.font_size': 'Font size',
  'settings.font_size_xxs': 'XXS',
  'settings.font_size_xs': 'XS',
  'settings.font_size_s': 'S',
  'settings.font_size_m': 'M',
  'settings.font_size_l': 'L',
  'settings.font_size_xl': 'XL',
  'settings.font_size_xxl': 'XXL',
  'settings.theme': 'Theme',
  'settings.theme_proton': 'proton',
  'settings.theme_compact': 'compact',
  'settings.theme_plain': 'plain',
  'settings.theme_none': 'none',
  'settings.switch_color_scheme': 'Color scheme',
  'settings.color_scheme_dark': 'dark',
  'settings.color_scheme_light': 'light',
  'settings.color_scheme_sys': 'dark/light',
  'settings.color_scheme_ff': 'firefox',
  'settings.bg_noise': 'Frosted background',
  'settings.animations': 'Animations',
  'settings.animation_speed': 'Animations speed',
  'settings.animation_speed_fast': 'fast',
  'settings.animation_speed_norm': 'normal',
  'settings.animation_speed_slow': 'slow',
  'settings.edit_styles': 'Edit styles',
  'settings.edit_theme': 'Edit theme',
  'settings.appearance_notes_title': 'Notes:',
  'settings.appearance_notes':
    '- To apply theme color to Sidebery buttons in browser interface set "svg.context-properties.content.enabled" to "true" in about:config page.',

  // - Snapshots
  'settings.snapshots_title': 'Snapshots',
  'settings.snap_notify': 'Show notification after snapshot creation',
  'settings.snap_exclude_private': 'Exclude private windows',
  'settings.snap_interval': 'Auto-snapshots interval',
  'settings.snap_interval_min': n => (n === 1 ? 'minute' : 'minutes'),
  'settings.snap_interval_hr': n => (n === 1 ? 'hour' : 'hours'),
  'settings.snap_interval_day': n => (n === 1 ? 'day' : 'days'),
  'settings.snap_interval_none': 'none',
  'settings.snap_limit': 'Snapshots limit',
  'settings.snap_limit_snap': n => (n === 1 ? 'snapshot' : 'snapshots'),
  'settings.snap_limit_kb': n => (n === 1 ? 'kbyte' : 'kbytes'),
  'settings.snap_limit_day': n => (n === 1 ? 'day' : 'days'),
  'settings.snapshots_view_label': 'View snapshots',
  'settings.make_snapshot': 'Create snapshot',
  'settings.rm_all_snapshots': 'Remove all snapshots',
  'settings.apply_snapshot': 'apply',
  'settings.rm_snapshot': 'remove',

  // - Mouse
  'settings.mouse_title': 'Mouse',
  'settings.h_scroll_through_panels': 'Use horizontal scroll to switch panels',
  'settings.scroll_through_tabs': 'Switch tabs with scroll wheel',
  'settings.scroll_through_tabs_panel': 'panel',
  'settings.scroll_through_tabs_global': 'global',
  'settings.scroll_through_tabs_none': 'none',
  'settings.scroll_through_visible_tabs': 'Skip folded tabs',
  'settings.scroll_through_tabs_skip_discarded': 'Skip discarded tabs',
  'settings.scroll_through_tabs_except_overflow': 'Except if panel is overflowing',
  'settings.scroll_through_tabs_cyclic': 'Cyclically',
  'settings.long_click_delay': 'Long click delay (ms)',

  'settings.nav_actions_sub_title': 'Navigation bar actions',

  'settings.tab_actions_sub_title': 'Tab actions',
  'settings.tab_double_click': 'Double click on tab',
  'settings.tab_long_left_click': 'Long left click on tab',
  'settings.tab_long_right_click': 'Long right click on tab',
  'settings.tab_close_middle_click': 'Middle click on close tab button',
  'settings.tab_action_reload': 'reload',
  'settings.tab_action_duplicate': 'duplicate',
  'settings.tab_action_pin': 'pin',
  'settings.tab_action_mute': 'mute',
  'settings.tab_action_clear_cookies': 'clear cookies',
  'settings.tab_action_exp': 'expand',
  'settings.tab_action_new_after': 'new sibling tab',
  'settings.tab_action_new_child': 'new child tab',
  'settings.tab_action_close': 'close tab',
  'settings.tab_action_discard': 'unload',
  'settings.tab_action_none': 'none',

  'settings.tabs_panel_actions_sub_title': 'Tabs panel actions',
  'settings.tabs_panel_left_click_action': 'Left click on tabs panel',
  'settings.tabs_panel_double_click_action': 'Double click on tabs panel',
  'settings.tabs_panel_right_click_action': 'Right click on tabs panel',
  'settings.tabs_panel_middle_click_action': 'Middle click on tabs panel',
  'settings.tabs_panel_action_tab': 'create tab',
  'settings.tabs_panel_action_prev': 'previous panel',
  'settings.tabs_panel_action_next': 'next panel',
  'settings.tabs_panel_action_expand': 'expand/fold',
  'settings.tabs_panel_action_parent': 'activate parent tab',
  'settings.tabs_panel_action_menu': 'show menu',
  'settings.tabs_panel_action_collapse': 'collapse inactive branches',
  'settings.tabs_panel_action_undo': 'undo tab close',
  'settings.tabs_panel_action_rm_act_tab': 'close active tab',
  'settings.tabs_panel_action_none': 'none',

  // - Keybindings
  'settings.kb_title': 'Keybindings',
  'settings.kb_input': 'Press new shortcut',
  'settings.kb_err_duplicate': 'Already exists',
  'settings.kb_err_invalid': 'Invalid shortcut',
  'settings.reset_kb': 'Reset Keybindings',
  'settings.toggle_kb': 'Enable/Disable Keybindings',
  'settings.enable_kb': 'Enable Keybindings',
  'settings.disable_kb': 'Disable Keybindings',

  // - Permissions
  'settings.permissions_title': 'Permissions',
  'settings.all_urls_label': 'Accessing web requests data:',
  'settings.all_urls_info':
    'Required for:\n- Cleaning cookies\n- Proxy and URL rules of containers\n- Screenshots for the group page and windows selection panel\n- Changing the User-Agent per container',
  'settings.perm.bookmarks_label': 'Bookmarks:',
  'settings.perm.bookmarks_info': 'Required for:\n- Bookmarks panels',
  'settings.tab_hide_label': 'Hiding tabs:',
  'settings.tab_hide_info': 'Required for:\n- Hiding tabs in inactive panels\n- Hiding folded tabs',
  'settings.clipboard_write_label': 'Writing to clipboard:',
  'settings.clipboard_write_info':
    'Required for:\n- Copying URLs of tabs/bookmarks through context menu',
  'settings.history_label': 'History:',
  'settings.history_info': 'Required for:\n- History panel',
  'settings.downloads_label': 'Downloads:',
  'settings.downloads_info': 'Required for:\n- Downloads panel',

  // - Storage
  'settings.storage_title': 'Storage',
  'settings.storage_delete_prop': 'delete',
  'settings.storage_edit_prop': 'edit',
  'settings.storage_open_prop': 'open',
  'settings.storage_delete_confirm': 'Delete property ',
  'settings.update_storage_info': 'Update',
  'settings.clear_storage_info': 'Clear',
  'settings.clear_storage_confirm': 'Are you sure you want to delete all Sidebery data?',

  // - Sync
  'settings.sync_title': 'Sync',
  'settings.sync_name': 'Profile name for sync',
  'settings.sync_name_or': 'e.g: Firefox Beta Home',
  'settings.sync_save_settings': 'Save settings to sync storage',
  'settings.sync_save_ctx_menu': 'Save context menu to sync storage',
  'settings.sync_save_styles': 'Save styles to sync storage',
  'settings.sync_auto_apply': 'Automatically apply changes',
  'settings.sync_settings_title': 'Settings',
  'settings.sync_ctx_menu_title': 'Context menu',
  'settings.sync_styles_title': 'Styles',
  'settings.sync_apply_btn': 'Apply',
  'settings.sync_delete_btn': 'Delete',
  'settings.sync_update_btn': 'Update synced data',
  'settings.sync_apply_confirm': 'Are you sure you want to apply synced data?',
  'settings.sync.apply_err': 'Cannot apply synchronized data',

  // - Help
  'settings.help_title': 'Help',
  'settings.debug_info': 'Show debug info',
  'settings.log_lvl': 'Logs level',
  'settings.log_lvl_0': 'none',
  'settings.log_lvl_1': 'errors',
  'settings.log_lvl_2': 'warnings',
  'settings.log_lvl_3': 'all',
  'settings.copy_devtools_url': 'Copy devtools URL',
  'settings.repo_issue': 'Open issue',
  'settings.repo_bug': 'Report a bug',
  'settings.repo_feature': 'Suggest a feature',
  'settings.reset_settings': 'Reset settings',
  'settings.reset_confirm': 'Are you sure you want to reset settings?',
  'settings.ref_rm': 'Will be removed; open an issue if you need this feature.',
  'settings.help_exp_data': 'Export',
  'settings.help_imp_data': 'Import',
  'settings.help_imp_perm': 'Additional permissions are required',
  'settings.export_title': 'Select what to export',
  'settings.import_title': 'Select what to import',
  'settings.backup_all': 'All',
  'settings.backup_containers': 'Containers config',
  'settings.backup_settings': 'Settings',
  'settings.backup_styles': 'Styles',
  'settings.backup_snapshots': 'Snapshots',
  'settings.backup_favicons': 'Sites icons cache',
  'settings.backup_kb': 'Keybindings',
  'settings.backup_parse_err': 'Wrong format of imported data',
  'settings.reload_addon': 'Reload add-on',
  'settings.mark_window': "Add preface to the browser window's title if sidebery is active",
  'settings.mark_window_preface': 'Preface value',

  // ---
  // -- Snapshots viewer
  // -
  'snapshot.window_title': 'Window',
  'snapshot.btn_open': 'Open',
  'snapshot.btn_apply': 'Apply',
  'snapshot.btn_remove': 'Remove',
  'snapshot.btn_create_snapshot': 'Create snapshot',
  'snapshot.btn_open_all_win': 'Open all windows',
  'snapshot.btn_open_win': 'Open window',
  'snapshot.btn_create_first': 'Create first snapshot',
  'snapshot.snap_win': n => (n === 1 ? 'window' : 'windows'),
  'snapshot.snap_ctr': n => (n === 1 ? 'container' : 'containers'),
  'snapshot.snap_tab': n => (n === 1 ? 'tab' : 'tabs'),
  'snapshot.selected': 'Selected:',
  'snapshot.sel.open_in_panel': 'Open in current panel',
  'snapshot.sel.reset_sel': 'Reset selection',

  // ---
  // -- Styles editor
  // -
  'styles.reset_styles': 'Reset CSS variables',
  'styles.css_sidebar': 'Sidebar',
  'styles.css_group': 'Group page',
  'styles.css_placeholder': 'Write custom CSS here...',
  'styles.css_selectors_instruction': `NOTE: To get currently available css-selectors use debugger:
  - Click "Copy debtools URL" button in the bottom bar
  - Open new tab with that URL
  - Select frame to inspect
    - Click on the rectangular icon (with three sections) in top-right area of the debugger page
    - Select "/sidebar/index.html" for sidebar frame
    - Select "/page.group/group.html" for group page frame
  - Browse "Inspector" tab`,
  'styles.vars_group.other': 'Other',
  'styles.vars_group.animation': 'Animation speed',
  'styles.vars_group.buttons': 'Buttons',
  'styles.vars_group.scroll': 'Scroll',
  'styles.vars_group.menu': 'Context menu',
  'styles.vars_group.nav': 'Navigation bar',
  'styles.vars_group.pinned_dock': 'Pinned tabs dock',
  'styles.vars_group.tabs': 'Tabs',
  'styles.vars_group.bookmarks': 'Bookmarks',

  // ---
  // -- Time
  // -
  'time.month_0': 'January',
  'time.month_1': 'February',
  'time.month_2': 'March',
  'time.month_3': 'April',
  'time.month_4': 'May',
  'time.month_5': 'June',
  'time.month_6': 'July',
  'time.month_7': 'August',
  'time.month_8': 'September',
  'time.month_9': 'October',
  'time.month_10': 'November',
  'time.month_11': 'December',
  'time.today': 'Today',
  'time.yesterday': 'Yesterday',
  'time.this_week': 'This week',
  'time.passed_short': ms => {
    if (ms === undefined || typeof ms === 'string') return '?'

    const s = Math.trunc(ms / 1000)
    if (s < 60) return `${s}s`

    const rs = s % 60
    const m = (s - rs) / 60
    if (m < 60) {
      if (rs > 0) return `${m}m, ${rs}s`
      else return `${m}m`
    }

    const rm = m % 60
    const h = (m - rm) / 60
    if (h < 24) {
      if (rm > 0) return `${h}h, ${rm}m`
      else return `${h}h`
    }

    const rh = h % 24
    const d = (h - rh) / 24
    if (rh > 0) return `${d}d, ${rh}h`
    else return `${d}d`
  },

  // ---
  // -- Upgrade screen
  // -
  'upgrade.title': 'Upgrading',
  'upgrade.btn.backup': 'Save backup',
  'upgrade.btn.continue': 'Continue',
  'upgrade.status.done': 'Done',
  'upgrade.status.in_progress': 'In progress',
  'upgrade.status.pending': 'Pending',
  'upgrade.status.err': 'Error',
  'upgrade.status.no': 'No data',
  'upgrade.initializing': 'Initializing',
  'upgrade.settings': 'Settings',
  'upgrade.panels_nav': 'Panels and navigation',
  'upgrade.ctx_menu': 'Context menu',
  'upgrade.snapshots': 'Snapshots',
  'upgrade.fav_cache': 'Favicons cache',
  'upgrade.styles': 'Custom styles',
  'upgrade.err.get_stored': 'Cannot get stored data',
}

export default dict
