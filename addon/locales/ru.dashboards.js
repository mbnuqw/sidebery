export default {
  // --- General
  'dashboard.lock_panel_label': { message: 'Запретить автоматическое переключение с этой панели' },
  'dashboard.lock_panel_tooltip': {
    message: 'Запретить автоматическое переключение с этой панели',
  },
  'dashboard.lock_tabs_label': { message: 'Запретить закрытие вкладок на этой панели' },
  'dashboard.lock_tabs_tooltip': { message: 'Запретить закрытие вкладок на этой панели' },
  'dashboard.skip_on_switching': { message: 'Пропускать эту панель при переключении панелей' },
  'dashboard.no_empty_label': { message: 'Создавать новую вкладку после закрытия последней' },
  'dashboard.no_empty_tooltip': { message: 'Предотвращать опустошение этой панели' },
  'dashboard.new_tab_ctx': { message: 'Контейнер новой вкладки' },
  'dashboard.drop_tab_ctx': {
    message: 'Переоткрыть вкладку, переброшенную в эту панель, в контейнере:',
  },
  'dashboard.move_tab_ctx': { message: 'Перемещать вкладки выбранного контейнера в эту панель' },
  'dashboard.move_tab_ctx_none': { message: 'ня' },
  'dashboard.move_tab_ctx_nochild': { message: 'За исключением дочерних вкладок' },
  'dashboard.url_rules': { message: 'Перемещать вкладки с совпадающими адресами в эту панель' },
  'container_dashboard.custom_icon_note': {
    message: 'Base64, url или символы. Синтакс для символов: "символы::CSS-цвет::CSS-шрифт"',
  },
  'panel_config.custom_icon': { message: 'Пользовательская иконка' },
  'panel_config.custom_icon_load': { message: 'Загрузить' },

  // --- Bookmarks
  'bookmarks_dashboard.title': { message: 'Закладки' },
  'bookmarks_dashboard.reload_bookmarks_tree': { message: 'Перезагрузить закладки' },
  'bookmarks_dashboard.collapse_all_folders': { message: 'Свернуть все папки' },

  // --- Tabs
  'tabs_dashboard.dedup_tabs': { message: 'Закрыть дубликаты табов' },
  'tabs_dashboard.close_all_tabs': { message: 'Закрыть все табы' },
  'tabs_dashboard.reload_all_tabs': { message: 'Перезагрузить все табы' },
  'tabs_dashboard.delete_container': { message: 'Удалить контейнер' },

  // --- Pinned tabs
  'pinned_dashboard.title': { message: 'Закрепленные табы' },

  // --- Private tabs
  'private_dashboard.title': { message: 'Приватные табы' },

  // --- Default tabs
  'default_dashboard.title': { message: 'Стандартные табы' },
  'default_dashboard.close_all_tabs': { message: 'Закрыть все табы' },

  // --- Container
  'container_dashboard.name_placeholder': { message: 'Название...' },
  'container_dashboard.icon_label': { message: 'Иконка' },
  'container_dashboard.color_label': { message: 'Цвет' },
  'container_dashboard.proxy_label': { message: 'Прокси' },
  'container_dashboard.proxy_host_placeholder': { message: 'хост' },
  'container_dashboard.proxy_port_placeholder': { message: 'порт' },
  'container_dashboard.proxy_username_placeholder': { message: 'пользователь' },
  'container_dashboard.proxy_password_placeholder': { message: 'пароль' },
  'container_dashboard.proxy_dns_label': { message: 'проксировать DNS' },
  'container_dashboard.proxy_http': { message: 'http' },
  'container_dashboard.proxy_https': { message: 'tls' },
  'container_dashboard.proxy_socks4': { message: 'socks4' },
  'container_dashboard.proxy_socks': { message: 'socks5' },
  'container_dashboard.proxy_direct': { message: 'выкл' },
  'container_dashboard.rules_include': { message: 'Включать табы' },
  'container_dashboard.rules_include_tooltip': {
    message:
      'Переоткрывать табы с совпадающими url в этой панели.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
  },
  'container_dashboard.rules_exclude': { message: 'Исключать табы' },
  'container_dashboard.rules_exclude_tooltip': {
    message:
      'Переоткрывать табы с совпадающими url из этой панели в стандартной.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
  },
  'container_dashboard.user_agent': { message: 'User Agent' },
}
