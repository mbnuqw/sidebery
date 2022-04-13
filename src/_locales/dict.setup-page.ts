import { NUM_1_RE, NUM_234_RE } from './dict.common'

export const setupPageTranslations: Translations = {
  // ---
  // -- Popups
  // -
  // - Container config popup
  'container.name_placeholder': {
   en: 'Name...',
   ru: 'Название...',
   zh: '名称...'
  },
  'container.icon_label': {
   en: 'Icon',
   ru: 'Иконка',
   zh: '图标'
  },
  'container.color_label': {
   en: 'Color',
   ru: 'Цвет',
   zh: '颜色'
  },
  'container.proxy_label': {
   en: 'Proxy',
   ru: 'Прокси',
   zh: '代理'
  },
  'container.proxy_host_placeholder': {
   en: '---',
   ru: 'хост',
   zh: '---'
  },
  'container.proxy_port_placeholder': {
   en: '---',
   ru: 'порт',
   zh: '---'
  },
  'container.proxy_username_placeholder': {
   en: '---',
   ru: 'пользователь',
   zh: '---'
  },
  'container.proxy_password_placeholder': {
   en: '---',
   ru: 'пароль',
   zh: '---'
  },
  'container.proxy_dns_label': {
   en: 'proxy DNS',
   ru: 'проксировать DNS',
   zh: 'DNS代理'
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
   zh: '无',
  },
  'container.rules_include': {
   en: 'Include URLs',
   ru: 'Включать вкладки',
   zh: 'URL列表'
  },
  'container.rules_include_tooltip': {
   en: 'Reopen tabs with matched URLs in this container.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
   ru: 'Переоткрывать вкладки с совпадающими url в этом контейнере.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
   zh: '在此容器中重新打开匹配此URL列表的标签页。\n以换行符分割的 字符串 或 /正则/ 列表:\n    example.com\n    /^(some)?regex$/\n    ...'
  },
  'container.rules_exclude': {
   en: 'Exclude URLs',
   ru: 'Исключать вкладки',
   zh: 'URL排除列表'
  },
  'container.rules_exclude_tooltip': {
   en: 'Reopen tabs with matched URL in default container.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
   ru: 'Переоткрывать вкладки с совпадающими url из этого контейнера в стандартном.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
   zh: '在默认容器中重新打开匹配此URL列表的标签页。\n以换行符分割的 字符串 或 /正则/ 列表:\n    example.com\n    /^(some)?regex$/\n    ...'
  },
  'container.user_agent': {
   en: 'User Agent',
  },
  // - Panel config popup
  'panel.name_placeholder': {
   en: 'Name...',
   ru: 'Название...',
   zh: '名称...',
  },
  'panel.icon_label': {
   en: 'Icon',
   ru: 'Иконка',
   zh: '图标'
  },
  'panel.color_label': {
   en: 'Color',
   ru: 'Цвет',
   zh: '颜色'
  },
  'panel.lock_panel_label': {
   en: 'Prevent auto-switching from this panel',
   ru: 'Запретить автоматическое переключение с этой панели',
   zh: '防止从此面板自动切换'
  },
  'panel.temp_mode_label': {
   en: 'Switch back to previously active tabs panel after mouse leave',
   ru: 'Переключаться на последнюю активную панель вкладок, если курсор мыши убран',
   zh: '鼠标离开后切换回之前活动的标签页面板'
  },
  'panel.skip_on_switching': {
   en: 'Skip this panel when switching panels',
   ru: 'Пропускать эту панель при переключении панелей',
   zh: '切换面板时跳过此面板'
  },
  'panel.no_empty_label': {
   en: 'Create new tab after the last one is closed',
   ru: 'Создавать новую вкладку после закрытия последней',
   zh: '关闭最后一个标签页后创建新标签页'
  },
  'panel.new_tab_ctx': {
   en: 'Container of new tab',
   ru: 'Контейнер новой вкладки',
   zh: '新标签页的容器'
  },
  'panel.drop_tab_ctx': {
   en: 'Reopen tab that was dropped to this panel in container:',
   ru: 'Переоткрыть вкладку, переброшенную в эту панель, в контейнере:',
   zh: '在容器中重新打开拖放到此面板的标签页:'
  },
  'panel.move_tab_ctx': {
   en: 'Move tab to this panel if it is opened in container:',
   ru: 'Перемещать вкладки выбранного контейнера в эту панель',
   zh: '如果它在容器中打开，则将标签页移动到此面板:'
  },
  'panel.move_tab_ctx_nochild': {
   en: 'Except child tabs',
   ru: 'За исключением дочерних вкладок',
   zh: '排除子标签页'
  },
  'panel.ctr_tooltip_none': {
   en: 'Not set',
   ru: 'Не задан',
   zh: '未设置'
  },
  'panel.ctr_tooltip_default': {
   en: 'No container',
   ru: 'Без контейнера',
   zh: '无容器'
  },
  'panel.url_rules': {
   en: 'Move tabs with matched URLs to this panel',
   ru: 'Перемещать вкладки с совпадающими адресами в эту панель',
   zh: '将匹配URL列表的标签页移动到此面板'
  },
  'panel.auto_convert': {
   en: 'Convert to source tabs panel on opening bookmark',
   ru: 'При открытии закладки преобразовать в исходную панель вкладок',
   zh: '打开书签时切换到源标签页面板'
  },
  'panel.custom_icon_note': {
   en: 'Base64, URL or text. Text values syntax: "text::color::CSS-font-value"',
   ru: 'Base64, url или символы. Синтакс для символов: "символы::CSS-цвет::CSS-шрифт"',
   zh: 'Base64、URL 或文本。文本值语法：“text::color::CSS-font-value”'
  },
  'panel.custom_icon': {
   en: 'Custom icon',
   ru: 'Пользовательская иконка',
   zh: '自定义图标'
  },
  'panel.custom_icon_load': {
   en: 'Load',
   ru: 'Загрузить',
   zh: '加载'
  },
  'panel.custom_icon_placeholder': {
   en: 'e.g. A::#000000ff::700 32px Roboto',
   ru: 'A::#000000ff::700 32px Roboto',
   zh: '例如 A::#000000ff::700 32px Roboto'
  },
  'panel.url_label': {
   en: 'URL',
  },
  'panel.root_id_label': {
   en: 'Root folder',
   ru: 'Корневая папка',
   zh: '根文件夹',
  },
  'panel.root_id.choose': {
   en: 'Choose folder',
   ru: 'Выбрать папку',
   zh: '选择文件夹'
  },
  'panel.root_id.reset': {
   en: 'Reset',
   ru: 'Сбросить',
   zh: '重置'
  },
  'panel.bookmarks_view_mode': {
   en: 'View mode',
   ru: 'Тип отображения',
   zh: '视图模式'
  },
  'panel.bookmarks_view_mode_tree': {
   en: 'tree',
   ru: 'древовидная структура',
   zh: '树状'
  },
  'panel.bookmarks_view_mode_history': {
   en: 'history',
   ru: 'хронологический список',
   zh: '历史'
  },
  'panel.new_tab_custom_btns': {
   en: 'Additional "New tab" buttons',
   ru: 'Дополнительные кнопки для создания новой вкладки',
   zh: '额外的“新建标签”按钮'
  },
  'panel.new_tab_custom_btns_placeholder': {
   en: 'Container name and/or URL',
   ru: 'Имя контейнера и/или URL',
   zh: '容器名称 和/或 URL'
  },
  'panel.new_tab_custom_btns_note': {
   en: 'Note: List of button configs. Example:\n  Personal  (open new tab in "Personal" container)\n  https://example.com  (open provided URL)\n  Personal, https://example.com  (open provided URL in "Personal" container)',
   ru: 'Список настроек для кнопок новой вкладки. Пример:\n  Персональный  (Открыть вкладку в контейнере "Персональный")\n  https://example.com  (Открыть вкладку с данным URL)\n  Персональный, https://example.com  (Открыть вкладку с данным URL в контейнере "Персональный")',
   zh: '注意：按钮配置列表。示例：\n 个人（在“个人”容器中打开新标签页）\n  https://example.com  (打开提供的URL)\n  个人, https://example.com  (在“个人”容器中打开提供的 URL)'
  },

  // ---
  // -- Settings
  // -
  'settings.nav_settings': {
   en: 'Settings',
   ru: 'Настройки',
   zh: '设置'
  },
  'settings.nav_settings_general': {
   en: 'General',
   ru: 'Основные',
   zh: '通用'
  },
  'settings.nav_settings_menu': {
   en: 'Menu',
   ru: 'Меню',
   zh: '菜单'
  },
  'settings.nav_settings_nav': {
   en: 'Navigation bar',
   ru: 'Навигация',
   zh: '导航栏'
  },
  'settings.nav_settings_panels': {
   en: 'Panels',
   ru: 'Панель управления',
   zh: '面板'
  },
  'settings.nav_settings_controlbar': {
   en: 'Control bar',
   ru: 'Групповая страница',
   zh: '控制栏'
  },
  'settings.nav_settings_group': {
   en: 'Group page',
   ru: 'Контейнеры',
   zh: '分组页面'
  },
  'settings.nav_settings_containers': {
   en: 'Containers',
   ru: 'Панели',
   zh: '容器'
  },
  'settings.nav_settings_dnd': {
   en: 'Drag and Drop',
   ru: 'Перетаскивание',
   zh: '拖拽'
  },
  'settings.nav_settings_search': {
   en: 'Search',
   ru: 'Поиск',
   zh: '搜索'
  },
  'settings.nav_settings_tabs': {
   en: 'Tabs',
   ru: 'Вкладки',
   zh: '标签页'
  },
  'settings.nav_settings_new_tab_position': {
   en: 'Position of new tab',
   ru: 'Позиция новых вкладок',
   zh: '新标签页的位置'
  },
  'settings.nav_settings_pinned_tabs': {
   en: 'Pinned tabs',
   ru: 'Закрепленные вкладки',
   zh: '固定的标签页'
  },
  'settings.nav_settings_tabs_tree': {
   en: 'Tabs tree',
   ru: 'Дерево вкладок',
   zh: '树状标签页'
  },
  'settings.nav_settings_bookmarks': {
   en: 'Bookmarks',
   ru: 'Закладки',
   zh: '书签'
  },
  'settings.nav_settings_history': {
   en: 'History',
   ru: 'История',
   zh: '历史'
  },
  'settings.nav_settings_appearance': {
   en: 'Appearance',
   ru: 'Вид',
   zh: '外观'
  },
  'settings.nav_settings_snapshots': {
   en: 'Snapshots',
   ru: 'Снепшоты',
   zh: '快照'
  },
  'settings.nav_settings_mouse': {
   en: 'Mouse',
   ru: 'Мышь',
   zh: '鼠标'
  },
  'settings.nav_settings_keybindings': {
   en: 'Keybindings',
   ru: 'Клавиши',
   zh: '按键绑定'
  },
  'settings.nav_settings_permissions': {
   en: 'Permissions',
   ru: 'Разрешения',
   zh: '权限'
  },
  'settings.nav_settings_storage': {
   en: 'Storage',
   ru: 'Данные',
   zh: '存储'
  },
  'settings.nav_settings_sync': {
   en: 'Sync',
   ru: 'Синхронизация',
   zh: '同步'
  },
  'settings.nav_settings_help': {
   en: 'Help',
   ru: 'Помощь',
   zh: '帮助'
  },
  'settings.nav_menu_editor': {
   en: 'Menu editor',
   ru: 'Редактор меню',
   zh: '菜单编辑器'
  },
  'settings.nav_menu_editor_tabs': {
   en: 'Tabs',
   ru: 'Вкладки',
   zh: '标签页'
  },
  'settings.nav_menu_editor_tabs_panel': {
   en: 'Tabs panel',
   ru: 'Панель вкладок',
   zh: '标签页面板'
  },
  'settings.nav_menu_editor_bookmarks': {
   en: 'Bookmarks',
   ru: 'Закладки',
   zh: '书签'
  },
  'settings.nav_menu_editor_bookmarks_panel': {
   en: 'Bookmarks panel',
   ru: 'Панель закладок',
   zh: '书签面板'
  },
  'settings.nav_styles_editor': {
   en: 'Styles editor',
   ru: 'Редактор стилей',
   zh: '样式编辑器'
  },
  'settings.nav_snapshots': {
   en: 'Snapshots viewer',
   ru: 'Снепшоты',
   zh: '快照查看器'
  },

  // - Details controls
  'settings.ctrl_update': {
   en: 'UPDATE',
   ru: 'ОБНОВИТЬ',
   zh: '更新'
  },
  'settings.ctrl_copy': {
   en: 'COPY',
   ru: 'СКОПИРОВАТЬ',
   zh: '复制'
  },
  'settings.ctrl_close': {
   en: 'CLOSE',
   ru: 'ЗАКРЫТЬ',
   zh: '关闭'
  },

  // - General
  'settings.general_title': {
   en: 'General',
   ru: 'Основные',
   zh: '通用'
  },
  'settings.native_scrollbars': {
   en: 'Use native scroll-bars',
   ru: 'Использовать системные скроллбары',
   zh: '使用原生滚动条'
  },
  'settings.native_scrollbars_thin': {
   en: 'Use thin scroll-bars',
   ru: 'Использовать узкие скроллбары',
   zh: '使用细滚动条'
  },
  'settings.sel_win_screenshots': {
   en: 'Show screenshots in the window selection menu',
   ru: 'Показывать скриншоты в меню выбора окна',
   zh: '在窗口选择菜单中显示屏幕截图'
  },
  'settings.update_sidebar_title': {
    en: "Use active panel's name as sidebar title",
    ru: 'Использовать имя активной панели в качестве заголовка боковой панели',
    zh: "使用活动面板的名称作为侧边栏标题",
  },
  'settings.mark_window': {
    en: "Add preface to the browser window's title if Sidebery sidebar is active",
    ru: 'Добавлять префикс к заголовку окна, если боковая панель Sidebery активна',
    zh: "如果 Sidebery 侧边栏处于活动状态，则在浏览器窗口的标题中添加前言",
  },
  'settings.mark_window_preface': {
   en: 'Preface value',
   ru: 'Значение префикса',
   zh: '前言值设置'
  },
  'settings.storage_btn': {
    en: "Sidebery's data:",
    ru: 'Данные Sidebery:',
    zh: "Sidebery的数据:",
  },
  'settings.permissions_btn': {
    en: 'Permissions',
    ru: 'Разрешения',
  },

  // - Context menu
  'settings.ctx_menu_title': {
   en: 'Context menu',
   ru: 'Контекстное меню',
   zh: '上下文菜单'
  },
  'settings.ctx_menu_native': {
   en: 'Use native context menu',
   ru: 'Использовать системное контекстное меню',
   zh: '使用本机上下文菜单'
  },
  'settings.ctx_menu_render_inact': {
   en: 'Render inactive options',
   ru: 'Отображать неактивные элементы',
   zh: '渲染非活动选项'
  },
  'settings.ctx_menu_render_icons': {
   en: 'Render icons',
   ru: 'Отображать иконки',
   zh: '渲染图标'
  },
  'settings.ctx_menu_ignore_ctr': {
   en: 'Ignore containers',
   ru: 'Не отображать контейнеры',
   zh: '忽略容器'
  },
  'settings.ctx_menu_ignore_ctr_or': {
   en: 'e.g. /^tmp.+/, Google, Facebook',
   ru: 'пример: /^tmp.+/, Google, Facebook',
   zh: '例如 /^tmp.+/, Google, Facebook'
  },
  'settings.ctx_menu_ignore_ctr_note': {
   en: 'Use comma-separated list of contaianers names or /regexp/',
   ru: 'Список названий или /regexp/ через запятую',
   zh: '使用逗号分隔的容器列表名称, 字符串或 /正则/ '
  },
  'settings.ctx_menu_editor': {
   en: 'Edit context menu',
   ru: 'Редактировать меню',
   zh: '编辑上下文菜单'
  },

  // - Navigation bar
  // TODO: rename 'nav' to 'navbar'
  'settings.nav_title': {
   en: 'Navigation bar',
   ru: 'Навигация',
   zh: '导航栏'
  },
  'settings.nav_bar_layout': {
   en: 'Layout',
   ru: 'Расположение',
   zh: '布局'
  },
  'settings.nav_bar_layout_horizontal': {
   en: 'horizontal',
   ru: 'горизонтальное',
   zh: '水平排列'
  },
  'settings.nav_bar_layout_vertical': {
   en: 'vertical',
   ru: 'вертикальное',
   zh: '垂直排列'
  },
  'settings.nav_bar_layout_hidden': {
   en: 'hidden',
   ru: 'скрытое',
   zh: '隐藏'
  },
  'settings.nav_bar_inline': {
   en: 'Show navigation bar in one line',
   ru: 'В одну строку',
   zh: '在一行中显示导航栏'
  },
  'settings.nav_bar_side': {
   en: 'Side',
   ru: 'Сторона',
   zh: '侧面设置'
  },
  'settings.nav_bar_side_left': {
   en: 'left',
   ru: 'левая',
   zh: '移动侧栏到左侧'
  },
  'settings.nav_bar_side_right': {
   en: 'right',
   ru: 'правая',
   zh: '移动侧栏到右侧'
  },
  'settings.nav_btn_count': {
   en: 'Show count of tabs/bookmarks',
   ru: 'Показывать количество вкладок/закладок',
   zh: '显示标签页/书签的数量'
  },
  'settings.hide_empty_panels': {
   en: 'Hide empty tabs panels',
   ru: 'Скрывать пустые панели вкладок',
   zh: '隐藏空标签页面板'
  },
  'settings.nav_switch_panels_delay': {
   en: 'Min delay between panels switching (ms)',
   ru: 'Минимальная задержка между переключениями панелей (мс)',
   zh: '面板切换的最小延迟（毫秒）'
  },
  'settings.nav_act_tabs_panel_left_click': {
   en: 'Left click on active tabs panel',
   ru: 'Клик левой кнопкой мыши по активной панели вкладок',
   zh: '左键单击活动的标签页面板'
  },
  'settings.nav_act_tabs_panel_left_click_new_tab': {
   en: 'create tab',
   ru: 'создать вкладку',
   zh: '新建标签页'
  },
  'settings.nav_act_tabs_panel_left_click_none': {
   en: 'none',
   ru: 'ничего',
   zh: '无'
  },
  'settings.nav_act_bookmarks_panel_left_click': {
   en: 'Left click on active bookmarks panel',
   ru: 'Клик левой кнопкой мыши по активной панели закладок',
   zh: '左键单击活动的书签面板'
  },
  'settings.nav_act_bookmarks_panel_left_click_scroll': {
   en: 'scroll to start/end',
   ru: 'проскроллить к началу/концу',
   zh: '滚动到顶部/底部'
  },
  'settings.nav_act_bookmarks_panel_left_click_none': {
   en: 'none',
   ru: 'ничего',
   zh: '无'
  },
  'settings.nav_tabs_panel_mid_click': {
   en: 'Middle click on tabs panel',
   ru: 'Клик средней кнопкой мыши по панели вкладок',
   zh: '中键单击标签页面板'
  },
  'settings.nav_tabs_panel_mid_click_rm_act_tab': {
   en: 'close active tab',
   ru: 'закрыть активную вкладку',
   zh: '关闭活动标签页'
  },
  'settings.nav_tabs_panel_mid_click_rm_all': {
   en: 'close tabs',
   ru: 'закрыть вкладки',
   zh: '关闭标签页'
  },
  'settings.nav_tabs_panel_mid_click_discard': {
   en: 'unload tabs',
   ru: 'выгрузить вкладки',
   zh: '卸载标签页'
  },
  'settings.nav_tabs_panel_mid_click_bookmark': {
   en: 'save panel to bookmarks',
   ru: 'сохранить панель в закладки',
   zh: '将面板保存到书签'
  },
  'settings.nav_tabs_panel_mid_click_convert': {
   en: 'convert to bookmarks',
   ru: 'конвертировать в панель закладок',
   zh: '转换为书签'
  },
  'settings.nav_tabs_panel_mid_click_none': {
   en: 'none',
   ru: 'ничего',
   zh: '无'
  },
  'settings.nav_bookmarks_panel_mid_click': {
   en: 'Middle click on bookmarks panel',
   ru: 'Клик средней кнопкой мыши по панели закладок',
   zh: '在书签面板上单击鼠标中键'
  },
  'settings.nav_bookmarks_panel_mid_click_convert': {
   en: 'convert to tabs',
   ru: 'конвертировать во вкладки',
   zh: '转换为标签'
  },
  'settings.nav_bookmarks_panel_mid_click_none': {
   en: 'none',
   ru: 'ничего',
   zh: 'none'
  },
  'settings.nav_switch_panels_wheel': {
   en: 'Switch panels with mouse wheel over navigation bar',
   ru: 'Переключать панели с помощью колеса мыши над панелью навигации',
   zh: '在导航栏上使用鼠标滚轮切换面板'
  },
  'settings.nav_bar_enabled': {
   en: 'Enabled elements',
   ru: 'Активированные элементы',
   zh: '已启用的元素'
  },
  'settings.nav_bar.no_elements': {
   en: 'No elements',
   ru: 'Нет элементов',
   zh: '无元素'
  },
  'settings.nav_bar.available_elements': {
   en: 'Available elements',
   ru: 'Доступные элементы',
   zh: '可用元素'
  },
  'settings.nav_bar_btn_tabs_panel': {
   en: 'Tabs panel',
   ru: 'Панель вкладок',
   zh: '标签页面板'
  },
  'settings.nav_bar_btn_bookmarks_panel': {
   en: 'Bookmarks panel',
   ru: 'Панель закладок',
   zh: '书签面板'
  },
  'settings.nav_bar_btn_sp': {
   en: 'Space',
   ru: 'Пространство',
   zh: 'Space'
  },
  'settings.nav_bar_btn_sd': {
   en: 'Delimiter',
   ru: 'Разделитель',
   zh: '分隔符'
  },
  'settings.nav_bar_btn_history': {
   en: 'History panel',
   ru: 'История',
   zh: '历史面板'
  },
  'settings.nav_bar_btn_settings': {
   en: 'Settings',
   ru: 'Настройки',
   zh: '设置'
  },
  'settings.nav_bar_btn_add_tp': {
   en: 'Create tabs panel',
   ru: 'Создать панель вкладок',
   zh: '创建标签页面板'
  },
  'settings.nav_bar_btn_search': {
   en: 'Search',
   ru: 'Поиск',
   zh: '搜索'
  },
  'settings.nav_bar_btn_create_snapshot': {
   en: 'Create snapshot',
   ru: 'Создать снепшот',
   zh: '创建快照'
  },
  'settings.nav_bar_btn_remute_audio_tabs': {
   en: 'Mute/Unmute audible tabs',
   ru: 'Приглушить/Включить вкладки со звуком',
   zh: '静音/取消静音有声标签页'
  },
  'settings.nav_rm_tabs_panel_confirm_pre': {
   en: 'Delete "',
   ru: 'Удалить панель "',
   zh: '删除 "'
  },
  'settings.nav_rm_tabs_panel_confirm_post': {
   en: '" panel?\nAll tabs of this panel will be assigned to nearest tabs panel.',
   ru: '"?\n Все вкладки этой панели будут присоединены к соседней панели.',
   zh: '" 面板吗?\n此面板的所有标签页都将分配给最近的标签页面板。'
  },
  'settings.nav_rm_bookmarks_panel_confirm_pre': {
   en: 'Delete "',
   ru: 'Удалить панель "',
   zh: '删除 "'
  },
  'settings.nav_rm_bookmarks_panel_confirm_post': {
   en: '" panel?',
   ru: '"?',
   zh: '" 面板吗?'
  },

  // - Group page
  'settings.group_title': {
   en: 'Group page',
   ru: 'Групповая страница',
   zh: '分组页面'
  },
  'settings.group_layout': {
   en: 'Layout of tabs',
   ru: 'Отображение',
   zh: '标签页的布局'
  },
  'settings.group_layout_grid': {
   en: 'grid',
   ru: 'сетка',
   zh: '网格'
  },
  'settings.group_layout_list': {
   en: 'list',
   ru: 'список',
   zh: '列表'
  },

  // - Containers
  'settings.containers_title': {
   en: 'Containers',
   ru: 'Контейнеры',
   zh: '容器'
  },
  'settings.contianer_remove_confirm_prefix': {
   en: 'Are you sure you want to delete "',
   ru: 'Вы действительно хотите удалить контейнер "',
   zh: '你确定要删除 "'
  },
  'settings.contianer_remove_confirm_postfix': {
   en: '" container?',
   ru: '"?',
   zh: '" 容器吗?'
  },
  'settings.containers_create_btn': {
   en: 'Create container',
   ru: 'Создать контейнер',
   zh: '创建容器'
  },

  // - Drag and drop
  'settings.dnd_title': {
   en: 'Drag and Drop',
   ru: 'Перетаскивание',
   zh: '拖拽'
  },
  'settings.dnd_tab_act': {
   en: 'Activate tab on hover',
   ru: 'Активировать вкладку при наведении',
   zh: '悬停时激活标签页'
  },
  'settings.dnd_tab_act_delay': {
   en: 'With delay (ms)',
   ru: 'С задержкой (мс)',
   zh: '延迟 (毫秒)'
  },
  'settings.dnd_mod': {
   en: 'With pressed key',
   ru: 'При нажатии на',
   zh: '仅当按下'
  },
  'settings.dnd_mod_alt': {
   en: 'alt',
   ru: 'alt',
   zh: 'alt'
  },
  'settings.dnd_mod_shift': {
   en: 'shift',
   ru: 'shift',
   zh: 'shift'
  },
  'settings.dnd_mod_ctrl': {
   en: 'ctrl',
   ru: 'ctrl',
   zh: 'ctrl'
  },
  'settings.dnd_mod_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },
  'settings.dnd_exp': {
   en: 'Expand/Fold the branch on hovering over the',
   ru: 'Развернуть/свернуть ветвь при наведении на',
   zh: '展开/折叠分支当悬停在'
  },
  'settings.dnd_exp_pointer': {
    en: "pointer's triangle",
    ru: 'треугольник указателя',
    zh: "下拉三角形指针",
  },
  'settings.dnd_exp_hover': {
   en: 'tab/bookmark',
   ru: 'вкладку/закладку',
   zh: '标签页/书签'
  },
  'settings.dnd_exp_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },
  'settings.dnd_exp_delay': {
   en: 'With delay (ms)',
   ru: 'С задержкой (мс)',
   zh: '延迟 (毫秒)'
  },

  // - Search
  'settings.search_title': {
   en: 'Search',
   ru: 'Поиск',
   zh: '搜索'
  },
  'settings.search_bar_mode': {
   en: 'Search bar mode',
   ru: 'Режим панели',
   zh: '搜索栏模式'
  },
  'settings.search_bar_mode_static': {
   en: 'always shown',
   ru: 'активный',
   zh: '总是显示'
  },
  'settings.search_bar_mode_dynamic': {
   en: 'dynamic',
   ru: 'динамический',
   zh: '动态显示'
  },
  'settings.search_bar_mode_none': {
   en: 'inactive',
   ru: 'скрытый',
   zh: '不活跃'
  },

  // - Tabs
  'settings.tabs_title': {
   en: 'Tabs',
   ru: 'Вкладки',
   zh: '标签页'
  },
  'settings.warn_on_multi_tab_close': {
   en: 'Warn on trying to close multiple tabs',
   ru: 'Предупреждать при закрытии нескольких вкладок',
   zh: '尝试关闭多个标签页时给予提醒'
  },
  'settings.warn_on_multi_tab_close_any': {
   en: 'any',
   ru: 'любых',
   zh: '所有'
  },
  'settings.warn_on_multi_tab_close_collapsed': {
   en: 'collapsed',
   ru: 'свернутых',
   zh: '折叠'
  },
  'settings.warn_on_multi_tab_close_none': {
   en: 'none',
   ru: 'нет',
   zh: '无'
  },
  'settings.activate_on_mouseup': {
   en: 'Activate tab on mouse button release',
   ru: 'Активировать вкладку при отпускании кнопки мыши',
   zh: '释放鼠标按钮时激活标签页'
  },
  'settings.activate_last_tab_on_panel_switching': {
   en: 'Activate last active tab on panel switching',
   ru: 'Активировать последнюю активную вкладку при переключении панелей',
   zh: '在面板切换时激活上一个活动标签页'
  },
  'settings.skip_empty_panels': {
   en: 'Skip empty panels on switching',
   ru: 'Пропускать пустые контейнеры при переключении',
   zh: '切换时跳过空面板'
  },
  'settings.show_tab_rm_btn': {
   en: 'Show close button on mouse hover',
   ru: 'Показывать кнопку закрытия вкладки при наведении курсора',
   zh: '在鼠标悬停时显示关闭按钮'
  },
  'settings.hide_inactive_panel_tabs': {
   en: 'Hide native tabs of inactive panels',
   ru: 'Скрывать горизонтальные вкладки неактивных панелей',
   zh: '隐藏非活动面板的本机标签页'
  },
  'settings.activate_after_closing': {
   en: 'After closing current tab activate',
   ru: 'После закрытия текущей вкладки активировать',
   zh: '关闭当前标签页后激活'
  },
  'settings.activate_after_closing_next': {
   en: 'next tab',
   ru: 'следующую',
   zh: '下一个标签页'
  },
  'settings.activate_after_closing_prev': {
   en: 'previous tab',
   ru: 'предыдущую',
   zh: '上一个标签页'
  },
  'settings.activate_after_closing_prev_act': {
   en: 'previously active tab',
   ru: 'последнюю активную',
   zh: '上一活动标签页'
  },
  'settings.activate_after_closing_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },
  'settings.activate_after_closing_prev_rule': {
   en: 'Previous tab rule',
   ru: 'Правило предыдущей вкладки',
   zh: '上一个标签页规则'
  },
  'settings.activate_after_closing_next_rule': {
   en: 'Next tab rule',
   ru: 'Правило следующей вкладки',
   zh: '下一个标签页规则'
  },
  'settings.activate_after_closing_rule_tree': {
   en: 'tree',
   ru: 'дерево',
   zh: '树状'
  },
  'settings.activate_after_closing_rule_visible': {
   en: 'visible',
   ru: 'видимая',
   zh: '可见的'
  },
  'settings.activate_after_closing_rule_any': {
   en: 'any',
   ru: 'любая',
   zh: '所有'
  },
  'settings.activate_after_closing_global': {
   en: 'Globally',
   ru: 'Глобально',
   zh: '全局'
  },
  'settings.activate_after_closing_no_folded': {
   en: 'Ignore folded tabs',
   ru: 'Игнорировать свернутые вкладки',
   zh: '忽略折叠的标签页'
  },
  'settings.activate_after_closing_no_discarded': {
   en: 'Ignore discarded tabs',
   ru: 'Игнорировать выгруженные вкладки',
   zh: '忽略丢弃的标签页'
  },
  'settings.shift_selection_from_active': {
   en: 'Start shift+click selection from the active tab',
   ru: 'Начинать выделение по shift+клику с активной вкладки',
   zh: '活动标签页中启用 shift + 点击 进行选择'
  },
  'settings.ask_new_bookmark_place': {
   en: 'Ask where to store bookmarks',
   ru: 'Спрашивать куда сохранить закладки',
   zh: '询问存储书签的位置'
  },
  'settings.tabs_rm_undo_note': {
   en: 'Show undo notification on closing multiple tabs',
   ru: 'Показывать уведомление о закрытии нескольких вкладок',
   zh: '在关闭多个标签页时显示撤消通知'
  },
  'settings.native_highlight': {
   en: 'Highlight native tabs (in top horizontal bar) along with tabs in sidebar',
   ru: 'Выделять стандартные вкладки (в верхней панели) вместе с вкладками в боковой панели',
   zh: '突出显示本机标签页（在顶部水平栏中）以及侧边栏中的标签页'
  },
  'settings.tabs_unread_mark': {
   en: 'Show mark on unread tabs',
   ru: 'Показывать метку на непрочитанных вкладках',
   zh: '在未读标签页上显示标记'
  },
  'settings.tabs_reload_limit': {
   en: 'Limit the count of simultaneously reloading tabs',
   ru: 'Ограничить количество одновременно перезагружаемых вкладок',
   zh: '限制同时重新加载标签页的数量'
  },
  'settings.tabs_reload_limit_notif': {
   en: 'Show notification with the reloading progress',
   ru: 'Показывать уведомление со статусом перезагрузки',
   zh: '显示重新加载进度的通知'
  },
  'settings.tabs_panel_switch_act_move': {
   en: 'Switch panel after moving active tab to another panel',
   ru: 'Переключать панель после перемещения активной вкладки на другую панель',
   zh: '将活动标签页移动到另一个面板后切换面板'
  },
  'settings.show_new_tab_btns': {
   en: 'Show new tab buttons',
   ru: 'Показывать кнопки создания новых вкладок',
   zh: '显示新标签页按钮'
  },
  'settings.new_tab_bar_position': {
   en: 'Position',
   ru: 'Положение',
   zh: '地址'
  },
  'settings.new_tab_bar_position_after_tabs': {
   en: 'after tabs',
   ru: 'после вкладок',
   zh: '标签页后'
  },
  'settings.new_tab_bar_position_bottom': {
   en: 'bottom',
   ru: 'снизу',
   zh: '底部'
  },
  'settings.discard_inactive_panel_tabs_delay': {
   en: 'Unload tabs of inactive panel after delay',
   ru: 'Выгружать вкладки неактивных панелей c задержкой',
   zh: '超过延迟时间后卸载非活动面板的标签页'
  },
  'settings.discard_inactive_panel_tabs_delay_sec': {
    en: n => (n === 1 ? 'second' : 'seconds'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'секунда'
      if (NUM_234_RE.test(n.toString())) return 'секунды'
      return 'секунд'
    },
    zh: "秒",
  },
  'settings.discard_inactive_panel_tabs_delay_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
    zh: "分",
  },
  'settings.tabs_second_click_act_prev': {
   en: 'Backward activation when clicking on the active tab',
   ru: 'Обратная активация при нажатии на активную вкладку ',
   zh: '单击活动标签页时向后激活'
  },

  // - New tab position
  'settings.new_tab_position': {
   en: 'Position of new tab',
   ru: 'Позиция новых вкладок',
   zh: '新标签页的位置'
  },
  'settings.move_new_tab_pin': {
   en: 'Place new tab opened from pinned tab',
   ru: 'Открытые из закрепленных вкладок',
   zh: '从固定标签页打开的新标签页的位置'
  },
  'settings.move_new_tab_pin_start': {
   en: 'panel start',
   ru: 'начало панели',
   zh: '面板起始位置'
  },
  'settings.move_new_tab_pin_end': {
   en: 'panel end',
   ru: 'конец пенели',
   zh: '面板末尾位置'
  },
  'settings.move_new_tab_pin_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },
  'settings.move_new_tab_parent': {
   en: 'Place new tab opened from another tab',
   ru: 'Открытые из другой вкладки',
   zh: '从其它标签页打开的新标签页的位置'
  },
  'settings.move_new_tab_parent_before': {
   en: 'before parent',
   ru: 'перед родительской',
   zh: '父标签之前'
  },
  'settings.move_new_tab_parent_sibling': {
   en: 'after parent',
   ru: 'после родительской',
   zh: '父标签之后'
  },
  'settings.move_new_tab_parent_first_child': {
   en: 'first child',
   ru: 'первая дочерняя',
   zh: '第一个子标签'
  },
  'settings.move_new_tab_parent_last_child': {
   en: 'last child',
   ru: 'последняя дочерняя',
   zh: '最后一个子标签'
  },
  'settings.move_new_tab_parent_start': {
   en: 'panel start',
   ru: 'начало панели',
   zh: '面板起始位置'
  },
  'settings.move_new_tab_parent_end': {
   en: 'panel end',
   ru: 'конец пенели',
   zh: '面板末尾位置'
  },
  'settings.move_new_tab_parent_default': {
   en: 'default',
   ru: 'по умолчанию',
   zh: '默认'
  },
  'settings.move_new_tab_parent_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },
  'settings.move_new_tab_parent_act_panel': {
   en: 'Only if panel of parent tab is active',
   ru: 'Только если панель родительской вкладки активна',
   zh: '仅当父标签页的面板处于活动状态时'
  },
  'settings.move_new_tab': {
   en: 'Place new tab (for the other cases)',
   ru: 'Для остальных случаев',
   zh: '新标签的位置（对于其他情况）'
  },
  'settings.move_new_tab_start': {
   en: 'panel start',
   ru: 'начало панели',
   zh: '面板起始位置'
  },
  'settings.move_new_tab_end': {
   en: 'panel end',
   ru: 'конец пенели',
   zh: '面板末尾位置'
  },
  'settings.move_new_tab_before': {
   en: 'before active tab',
   ru: 'перед активной вкладкой',
   zh: '活动标签页之前'
  },
  'settings.move_new_tab_after': {
   en: 'after active tab',
   ru: 'после активной вкладкой',
   zh: '活动标签页之后'
  },
  'settings.move_new_tab_first_child': {
   en: 'first child of active tab',
   ru: 'первая дочерняя вкладка активной',
   zh: '活动标签页的第一个子标签'
  },
  'settings.move_new_tab_last_child': {
   en: 'last child of active tab',
   ru: 'последняя дочерняя вкладка активной',
   zh: '活动标签页的最后一个子标签'
  },
  'settings.move_new_tab_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },

  // - Pinned tabs
  'settings.pinned_tabs_title': {
   en: 'Pinned tabs',
   ru: 'Закрепленные вкладки',
   zh: '固定标签页'
  },
  'settings.pinned_tabs_position': {
   en: 'Pinned tabs position',
   ru: 'Расположение закрепленных вкладок',
   zh: '固定标签页位置'
  },
  'settings.pinned_tabs_position_top': {
   en: 'top',
   ru: 'вверху',
   zh: '顶侧'
  },
  'settings.pinned_tabs_position_left': {
   en: 'left',
   ru: 'слева',
   zh: '左侧'
  },
  'settings.pinned_tabs_position_right': {
   en: 'right',
   ru: 'справа',
   zh: '右侧'
  },
  'settings.pinned_tabs_position_bottom': {
   en: 'bottom',
   ru: 'внизу',
   zh: '底侧'
  },
  'settings.pinned_tabs_position_panel': {
   en: 'panel',
   ru: 'панель',
   zh: '面板'
  },
  'settings.pinned_tabs_list': {
   en: 'Show titles of pinned tabs',
   ru: 'Показывать заголовки закрепленных вкладок',
   zh: '显示固定标签页的标题'
  },
  'settings.pinned_auto_group': {
   en: 'Group tabs that were opened from a pinned tab',
   ru: 'Группировать вкладки, которые были открыты из закрепленной вкладки.',
   zh: '对从固定标签页打开的标签进行分组'
  },

  // - Tabs tree
  'settings.tabs_tree_title': {
   en: 'Tabs tree',
   ru: 'Древовидное отображение вкладок',
   zh: '树状标签页'
  },
  'settings.tabs_tree_layout': {
   en: 'Tabs tree structure',
   ru: 'Древовидное отображение вкладок',
   zh: '标签页树状结构'
  },
  'settings.group_on_open_layout': {
   en: 'Create sub-tree on opening link in new tab',
   ru: 'Создать поддерево при открытии ссылки в новой вкладке',
   zh: '新标签页中打开链接时创建子树'
  },
  'settings.tabs_tree_limit': {
   en: 'Tabs tree level limit',
   ru: 'Максимальный уровень вложенности вкладок',
   zh: '限制标签页树级别'
  },
  'settings.tabs_tree_limit_1': {
   en: '1',
   ru: '1',
   zh: '1'
  },
  'settings.tabs_tree_limit_2': {
   en: '2',
   ru: '2',
   zh: '2'
  },
  'settings.tabs_tree_limit_3': {
   en: '3',
   ru: '3',
   zh: '3'
  },
  'settings.tabs_tree_limit_4': {
   en: '4',
   ru: '4',
   zh: '4'
  },
  'settings.tabs_tree_limit_5': {
   en: '5',
   ru: '5',
   zh: '5'
  },
  'settings.tabs_tree_limit_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },
  'settings.hide_folded_tabs': {
   en: 'Hide folded tabs',
   ru: 'Скрывать свернутые вкладки',
   zh: '隐藏已折叠标签页'
  },
  'settings.auto_fold_tabs': {
   en: 'Auto fold tabs',
   ru: 'Автоматически сворачивать вкладки',
   zh: '自动折叠标签页'
  },
  'settings.auto_fold_tabs_except': {
   en: 'Max count of open branches',
   ru: 'Максимальное количество открытых веток',
   zh: '打开分支上限'
  },
  'settings.auto_fold_tabs_except_1': {
   en: '1',
   ru: '1',
   zh: '1'
  },
  'settings.auto_fold_tabs_except_2': {
   en: '2',
   ru: '2',
   zh: '2'
  },
  'settings.auto_fold_tabs_except_3': {
   en: '3',
   ru: '3',
   zh: '3'
  },
  'settings.auto_fold_tabs_except_4': {
   en: '4',
   ru: '4',
   zh: '4'
  },
  'settings.auto_fold_tabs_except_5': {
   en: '5',
   ru: '5',
   zh: '5'
  },
  'settings.auto_fold_tabs_except_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },
  'settings.auto_exp_tabs': {
   en: 'Auto expand tab on activation',
   ru: 'Автоматически разворачивать вкладки',
   zh: '激活时自动展开标签页'
  },
  'settings.rm_child_tabs': {
   en: 'Close child tabs along with parent',
   ru: 'Закрывать дочерние вкладки вместе с родительской',
   zh: '与父项一起关闭子标签页'
  },
  'settings.rm_child_tabs_all': {
   en: 'all',
   ru: 'все',
   zh: '所有'
  },
  'settings.rm_child_tabs_folded': {
   en: 'folded',
   ru: 'свернутые',
   zh: '已折叠的'
  },
  'settings.rm_child_tabs_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },
  'settings.tabs_child_count': {
   en: 'Show count of descendants on the folded tab',
   ru: 'Показывать количество потомков на свернутой вкладке',
   zh: '在折叠标签上显示后代数量'
  },
  'settings.tabs_lvl_dots': {
   en: 'Show marks to indicate tabs sub-tree levels',
   ru: 'Показывать отметки уровней вложенности',
   zh: '显示标记以表示标签页子树的级别'
  },
  'settings.discard_folded': {
   en: 'Unload folded tabs',
   ru: 'Выгружать свернутые вкладки',
   zh: '卸载已折叠的标签页'
  },
  'settings.discard_folded_delay': {
   en: 'With delay',
   ru: 'Через',
   zh: '延迟'
  },
  'settings.discard_folded_delay_sec': {
    en: n => (n === 1 ? 'second' : 'seconds'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'секунда'
      if (NUM_234_RE.test(n.toString())) return 'секунды'
      return 'секунд'
    },
    zh: '秒',
  },
  'settings.discard_folded_delay_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
    zh: '分',
  },
  'settings.tabs_tree_bookmarks': {
   en: 'Preserve tree on creating bookmarks',
   ru: 'Сохранять древовидную структуру при создании закладок',
   zh: '保存创建书签的树'
  },
  'settings.tree_rm_outdent': {
   en: 'After closing parent tab, outdent',
   ru: 'После закрытия родительской вкладки понизить уровень',
   zh: '关闭父标签页后减小缩进'
  },
  'settings.tree_rm_outdent_branch': {
   en: 'whole branch',
   ru: 'всей ветви',
   zh: '整个分支'
  },
  'settings.tree_rm_outdent_first_child': {
   en: 'first child',
   ru: 'первой дочерней вкладки',
   zh: '第一个子标签'
  },

  // - Bookmarks
  'settings.bookmarks_title': {
   en: 'Bookmarks',
   ru: 'Закладки',
   zh: '书签'
  },
  'settings.bookmarks_panel': {
   en: 'Bookmarks panel',
   ru: 'Панель закладок',
   zh: '书签面板'
  },
  'settings.bookmarks_layout': {
   en: 'Bookmarks layout',
   ru: 'Тип отображения',
   zh: '书签布局'
  },
  'settings.bookmarks_layout_tree': {
   en: 'tree',
   ru: 'дерево',
   zh: '树状'
  },
  'settings.bookmarks_layout_history': {
   en: 'history',
   ru: 'история',
   zh: '历史'
  },
  'settings.warn_on_multi_bookmark_delete': {
   en: 'Warn on trying delete multiple bookmarks',
   ru: 'Предупреждать об удалении нескольких закладкок',
   zh: '尝试删除多个书签时弹出警告'
  },
  'settings.warn_on_multi_bookmark_delete_any': {
   en: 'any',
   ru: 'любых',
   zh: '所有'
  },
  'settings.warn_on_multi_bookmark_delete_collapsed': {
   en: 'collapsed',
   ru: 'свернутых',
   zh: '已折叠的'
  },
  'settings.warn_on_multi_bookmark_delete_none': {
   en: 'none',
   ru: 'нет',
   zh: '无'
  },
  'settings.open_bookmark_new_tab': {
   en: 'Open bookmark in new tab',
   ru: 'Открывать закладку в новой вкладке',
   zh: '在新标签页中打开书签'
  },
  'settings.mid_click_bookmark': {
   en: 'Middle click on the bookmark',
   ru: 'При нажатии средней кнопки мыши',
   zh: '中键单击书签'
  },
  'settings.mid_click_bookmark_open_new_tab': {
   en: 'open in new tab',
   ru: 'открывать в новой вкладке',
   zh: '在新标签页中打开'
  },
  'settings.mid_click_bookmark_edit': {
   en: 'edit',
   ru: 'редактировать',
   zh: '编辑'
  },
  'settings.mid_click_bookmark_delete': {
   en: 'delete',
   ru: 'удалять',
   zh: '删除'
  },
  'settings.act_mid_click_tab': {
   en: 'Activate tab',
   ru: 'Активировать вкладку',
   zh: '激活标签页'
  },
  'settings.auto_close_bookmarks': {
   en: 'Auto-close folders',
   ru: 'Автоматически сворачивать папки',
   zh: '自动关闭文件夹'
  },
  'settings.auto_rm_other': {
   en: 'Delete open bookmarks from "Other Bookmarks" folder',
   ru: 'Удалять открытые закладки из папки "Другие закладки"',
   zh: '从“其他书签”文件夹中删除打开的书签'
  },
  'settings.show_bookmark_len': {
   en: 'Show folder size',
   ru: 'Показывать размер папки',
   zh: '显示文件夹大小'
  },
  'settings.highlight_open_bookmarks': {
   en: 'Mark open bookmarks',
   ru: 'Отмечать открытые закладки',
   zh: '标记打开的书签'
  },
  'settings.activate_open_bookmark_tab': {
   en: 'Go to open tab instead of opening new one',
   ru: 'Переходить на открытую вкладку вместо открытия новой',
   zh: '转到打开的标签而不是打开新的标签'
  },
  'settings.bookmarks_rm_undo_note': {
   en: 'Show undo notification after deleting bookmarks',
   ru: 'Показывать уведомление об удалении нескольких закладок',
   zh: '删除书签后显示撤消通知'
  },
  'settings.fetch_bookmarks_favs': {
   en: 'Fetch favicons',
   ru: 'Загрузить иконки',
   zh: '获取网站图标'
  },
  'settings.fetch_bookmarks_favs_stop': {
   en: 'Stop fetching',
   ru: 'Остановить загрузку',
   zh: '停止获取'
  },
  'settings.fetch_bookmarks_favs_done': {
   en: 'done',
   ru: 'завершено',
   zh: '已完成'
  },
  'settings.fetch_bookmarks_favs_errors': {
   en: 'errors',
   ru: 'ошибок',
   zh: '错误'
  },
  'settings.load_bookmarks_on_demand': {
   en: 'Load bookmarks on demand',
   ru: 'Инициализоровать сервис закладок только по необходимости',
   zh: '按需加载书签'
  },
  'settings.pin_opened_bookmarks_folder': {
   en: 'Pin opened folder when scrolling',
   ru: 'Закреплять открытую папку при прокрутке',
   zh: '滚动时固定已打开的文件夹'
  },

  // - History
  'settings.history_title': {
   en: 'History',
   ru: 'История',
   zh: '历史'
  },
  'settings.load_history_on_demand': {
   en: 'Initialize history service on demand',
   ru: 'Инициализоровать сервис истории только по необходимости',
   zh: '按需初始化历史服务'
  },

  // - Appearance
  'settings.appearance_title': {
   en: 'Appearance',
   ru: 'Вид',
   zh: '外观'
  },
  'settings.font_size': {
   en: 'Font size',
   ru: 'Размер шрифта',
   zh: '字体大小'
  },
  'settings.font_size_xxs': {
   en: 'XXS',
   ru: 'XXS',
   zh: 'XXS'
  },
  'settings.font_size_xs': {
   en: 'XS',
   ru: 'XS',
   zh: 'XS'
  },
  'settings.font_size_s': {
   en: 'S',
   ru: 'S',
   zh: 'S'
  },
  'settings.font_size_m': {
   en: 'M',
   ru: 'M',
   zh: 'M'
  },
  'settings.font_size_l': {
   en: 'L',
   ru: 'L',
   zh: 'L'
  },
  'settings.font_size_xl': {
   en: 'XL',
   ru: 'XL',
   zh: 'XL'
  },
  'settings.font_size_xxl': {
   en: 'XXL',
   ru: 'XXL',
   zh: 'XXL'
  },
  'settings.theme': {
   en: 'Theme',
   ru: 'Тема',
   zh: '主题'
  },
  'settings.theme_proton': {
   en: 'proton',
   ru: 'proton',
   zh: 'proton'
  },
  'settings.theme_compact': {
   en: 'compact',
   ru: 'compact',
   zh: 'compact'
  },
  'settings.theme_plain': {
   en: 'plain',
   ru: 'plain',
   zh: 'plain'
  },
  'settings.theme_none': {
   en: 'none',
   ru: 'нет',
   zh: '无'
  },
  'settings.switch_color_scheme': {
   en: 'Color scheme',
   ru: 'Цветовая схема',
   zh: '配色方案'
  },
  'settings.color_scheme_dark': {
   en: 'dark',
   ru: 'темная',
   zh: '暗黑'
  },
  'settings.color_scheme_light': {
   en: 'light',
   ru: 'светлая',
   zh: '明亮'
  },
  'settings.color_scheme_sys': {
   en: 'dark/light',
   ru: 'система',
   zh: '暗黑/明亮'
  },
  'settings.color_scheme_ff': {
   en: 'firefox',
   ru: 'firefox',
   zh: 'firefox'
  },
  'settings.bg_noise': {
   en: 'Frosted background',
   ru: 'Матовый задний фон',
   zh: '磨砂背景'
  },
  'settings.animations': {
   en: 'Animations',
   ru: 'Анимации',
   zh: '动画'
  },
  'settings.animation_speed': {
   en: 'Animations speed',
   ru: 'Скорость анимации',
   zh: '动画速度'
  },
  'settings.animation_speed_fast': {
   en: 'fast',
   ru: 'быстрая',
   zh: '快'
  },
  'settings.animation_speed_norm': {
   en: 'normal',
   ru: 'средняя',
   zh: '正常'
  },
  'settings.animation_speed_slow': {
   en: 'slow',
   ru: 'медленная',
   zh: '慢'
  },
  'settings.edit_styles': {
   en: 'Edit styles',
   ru: 'Редактировать стили',
   zh: '编辑样式'
  },
  'settings.edit_theme': {
   en: 'Edit theme',
   ru: 'Редактировать тему',
   zh: '编辑主题'
  },
  'settings.appearance_notes_title': {
   en: 'Notes:',
   ru: 'Примечания:',
   zh: '说明:'
  },
  'settings.appearance_notes': {
   en: '- To apply theme color to Sidebery buttons in browser interface set "svg.context-properties.content.enabled" to "true" in about:config page.',
   ru: '- Чтобы применить цвет темы к кнопкам Sidebery в интерфейсе браузера, установите ?svg.context-properties.content.enabled? в ?true? на странице about:config.',
   zh: '- 为了将主题颜色应用于浏览器界面的Sidebery按钮，需要在about:config页面中设置 "svg.context-properties.content.enabled "的值为 "true".'
  },

  // - Snapshots
  'settings.snapshots_title': {
   en: 'Snapshots',
   ru: 'Снепшоты',
   zh: '快照'
  },
  'settings.snap_notify': {
   en: 'Show notification after snapshot creation',
   ru: 'Показать уведомление после создания снепшота',
   zh: '创建快照后显示通知'
  },
  'settings.snap_exclude_private': {
   en: 'Exclude private windows',
   ru: 'Исключать приватные окна',
   zh: '排除隐私窗口'
  },
  'settings.snap_interval': {
   en: 'Auto-snapshots interval',
   ru: 'Интервал авто-снепшотов',
   zh: '自动快照间隔'
  },
  'settings.snap_interval_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
    zh: '分',
  },
  'settings.snap_interval_hr': {
    en: n => (n === 1 ? 'hour' : 'hours'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'час'
      if (NUM_234_RE.test(n.toString())) return 'часа'
      return 'часов'
    },
    zh: '小时',
  },
  'settings.snap_interval_day': {
    en: n => (n === 1 ? 'day' : 'days'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'день'
      if (NUM_234_RE.test(n.toString())) return 'дня'
      return 'дней'
    },
    zh: '日',
  },
  'settings.snap_interval_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },
  'settings.snap_limit': {
   en: 'Snapshots limit',
   ru: 'Лимиты',
   zh: '快照上限'
  },
  'settings.snap_limit_snap': {
    en: n => (n === 1 ? 'snapshot' : 'snapshots'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'снепшот'
      if (NUM_234_RE.test(n.toString())) return 'снепшота'
      return 'снепшотов'
    },
    zh: '快照',
  },
  'settings.snap_limit_kb': {
    en: n => (n === 1 ? 'kbyte' : 'kbytes'),
    ru: (n = 0): string => {
      if (NUM_234_RE.test(n.toString())) return 'кбайта'
      return 'кбайт'
    },
    zh: '千字节',
  },
  'settings.snap_limit_day': {
    en: n => (n === 1 ? 'day' : 'days'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'день'
      if (NUM_234_RE.test(n.toString())) return 'дня'
      return 'дней'
    },
    zh: '日',
  },
  'settings.snapshots_view_label': {
   en: 'View snapshots',
   ru: 'Просмотреть снепшоты',
   zh: '查看快照'
  },
  'settings.make_snapshot': {
   en: 'Create snapshot',
   ru: 'Создать снепшот',
   zh: '创建快照'
  },
  'settings.rm_all_snapshots': {
   en: 'Remove all snapshots',
   ru: 'Удалить все снепшоты',
   zh: '删除所有快照'
  },
  'settings.apply_snapshot': {
   en: 'apply',
   ru: 'применить',
   zh: '应用'
  },
  'settings.rm_snapshot': {
   en: 'remove',
   ru: 'удалить',
   zh: '删除'
  },

  // - Mouse
  'settings.mouse_title': {
   en: 'Mouse',
   ru: 'Мышь',
   zh: '鼠标'
  },
  'settings.h_scroll_through_panels': {
   en: 'Use horizontal scroll to switch panels',
   ru: 'Переключать панели с помощью горизонтальной прокрутки',
   zh: '使用水平滚动切换面板'
  },
  'settings.scroll_through_tabs': {
   en: 'Switch tabs with scroll wheel',
   ru: 'Переключать вкладки с помощью колеса прокрутки',
   zh: '使用滚轮切换标签页'
  },
  'settings.scroll_through_tabs_panel': {
   en: 'panel',
   ru: 'на панели',
   zh: '面板'
  },
  'settings.scroll_through_tabs_global': {
   en: 'global',
   ru: 'глобально',
   zh: '全局'
  },
  'settings.scroll_through_tabs_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },
  'settings.scroll_through_visible_tabs': {
   en: 'Skip folded tabs',
   ru: 'Пропускать свернутые',
   zh: '跳过已折叠的标签'
  },
  'settings.scroll_through_tabs_skip_discarded': {
   en: 'Skip discarded tabs',
   ru: 'Пропускать выгруженые',
   zh: '跳过已丢弃的标签'
  },
  'settings.scroll_through_tabs_except_overflow': {
   en: 'Except if panel is overflowing',
   ru: 'За исключением случаев, когда панель переполнена',
   zh: '溢出面板除外'
  },
  'settings.scroll_through_tabs_cyclic': {
   en: 'Cyclically',
   ru: 'Зациклить',
   zh: '循环'
  },
  'settings.long_click_delay': {
   en: 'Long click delay (ms)',
   ru: 'Задержка длительного нажатия (мс)',
   zh: '长按延迟（毫秒）'
  },

  'settings.nav_actions_sub_title': {
   en: 'Navigation bar actions',
   ru: 'Действия над навигацией',
   zh: '导航栏操作'
  },

  'settings.tab_actions_sub_title': {
   en: 'Tab actions',
   ru: 'Действия над вкладками',
   zh: '标签页操作'
  },
  'settings.tab_double_click': {
   en: 'Double click on tab',
   ru: 'Двойной клик по вкладке',
   zh: '双击标签页'
  },
  'settings.tab_long_left_click': {
   en: 'Long left click on tab',
   ru: 'Длительное нажатие левой кнопки мыши по вкладке',
   zh: '长按左击标签页'
  },
  'settings.tab_long_right_click': {
   en: 'Long right click on tab',
   ru: 'Длительное нажатие правой кнопки мыши по вкладке',
   zh: '长按右击标签页'
  },
  'settings.tab_close_middle_click': {
   en: 'Middle click on close tab button',
   ru: 'Нажатие средней кнопкой мыши по кнопке закрытия вкладки',
   zh: '中键单击关闭标签页按钮'
  },
  'settings.tab_action_reload': {
   en: 'reload',
   ru: 'перезагрузить',
   zh: '重新加载'
  },
  'settings.tab_action_duplicate': {
   en: 'duplicate',
   ru: 'дублировать',
   zh: '克隆'
  },
  'settings.tab_action_pin': {
   en: 'pin',
   ru: 'закрепить',
   zh: '固定'
  },
  'settings.tab_action_mute': {
   en: 'mute',
   ru: 'выключить звук',
   zh: '静音'
  },
  'settings.tab_action_clear_cookies': {
   en: 'clear cookies',
   ru: 'удалить cookies',
   zh: '清除Cookies'
  },
  'settings.tab_action_exp': {
   en: 'expand',
   ru: 'развернуть',
   zh: '展开'
  },
  'settings.tab_action_new_after': {
   en: 'new sibling tab',
   ru: 'новая вкладка',
   zh: '新建兄弟标签页'
  },
  'settings.tab_action_new_child': {
   en: 'new child tab',
   ru: 'новая дочерняя вкладка',
   zh: '新建子标签页'
  },
  'settings.tab_action_close': {
   en: 'close tab',
   ru: 'закрыть вкладку',
   zh: '关闭标签页'
  },
  'settings.tab_action_discard': {
   en: 'unload',
   ru: 'выгрузить',
   zh: '卸载'
  },
  'settings.tab_action_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },

  'settings.tabs_panel_actions_sub_title': {
   en: 'Tabs panel actions',
   ru: 'Действия над панелью c вкладками',
   zh: '标签页面板操作'
  },
  'settings.tabs_panel_left_click_action': {
   en: 'Left click on tabs panel',
   ru: 'Левый клик по панели с вкладками',
   zh: '左击标签页面板'
  },
  'settings.tabs_panel_double_click_action': {
   en: 'Double click on tabs panel',
   ru: 'Двойной клик по панели с вкладками',
   zh: '双击标签页面板'
  },
  'settings.tabs_panel_right_click_action': {
   en: 'Right click on tabs panel',
   ru: 'Правый клик по панели с вкладками',
   zh: '右击标签页面板'
  },
  'settings.tabs_panel_middle_click_action': {
   en: 'Middle click on tabs panel',
   ru: 'Средний клик по панели с вкладками',
   zh: '中键单击标签页面板'
  },
  'settings.tabs_panel_action_tab': {
   en: 'create tab',
   ru: 'создать вкладку',
   zh: '创建标签页'
  },
  'settings.tabs_panel_action_prev': {
   en: 'previous panel',
   ru: 'пред. панель',
   zh: '前一个面板'
  },
  'settings.tabs_panel_action_next': {
   en: 'next panel',
   ru: 'след. панель',
   zh: '后一个面板'
  },
  'settings.tabs_panel_action_expand': {
   en: 'expand/fold',
   ru: 'развернуть/свернуть',
   zh: '展开/折叠'
  },
  'settings.tabs_panel_action_parent': {
   en: 'activate parent tab',
   ru: 'перейти к родительской вкладке',
   zh: '激活父标签页'
  },
  'settings.tabs_panel_action_menu': {
   en: 'show menu',
   ru: 'открыть меню',
   zh: '展示菜单'
  },
  'settings.tabs_panel_action_collapse': {
   en: 'collapse inactive branches',
   ru: 'свернуть неактивные ветки',
   zh: '折叠非活动分支'
  },
  'settings.tabs_panel_action_undo': {
   en: 'undo tab close',
   ru: 'восстановить закрытую вкладку',
   zh: '撤消关闭标签页'
  },
  'settings.tabs_panel_action_rm_act_tab': {
   en: 'close active tab',
   ru: 'закрыть активную вкладку',
   zh: '关闭活动标签'
  },
  'settings.tabs_panel_action_none': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },

  // - Keybindings
  'settings.kb_title': {
   en: 'Keybindings',
   ru: 'Клавиши',
   zh: '按键绑定'
  },
  'settings.kb_input': {
   en: 'Press new shortcut',
   ru: 'Нажмете новое сочетание клавиш',
   zh: '按下新的快捷键'
  },
  'settings.kb_err_duplicate': {
   en: 'Already exists',
   ru: 'Уже существует',
   zh: '已存在'
  },
  'settings.kb_err_invalid': {
   en: 'Invalid shortcut',
   ru: 'Недопустимое сочетание клавиш',
   zh: '无效的快捷键'
  },
  'settings.reset_kb': {
   en: 'Reset Keybindings',
   ru: 'Сбросить клав. настройки',
   zh: '重置快捷键'
  },
  'settings.toggle_kb': {
   en: 'Enable/Disable Keybindings',
   ru: 'Включить / отключить сочетания клавиш',
   zh: '启用/禁用按键绑定'
  },
  'settings.enable_kb': {
   en: 'Enable Keybindings',
   ru: 'Включить сочетания клавиш',
   zh: '启用按键绑定'
  },
  'settings.disable_kb': {
   en: 'Disable Keybindings',
   ru: 'Отключить сочетания клавиш',
   zh: '禁用按键绑定'
  },

  // - Permissions
  'settings.permissions_title': {
   en: 'Permissions',
   ru: 'Разрешения',
   zh: '权限'
  },
  'settings.all_urls_label': {
   en: 'Accessing web requests data:',
   ru: 'Данные веб-сайтов:',
   zh: '访问网络请求数据：'
  },
  'settings.all_urls_info': {
   en: 'Required for:\n- Cleaning cookies\n- Proxy and URL rules of containers\n- Screenshots for the group page and windows selection panel\n- Changing the User-Agent per container',
   ru: 'Необходимо для:\n- Удаления cookies\n- Прокси и url-правил контейнеров\n- Скриншотов на групповой странице и на панели выбора окна',
   zh: '需要：\n- 清除Cookies\n- 容器的代理和 URL 规则\n- 分组页面和窗口选择面板的屏幕快照\n- 更改每个容器的用户代理'
  },
  'settings.perm.bookmarks_label': {
   en: 'Bookmarks:',
   ru: 'Управление закладками:',
   zh: '书签:'
  },
  'settings.perm.bookmarks_info': {
   en: 'Required for:\n- Bookmarks panels',
   ru: 'Required for:\n- Панели закладок',
   zh: '需要:\n-书签面板'
  },
  'settings.tab_hide_label': {
   en: 'Hiding tabs:',
   ru: 'Скрытие вкладок:',
   zh: '隐藏标签页：'
  },
  'settings.tab_hide_info': {
   en: 'Required for:\n- Hiding tabs in inactive panels\n- Hiding folded tabs',
   ru: 'Необходимо для:\n- Скрывания вкладок неактивных панелей\n- Скрывания свернутых вкладок',
   zh: '需要：\n-隐藏非活动面板中的标签页\n-隐藏折叠的标签页'
  },
  'settings.clipboard_write_label': {
   en: 'Writing to clipboard:',
   ru: 'Запись в буфер обмена:',
   zh: '写入剪贴板：'
  },
  'settings.clipboard_write_info': {
   en: 'Required for:\n- Copying URLs of tabs/bookmarks through context menu',
   ru: 'Необходимо для:\n- Копирования ссылок вкладок/закладок',
   zh: '需要：\n-通过上下文菜单复制标签页/书签的 URL'
  },
  'settings.history_label': {
   en: 'History:',
   ru: 'История:',
   zh: '历史:'
  },
  'settings.history_info': {
   en: 'Required for:\n- History panel',
   ru: 'Необходимо для:\n- Панель истории',
   zh: '需要:\n-历史面板'
  },

  // - Storage
  'settings.storage_title': {
   en: 'Storage',
   ru: 'Данные',
   zh: '存储'
  },
  'settings.storage_delete_prop': {
   en: 'delete',
   ru: 'удалить',
   zh: '删除'
  },
  'settings.storage_edit_prop': {
   en: 'edit',
   ru: 'редактировать',
   zh: '编辑'
  },
  'settings.storage_open_prop': {
   en: 'open',
   ru: 'открыть',
   zh: '打开'
  },
  'settings.storage_delete_confirm': {
   en: 'Delete property ',
   ru: 'Удалить поле ',
   zh: '删除属性 '
  },
  'settings.update_storage_info': {
   en: 'Update',
   ru: 'Обновить',
   zh: '更新'
  },
  'settings.clear_storage_info': {
   en: 'Delete everything',
   ru: 'Удалить все',
   zh: '删除所有内容'
  },
  'settings.clear_storage_confirm': {
   en: 'Are you sure you want to delete all Sidebery data?',
   ru: 'Вы действительно хотите удалить все данные?',
   zh: '确定要删除 Sidebery 所有的数据吗？'
  },
  'settings.favs_title': {
   en: 'Cached favicons',
   ru: 'Кэшированные иконки сайтов',
   zh: '已缓存的图标'
  },

  // - Sync
  'settings.sync_title': {
   en: 'Sync',
   ru: 'Синхронизация',
   zh: '同步'
  },
  'settings.sync_name': {
   en: 'Profile name for sync',
   ru: 'Имя профиля для синхронизации',
   zh: '用于同步的配置文件名称'
  },
  'settings.sync_name_or': {
   en: 'e.g: Firefox Beta Home',
   ru: 'напр. Firefox Домашний',
   zh: '例如 Firefox Beta Home'
  },
  'settings.sync_save_settings': {
   en: 'Save settings to sync storage',
   ru: 'Сохранять настройки в синхронизируемое хранилище',
   zh: '保存设置至同步存储'
  },
  'settings.sync_save_ctx_menu': {
   en: 'Save context menu to sync storage',
   ru: 'Сохранять контекстное меню в синхронизируемое хранилище',
   zh: '保存上下文菜单至同步存储'
  },
  'settings.sync_save_styles': {
   en: 'Save styles to sync storage',
   ru: 'Сохранять стили в синхронизируемое хранилище',
   zh: '保存样式至同步存储'
  },
  'settings.sync_auto_apply': {
   en: 'Automatically apply changes',
   ru: 'Автоматически применять изменения',
   zh: '自动应用更改'
  },
  'settings.sync_settings_title': {
   en: 'Settings',
   ru: 'Настройки',
   zh: '设置'
  },
  'settings.sync_ctx_menu_title': {
   en: 'Context menu',
   ru: 'Контекстное меню',
   zh: '上下文菜单'
  },
  'settings.sync_styles_title': {
   en: 'Styles',
   ru: 'Стили',
   zh: '样式'
  },
  'settings.sync_apply_btn': {
   en: 'Apply',
   ru: 'Применить',
   zh: '应用'
  },
  'settings.sync_delete_btn': {
   en: 'Delete',
   ru: 'Удалить',
   zh: '删除'
  },
  'settings.sync_update_btn': {
   en: 'Update synced data',
   ru: 'Обновить данные',
   zh: '更新同步数据'
  },
  'settings.sync_apply_confirm': {
   en: 'Are you sure you want to apply synced data?',
   ru: 'Вы действительно хотите применить синхронизированные данные?',
   zh: '您确定要应用同步数据吗？'
  },
  'settings.sync.apply_err': {
   en: 'Cannot apply synchronized data',
   ru: 'Невозможно применить синхронизированные данные',
   zh: '无法应用同步数据'
  },

  // - Help
  'settings.help_title': {
   en: 'Help',
   ru: 'Помощь',
   zh: '帮助'
  },
  'settings.debug_info': {
   en: 'Show debug info',
   ru: 'Отладочная информация',
   zh: '显示调试信息'
  },
  'settings.log_lvl': {
   en: 'Log level',
   ru: 'Уровень логов',
   zh: '日志级别'
  },
  'settings.log_lvl_0': {
   en: 'none',
   ru: 'выкл',
   zh: '无'
  },
  'settings.log_lvl_1': {
   en: 'errors',
   ru: 'ошибки',
   zh: '错误'
  },
  'settings.log_lvl_2': {
   en: 'warnings',
   ru: 'предупреждения',
   zh: '警告'
  },
  'settings.log_lvl_3': {
   en: 'all',
   ru: 'все',
   zh: '所有'
  },
  'settings.copy_devtools_url': {
   en: 'Copy devtools URL',
   ru: 'Скопировать URL страницы разработчика',
   zh: '复制开发工具 URL'
  },
  'settings.repo_issue': {
   en: 'Open issue',
   ru: 'Создать github issue',
   zh: '打开issue'
  },
  'settings.repo_bug': {
   en: 'Report a bug',
   ru: 'Сообщить об ошибке',
   zh: '报告错误'
  },
  'settings.repo_feature': {
   en: 'Suggest a feature',
   ru: 'Предложить новую функцию',
   zh: '功能建议'
  },
  'settings.reset_settings': {
   en: 'Reset settings',
   ru: 'Сбросить настройки',
   zh: '重置设置'
  },
  'settings.reset_confirm': {
   en: 'Are you sure you want to reset settings?',
   ru: 'Вы уверены, что хотите сбросить настройки?',
   zh: '您确定要重置设置吗？'
  },
  'settings.ref_rm': {
   en: 'Will be removed; open an issue if you need this feature.',
   ru: 'Will be removed, open an issue if you need this feature.',
   zh: '将被删除；如果您需要此功能，请提交issue。'
  },
  'settings.help_exp_data': {
   en: 'Export',
   ru: 'Экспорт',
   zh: '导出'
  },
  'settings.help_imp_data': {
   en: 'Import',
   ru: 'Импорт',
   zh: '导入'
  },
  'settings.help_imp_perm': {
   en: 'Additional permissions are required',
   ru: 'Необходимы дополнительные разрешения',
   zh: '需要额外的权限'
  },
  'settings.export_title': {
   en: 'Select what to export',
   ru: 'Выберете данные для экспорта',
   zh: '选择要导出的内容'
  },
  'settings.import_title': {
   en: 'Select what to import',
   ru: 'Выберете данные для импорта',
   zh: '选择要导入的内容'
  },
  'settings.backup_all': {
   en: 'All',
   ru: 'Все',
   zh: '全部'
  },
  'settings.backup_containers': {
   en: 'Containers config',
   ru: 'Конфигурация контейнеры',
   zh: '容器配置'
  },
  'settings.backup_settings': {
   en: 'Settings',
   ru: 'Настройки',
   zh: '设置'
  },
  'settings.backup_styles': {
   en: 'Styles',
   ru: 'Стили',
   zh: '样式'
  },
  'settings.backup_snapshots': {
   en: 'Snapshots',
   ru: 'Снепшоты',
   zh: '快照'
  },
  'settings.backup_favicons': {
   en: 'Sites icons cache',
   ru: 'Кэш иконок сайтов',
   zh: '站点图标缓存'
  },
  'settings.backup_kb': {
   en: 'Keybindings',
   ru: 'Сочетания клавиш',
   zh: '按键绑定'
  },
  'settings.backup_parse_err': {
   en: 'Wrong format of imported data',
   ru: 'Неправильный формат импортированных данных',
   zh: '导入数据格式错误'
  },
  'settings.reload_addon': {
   en: 'Reload add-on',
   ru: 'Перезагрузить расширение',
   zh: '重新加载插件'
  },

  // ---
  // -- Snapshots viewer
  // -
  'snapshot.window_title': {
   en: 'Window',
   ru: 'Окно',
   zh: '窗口'
  },
  'snapshot.btn_open': {
   en: 'Open',
   ru: 'Открыть',
   zh: '打开'
  },
  'snapshot.btn_apply': {
   en: 'Apply',
   ru: 'Применить',
   zh: '应用'
  },
  'snapshot.btn_remove': {
   en: 'Remove',
   ru: 'Удалить',
   zh: '删除'
  },
  'snapshot.btn_create_snapshot': {
   en: 'Create snapshot',
   ru: 'Создать снепшот',
   zh: '创建快照'
  },
  'snapshot.btn_open_all_win': {
   en: 'Open all windows',
   ru: 'Открыть все окна',
   zh: '打开所有窗口'
  },
  'snapshot.btn_open_win': {
   en: 'Open window',
   ru: 'Открыть окно',
   zh: '打开窗口'
  },
  'snapshot.btn_create_first': {
   en: 'Create first snapshot',
   ru: 'Создать первый снепшот',
   zh: '创建第一张快照'
  },
  'snapshot.snap_win': {
    en: n => (n === 1 ? 'window' : 'windows'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'окно'
      if (NUM_234_RE.test(n.toString())) return 'окна'
      return 'окон'
    },
    zh:'窗口',
  },
  'snapshot.snap_ctr': {
    en: n => (n === 1 ? 'container' : 'containers'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'контейнер'
      if (NUM_234_RE.test(n.toString())) return 'контейнера'
      return 'контейнеров'
    },
    zh:'窗口',
  },
  'snapshot.snap_tab': {
    en: n => (n === 1 ? 'tab' : 'tabs'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'вкладка'
      if (NUM_234_RE.test(n.toString())) return 'вкладки'
      return 'вкладок'
    },
    zh:'标签页',
  },
  'snapshot.selected': {
   en: 'Selected:',
   ru: 'Выбрано:',
   zh: '已选中:'
  },
  'snapshot.sel.open_in_panel': {
   en: 'Open in current panel',
   ru: 'Открыть в текущей панели',
   zh: '在当前面板中打开'
  },
  'snapshot.sel.reset_sel': {
   en: 'Reset selection',
   ru: 'Сбросить',
   zh: '重置选择'
  },

  // ---
  // -- Styles editor
  // -
  'styles.reset_styles': {
   en: 'Reset CSS variables',
   ru: 'Сбросить CSS переменные',
   zh: '重置 CSS 变量'
  },
  'styles.css_sidebar': {
   en: 'Sidebar',
   ru: 'Боковая панель',
   zh: '侧边栏'
  },
  'styles.css_group': {
   en: 'Group page',
   ru: 'Групповая страница',
   zh: '分组页面'
  },
  'styles.css_placeholder': {
   en: 'Write custom CSS here...',
   ru: 'Write custom CSS here...',
   zh: '在此处编写自定义 CSS...'
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
   zh: '其他'
  },
  'styles.vars_group.animation': {
   en: 'Animation speed',
   ru: 'Скорость анимации',
   zh: '动画速度'
  },
  'styles.vars_group.buttons': {
   en: 'Buttons',
   ru: 'Кнопки',
   zh: '按钮'
  },
  'styles.vars_group.scroll': {
   en: 'Scroll',
   ru: 'Скрол',
   zh: '滚动'
  },
  'styles.vars_group.menu': {
   en: 'Context menu',
   ru: 'Контекстное меню',
   zh: '上下文菜单'
  },
  'styles.vars_group.nav': {
   en: 'Navigation bar',
   ru: 'Панель навигации',
   zh: '导航栏'
  },
  'styles.vars_group.pinned_dock': {
   en: 'Pinned tabs dock',
   ru: 'Область закрепленных вкладок',
   zh: '固定标签页停靠'
  },
  'styles.vars_group.tabs': {
   en: 'Tabs',
   ru: 'Вкладки',
   zh: '标签页'
  },
  'styles.vars_group.bookmarks': {
   en: 'Bookmarks',
   ru: 'Закладки',
   zh: '书签'
  },
}

if (!window.translations) window.translations = setupPageTranslations
else Object.assign(window.translations, setupPageTranslations)
