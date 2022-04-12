import { NUM_1_RE, NUM_234_RE } from './dict.common'

export const setupPageTranslations: Translations = {
  // ---
  // -- Popups
  // -
  // - Container config popup
  'container.name_placeholder': {
    en: 'Name...',
    ru: 'Название...',
  },
  'container.icon_label': {
    en: 'Icon',
    ru: 'Иконка',
  },
  'container.color_label': {
    en: 'Color',
    ru: 'Цвет',
  },
  'container.proxy_label': {
    en: 'Proxy',
    ru: 'Прокси',
  },
  'container.proxy_host_placeholder': {
    en: '---',
    ru: 'хост',
  },
  'container.proxy_port_placeholder': {
    en: '---',
    ru: 'порт',
  },
  'container.proxy_username_placeholder': {
    en: '---',
    ru: 'пользователь',
  },
  'container.proxy_password_placeholder': {
    en: '---',
    ru: 'пароль',
  },
  'container.proxy_dns_label': {
    en: 'proxy DNS',
    ru: 'проксировать DNS',
  },
  'container.proxy_http': {
    en: 'HTTP',
  },
  'container.proxy_https': {
    en: 'TLS',
  },
  'container.proxy_socks4': {
    en: 'SOCKS4',
  },
  'container.proxy_socks': {
    en: 'SOCKS5',
  },
  'container.proxy_direct': {
    en: 'none',
    ru: 'выкл',
  },
  'container.rules_include': {
    en: 'Include URLs',
    ru: 'Включать вкладки',
  },
  'container.rules_include_tooltip': {
    en: 'Reopen tabs with matched URLs in this container.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    ru: 'Переоткрывать вкладки с совпадающими url в этом контейнере.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
  },
  'container.rules_exclude': {
    en: 'Exclude URLs',
    ru: 'Исключать вкладки',
  },
  'container.rules_exclude_tooltip': {
    en: 'Reopen tabs with matched URL in default container.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    ru: 'Переоткрывать вкладки с совпадающими url из этого контейнера в стандартном.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
  },
  'container.user_agent': {
    en: 'User Agent',
  },
  // - Panel config popup
  'panel.name_placeholder': {
    en: 'Name...',
    ru: 'Название...',
  },
  'panel.icon_label': {
    en: 'Icon',
    ru: 'Иконка',
  },
  'panel.color_label': {
    en: 'Color',
    ru: 'Цвет',
  },
  'panel.lock_panel_label': {
    en: 'Prevent auto-switching from this panel',
    ru: 'Запретить автоматическое переключение с этой панели',
  },
  'panel.temp_mode_label': {
    en: 'Switch back to previously active tabs panel after mouse leave',
    ru: 'Переключаться на последнюю активную панель вкладок, если курсор мыши убран',
  },
  'panel.skip_on_switching': {
    en: 'Skip this panel when switching panels',
    ru: 'Пропускать эту панель при переключении панелей',
  },
  'panel.no_empty_label': {
    en: 'Create new tab after the last one is closed',
    ru: 'Создавать новую вкладку после закрытия последней',
  },
  'panel.new_tab_ctx': {
    en: 'Container of new tab',
    ru: 'Контейнер новой вкладки',
  },
  'panel.drop_tab_ctx': {
    en: 'Reopen tab that was dropped to this panel in container:',
    ru: 'Переоткрыть вкладку, переброшенную в эту панель, в контейнере:',
  },
  'panel.move_tab_ctx': {
    en: 'Move tab to this panel if it is opened in container:',
    ru: 'Перемещать вкладки выбранного контейнера в эту панель',
  },
  'panel.move_tab_ctx_nochild': {
    en: 'Except child tabs',
    ru: 'За исключением дочерних вкладок',
  },
  'panel.ctr_tooltip_none': {
    en: 'Not set',
    ru: 'Не задан',
  },
  'panel.ctr_tooltip_default': {
    en: 'No container',
    ru: 'Без контейнера',
  },
  'panel.url_rules': {
    en: 'Move tabs with matched URLs to this panel',
    ru: 'Перемещать вкладки с совпадающими адресами в эту панель',
  },
  'panel.auto_convert': {
    en: 'Convert to source tabs panel on opening bookmark',
    ru: 'При открытии закладки преобразовать в исходную панель вкладок',
  },
  'panel.custom_icon_note': {
    en: 'Base64, URL or text. Text values syntax: "text::color::CSS-font-value"',
    ru: 'Base64, url или символы. Синтакс для символов: "символы::CSS-цвет::CSS-шрифт"',
  },
  'panel.custom_icon': {
    en: 'Custom icon',
    ru: 'Пользовательская иконка',
  },
  'panel.custom_icon_load': {
    en: 'Load',
    ru: 'Загрузить',
  },
  'panel.custom_icon_placeholder': {
    en: 'e.g. A::#000000ff::700 32px Roboto',
    ru: 'A::#000000ff::700 32px Roboto',
  },
  'panel.url_label': {
    en: 'URL',
  },
  'panel.root_id_label': {
    en: 'Root folder',
    ru: 'Корневая папка',
  },
  'panel.root_id.choose': {
    en: 'Choose folder',
    ru: 'Выбрать папку',
  },
  'panel.root_id.reset': {
    en: 'Reset',
    ru: 'Сбросить',
  },
  'panel.bookmarks_view_mode': {
    en: 'View mode',
    ru: 'Тип отображения',
  },
  'panel.bookmarks_view_mode_tree': {
    en: 'tree',
    ru: 'древовидная структура',
  },
  'panel.bookmarks_view_mode_history': {
    en: 'history',
    ru: 'хронологический список',
  },
  'panel.new_tab_custom_btns': {
    en: 'Additional "New tab" buttons',
    ru: 'Дополнительные кнопки для создания новой вкладки',
  },
  'panel.new_tab_custom_btns_placeholder': {
    en: 'Container name and/or URL',
    ru: 'Имя контейнера и/или URL',
  },
  'panel.new_tab_custom_btns_note': {
    en: 'Note: List of button configs. Example:\n  Personal  (open new tab in "Personal" container)\n  https://example.com  (open provided URL)\n  Personal, https://example.com  (open provided URL in "Personal" container)',
    ru: 'Список настроек для кнопок новой вкладки. Пример:\n  Персональный  (Открыть вкладку в контейнере "Персональный")\n  https://example.com  (Открыть вкладку с данным URL)\n  Персональный, https://example.com  (Открыть вкладку с данным URL в контейнере "Персональный")',
  },

  // ---
  // -- Settings
  // -
  'settings.nav_settings': {
    en: 'Settings',
    ru: 'Настройки',
  },
  'settings.nav_settings_general': {
    en: 'General',
    ru: 'Основные',
  },
  'settings.nav_settings_menu': {
    en: 'Menu',
    ru: 'Меню',
  },
  'settings.nav_settings_nav': {
    en: 'Navigation bar',
    ru: 'Навигация',
  },
  'settings.nav_settings_panels': {
    en: 'Panels',
    ru: 'Панель управления',
  },
  'settings.nav_settings_controlbar': {
    en: 'Control bar',
    ru: 'Групповая страница',
  },
  'settings.nav_settings_group': {
    en: 'Group page',
    ru: 'Контейнеры',
  },
  'settings.nav_settings_containers': {
    en: 'Containers',
    ru: 'Панели',
  },
  'settings.nav_settings_dnd': {
    en: 'Drag and Drop',
    ru: 'Перетаскивание',
  },
  'settings.nav_settings_search': {
    en: 'Search',
    ru: 'Поиск',
  },
  'settings.nav_settings_tabs': {
    en: 'Tabs',
    ru: 'Вкладки',
  },
  'settings.nav_settings_new_tab_position': {
    en: 'Position of new tab',
    ru: 'Позиция новых вкладок',
  },
  'settings.nav_settings_pinned_tabs': {
    en: 'Pinned tabs',
    ru: 'Закрепленные вкладки',
  },
  'settings.nav_settings_tabs_tree': {
    en: 'Tabs tree',
    ru: 'Дерево вкладок',
  },
  'settings.nav_settings_bookmarks': {
    en: 'Bookmarks',
    ru: 'Закладки',
  },
  'settings.nav_settings_history': {
    en: 'History',
    ru: 'История',
  },
  'settings.nav_settings_appearance': {
    en: 'Appearance',
    ru: 'Вид',
  },
  'settings.nav_settings_snapshots': {
    en: 'Snapshots',
    ru: 'Снепшоты',
  },
  'settings.nav_settings_mouse': {
    en: 'Mouse',
    ru: 'Мышь',
  },
  'settings.nav_settings_keybindings': {
    en: 'Keybindings',
    ru: 'Клавиши',
  },
  'settings.nav_settings_permissions': {
    en: 'Permissions',
    ru: 'Разрешения',
  },
  'settings.nav_settings_storage': {
    en: 'Storage',
    ru: 'Данные',
  },
  'settings.nav_settings_sync': {
    en: 'Sync',
    ru: 'Синхронизация',
  },
  'settings.nav_settings_help': {
    en: 'Help',
    ru: 'Помощь',
  },
  'settings.nav_menu_editor': {
    en: 'Menu editor',
    ru: 'Редактор меню',
  },
  'settings.nav_menu_editor_tabs': {
    en: 'Tabs',
    ru: 'Вкладки',
  },
  'settings.nav_menu_editor_tabs_panel': {
    en: 'Tabs panel',
    ru: 'Панель вкладок',
  },
  'settings.nav_menu_editor_bookmarks': {
    en: 'Bookmarks',
    ru: 'Закладки',
  },
  'settings.nav_menu_editor_bookmarks_panel': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
  },
  'settings.nav_styles_editor': {
    en: 'Styles editor',
    ru: 'Редактор стилей',
  },
  'settings.nav_snapshots': {
    en: 'Snapshots viewer',
    ru: 'Снепшоты',
  },

  // - Details controls
  'settings.ctrl_update': {
    en: 'UPDATE',
    ru: 'ОБНОВИТЬ',
  },
  'settings.ctrl_copy': {
    en: 'COPY',
    ru: 'СКОПИРОВАТЬ',
  },
  'settings.ctrl_close': {
    en: 'CLOSE',
    ru: 'ЗАКРЫТЬ',
  },

  // - General
  'settings.general_title': {
    en: 'General',
    ru: 'Основные',
  },
  'settings.native_scrollbars': {
    en: 'Use native scroll-bars',
    ru: 'Использовать системные скроллбары',
  },
  'settings.native_scrollbars_thin': {
    en: 'Use thin scroll-bars',
    ru: 'Использовать узкие скроллбары',
  },
  'settings.sel_win_screenshots': {
    en: 'Show screenshots in the window selection menu',
    ru: 'Показывать скриншоты в меню выбора окна',
  },
  'settings.update_sidebar_title': {
    en: "Use active panel's name as sidebar title",
    ru: 'Использовать имя активной панели в качестве заголовка боковой панели',
  },
  'settings.mark_window': {
    en: "Add preface to the browser window's title if Sidebery sidebar is active",
    ru: 'Добавлять префикс к заголовку окна, если боковая панель Sidebery активна',
  },
  'settings.mark_window_preface': {
    en: 'Preface value',
    ru: 'Значение префикса',
  },
  'settings.storage_btn': {
    en: "Sidebery's data:",
    ru: 'Данные Sidebery:',
  },
  'settings.permissions_btn': {
    en: 'Permissions',
    ru: 'Разрешения',
  },

  // - Context menu
  'settings.ctx_menu_title': {
    en: 'Context menu',
    ru: 'Контекстное меню',
  },
  'settings.ctx_menu_native': {
    en: 'Use native context menu',
    ru: 'Использовать системное контекстное меню',
  },
  'settings.ctx_menu_render_inact': {
    en: 'Render inactive options',
    ru: 'Отображать неактивные элементы',
  },
  'settings.ctx_menu_render_icons': {
    en: 'Render icons',
    ru: 'Отображать иконки',
  },
  'settings.ctx_menu_ignore_ctr': {
    en: 'Ignore containers',
    ru: 'Не отображать контейнеры',
  },
  'settings.ctx_menu_ignore_ctr_or': {
    en: 'e.g. /^tmp.+/, Google, Facebook',
    ru: 'пример: /^tmp.+/, Google, Facebook',
  },
  'settings.ctx_menu_ignore_ctr_note': {
    en: 'Use comma-separated list of contaianers names or /regexp/',
    ru: 'Список названий или /regexp/ через запятую',
  },
  'settings.ctx_menu_editor': {
    en: 'Edit context menu',
    ru: 'Редактировать меню',
  },

  // - Navigation bar
  // TODO: rename 'nav' to 'navbar'
  'settings.nav_title': {
    en: 'Navigation bar',
    ru: 'Навигация',
  },
  'settings.nav_bar_layout': {
    en: 'Layout',
    ru: 'Расположение',
  },
  'settings.nav_bar_layout_horizontal': {
    en: 'horizontal',
    ru: 'горизонтальное',
  },
  'settings.nav_bar_layout_vertical': {
    en: 'vertical',
    ru: 'вертикальное',
  },
  'settings.nav_bar_layout_hidden': {
    en: 'hidden',
    ru: 'скрытое',
  },
  'settings.nav_bar_inline': {
    en: 'Show navigation bar in one line',
    ru: 'В одну строку',
  },
  'settings.nav_bar_side': {
    en: 'Side',
    ru: 'Сторона',
  },
  'settings.nav_bar_side_left': {
    en: 'left',
    ru: 'левая',
  },
  'settings.nav_bar_side_right': {
    en: 'right',
    ru: 'правая',
  },
  'settings.nav_btn_count': {
    en: 'Show count of tabs/bookmarks',
    ru: 'Показывать количество вкладок/закладок',
  },
  'settings.hide_empty_panels': {
    en: 'Hide empty tabs panels',
    ru: 'Скрывать пустые панели вкладок',
  },
  'settings.nav_switch_panels_delay': {
    en: 'Min delay between panels switching (ms)',
    ru: 'Минимальная задержка между переключениями панелей (мс)',
  },
  'settings.nav_act_tabs_panel_left_click': {
    en: 'Left click on active tabs panel',
    ru: 'Клик левой кнопкой мыши по активной панели вкладок',
  },
  'settings.nav_act_tabs_panel_left_click_new_tab': {
    en: 'create tab',
    ru: 'создать вкладку',
  },
  'settings.nav_act_tabs_panel_left_click_none': {
    en: 'none',
    ru: 'ничего',
  },
  'settings.nav_act_bookmarks_panel_left_click': {
    en: 'Left click on active bookmarks panel',
    ru: 'Клик левой кнопкой мыши по активной панели закладок',
  },
  'settings.nav_act_bookmarks_panel_left_click_scroll': {
    en: 'scroll to start/end',
    ru: 'проскроллить к началу/концу',
  },
  'settings.nav_act_bookmarks_panel_left_click_none': {
    en: 'none',
    ru: 'ничего',
  },
  'settings.nav_tabs_panel_mid_click': {
    en: 'Middle click on tabs panel',
    ru: 'Клик средней кнопкой мыши по панели вкладок',
  },
  'settings.nav_tabs_panel_mid_click_rm_act_tab': {
    en: 'close active tab',
    ru: 'закрыть активную вкладку',
  },
  'settings.nav_tabs_panel_mid_click_rm_all': {
    en: 'close tabs',
    ru: 'закрыть вкладки',
  },
  'settings.nav_tabs_panel_mid_click_discard': {
    en: 'unload tabs',
    ru: 'выгрузить вкладки',
  },
  'settings.nav_tabs_panel_mid_click_bookmark': {
    en: 'save panel to bookmarks',
    ru: 'сохранить панель в закладки',
  },
  'settings.nav_tabs_panel_mid_click_convert': {
    en: 'convert to bookmarks',
    ru: 'конвертировать в панель закладок',
  },
  'settings.nav_tabs_panel_mid_click_none': {
    en: 'none',
    ru: 'ничего',
  },
  'settings.nav_bookmarks_panel_mid_click': {
    en: 'Middle click on bookmarks panel',
    ru: 'Клик средней кнопкой мыши по панели закладок',
  },
  'settings.nav_bookmarks_panel_mid_click_convert': {
    en: 'convert to tabs',
    ru: 'конвертировать во вкладки',
  },
  'settings.nav_bookmarks_panel_mid_click_none': {
    en: 'none',
    ru: 'ничего',
  },
  'settings.nav_switch_panels_wheel': {
    en: 'Switch panels with mouse wheel over navigation bar',
    ru: 'Переключать панели с помощью колеса мыши над панелью навигации',
  },
  'settings.nav_bar_enabled': {
    en: 'Enabled elements',
    ru: 'Активированные элементы',
  },
  'settings.nav_bar.no_elements': {
    en: 'No elements',
    ru: 'Нет элементов',
  },
  'settings.nav_bar.available_elements': {
    en: 'Available elements',
    ru: 'Доступные элементы',
  },
  'settings.nav_bar_btn_tabs_panel': {
    en: 'Tabs panel',
    ru: 'Панель вкладок',
  },
  'settings.nav_bar_btn_bookmarks_panel': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
  },
  'settings.nav_bar_btn_sp': {
    en: 'Space',
    ru: 'Пространство',
  },
  'settings.nav_bar_btn_sd': {
    en: 'Delimiter',
    ru: 'Разделитель',
  },
  'settings.nav_bar_btn_history': {
    en: 'History panel',
    ru: 'История',
  },
  'settings.nav_bar_btn_settings': {
    en: 'Settings',
    ru: 'Настройки',
  },
  'settings.nav_bar_btn_add_tp': {
    en: 'Create tabs panel',
    ru: 'Создать панель вкладок',
  },
  'settings.nav_bar_btn_search': {
    en: 'Search',
    ru: 'Поиск',
  },
  'settings.nav_bar_btn_create_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
  },
  'settings.nav_bar_btn_remute_audio_tabs': {
    en: 'Mute/Unmute audible tabs',
    ru: 'Приглушить/Включить вкладки со звуком',
  },
  'settings.nav_rm_tabs_panel_confirm_pre': {
    en: 'Delete "',
    ru: 'Удалить панель "',
  },
  'settings.nav_rm_tabs_panel_confirm_post': {
    en: '" panel?\nAll tabs of this panel will be assigned to nearest tabs panel.',
    ru: '"?\n Все вкладки этой панели будут присоединены к соседней панели.',
  },
  'settings.nav_rm_bookmarks_panel_confirm_pre': {
    en: 'Delete "',
    ru: 'Удалить панель "',
  },
  'settings.nav_rm_bookmarks_panel_confirm_post': {
    en: '" panel?',
    ru: '"?',
  },

  // - Group page
  'settings.group_title': {
    en: 'Group page',
    ru: 'Групповая страница',
  },
  'settings.group_layout': {
    en: 'Layout of tabs',
    ru: 'Отображение',
  },
  'settings.group_layout_grid': {
    en: 'grid',
    ru: 'сетка',
  },
  'settings.group_layout_list': {
    en: 'list',
    ru: 'список',
  },

  // - Containers
  'settings.containers_title': {
    en: 'Containers',
    ru: 'Контейнеры',
  },
  'settings.contianer_remove_confirm_prefix': {
    en: 'Are you sure you want to delete "',
    ru: 'Вы действительно хотите удалить контейнер "',
  },
  'settings.contianer_remove_confirm_postfix': {
    en: '" container?',
    ru: '"?',
  },
  'settings.containers_create_btn': {
    en: 'Create container',
    ru: 'Создать контейнер',
  },

  // - Drag and drop
  'settings.dnd_title': {
    en: 'Drag and Drop',
    ru: 'Перетаскивание',
  },
  'settings.dnd_tab_act': {
    en: 'Activate tab on hover',
    ru: 'Активировать вкладку при наведении',
  },
  'settings.dnd_tab_act_delay': {
    en: 'With delay (ms)',
    ru: 'С задержкой (мс)',
  },
  'settings.dnd_mod': {
    en: 'With pressed key',
    ru: 'При нажатии на',
  },
  'settings.dnd_mod_alt': {
    en: 'alt',
    ru: 'alt',
  },
  'settings.dnd_mod_shift': {
    en: 'shift',
    ru: 'shift',
  },
  'settings.dnd_mod_ctrl': {
    en: 'ctrl',
    ru: 'ctrl',
  },
  'settings.dnd_mod_none': {
    en: 'none',
    ru: 'выкл',
  },
  'settings.dnd_exp': {
    en: 'Expand/Fold the branch on hovering over the',
    ru: 'Развернуть/свернуть ветвь при наведении на',
  },
  'settings.dnd_exp_pointer': {
    en: "pointer's triangle",
    ru: 'треугольник указателя',
  },
  'settings.dnd_exp_hover': {
    en: 'tab/bookmark',
    ru: 'вкладку/закладку',
  },
  'settings.dnd_exp_none': {
    en: 'none',
    ru: 'выкл',
  },
  'settings.dnd_exp_delay': {
    en: 'With delay (ms)',
    ru: 'С задержкой (мс)',
  },

  // - Search
  'settings.search_title': {
    en: 'Search',
    ru: 'Поиск',
  },
  'settings.search_bar_mode': {
    en: 'Search bar mode',
    ru: 'Режим панели',
  },
  'settings.search_bar_mode_static': {
    en: 'always shown',
    ru: 'активный',
  },
  'settings.search_bar_mode_dynamic': {
    en: 'dynamic',
    ru: 'динамический',
  },
  'settings.search_bar_mode_none': {
    en: 'inactive',
    ru: 'скрытый',
  },

  // - Tabs
  'settings.tabs_title': {
    en: 'Tabs',
    ru: 'Вкладки',
  },
  'settings.warn_on_multi_tab_close': {
    en: 'Warn on trying to close multiple tabs',
    ru: 'Предупреждать при закрытии нескольких вкладок',
  },
  'settings.warn_on_multi_tab_close_any': {
    en: 'any',
    ru: 'любых',
  },
  'settings.warn_on_multi_tab_close_collapsed': {
    en: 'collapsed',
    ru: 'свернутых',
  },
  'settings.warn_on_multi_tab_close_none': {
    en: 'none',
    ru: 'нет',
  },
  'settings.activate_on_mouseup': {
    en: 'Activate tab on mouse button release',
    ru: 'Активировать вкладку при отпускании кнопки мыши',
  },
  'settings.activate_last_tab_on_panel_switching': {
    en: 'Activate last active tab on panel switching',
    ru: 'Активировать последнюю активную вкладку при переключении панелей',
  },
  'settings.skip_empty_panels': {
    en: 'Skip empty panels on switching',
    ru: 'Пропускать пустые контейнеры при переключении',
  },
  'settings.show_tab_rm_btn': {
    en: 'Show close button on mouse hover',
    ru: 'Показывать кнопку закрытия вкладки при наведении курсора',
  },
  'settings.hide_inactive_panel_tabs': {
    en: 'Hide native tabs of inactive panels',
    ru: 'Скрывать горизонтальные вкладки неактивных панелей',
  },
  'settings.activate_after_closing': {
    en: 'After closing current tab activate',
    ru: 'После закрытия текущей вкладки активировать',
  },
  'settings.activate_after_closing_next': {
    en: 'next tab',
    ru: 'следующую',
  },
  'settings.activate_after_closing_prev': {
    en: 'previous tab',
    ru: 'предыдущую',
  },
  'settings.activate_after_closing_prev_act': {
    en: 'previously active tab',
    ru: 'последнюю активную',
  },
  'settings.activate_after_closing_none': {
    en: 'none',
    ru: 'выкл',
  },
  'settings.activate_after_closing_prev_rule': {
    en: 'Previous tab rule',
    ru: 'Правило предыдущей вкладки',
  },
  'settings.activate_after_closing_next_rule': {
    en: 'Next tab rule',
    ru: 'Правило следующей вкладки',
  },
  'settings.activate_after_closing_rule_tree': {
    en: 'tree',
    ru: 'дерево',
  },
  'settings.activate_after_closing_rule_visible': {
    en: 'visible',
    ru: 'видимая',
  },
  'settings.activate_after_closing_rule_any': {
    en: 'any',
    ru: 'любая',
  },
  'settings.activate_after_closing_global': {
    en: 'Globally',
    ru: 'Глобально',
  },
  'settings.activate_after_closing_no_folded': {
    en: 'Ignore folded tabs',
    ru: 'Игнорировать свернутые вкладки',
  },
  'settings.activate_after_closing_no_discarded': {
    en: 'Ignore discarded tabs',
    ru: 'Игнорировать выгруженные вкладки',
  },
  'settings.shift_selection_from_active': {
    en: 'Start shift+click selection from the active tab',
    ru: 'Начинать выделение по shift+клику с активной вкладки',
  },
  'settings.ask_new_bookmark_place': {
    en: 'Ask where to store bookmarks',
    ru: 'Спрашивать куда сохранить закладки',
  },
  'settings.tabs_rm_undo_note': {
    en: 'Show undo notification on closing multiple tabs',
    ru: 'Показывать уведомление о закрытии нескольких вкладок',
  },
  'settings.native_highlight': {
    en: 'Highlight native tabs (in top horizontal bar) along with tabs in sidebar',
    ru: 'Выделять стандартные вкладки (в верхней панели) вместе с вкладками в боковой панели',
  },
  'settings.tabs_unread_mark': {
    en: 'Show mark on unread tabs',
    ru: 'Показывать метку на непрочитанных вкладках',
  },
  'settings.tabs_reload_limit': {
    en: 'Limit the count of simultaneously reloading tabs',
    ru: 'Ограничить количество одновременно перезагружаемых вкладок',
  },
  'settings.tabs_reload_limit_notif': {
    en: 'Show notification with the reloading progress',
    ru: 'Показывать уведомление со статусом перезагрузки',
  },
  'settings.tabs_panel_switch_act_move': {
    en: 'Switch panel after moving active tab to another panel',
    ru: 'Переключать панель после перемещения активной вкладки на другую панель',
  },
  'settings.show_new_tab_btns': {
    en: 'Show new tab buttons',
    ru: 'Показывать кнопки создания новых вкладок',
  },
  'settings.new_tab_bar_position': {
    en: 'Position',
    ru: 'Положение',
  },
  'settings.new_tab_bar_position_after_tabs': {
    en: 'after tabs',
    ru: 'после вкладок',
  },
  'settings.new_tab_bar_position_bottom': {
    en: 'bottom',
    ru: 'снизу',
  },
  'settings.discard_inactive_panel_tabs_delay': {
    en: 'Unload tabs of inactive panel after delay',
    ru: 'Выгружать вкладки неактивных панелей c задержкой',
  },
  'settings.discard_inactive_panel_tabs_delay_sec': {
    en: n => (n === 1 ? 'second' : 'seconds'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'секунда'
      if (NUM_234_RE.test(n.toString())) return 'секунды'
      return 'секунд'
    },
  },
  'settings.discard_inactive_panel_tabs_delay_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
  },
  'settings.tabs_second_click_act_prev': {
    en: 'Backward activation when clicking on the active tab',
    ru: 'Обратная активация при нажатии на активную вкладку ',
  },

  // - New tab position
  'settings.new_tab_position': {
    en: 'Position of new tab',
    ru: 'Позиция новых вкладок',
  },
  'settings.move_new_tab_pin': {
    en: 'Place new tab opened from pinned tab',
    ru: 'Открытые из закрепленных вкладок',
  },
  'settings.move_new_tab_pin_start': {
    en: 'panel start',
    ru: 'начало панели',
  },
  'settings.move_new_tab_pin_end': {
    en: 'panel end',
    ru: 'конец пенели',
  },
  'settings.move_new_tab_pin_none': {
    en: 'none',
    ru: 'выкл',
  },
  'settings.move_new_tab_parent': {
    en: 'Place new tab opened from another tab',
    ru: 'Открытые из другой вкладки',
  },
  'settings.move_new_tab_parent_before': {
    en: 'before parent',
    ru: 'перед родительской',
  },
  'settings.move_new_tab_parent_sibling': {
    en: 'after parent',
    ru: 'после родительской',
  },
  'settings.move_new_tab_parent_first_child': {
    en: 'first child',
    ru: 'первая дочерняя',
  },
  'settings.move_new_tab_parent_last_child': {
    en: 'last child',
    ru: 'последняя дочерняя',
  },
  'settings.move_new_tab_parent_start': {
    en: 'panel start',
    ru: 'начало панели',
  },
  'settings.move_new_tab_parent_end': {
    en: 'panel end',
    ru: 'конец пенели',
  },
  'settings.move_new_tab_parent_default': {
    en: 'default',
    ru: 'по умолчанию',
  },
  'settings.move_new_tab_parent_none': {
    en: 'none',
    ru: 'выкл',
  },
  'settings.move_new_tab_parent_act_panel': {
    en: 'Only if panel of parent tab is active',
    ru: 'Только если панель родительской вкладки активна',
  },
  'settings.move_new_tab': {
    en: 'Place new tab (for the other cases)',
    ru: 'Для остальных случаев',
  },
  'settings.move_new_tab_start': {
    en: 'panel start',
    ru: 'начало панели',
  },
  'settings.move_new_tab_end': {
    en: 'panel end',
    ru: 'конец пенели',
  },
  'settings.move_new_tab_before': {
    en: 'before active tab',
    ru: 'перед активной вкладкой',
  },
  'settings.move_new_tab_after': {
    en: 'after active tab',
    ru: 'после активной вкладкой',
  },
  'settings.move_new_tab_first_child': {
    en: 'first child of active tab',
    ru: 'первая дочерняя вкладка активной',
  },
  'settings.move_new_tab_last_child': {
    en: 'last child of active tab',
    ru: 'последняя дочерняя вкладка активной',
  },
  'settings.move_new_tab_none': {
    en: 'none',
    ru: 'выкл',
  },

  // - Pinned tabs
  'settings.pinned_tabs_title': {
    en: 'Pinned tabs',
    ru: 'Закрепленные вкладки',
  },
  'settings.pinned_tabs_position': {
    en: 'Pinned tabs position',
    ru: 'Расположение закрепленных вкладок',
  },
  'settings.pinned_tabs_position_top': {
    en: 'top',
    ru: 'вверху',
  },
  'settings.pinned_tabs_position_left': {
    en: 'left',
    ru: 'слева',
  },
  'settings.pinned_tabs_position_right': {
    en: 'right',
    ru: 'справа',
  },
  'settings.pinned_tabs_position_bottom': {
    en: 'bottom',
    ru: 'внизу',
  },
  'settings.pinned_tabs_position_panel': {
    en: 'panel',
    ru: 'панель',
  },
  'settings.pinned_tabs_list': {
    en: 'Show titles of pinned tabs',
    ru: 'Показывать заголовки закрепленных вкладок',
  },
  'settings.pinned_auto_group': {
    en: 'Group tabs that were opened from a pinned tab',
    ru: 'Группировать вкладки, которые были открыты из закрепленной вкладки.',
  },

  // - Tabs tree
  'settings.tabs_tree_title': {
    en: 'Tabs tree',
    ru: 'Древовидное отображение вкладок',
  },
  'settings.tabs_tree_layout': {
    en: 'Tabs tree structure',
    ru: 'Древовидное отображение вкладок',
  },
  'settings.group_on_open_layout': {
    en: 'Create sub-tree on opening link in new tab',
    ru: 'Создать поддерево при открытии ссылки в новой вкладке',
  },
  'settings.tabs_tree_limit': {
    en: 'Tabs tree level limit',
    ru: 'Максимальный уровень вложенности вкладок',
  },
  'settings.tabs_tree_limit_1': {
    en: '1',
    ru: '1',
  },
  'settings.tabs_tree_limit_2': {
    en: '2',
    ru: '2',
  },
  'settings.tabs_tree_limit_3': {
    en: '3',
    ru: '3',
  },
  'settings.tabs_tree_limit_4': {
    en: '4',
    ru: '4',
  },
  'settings.tabs_tree_limit_5': {
    en: '5',
    ru: '5',
  },
  'settings.tabs_tree_limit_none': {
    en: 'none',
    ru: 'выкл',
  },
  'settings.hide_folded_tabs': {
    en: 'Hide folded tabs',
    ru: 'Скрывать свернутые вкладки',
  },
  'settings.auto_fold_tabs': {
    en: 'Auto fold tabs',
    ru: 'Автоматически сворачивать вкладки',
  },
  'settings.auto_fold_tabs_except': {
    en: 'Max count of open branches',
    ru: 'Максимальное количество открытых веток',
  },
  'settings.auto_fold_tabs_except_1': {
    en: '1',
    ru: '1',
  },
  'settings.auto_fold_tabs_except_2': {
    en: '2',
    ru: '2',
  },
  'settings.auto_fold_tabs_except_3': {
    en: '3',
    ru: '3',
  },
  'settings.auto_fold_tabs_except_4': {
    en: '4',
    ru: '4',
  },
  'settings.auto_fold_tabs_except_5': {
    en: '5',
    ru: '5',
  },
  'settings.auto_fold_tabs_except_none': {
    en: 'none',
    ru: 'выкл',
  },
  'settings.auto_exp_tabs': {
    en: 'Auto expand tab on activation',
    ru: 'Автоматически разворачивать вкладки',
  },
  'settings.rm_child_tabs': {
    en: 'Close child tabs along with parent',
    ru: 'Закрывать дочерние вкладки вместе с родительской',
  },
  'settings.rm_child_tabs_all': {
    en: 'all',
    ru: 'все',
  },
  'settings.rm_child_tabs_folded': {
    en: 'folded',
    ru: 'свернутые',
  },
  'settings.rm_child_tabs_none': {
    en: 'none',
    ru: 'выкл',
  },
  'settings.tabs_child_count': {
    en: 'Show count of descendants on the folded tab',
    ru: 'Показывать количество потомков на свернутой вкладке',
  },
  'settings.tabs_lvl_dots': {
    en: 'Show marks to indicate tabs sub-tree levels',
    ru: 'Показывать отметки уровней вложенности',
  },
  'settings.discard_folded': {
    en: 'Unload folded tabs',
    ru: 'Выгружать свернутые вкладки',
  },
  'settings.discard_folded_delay': {
    en: 'With delay',
    ru: 'Через',
  },
  'settings.discard_folded_delay_sec': {
    en: n => (n === 1 ? 'second' : 'seconds'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'секунда'
      if (NUM_234_RE.test(n.toString())) return 'секунды'
      return 'секунд'
    },
  },
  'settings.discard_folded_delay_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
  },
  'settings.tabs_tree_bookmarks': {
    en: 'Preserve tree on creating bookmarks',
    ru: 'Сохранять древовидную структуру при создании закладок',
  },
  'settings.tree_rm_outdent': {
    en: 'After closing parent tab, outdent',
    ru: 'После закрытия родительской вкладки понизить уровень',
  },
  'settings.tree_rm_outdent_branch': {
    en: 'whole branch',
    ru: 'всей ветви',
  },
  'settings.tree_rm_outdent_first_child': {
    en: 'first child',
    ru: 'первой дочерней вкладки',
  },

  // - Bookmarks
  'settings.bookmarks_title': {
    en: 'Bookmarks',
    ru: 'Закладки',
  },
  'settings.bookmarks_panel': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
  },
  'settings.bookmarks_layout': {
    en: 'Bookmarks layout',
    ru: 'Тип отображения',
  },
  'settings.bookmarks_layout_tree': {
    en: 'tree',
    ru: 'дерево',
  },
  'settings.bookmarks_layout_history': {
    en: 'history',
    ru: 'история',
  },
  'settings.warn_on_multi_bookmark_delete': {
    en: 'Warn on trying delete multiple bookmarks',
    ru: 'Предупреждать об удалении нескольких закладкок',
  },
  'settings.warn_on_multi_bookmark_delete_any': {
    en: 'any',
    ru: 'любых',
  },
  'settings.warn_on_multi_bookmark_delete_collapsed': {
    en: 'collapsed',
    ru: 'свернутых',
  },
  'settings.warn_on_multi_bookmark_delete_none': {
    en: 'none',
    ru: 'нет',
  },
  'settings.open_bookmark_new_tab': {
    en: 'Open bookmark in new tab',
    ru: 'Открывать закладку в новой вкладке',
  },
  'settings.mid_click_bookmark': {
    en: 'Middle click on the bookmark',
    ru: 'При нажатии средней кнопки мыши',
  },
  'settings.mid_click_bookmark_open_new_tab': {
    en: 'open in new tab',
    ru: 'открывать в новой вкладке',
  },
  'settings.mid_click_bookmark_edit': {
    en: 'edit',
    ru: 'редактировать',
  },
  'settings.mid_click_bookmark_delete': {
    en: 'delete',
    ru: 'удалять',
  },
  'settings.act_mid_click_tab': {
    en: 'Activate tab',
    ru: 'Активировать вкладку',
  },
  'settings.auto_close_bookmarks': {
    en: 'Auto-close folders',
    ru: 'Автоматически сворачивать папки',
  },
  'settings.auto_rm_other': {
    en: 'Delete open bookmarks from "Other Bookmarks" folder',
    ru: 'Удалять открытые закладки из папки "Другие закладки"',
  },
  'settings.show_bookmark_len': {
    en: 'Show folder size',
    ru: 'Показывать размер папки',
  },
  'settings.highlight_open_bookmarks': {
    en: 'Mark open bookmarks',
    ru: 'Отмечать открытые закладки',
  },
  'settings.activate_open_bookmark_tab': {
    en: 'Go to open tab instead of opening new one',
    ru: 'Переходить на открытую вкладку вместо открытия новой',
  },
  'settings.bookmarks_rm_undo_note': {
    en: 'Show undo notification after deleting bookmarks',
    ru: 'Показывать уведомление об удалении нескольких закладок',
  },
  'settings.fetch_bookmarks_favs': {
    en: 'Fetch favicons',
    ru: 'Загрузить иконки',
  },
  'settings.fetch_bookmarks_favs_stop': {
    en: 'Stop fetching',
    ru: 'Остановить загрузку',
  },
  'settings.fetch_bookmarks_favs_done': {
    en: 'done',
    ru: 'завершено',
  },
  'settings.fetch_bookmarks_favs_errors': {
    en: 'errors',
    ru: 'ошибок',
  },
  'settings.load_bookmarks_on_demand': {
    en: 'Load bookmarks on demand',
    ru: 'Инициализоровать сервис закладок только по необходимости',
  },
  'settings.pin_opened_bookmarks_folder': {
    en: 'Pin opened folder when scrolling',
    ru: 'Закреплять открытую папку при прокрутке',
  },

  // - History
  'settings.history_title': {
    en: 'History',
    ru: 'История',
  },
  'settings.load_history_on_demand': {
    en: 'Initialize history service on demand',
    ru: 'Инициализоровать сервис истории только по необходимости',
  },

  // - Appearance
  'settings.appearance_title': {
    en: 'Appearance',
    ru: 'Вид',
  },
  'settings.font_size': {
    en: 'Font size',
    ru: 'Размер шрифта',
  },
  'settings.font_size_xxs': {
    en: 'XXS',
    ru: 'XXS',
  },
  'settings.font_size_xs': {
    en: 'XS',
    ru: 'XS',
  },
  'settings.font_size_s': {
    en: 'S',
    ru: 'S',
  },
  'settings.font_size_m': {
    en: 'M',
    ru: 'M',
  },
  'settings.font_size_l': {
    en: 'L',
    ru: 'L',
  },
  'settings.font_size_xl': {
    en: 'XL',
    ru: 'XL',
  },
  'settings.font_size_xxl': {
    en: 'XXL',
    ru: 'XXL',
  },
  'settings.theme': {
    en: 'Theme',
    ru: 'Тема',
  },
  'settings.theme_proton': {
    en: 'proton',
    ru: 'proton',
  },
  'settings.theme_compact': {
    en: 'compact',
    ru: 'compact',
  },
  'settings.theme_plain': {
    en: 'plain',
    ru: 'plain',
  },
  'settings.theme_none': {
    en: 'none',
    ru: 'нет',
  },
  'settings.switch_color_scheme': {
    en: 'Color scheme',
    ru: 'Цветовая схема',
  },
  'settings.color_scheme_dark': {
    en: 'dark',
    ru: 'темная',
  },
  'settings.color_scheme_light': {
    en: 'light',
    ru: 'светлая',
  },
  'settings.color_scheme_sys': {
    en: 'dark/light',
    ru: 'система',
  },
  'settings.color_scheme_ff': {
    en: 'firefox',
    ru: 'firefox',
  },
  'settings.bg_noise': {
    en: 'Frosted background',
    ru: 'Матовый задний фон',
  },
  'settings.animations': {
    en: 'Animations',
    ru: 'Анимации',
  },
  'settings.animation_speed': {
    en: 'Animations speed',
    ru: 'Скорость анимации',
  },
  'settings.animation_speed_fast': {
    en: 'fast',
    ru: 'быстрая',
  },
  'settings.animation_speed_norm': {
    en: 'normal',
    ru: 'средняя',
  },
  'settings.animation_speed_slow': {
    en: 'slow',
    ru: 'медленная',
  },
  'settings.edit_styles': {
    en: 'Edit styles',
    ru: 'Редактировать стили',
  },
  'settings.edit_theme': {
    en: 'Edit theme',
    ru: 'Редактировать тему',
  },
  'settings.appearance_notes_title': {
    en: 'Notes:',
    ru: 'Примечания:',
  },
  'settings.appearance_notes': {
    en: '- To apply theme color to Sidebery buttons in browser interface set "svg.context-properties.content.enabled" to "true" in about:config page.',
    ru: '- Чтобы применить цвет темы к кнопкам Sidebery в интерфейсе браузера, установите «svg.context-properties.content.enabled» в «true» на странице about:config.',
  },

  // - Snapshots
  'settings.snapshots_title': {
    en: 'Snapshots',
    ru: 'Снепшоты',
  },
  'settings.snap_notify': {
    en: 'Show notification after snapshot creation',
    ru: 'Показать уведомление после создания снепшота',
  },
  'settings.snap_exclude_private': {
    en: 'Exclude private windows',
    ru: 'Исключать приватные окна',
  },
  'settings.snap_interval': {
    en: 'Auto-snapshots interval',
    ru: 'Интервал авто-снепшотов',
  },
  'settings.snap_interval_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
  },
  'settings.snap_interval_hr': {
    en: n => (n === 1 ? 'hour' : 'hours'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'час'
      if (NUM_234_RE.test(n.toString())) return 'часа'
      return 'часов'
    },
  },
  'settings.snap_interval_day': {
    en: n => (n === 1 ? 'day' : 'days'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'день'
      if (NUM_234_RE.test(n.toString())) return 'дня'
      return 'дней'
    },
  },
  'settings.snap_interval_none': {
    en: 'none',
    ru: 'выкл',
  },
  'settings.snap_limit': {
    en: 'Snapshots limit',
    ru: 'Лимиты',
  },
  'settings.snap_limit_snap': {
    en: n => (n === 1 ? 'snapshot' : 'snapshots'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'снепшот'
      if (NUM_234_RE.test(n.toString())) return 'снепшота'
      return 'снепшотов'
    },
  },
  'settings.snap_limit_kb': {
    en: n => (n === 1 ? 'kbyte' : 'kbytes'),
    ru: (n = 0): string => {
      if (NUM_234_RE.test(n.toString())) return 'кбайта'
      return 'кбайт'
    },
  },
  'settings.snap_limit_day': {
    en: n => (n === 1 ? 'day' : 'days'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'день'
      if (NUM_234_RE.test(n.toString())) return 'дня'
      return 'дней'
    },
  },
  'settings.snapshots_view_label': {
    en: 'View snapshots',
    ru: 'Просмотреть снепшоты',
  },
  'settings.make_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
  },
  'settings.rm_all_snapshots': {
    en: 'Remove all snapshots',
    ru: 'Удалить все снепшоты',
  },
  'settings.apply_snapshot': {
    en: 'apply',
    ru: 'применить',
  },
  'settings.rm_snapshot': {
    en: 'remove',
    ru: 'удалить',
  },

  // - Mouse
  'settings.mouse_title': {
    en: 'Mouse',
    ru: 'Мышь',
  },
  'settings.h_scroll_through_panels': {
    en: 'Use horizontal scroll to switch panels',
    ru: 'Переключать панели с помощью горизонтальной прокрутки',
  },
  'settings.scroll_through_tabs': {
    en: 'Switch tabs with scroll wheel',
    ru: 'Переключать вкладки с помощью колеса прокрутки',
  },
  'settings.scroll_through_tabs_panel': {
    en: 'panel',
    ru: 'на панели',
  },
  'settings.scroll_through_tabs_global': {
    en: 'global',
    ru: 'глобально',
  },
  'settings.scroll_through_tabs_none': {
    en: 'none',
    ru: 'выкл',
  },
  'settings.scroll_through_visible_tabs': {
    en: 'Skip folded tabs',
    ru: 'Пропускать свернутые',
  },
  'settings.scroll_through_tabs_skip_discarded': {
    en: 'Skip discarded tabs',
    ru: 'Пропускать выгруженые',
  },
  'settings.scroll_through_tabs_except_overflow': {
    en: 'Except if panel is overflowing',
    ru: 'За исключением случаев, когда панель переполнена',
  },
  'settings.scroll_through_tabs_cyclic': {
    en: 'Cyclically',
    ru: 'Зациклить',
  },
  'settings.long_click_delay': {
    en: 'Long click delay (ms)',
    ru: 'Задержка длительного нажатия (мс)',
  },

  'settings.nav_actions_sub_title': {
    en: 'Navigation bar actions',
    ru: 'Действия над навигацией',
  },

  'settings.tab_actions_sub_title': {
    en: 'Tab actions',
    ru: 'Действия над вкладками',
  },
  'settings.tab_double_click': {
    en: 'Double click on tab',
    ru: 'Двойной клик по вкладке',
  },
  'settings.tab_long_left_click': {
    en: 'Long left click on tab',
    ru: 'Длительное нажатие левой кнопки мыши по вкладке',
  },
  'settings.tab_long_right_click': {
    en: 'Long right click on tab',
    ru: 'Длительное нажатие правой кнопки мыши по вкладке',
  },
  'settings.tab_close_middle_click': {
    en: 'Middle click on close tab button',
    ru: 'Нажатие средней кнопкой мыши по кнопке закрытия вкладки',
  },
  'settings.tab_action_reload': {
    en: 'reload',
    ru: 'перезагрузить',
  },
  'settings.tab_action_duplicate': {
    en: 'duplicate',
    ru: 'дублировать',
  },
  'settings.tab_action_pin': {
    en: 'pin',
    ru: 'закрепить',
  },
  'settings.tab_action_mute': {
    en: 'mute',
    ru: 'выключить звук',
  },
  'settings.tab_action_clear_cookies': {
    en: 'clear cookies',
    ru: 'удалить cookies',
  },
  'settings.tab_action_exp': {
    en: 'expand',
    ru: 'развернуть',
  },
  'settings.tab_action_new_after': {
    en: 'new sibling tab',
    ru: 'новая вкладка',
  },
  'settings.tab_action_new_child': {
    en: 'new child tab',
    ru: 'новая дочерняя вкладка',
  },
  'settings.tab_action_close': {
    en: 'close tab',
    ru: 'закрыть вкладку',
  },
  'settings.tab_action_discard': {
    en: 'unload',
    ru: 'выгрузить',
  },
  'settings.tab_action_none': {
    en: 'none',
    ru: 'выкл',
  },

  'settings.tabs_panel_actions_sub_title': {
    en: 'Tabs panel actions',
    ru: 'Действия над панелью c вкладками',
  },
  'settings.tabs_panel_left_click_action': {
    en: 'Left click on tabs panel',
    ru: 'Левый клик по панели с вкладками',
  },
  'settings.tabs_panel_double_click_action': {
    en: 'Double click on tabs panel',
    ru: 'Двойной клик по панели с вкладками',
  },
  'settings.tabs_panel_right_click_action': {
    en: 'Right click on tabs panel',
    ru: 'Правый клик по панели с вкладками',
  },
  'settings.tabs_panel_middle_click_action': {
    en: 'Middle click on tabs panel',
    ru: 'Средний клик по панели с вкладками',
  },
  'settings.tabs_panel_action_tab': {
    en: 'create tab',
    ru: 'создать вкладку',
  },
  'settings.tabs_panel_action_prev': {
    en: 'previous panel',
    ru: 'пред. панель',
  },
  'settings.tabs_panel_action_next': {
    en: 'next panel',
    ru: 'след. панель',
  },
  'settings.tabs_panel_action_expand': {
    en: 'expand/fold',
    ru: 'развернуть/свернуть',
  },
  'settings.tabs_panel_action_parent': {
    en: 'activate parent tab',
    ru: 'перейти к родительской вкладке',
  },
  'settings.tabs_panel_action_menu': {
    en: 'show menu',
    ru: 'открыть меню',
  },
  'settings.tabs_panel_action_collapse': {
    en: 'collapse inactive branches',
    ru: 'свернуть неактивные ветки',
  },
  'settings.tabs_panel_action_undo': {
    en: 'undo tab close',
    ru: 'восстановить закрытую вкладку',
  },
  'settings.tabs_panel_action_rm_act_tab': {
    en: 'close active tab',
    ru: 'закрыть активную вкладку',
  },
  'settings.tabs_panel_action_none': {
    en: 'none',
    ru: 'выкл',
  },

  // - Keybindings
  'settings.kb_title': {
    en: 'Keybindings',
    ru: 'Клавиши',
  },
  'settings.kb_input': {
    en: 'Press new shortcut',
    ru: 'Нажмете новое сочетание клавиш',
  },
  'settings.kb_err_duplicate': {
    en: 'Already exists',
    ru: 'Уже существует',
  },
  'settings.kb_err_invalid': {
    en: 'Invalid shortcut',
    ru: 'Недопустимое сочетание клавиш',
  },
  'settings.reset_kb': {
    en: 'Reset Keybindings',
    ru: 'Сбросить клав. настройки',
  },
  'settings.toggle_kb': {
    en: 'Enable/Disable Keybindings',
    ru: 'Включить / отключить сочетания клавиш',
  },
  'settings.enable_kb': {
    en: 'Enable Keybindings',
    ru: 'Включить сочетания клавиш',
  },
  'settings.disable_kb': {
    en: 'Disable Keybindings',
    ru: 'Отключить сочетания клавиш',
  },

  // - Permissions
  'settings.permissions_title': {
    en: 'Permissions',
    ru: 'Разрешения',
  },
  'settings.all_urls_label': {
    en: 'Accessing web requests data:',
    ru: 'Данные веб-сайтов:',
  },
  'settings.all_urls_info': {
    en: 'Required for:\n- Cleaning cookies\n- Proxy and URL rules of containers\n- Screenshots for the group page and windows selection panel\n- Changing the User-Agent per container',
    ru: 'Необходимо для:\n- Удаления cookies\n- Прокси и url-правил контейнеров\n- Скриншотов на групповой странице и на панели выбора окна',
  },
  'settings.perm.bookmarks_label': {
    en: 'Bookmarks:',
    ru: 'Управление закладками:',
  },
  'settings.perm.bookmarks_info': {
    en: 'Required for:\n- Bookmarks panels',
    ru: 'Required for:\n- Панели закладок',
  },
  'settings.tab_hide_label': {
    en: 'Hiding tabs:',
    ru: 'Скрытие вкладок:',
  },
  'settings.tab_hide_info': {
    en: 'Required for:\n- Hiding tabs in inactive panels\n- Hiding folded tabs',
    ru: 'Необходимо для:\n- Скрывания вкладок неактивных панелей\n- Скрывания свернутых вкладок',
  },
  'settings.clipboard_write_label': {
    en: 'Writing to clipboard:',
    ru: 'Запись в буфер обмена:',
  },
  'settings.clipboard_write_info': {
    en: 'Required for:\n- Copying URLs of tabs/bookmarks through context menu',
    ru: 'Необходимо для:\n- Копирования ссылок вкладок/закладок',
  },
  'settings.history_label': {
    en: 'History:',
    ru: 'История:',
  },
  'settings.history_info': {
    en: 'Required for:\n- History panel',
    ru: 'Необходимо для:\n- Панель истории',
  },

  // - Storage
  'settings.storage_title': {
    en: 'Storage',
    ru: 'Данные',
  },
  'settings.storage_delete_prop': {
    en: 'delete',
    ru: 'удалить',
  },
  'settings.storage_edit_prop': {
    en: 'edit',
    ru: 'редактировать',
  },
  'settings.storage_open_prop': {
    en: 'open',
    ru: 'открыть',
  },
  'settings.storage_delete_confirm': {
    en: 'Delete property ',
    ru: 'Удалить поле ',
  },
  'settings.update_storage_info': {
    en: 'Update',
    ru: 'Обновить',
  },
  'settings.clear_storage_info': {
    en: 'Delete everything',
    ru: 'Удалить все',
  },
  'settings.clear_storage_confirm': {
    en: 'Are you sure you want to delete all Sidebery data?',
    ru: 'Вы действительно хотите удалить все данные?',
  },
  'settings.favs_title': {
    en: 'Cached favicons',
    ru: 'Кэшированные иконки сайтов',
  },

  // - Sync
  'settings.sync_title': {
    en: 'Sync',
    ru: 'Синхронизация',
  },
  'settings.sync_name': {
    en: 'Profile name for sync',
    ru: 'Имя профиля для синхронизации',
  },
  'settings.sync_name_or': {
    en: 'e.g: Firefox Beta Home',
    ru: 'напр. Firefox Домашний',
  },
  'settings.sync_save_settings': {
    en: 'Save settings to sync storage',
    ru: 'Сохранять настройки в синхронизируемое хранилище',
  },
  'settings.sync_save_ctx_menu': {
    en: 'Save context menu to sync storage',
    ru: 'Сохранять контекстное меню в синхронизируемое хранилище',
  },
  'settings.sync_save_styles': {
    en: 'Save styles to sync storage',
    ru: 'Сохранять стили в синхронизируемое хранилище',
  },
  'settings.sync_auto_apply': {
    en: 'Automatically apply changes',
    ru: 'Автоматически применять изменения',
  },
  'settings.sync_settings_title': {
    en: 'Settings',
    ru: 'Настройки',
  },
  'settings.sync_ctx_menu_title': {
    en: 'Context menu',
    ru: 'Контекстное меню',
  },
  'settings.sync_styles_title': {
    en: 'Styles',
    ru: 'Стили',
  },
  'settings.sync_apply_btn': {
    en: 'Apply',
    ru: 'Применить',
  },
  'settings.sync_delete_btn': {
    en: 'Delete',
    ru: 'Удалить',
  },
  'settings.sync_update_btn': {
    en: 'Update synced data',
    ru: 'Обновить данные',
  },
  'settings.sync_apply_confirm': {
    en: 'Are you sure you want to apply synced data?',
    ru: 'Вы действительно хотите применить синхронизированные данные?',
  },
  'settings.sync.apply_err': {
    en: 'Cannot apply synchronized data',
    ru: 'Невозможно применить синхронизированные данные',
  },

  // - Help
  'settings.help_title': {
    en: 'Help',
    ru: 'Помощь',
  },
  'settings.debug_info': {
    en: 'Show debug info',
    ru: 'Отладочная информация',
  },
  'settings.log_lvl': {
    en: 'Log level',
    ru: 'Уровень логов',
  },
  'settings.log_lvl_0': {
    en: 'none',
    ru: 'выкл',
  },
  'settings.log_lvl_1': {
    en: 'errors',
    ru: 'ошибки',
  },
  'settings.log_lvl_2': {
    en: 'warnings',
    ru: 'предупреждения',
  },
  'settings.log_lvl_3': {
    en: 'all',
    ru: 'все',
  },
  'settings.copy_devtools_url': {
    en: 'Copy devtools URL',
    ru: 'Скопировать URL страницы разработчика',
  },
  'settings.repo_issue': {
    en: 'Open issue',
    ru: 'Создать github issue',
  },
  'settings.repo_bug': {
    en: 'Report a bug',
    ru: 'Сообщить об ошибке',
  },
  'settings.repo_feature': {
    en: 'Suggest a feature',
    ru: 'Предложить новую функцию',
  },
  'settings.reset_settings': {
    en: 'Reset settings',
    ru: 'Сбросить настройки',
  },
  'settings.reset_confirm': {
    en: 'Are you sure you want to reset settings?',
    ru: 'Вы уверены, что хотите сбросить настройки?',
  },
  'settings.ref_rm': {
    en: 'Will be removed; open an issue if you need this feature.',
    ru: 'Will be removed, open an issue if you need this feature.',
  },
  'settings.help_exp_data': {
    en: 'Export',
    ru: 'Экспорт',
  },
  'settings.help_imp_data': {
    en: 'Import',
    ru: 'Импорт',
  },
  'settings.help_imp_perm': {
    en: 'Additional permissions are required',
    ru: 'Необходимы дополнительные разрешения',
  },
  'settings.export_title': {
    en: 'Select what to export',
    ru: 'Выберете данные для экспорта',
  },
  'settings.import_title': {
    en: 'Select what to import',
    ru: 'Выберете данные для импорта',
  },
  'settings.backup_all': {
    en: 'All',
    ru: 'Все',
  },
  'settings.backup_containers': {
    en: 'Containers config',
    ru: 'Конфигурация контейнеры',
  },
  'settings.backup_settings': {
    en: 'Settings',
    ru: 'Настройки',
  },
  'settings.backup_styles': {
    en: 'Styles',
    ru: 'Стили',
  },
  'settings.backup_snapshots': {
    en: 'Snapshots',
    ru: 'Снепшоты',
  },
  'settings.backup_favicons': {
    en: 'Sites icons cache',
    ru: 'Кэш иконок сайтов',
  },
  'settings.backup_kb': {
    en: 'Keybindings',
    ru: 'Сочетания клавиш',
  },
  'settings.backup_parse_err': {
    en: 'Wrong format of imported data',
    ru: 'Неправильный формат импортированных данных',
  },
  'settings.reload_addon': {
    en: 'Reload add-on',
    ru: 'Перезагрузить расширение',
  },

  // ---
  // -- Snapshots viewer
  // -
  'snapshot.window_title': {
    en: 'Window',
    ru: 'Окно',
  },
  'snapshot.btn_open': {
    en: 'Open',
    ru: 'Открыть',
  },
  'snapshot.btn_apply': {
    en: 'Apply',
    ru: 'Применить',
  },
  'snapshot.btn_remove': {
    en: 'Remove',
    ru: 'Удалить',
  },
  'snapshot.btn_create_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
  },
  'snapshot.btn_open_all_win': {
    en: 'Open all windows',
    ru: 'Открыть все окна',
  },
  'snapshot.btn_open_win': {
    en: 'Open window',
    ru: 'Открыть окно',
  },
  'snapshot.btn_create_first': {
    en: 'Create first snapshot',
    ru: 'Создать первый снепшот',
  },
  'snapshot.snap_win': {
    en: n => (n === 1 ? 'window' : 'windows'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'окно'
      if (NUM_234_RE.test(n.toString())) return 'окна'
      return 'окон'
    },
  },
  'snapshot.snap_ctr': {
    en: n => (n === 1 ? 'container' : 'containers'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'контейнер'
      if (NUM_234_RE.test(n.toString())) return 'контейнера'
      return 'контейнеров'
    },
  },
  'snapshot.snap_tab': {
    en: n => (n === 1 ? 'tab' : 'tabs'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'вкладка'
      if (NUM_234_RE.test(n.toString())) return 'вкладки'
      return 'вкладок'
    },
  },
  'snapshot.selected': {
    en: 'Selected:',
    ru: 'Выбрано:',
  },
  'snapshot.sel.open_in_panel': {
    en: 'Open in current panel',
    ru: 'Открыть в текущей панели',
  },
  'snapshot.sel.reset_sel': {
    en: 'Reset selection',
    ru: 'Сбросить',
  },

  // ---
  // -- Styles editor
  // -
  'styles.reset_styles': {
    en: 'Reset CSS variables',
    ru: 'Сбросить CSS переменные',
  },
  'styles.css_sidebar': {
    en: 'Sidebar',
    ru: 'Боковая панель',
  },
  'styles.css_group': {
    en: 'Group page',
    ru: 'Групповая страница',
  },
  'styles.css_placeholder': {
    en: 'Write custom CSS here...',
    ru: 'Write custom CSS here...',
  },
  'styles.css_selectors_instruction': {
    en: `NOTE: To get currently available css-selectors use debugger:
  - Click "Copy debtools URL" button in the bottom bar
  - Open new tab with that URL
  - Select frame to inspect
    - Click on the rectangular icon (with three sections) in top-right area of the debugger page
    - Select "/sidebar/index.html" for sidebar frame
    - Select "/page.group/group.html" for group page frame
  - Browse "Inspector" tab`,
  },
  'styles.vars_group.other': {
    en: 'Other',
    ru: 'Прочие',
  },
  'styles.vars_group.animation': {
    en: 'Animation speed',
    ru: 'Скорость анимации',
  },
  'styles.vars_group.buttons': {
    en: 'Buttons',
    ru: 'Кнопки',
  },
  'styles.vars_group.scroll': {
    en: 'Scroll',
    ru: 'Скрол',
  },
  'styles.vars_group.menu': {
    en: 'Context menu',
    ru: 'Контекстное меню',
  },
  'styles.vars_group.nav': {
    en: 'Navigation bar',
    ru: 'Панель навигации',
  },
  'styles.vars_group.pinned_dock': {
    en: 'Pinned tabs dock',
    ru: 'Область закрепленных вкладок',
  },
  'styles.vars_group.tabs': {
    en: 'Tabs',
    ru: 'Вкладки',
  },
  'styles.vars_group.bookmarks': {
    en: 'Bookmarks',
    ru: 'Закладки',
  },
}

if (!window.translations) window.translations = setupPageTranslations
else Object.assign(window.translations, setupPageTranslations)
