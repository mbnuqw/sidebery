export default {
  // --- General
  'dashboard.lock_panel_label': { message: 'Prevent auto-switching from this panel' },
  'dashboard.lock_panel_tooltip': { message: 'Prevent auto-switching from this panel' },
  'dashboard.lock_tabs_label': { message: 'Prevent closing tabs on this panel' },
  'dashboard.lock_tabs_tooltip': { message: 'Prevent closing tabs on this panel' },
  'dashboard.skip_on_switching': { message: 'Skip this panel when switching panels' },
  'dashboard.no_empty_label': { message: 'Create new tab after the last one is closed' },
  'dashboard.no_empty_tooltip': { message: 'Prevent emptying of this panel' },
  'dashboard.new_tab_ctx': { message: 'Container of new tab' },
  'dashboard.drop_tab_ctx': { message: 'Reopen tab that was dropped to this panel in container:' },
  'dashboard.move_tab_ctx': { message: 'Move tab to this panel if it is opened in container:' },
  'dashboard.move_tab_ctx_none': { message: 'none' },
  'dashboard.move_tab_ctx_nochild': { message: 'Except child tabs' },
  'dashboard.url_rules': { message: 'Move tabs with matched URLs to this panel' },
  'container_dashboard.custom_icon_note': {
    message: 'Base64, URL or text. Text values syntax: "text::color::CSS-font-value"',
  },
  'panel_config.custom_icon': { message: 'Custom icon' },
  'panel_config.custom_icon_load': { message: 'Load' },

  // --- Bookmarks
  'bookmarks_dashboard.title': { message: 'Bookmarks' },
  'bookmarks_dashboard.reload_bookmarks_tree': { message: 'Reload bookmarks tree' },
  'bookmarks_dashboard.collapse_all_folders': { message: 'Collapse all folders' },

  // --- Pinned tabs
  'tabs_dashboard.dedup_tabs': { message: 'Close tabs duplicates' },
  'tabs_dashboard.close_all_tabs': { message: 'Close all tabs' },
  'tabs_dashboard.reload_all_tabs': { message: 'Reload all tabs' },
  'tabs_dashboard.delete_container': { message: 'Delete container' },

  // --- Pinned tabs
  'pinned_dashboard.title': { message: 'Pinned' },

  // --- Private tabs
  'private_dashboard.title': { message: 'Private' },

  // --- Default tabs
  'default_dashboard.title': { message: 'Default' },
  'default_dashboard.close_all_tabs': { message: 'Close all tabs' },

  // --- Container
  'container_dashboard.name_placeholder': { message: 'Container name...' },
  'container_dashboard.icon_label': { message: 'Icon' },
  'container_dashboard.color_label': { message: 'Color' },
  'container_dashboard.proxy_label': { message: 'Proxy' },
  'container_dashboard.proxy_host_placeholder': { message: '---' },
  'container_dashboard.proxy_port_placeholder': { message: '---' },
  'container_dashboard.proxy_username_placeholder': { message: '---' },
  'container_dashboard.proxy_password_placeholder': { message: '---' },
  'container_dashboard.proxy_dns_label': { message: 'proxy DNS' },
  'container_dashboard.proxy_http': { message: 'HTTP' },
  'container_dashboard.proxy_https': { message: 'TLS' },
  'container_dashboard.proxy_socks4': { message: 'SOCKS4' },
  'container_dashboard.proxy_socks': { message: 'SOCKS5' },
  'container_dashboard.proxy_direct': { message: 'none' },
  'container_dashboard.rules_include': { message: 'Include URLs' },
  'container_dashboard.rules_include_tooltip': {
    message:
      'Reopen tabs with matched URLs in this panel.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
  },
  'container_dashboard.rules_exclude': { message: 'Exclude URLs' },
  'container_dashboard.rules_exclude_tooltip': {
    message:
      'Reopen tabs with matched URL in default panel.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
  },
  'container_dashboard.user_agent': { message: 'User Agent' },
}
