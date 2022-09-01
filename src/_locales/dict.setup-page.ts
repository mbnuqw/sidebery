import { NUM_1_RE, NUM_234_RE } from './dict.common'

export const setupPageTranslations: Translations = {
  // ---
  // -- Popups
  // -
  // - Container config popup
  'container.name_placeholder': {
    en: 'Name...',
    ru: 'Название...',
    de: 'Name...',
    zh_CN: '名称...',
  },
  'container.icon_label': {
    en: 'Icon',
    ru: 'Иконка',
    de: 'Symbol',
    zh_CN: '图标',
  },
  'container.color_label': {
    en: 'Color',
    ru: 'Цвет',
    de: 'Farbe',
    zh_CN: '颜色',
  },
  'container.proxy_label': {
    en: 'Proxy',
    ru: 'Прокси',
    de: 'Proxy',
    zh_CN: '代理',
  },
  'container.proxy_host_placeholder': {
    en: '---',
    ru: 'хост',
    de: '---',
    zh_CN: '---',
  },
  'container.proxy_port_placeholder': {
    en: '---',
    ru: 'порт',
    de: '---',
    zh_CN: '---',
  },
  'container.proxy_username_placeholder': {
    en: '---',
    ru: 'пользователь',
    de: '---',
    zh_CN: '---',
  },
  'container.proxy_password_placeholder': {
    en: '---',
    ru: 'пароль',
    de: '---',
    zh_CN: '---',
  },
  'container.proxy_dns_label': {
    en: 'proxy DNS',
    ru: 'проксировать DNS',
    de: 'Proxy DNS',
    zh_CN: 'DNS代理',
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
    de: 'Keiner',
    zh_CN: '无',
  },
  'container.rules_include': {
    en: 'Include URLs',
    ru: 'Включать вкладки',
    de: 'URLs einschließen',
    zh_CN: 'URL列表',
  },
  'container.rules_include_tooltip': {
    en: 'Reopen tabs with matched URLs in this container.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    ru: 'Переоткрывать вкладки с совпадающими url в этом контейнере.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    de: 'Tabs mit passender URL in dieser Umgebung neu öffnen.\nNewline Getrennte Liste von "Substrings" oder "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    zh_CN:
      '在此容器中重新打开匹配此URL列表的标签页。\n以换行符分割的 字符串 或 /正则/ 列表:\n    example.com\n    /^(some)?regex$/\n    ...',
  },
  'container.rules_exclude': {
    en: 'Exclude URLs',
    ru: 'Исключать вкладки',
    de: 'URLs ausschließen',
    zh_CN: 'URL排除列表',
  },
  'container.rules_exclude_tooltip': {
    en: 'Reopen tabs with matched URL in default container.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    ru: 'Переоткрывать вкладки с совпадающими url из этого контейнера в стандартном.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    de: 'Tabs mit passender URL in Standardumgebung neu öffnen.\nNewline Getrennte Liste von "Substrings" oder "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    zh_CN:
      '在默认容器中重新打开匹配此URL列表的标签页。\n以换行符分割的 字符串 或 /正则/ 列表:\n    example.com\n    /^(some)?regex$/\n    ...',
  },
  'container.user_agent': {
    en: 'User Agent',
  },
  // - Panel config popup
  'panel.name_placeholder': {
    en: 'Name...',
    ru: 'Название...',
    de: 'Name...',
    zh_CN: '名称...',
  },
  'panel.icon_label': {
    en: 'Icon',
    ru: 'Иконка',
    de: 'Symbol',
    zh_CN: '图标',
  },
  'panel.color_label': {
    en: 'Color',
    ru: 'Цвет',
    de: 'Farbe',
    zh_CN: '颜色',
  },
  'panel.lock_panel_label': {
    en: 'Prevent auto-switching from this panel',
    ru: 'Запретить автоматическое переключение с этой панели',
    de: 'Automatisches Wechseln aus diesem Panel verhindern',
    zh_CN: '防止从此面板自动切换',
  },
  'panel.temp_mode_label': {
    en: 'Switch back to previously active tabs panel after mouse leave',
    ru: 'Переключаться на последнюю активную панель вкладок, если курсор мыши убран',
    de: 'Beim Loslassen der Maus zurück zum zuvor aktiven Tab Panel wechseln',
    zh_CN: '鼠标离开后切换回之前活动的标签页面板',
  },
  'panel.skip_on_switching': {
    en: 'Skip this panel when switching panels',
    ru: 'Пропускать эту панель при переключении панелей',
    de: 'Beim Wechseln der Panels dieses Panel überspringen',
    zh_CN: '切换面板时跳过此面板',
  },
  'panel.no_empty_label': {
    en: 'Create new tab after the last one is closed',
    ru: 'Создавать новую вкладку после закрытия последней',
    de: 'Erstelle neuen Tab, nachdem der letzte geschlossen wurde',
    zh_CN: '关闭最后一个标签页后创建新标签页',
  },
  'panel.new_tab_ctx': {
    en: 'Container of new tab',
    ru: 'Контейнер новой вкладки',
    de: 'Umgebung des neuen Tabs',
    zh_CN: '新标签页的容器',
  },
  'panel.drop_tab_ctx': {
    en: 'Reopen tab that was dropped to this panel in container:',
    ru: 'Переоткрыть вкладку, переброшенную в эту панель, в контейнере:',
    de: 'Tabs, welche in dieses Panel verschoben werden in Umgebung neu öffnen',
    zh_CN: '在容器中重新打开拖放到此面板的标签页:',
  },
  'panel.move_tab_ctx': {
    en: 'Move tab to this panel if it is opened in container:',
    ru: 'Перемещать вкладки выбранного контейнера в эту панель',
    de: 'Verschiebe Tabs in dieses Panel, wenn sie in Umgebung geöffnet werden',
    zh_CN: '如果它在容器中打开，则将标签页移动到此面板:',
  },
  'panel.move_tab_ctx_nochild': {
    en: 'Except child tabs',
    ru: 'За исключением дочерних вкладок',
    de: 'Mit Ausnahme von Unter-Tabs',
    zh_CN: '排除子标签页',
  },
  'panel.ctr_tooltip_none': {
    en: 'Not set',
    ru: 'Не задан',
    de: 'Nicht festgelegt',
    zh_CN: '未设置',
  },
  'panel.ctr_tooltip_default': {
    en: 'No container',
    ru: 'Без контейнера',
    de: 'Keine Umgebung',
    zh_CN: '无容器',
  },
  'panel.url_rules': {
    en: 'Move tabs with matched URLs to this panel',
    ru: 'Перемещать вкладки с совпадающими адресами в эту панель',
    de: 'Verschiebe Tabs mit passender URL in dieses Panel',
    zh_CN: '将匹配URL列表的标签页移动到此面板',
  },
  'panel.auto_convert': {
    en: 'Convert to source tabs panel on opening bookmark',
    ru: 'При открытии закладки преобразовать в исходную панель вкладок',
    de: 'Beim Öffnen von Lesezeichen zum ursprünglichen Tab-Panel wechseln',
    zh_CN: '打开书签时切换到源标签页面板',
  },
  'panel.custom_icon_note': {
    en: 'Base64, URL or text. Text values syntax: "text::color::CSS-font-value"',
    ru: 'Base64, url или символы. Синтакс для символов: "символы::CSS-цвет::CSS-шрифт"',
    de: 'Base64, URL oder Text. Textwerte-Syntax: "Text::Farbe::CSS-Schriftart-Wert"',
    zh_CN: 'Base64、URL 或文本。文本值语法：“text::color::CSS-font-value”',
  },
  'panel.custom_icon': {
    en: 'Custom icon',
    ru: 'Пользовательская иконка',
    de: 'Benutzerdefiniertes Symbol',
    zh_CN: '自定义图标',
  },
  'panel.custom_icon_load': {
    en: 'Load',
    ru: 'Загрузить',
    de: 'Laden',
    zh_CN: '加载',
  },
  'panel.custom_icon_placeholder': {
    en: 'e.g. A::#000000ff::700 32px Roboto',
    ru: 'A::#000000ff::700 32px Roboto',
    de: 'z.B. A::#000000ff::700 32px Roboto',
    zh_CN: '例如 A::#000000ff::700 32px Roboto',
  },
  'panel.url_label': {
    en: 'URL',
  },
  'panel.root_id_label': {
    en: 'Root folder',
    ru: 'Корневая папка',
    de: 'Quellordner',
    zh_CN: '根文件夹',
  },
  'panel.root_id_wrong': {
    en: 'Cannot find such folder, please choose the new one',
    ru: 'Не удается найти такую папку, выберите новую',
    de: 'Kann diesen Ordner nicht finden, bitte neuen wählen',
  },
  'panel.root_id.choose': {
    en: 'Choose folder',
    ru: 'Выбрать папку',
    de: 'Ordner auswählen',
    zh_CN: '选择文件夹',
  },
  'panel.root_id.reset': {
    en: 'Reset',
    ru: 'Сбросить',
    de: 'Zurücksetzen',
    zh_CN: '重置',
  },
  'panel.bookmarks_view_mode': {
    en: 'View mode',
    ru: 'Тип отображения',
    de: 'Anzeigemodus',
    zh_CN: '视图模式',
  },
  'panel.bookmarks_view_mode_tree': {
    en: 'tree',
    ru: 'древовидная структура',
    de: 'Baumstruktur',
    zh_CN: '树状',
  },
  'panel.bookmarks_view_mode_history': {
    en: 'history',
    ru: 'хронологический список',
    de: 'Chronik',
    zh_CN: '历史',
  },
  'panel.new_tab_custom_btns': {
    en: 'Additional "New tab" buttons',
    ru: 'Дополнительные кнопки для создания новой вкладки',
    de: 'Zusätzliche "Neuer Tab" Schaltflächen',
    zh_CN: '额外的“新建标签”按钮',
  },
  'panel.new_tab_custom_btns_placeholder': {
    en: 'Container name and/or URL',
    ru: 'Имя контейнера и/или URL',
    de: 'Umgebungsname und/oder URL',
    zh_CN: '容器名称 和/或 URL',
  },
  'panel.new_tab_custom_btns_note': {
    en: 'Note: List of button configs. Example:\n  Personal  (open new tab in "Personal" container)\n  https://example.com  (open provided URL)\n  Personal, https://example.com  (open provided URL in "Personal" container)',
    ru: 'Список настроек для кнопок новой вкладки. Пример:\n  Персональный  (Открыть вкладку в контейнере "Персональный")\n  https://example.com  (Открыть вкладку с данным URL)\n  Персональный, https://example.com  (Открыть вкладку с данным URL в контейнере "Персональный")',
    de: 'Hinweis: Liste der Schaltflächenkonfigurationen. Beispiel:\n Persönlich (öffne neuen Tab in "Persönlich"-Umgebung)\n https://example.com (öffne bereitgestellte URL)\n Persönlich, https://example.com (öffne bereitgestellte URL in "Persönlich"-Umgebung)',
    zh_CN:
      '注意：按钮配置列表。示例：\n 个人（在“个人”容器中打开新标签页）\n  https://example.com  (打开提供的URL)\n  个人, https://example.com  (在“个人”容器中打开提供的 URL)',
  },

  // ---
  // -- Settings
  // -
  'settings.nav_settings': {
    en: 'Settings',
    ru: 'Настройки', 
    de: 'Einstellungen',
    zh_CN: '设置',
  },
  'settings.nav_settings_general': {
    en: 'General',
    ru: 'Основные',
    de: 'Allgemein',
    zh_CN: '通用',
  },
  'settings.nav_settings_menu': {
    en: 'Menu',
    ru: 'Меню',
    de: 'Menü',
    zh_CN: '菜单',
  },
  'settings.nav_settings_nav': {
    en: 'Navigation bar',
    ru: 'Навигация',
    de: 'Navigationsleiste',
    zh_CN: '导航栏',
  },
  'settings.nav_settings_group': {
    en: 'Group page',
    ru: 'Групповая страница',
    de: 'Gruppenseite',
    zh_CN: '分组页面',
  },
  'settings.nav_settings_containers': {
    en: 'Containers',
    ru: 'Контейнеры',
    de: 'Umgebungen',
    zh_CN: '容器',
  },
  'settings.nav_settings_dnd': {
    en: 'Drag and Drop',
    ru: 'Перетаскивание',
    de: 'Drag and Drop',
    zh_CN: '拖拽',
  },
  'settings.nav_settings_search': {
    en: 'Search',
    ru: 'Поиск',
    de: 'Suche',
    zh_CN: '搜索',
  },
  'settings.nav_settings_tabs': {
    en: 'Tabs',
    ru: 'Вкладки',
    de: 'Tabs',
    zh_CN: '标签页',
  },
  'settings.nav_settings_new_tab_position': {
    en: 'Position of new tab',
    ru: 'Позиция новых вкладок',
    de: 'Position neuer Tabs',
    zh_CN: '新标签页的位置',
  },
  'settings.nav_settings_pinned_tabs': {
    en: 'Pinned tabs',
    ru: 'Закрепленные вкладки',
    de: 'Angeheftete Tabs',
    zh_CN: '固定的标签页',
  },
  'settings.nav_settings_tabs_tree': {
    en: 'Tabs tree',
    ru: 'Дерево вкладок',
    de: 'Tab-Baum',
    zh_CN: '树状标签页',
  },
  'settings.nav_settings_bookmarks': {
    en: 'Bookmarks',
    ru: 'Закладки',
    de: 'Lesezeichen',
    zh_CN: '书签',
  },
  'settings.nav_settings_history': {
    en: 'History',
    ru: 'История',
    de: 'Chronik',
    zh_CN: '历史',
  },
  'settings.nav_settings_appearance': {
    en: 'Appearance',
    ru: 'Вид',
    de: 'Erscheinungsbild',
    zh_CN: '外观',
  },
  'settings.nav_settings_snapshots': {
    en: 'Snapshots',
    ru: 'Снепшоты',
    de: 'Schnappschüsse',
    zh_CN: '快照',
  },
  'settings.nav_settings_mouse': {
    en: 'Mouse',
    ru: 'Мышь',
    de: 'Maus',
    zh_CN: '鼠标',
  },
  'settings.nav_settings_keybindings': {
    en: 'Keybindings',
    ru: 'Клавиши',
    de: 'Tastenbelegung',
    zh_CN: '按键绑定',
  },
  'settings.nav_settings_permissions': {
    en: 'Permissions',
    ru: 'Разрешения',
    de: 'Berechtigungen',
    zh_CN: '权限',
  },
  'settings.nav_settings_storage': {
    en: 'Storage',
    ru: 'Данные',
    de: 'Speicher',
    zh_CN: '存储',
  },
  'settings.nav_settings_sync': {
    en: 'Sync',
    ru: 'Синхронизация',
    de: 'Sync',
    zh_CN: '同步',
  },
  'settings.nav_settings_help': {
    en: 'Help',
    ru: 'Помощь',
    de: 'Hilfe',
    zh_CN: '帮助',
  },
  'settings.nav_menu_editor': {
    en: 'Menu editor',
    ru: 'Редактор меню',
    de: 'Menü-Editor',
    zh_CN: '菜单编辑器',
  },
  'settings.nav_menu_editor_tabs': {
    en: 'Tabs',
    ru: 'Вкладки',
    de: 'Tabs',
    zh_CN: '标签页',
  },
  'settings.nav_menu_editor_tabs_panel': {
    en: 'Tabs panel',
    ru: 'Панель вкладок',
    de: 'Tab-Panel',
    zh_CN: '标签页面板',
  },
  'settings.nav_menu_editor_bookmarks': {
    en: 'Bookmarks',
    ru: 'Закладки',
    de: 'Lesezeichen',
    zh_CN: '书签',
  },
  'settings.nav_menu_editor_bookmarks_panel': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
    de: 'Lesezeichen-Panel',
    zh_CN: '书签面板',
  },
  'settings.nav_styles_editor': {
    en: 'Styles editor',
    ru: 'Редактор стилей',
    de: 'Stil-Editor',
    zh_CN: '样式编辑器',
  },
  'settings.nav_snapshots': {
    en: 'Snapshots viewer',
    ru: 'Снепшоты',
    de: 'Schnappschuss-Viewer',
    zh_CN: '快照查看器',
  },
  'settings.nav_keybindings': {
    en: 'Keybindings',
    ru: 'Клавиши',
    de: 'Tastenbelegung',
    zh_CN: '按键绑定',
  },

  // - Details controls
  'settings.ctrl_save': {
    en: 'SAVE',
    ru: 'СОХРАНИТЬ',
    de: 'SPEICHERN',
  },
  'settings.ctrl_update': {
    en: 'UPDATE',
    ru: 'ОБНОВИТЬ',
    de: 'AKTUALISIEREN',
    zh_CN: '更新',
  },
  'settings.ctrl_copy': {
    en: 'COPY',
    ru: 'СКОПИРОВАТЬ',
    de: 'KOPIEREN',
    zh_CN: '复制',
  },
  'settings.ctrl_close': {
    en: 'CLOSE',
    ru: 'ЗАКРЫТЬ',
    de: 'SCHLIEẞEN',
    zh_CN: '关闭',
  },

  // - General
  'settings.general_title': {
    en: 'General',
    ru: 'Основные',
    de: 'Allgemein',
    zh_CN: '通用',
  },
  'settings.native_scrollbars': {
    en: 'Use native scroll-bars',
    ru: 'Использовать системные скроллбары',
    de: 'Native Scrollleiste verwenden',
    zh_CN: '使用原生滚动条',
  },
  'settings.native_scrollbars_thin': {
    en: 'Use thin scroll-bars',
    ru: 'Использовать узкие скроллбары',
    de: 'Dünne Scrollleiste verwenden',
    zh_CN: '使用细滚动条',
  },
  'settings.native_scrollbars_left': {
    en: 'Show scroll-bar at the left side',
    ru: 'Показать полосу прокрутки слева',
    de: 'Scrollleiste auf der linken Seite anzeigen',
  },
  'settings.sel_win_screenshots': {
    en: 'Show screenshots in the window selection menu',
    ru: 'Показывать скриншоты в меню выбора окна',
    de: 'Screenshots im Fenster-Auswahl-Menü anzeigen',
    zh_CN: '在窗口选择菜单中显示屏幕截图',
  },
  'settings.update_sidebar_title': {
    en: "Use active panel's name as sidebar title",
    ru: 'Использовать имя активной панели в качестве заголовка боковой панели',
    de: 'Name des aktiven Panels als Seitenleistenname verwenden',
    zh_CN: '使用活动面板的名称作为侧边栏标题',
  },
  'settings.mark_window': {
    en: "Add preface to the browser window's title if Sidebery sidebar is active",
    ru: 'Добавлять префикс к заголовку окна, если боковая панель Sidebery активна',
    de: 'Präfix zu Fenstername des Browsers hinzufügen, wenn Sidebery-Seitenleiste geöffnet ist',
    zh_CN: '如果 Sidebery 侧边栏处于活动状态，则在浏览器窗口的标题中添加前言',
  },
  'settings.mark_window_preface': {
    en: 'Preface value',
    ru: 'Значение префикса',
    de: 'Präfix',
    zh_CN: '前言值设置',
  },
  'settings.storage_btn': {
    en: "Sidebery's data:",
    ru: 'Данные Sidebery:',
    de: 'Sidebery-Daten',
    zh_CN: 'Sidebery的数据:',
  },
  'settings.permissions_btn': {
    en: 'Permissions',
    ru: 'Разрешения',
    de: 'Berechtigungen',
  },

  // - Context menu
  'settings.ctx_menu_title': {
    en: 'Context menu',
    ru: 'Контекстное меню',
	de: 'Kontextmenü',
    zh_CN: '上下文菜单',
  },
  'settings.ctx_menu_native': {
    en: 'Use native context menu',
    ru: 'Использовать системное контекстное меню',
    de: 'Natives Kontextmenü verwenden',
    zh_CN: '使用本机上下文菜单',
  },
  'settings.ctx_menu_render_inact': {
    en: 'Render inactive options',
    ru: 'Отображать неактивные элементы',
    de: 'Inaktive Optionen rendern',
    zh_CN: '渲染非活动选项',
  },
  'settings.ctx_menu_render_icons': {
    en: 'Render icons',
    ru: 'Отображать иконки',
    de: 'Symbole rendern',
    zh_CN: '渲染图标',
  },
  'settings.ctx_menu_ignore_ctr': {
    en: 'Ignore containers',
    ru: 'Не отображать контейнеры',
    de: 'Umgebungen ignorieren',
    zh_CN: '忽略容器',
  },
  'settings.ctx_menu_ignore_ctr_or': {
    en: 'e.g. /^tmp.+/, Google, Facebook',
    ru: 'пример: /^tmp.+/, Google, Facebook',
    de: 'z.B. /^tmp.+/, Google, Facebook',
    zh_CN: '例如 /^tmp.+/, Google, Facebook',
  },
  'settings.ctx_menu_ignore_ctr_note': {
    en: 'Use comma-separated list of contaianers names or /regexp/',
    ru: 'Список названий или /regexp/ через запятую',
    de: 'Komma-getrennte Liste von Umgebungsnamen oder /regexp/ verwenden',
    zh_CN: '使用逗号分隔的容器列表名称, 字符串或 /正则/ ',
  },
  'settings.ctx_menu_editor': {
    en: 'Edit context menu',
    ru: 'Редактировать меню',
    de: 'Kontextmenü bearbeiten',
    zh_CN: '编辑上下文菜单',
  },

  // - Navigation bar
  // TODO: rename 'nav' to 'navbar'
  'settings.nav_title': {
    en: 'Navigation bar',
    ru: 'Навигация',
    de: 'Navigationsleiste',
    zh_CN: '导航栏',
  },
  'settings.nav_bar_layout': {
    en: 'Layout',
    ru: 'Расположение',
    de: 'Layout',
    zh_CN: '布局',
  },
  'settings.nav_bar_layout_horizontal': {
    en: 'horizontal',
    ru: 'горизонтальное',
    de: 'Horizontal',
    zh_CN: '水平排列',
  },
  'settings.nav_bar_layout_vertical': {
    en: 'vertical',
    ru: 'вертикальное',
    de: 'Vertikal',
    zh_CN: '垂直排列',
  },
  'settings.nav_bar_layout_hidden': {
    en: 'hidden',
    ru: 'скрытое',
    de: 'Versteckt',
    zh_CN: '隐藏',
  },
  'settings.nav_bar_inline': {
    en: 'Show navigation bar in one line',
    ru: 'В одну строку',
    de: 'Zeige Navigationsleiste in einer Zeile',
    zh_CN: '在一行中显示导航栏',
  },
  'settings.nav_bar_side': {
    en: 'Side',
    ru: 'Сторона',
    de: 'Seite',
    zh_CN: '侧面设置',
  },
  'settings.nav_bar_side_left': {
    en: 'left',
    ru: 'левая',
    de: 'Links',
    zh_CN: '移动侧栏到左侧',
  },
  'settings.nav_bar_side_right': {
    en: 'right',
    ru: 'правая',
    de: 'Rechts',
    zh_CN: '移动侧栏到右侧',
  },
  'settings.nav_btn_count': {
    en: 'Show count of tabs/bookmarks',
    ru: 'Показывать количество вкладок/закладок',
    de: 'Zeige Anzahl der Tabs/Lesezeichen',
    zh_CN: '显示标签页/书签的数量',
  },
  'settings.hide_empty_panels': {
    en: 'Hide empty tabs panels',
    ru: 'Скрывать пустые панели вкладок',
    de: 'Verstecke leere Tab-Panels',
    zh_CN: '隐藏空标签页面板',
  },
  'settings.nav_switch_panels_delay': {
    en: 'Min delay between panels switching (ms)',
    ru: 'Минимальная задержка между переключениями панелей (мс)',
    de: 'Mindestverzögerung beim Wechsel zwischen Panels (ms)',
    zh_CN: '面板切换的最小延迟（毫秒）',
  },
  'settings.nav_act_tabs_panel_left_click': {
    en: 'Left click on active tabs panel',
    ru: 'Клик левой кнопкой мыши по активной панели вкладок',
    de: 'Linksklick auf aktives Tab-Panel',
    zh_CN: '左键单击活动的标签页面板',
  },
  'settings.nav_act_tabs_panel_left_click_new_tab': {
    en: 'create tab',
    ru: 'создать вкладку',
    de: 'Erstelle Tab',
    zh_CN: '新建标签页',
  },
  'settings.nav_act_tabs_panel_left_click_none': {
    en: 'none',
    ru: 'ничего',
    de: 'Nichts',
    zh_CN: '无',
  },
  'settings.nav_act_bookmarks_panel_left_click': {
    en: 'Left click on active bookmarks panel',
    ru: 'Клик левой кнопкой мыши по активной панели закладок',
    de: 'Linksklick auf aktives Lesezeichen-Panel',
    zh_CN: '左键单击活动的书签面板',
  },
  'settings.nav_act_bookmarks_panel_left_click_scroll': {
    en: 'scroll to start/end',
    ru: 'проскроллить к началу/концу',
    de: 'Scrolle zum Anfang/Ende',
    zh_CN: '滚动到顶部/底部',
  },
  'settings.nav_act_bookmarks_panel_left_click_none': {
    en: 'none',
    ru: 'ничего',
    de: 'Nichts',
    zh_CN: '无',
  },
  'settings.nav_tabs_panel_mid_click': {
    en: 'Middle click on tabs panel',
    ru: 'Клик средней кнопкой мыши по панели вкладок',
    de: 'Mittlere Maustaste auf Tab-Panel',
    zh_CN: '中键单击标签页面板',
  },
  'settings.nav_tabs_panel_mid_click_rm_act_tab': {
    en: 'close active tab',
    ru: 'закрыть активную вкладку',
    de: 'Schließe aktiven Tab',
    zh_CN: '关闭活动标签页',
  },
  'settings.nav_tabs_panel_mid_click_rm_all': {
    en: 'close tabs',
    ru: 'закрыть вкладки',
    de: 'Schließe Tabs',
    zh_CN: '关闭标签页',
  },
  'settings.nav_tabs_panel_mid_click_discard': {
    en: 'unload tabs',
    ru: 'выгрузить вкладки',
    de: 'Entlade Tabs',
    zh_CN: '卸载标签页',
  },
  'settings.nav_tabs_panel_mid_click_bookmark': {
    en: 'save panel to bookmarks',
    ru: 'сохранить панель в закладки',
    de: 'Speichere Panel in Lesezeichen',
    zh_CN: '将面板保存到书签',
  },
  'settings.nav_tabs_panel_mid_click_convert': {
    en: 'convert to bookmarks',
    ru: 'конвертировать в панель закладок',
    de: 'Konvertiere in Lesezeichen',
    zh_CN: '转换为书签',
  },
  'settings.nav_tabs_panel_mid_click_none': {
    en: 'none',
    ru: 'ничего',
    de: 'Nichts',
    zh_CN: '无',
  },
  'settings.nav_bookmarks_panel_mid_click': {
    en: 'Middle click on bookmarks panel',
    ru: 'Клик средней кнопкой мыши по панели закладок',
    de: 'Mittlere Maustaste auf Lesezeichen-Panel',
    zh_CN: '在书签面板上单击鼠标中键',
  },
  'settings.nav_bookmarks_panel_mid_click_convert': {
    en: 'convert to tabs',
    ru: 'конвертировать во вкладки',
    de: 'Konvertiere in Tabs',
    zh_CN: '转换为标签',
  },
  'settings.nav_bookmarks_panel_mid_click_none': {
    en: 'none',
    ru: 'ничего',
    de: 'Nichts',
    zh_CN: 'none',
  },
  'settings.nav_switch_panels_wheel': {
    en: 'Switch panels with mouse wheel over navigation bar',
    ru: 'Переключать панели с помощью колеса мыши над панелью навигации',
    de: 'Wechsle Panels mittels Mausrad über Navigationsleiste',
    zh_CN: '在导航栏上使用鼠标滚轮切换面板',
  },
  'settings.nav_bar_enabled': {
    en: 'Enabled elements',
    ru: 'Активированные элементы',
    de: 'Aktivierte Elemente',
    zh_CN: '已启用的元素',
  },
  'settings.nav_bar.no_elements': {
    en: 'No elements',
    ru: 'Нет элементов',
    de: 'Keine Elemente',
    zh_CN: '无元素',
  },
  'settings.nav_bar.available_elements': {
    en: 'Available elements',
    ru: 'Доступные элементы',
    de: 'Verfügbare Elemente',
    zh_CN: '可用元素',
  },
  'settings.nav_bar_btn_tabs_panel': {
    en: 'Tabs panel',
    ru: 'Панель вкладок',
    de: 'Tab-Panel',
    zh_CN: '标签页面板',
  },
  'settings.nav_bar_btn_bookmarks_panel': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
    de: 'Lesezeichen-Panel',
    zh_CN: '书签面板',
  },
  'settings.nav_bar_btn_sp': {
    en: 'Space',
    ru: 'Пространство',
    de: 'Leerraum',
    zh_CN: 'Space',
  },
  'settings.nav_bar_btn_sd': {
    en: 'Delimiter',
    ru: 'Разделитель',
    de: 'Abgrenzung',
    zh_CN: '分隔符',
  },
  'settings.nav_bar_btn_history': {
    en: 'History panel',
    ru: 'История',
    de: 'Chronik-Panel',
    zh_CN: '历史面板',
  },
  'settings.nav_bar_btn_settings': {
    en: 'Settings',
    ru: 'Настройки',
    de: 'Einstellungen',
    zh_CN: '设置',
  },
  'settings.nav_bar_btn_add_tp': {
    en: 'Create tabs panel',
    ru: 'Создать панель вкладок',
    de: 'Tab-Panel erstellen',
    zh_CN: '创建标签页面板',
  },
  'settings.nav_bar_btn_search': {
    en: 'Search',
    ru: 'Поиск',
    de: 'Suche',
    zh_CN: '搜索',
  },
  'settings.nav_bar_btn_create_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
    de: 'Schnappschuss erstellen',
    zh_CN: '创建快照',
  },
  'settings.nav_bar_btn_remute_audio_tabs': {
    en: 'Mute/Unmute audible tabs',
    ru: 'Приглушить/Включить вкладки со звуком',
    de: 'Stumm/Laut schalten hörbarer Tabs',
    zh_CN: '静音/取消静音有声标签页',
  },
  'settings.nav_bar_btn_collapse': {
    en: 'Collapse all',
    de: 'Alle einklappen',
    ru: 'Свернуть все',
  },
  'settings.nav_rm_tabs_panel_confirm_pre': {
    en: 'Delete "',
    ru: 'Удалить панель "',
    de: 'Lösche "',
    zh_CN: '删除 "',
  },
  'settings.nav_rm_tabs_panel_confirm_post': {
    en: '" panel?\nAll tabs of this panel will be assigned to nearest tabs panel.',
    ru: '"?\n Все вкладки этой панели будут присоединены к соседней панели.',
    de: '" Panel?\nAlle Tabs dieses Panels werden dem nächsten Tab-Panel zugeordnet.',
    zh_CN: '" 面板吗?\n此面板的所有标签页都将分配给最近的标签页面板。',
  },
  'settings.nav_rm_bookmarks_panel_confirm_pre': {
    en: 'Delete "',
    ru: 'Удалить панель "',
    de: 'Lösche "',
    zh_CN: '删除 "',
  },
  'settings.nav_rm_bookmarks_panel_confirm_post': {
    en: '" panel?',
    ru: '"?',
    de: '" Panel?',
    zh_CN: '" 面板吗?',
  },

  // - Group page
  'settings.group_title': {
    en: 'Group page',
    ru: 'Групповая страница',
    de: 'Gruppenseite',
    zh_CN: '分组页面',
  },
  'settings.group_layout': {
    en: 'Layout of tabs',
    ru: 'Отображение',
    de: 'Tab-Layout',
    zh_CN: '标签页的布局',
  },
  'settings.group_layout_grid': {
    en: 'grid',
    ru: 'сетка',
    de: 'Gitter',
    zh_CN: '网格',
  },
  'settings.group_layout_list': {
    en: 'list',
    ru: 'список',
    de: 'Liste',
    zh_CN: '列表',
  },

  // - Containers
  'settings.containers_title': {
    en: 'Containers',
    ru: 'Контейнеры',
    de: 'Umgebung',
    zh_CN: '容器',
  },
  'settings.contianer_remove_confirm_prefix': {
    en: 'Are you sure you want to delete "',
    ru: 'Вы действительно хотите удалить контейнер "',
    de: 'Möchten Sie die "',
    zh_CN: '你确定要删除 "',
  },
  'settings.contianer_remove_confirm_postfix': {
    en: '" container?',
    ru: '"?',
    de: '" Umgebung wirklich löschen?',
    zh_CN: '" 容器吗?',
  },
  'settings.containers_create_btn': {
    en: 'Create container',
    ru: 'Создать контейнер',
    de: 'Umgebung erstellen',
    zh_CN: '创建容器',
  },

  // - Drag and drop
  'settings.dnd_title': {
    en: 'Drag and Drop',
    ru: 'Перетаскивание',
    de: 'Drag and Drop',
    zh_CN: '拖拽',
  },
  'settings.dnd_tab_act': {
    en: 'Activate tab on hover',
    ru: 'Активировать вкладку при наведении',
    de: 'Tabs beim darüber Hovern aktivieren',
    zh_CN: '悬停时激活标签页',
  },
  'settings.dnd_tab_act_delay': {
    en: 'With delay (ms)',
    ru: 'С задержкой (мс)',
    de: 'Mit Verzögerung (ms)',
    zh_CN: '延迟 (毫秒)',
  },
  'settings.dnd_mod': {
    en: 'With pressed key',
    ru: 'При нажатии на',
    de: 'Mit Tastendruck',
    zh_CN: '仅当按下',
  },
  'settings.dnd_mod_alt': {
    en: 'alt',
    ru: 'alt',
    de: 'Alt',
    zh_CN: 'alt',
  },
  'settings.dnd_mod_shift': {
    en: 'shift',
    ru: 'shift',
    de: 'Umschalt',
    zh_CN: 'shift',
  },
  'settings.dnd_mod_ctrl': {
    en: 'ctrl',
    ru: 'ctrl',
    de: 'Strg',
    zh_CN: 'ctrl',
  },
  'settings.dnd_mod_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Kein',
    zh_CN: '无',
  },
  'settings.dnd_outside': {
    en: 'Action on drag-and-drop to the outside of sidebar',
    ru: 'Действие при перетаскивании за пределы боковой панели',
    de: 'Aktion beim Drag-and-Drop aus der Seitenleiste hinaus',
  },
  'settings.dnd_outside_win': {
    en: 'Open in new window',
    de: 'In neuem Fenster öffnen',
    ru: 'Открыть в новом окне',
  },
  'settings.dnd_outside_data': {
    en: 'Pass dragged data to the target',
    ru: 'Передать данные получателю',
    de: 'Daten auf Ziel übertragen',
  },
  'settings.settings.dnd_outside_note': {
    en: 'Press the "Alt" key before dragging to invert this option',
    ru: 'Нажмите клавишу «Alt» перед перетаскиванием, чтобы инвертировать эту опцию',
    de: 'Drücke "Alt"-Taste vor dem Ziehen, um diese Option zu invertieren',
  },
  'settings.dnd_exp': {
    en: 'Expand/Fold the branch on hovering over the',
    ru: 'Развернуть/свернуть ветвь при наведении на',
    de: 'Zweig ein-/ausklappen beim Bewegen über',
    zh_CN: '展开/折叠分支当悬停在',
  },
  'settings.dnd_exp_pointer': {
    en: "pointer's triangle",
    ru: 'треугольник указателя',
    de: 'Dreieck des Indikators',
    zh_CN: '下拉三角形指针',
  },
  'settings.dnd_exp_hover': {
    en: 'tab/bookmark',
    ru: 'вкладку/закладку',
    de: 'Tab/Lesezeichen',
    zh_CN: '标签页/书签',
  },
  'settings.dnd_exp_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Nie',
    zh_CN: '无',
  },
  'settings.dnd_exp_delay': {
    en: 'With delay (ms)',
    ru: 'С задержкой (мс)',
    de: 'Mit Verzögerung (ms)',
    zh_CN: '延迟 (毫秒)',
  },

  // - Search
  'settings.search_title': {
    en: 'Search',
    ru: 'Поиск',
    de: 'Suche',
    zh_CN: '搜索',
  },
  'settings.search_bar_mode': {
    en: 'Search bar mode',
    ru: 'Режим панели',
    de: 'Modus der Suchleiste',
    zh_CN: '搜索栏模式',
  },
  'settings.search_bar_mode_static': {
    en: 'always shown',
    ru: 'активный',
    de: 'Immer anzeigen',
    zh_CN: '总是显示',
  },
  'settings.search_bar_mode_dynamic': {
    en: 'dynamic',
    ru: 'динамический',
    de: 'Dynamisch',
    zh_CN: '动态显示',
  },
  'settings.search_bar_mode_none': {
    en: 'inactive',
    ru: 'скрытый',
    de: 'Inaktiv',
    zh_CN: '不活跃',
  },

  // - Tabs
  'settings.tabs_title': {
    en: 'Tabs',
    ru: 'Вкладки',
    de: 'Tabs',
    zh_CN: '标签页',
  },
  'settings.warn_on_multi_tab_close': {
    en: 'Warn on trying to close multiple tabs',
    ru: 'Предупреждать при закрытии нескольких вкладок',
    de: 'Warne beim Schließen mehrerer Tabs',
    zh_CN: '尝试关闭多个标签页时给予提醒',
  },
  'settings.warn_on_multi_tab_close_any': {
    en: 'any',
    ru: 'любых',
    de: 'Alle',
    zh_CN: '所有',
  },
  'settings.warn_on_multi_tab_close_collapsed': {
    en: 'collapsed',
    ru: 'свернутых',
    de: 'Eingeklappte',
    zh_CN: '折叠',
  },
  'settings.warn_on_multi_tab_close_none': {
    en: 'none',
    ru: 'нет',
    de: 'Nie',
    zh_CN: '无',
  },
  'settings.activate_last_tab_on_panel_switching': {
    en: 'Activate last active tab on panel switching',
    ru: 'Активировать последнюю активную вкладку при переключении панелей',
    de: 'Aktiviere das zuletzt aktive Tab beim Wechseln des Panels',
    zh_CN: '在面板切换时激活上一个活动标签页',
  },
  'settings.skip_empty_panels': {
    en: 'Skip empty panels on switching',
    ru: 'Пропускать пустые контейнеры при переключении',
    de: 'Überspringe leere Panels beim Wechseln',
    zh_CN: '切换时跳过空面板',
  },
  'settings.show_tab_rm_btn': {
    en: 'Show close button on mouse hover',
    ru: 'Показывать кнопку закрытия вкладки при наведении курсора',
    de: 'Zeige "Schließen"-Knopf bei Maus-Hover',
    zh_CN: '在鼠标悬停时显示关闭按钮',
  },
  'settings.hide_inactive_panel_tabs': {
    en: 'Hide native tabs of inactive panels',
    ru: 'Скрывать горизонтальные вкладки неактивных панелей',
    de: 'Verstecke native Tabs inaktiver Panels',
    zh_CN: '隐藏非活动面板的本机标签页',
  },
  'settings.activate_after_closing': {
    en: 'After closing current tab activate',
    ru: 'После закрытия текущей вкладки активировать',
    de: 'Nach Schließen des aktuellen Tabs, aktiviere',
    zh_CN: '关闭当前标签页后激活',
  },
  'settings.activate_after_closing_next': {
    en: 'next tab',
    ru: 'следующую',
    de: 'nächsten Tab',
    zh_CN: '下一个标签页',
  },
  'settings.activate_after_closing_prev': {
    en: 'previous tab',
    ru: 'предыдущую',
    de: 'vorherigen Tab',
    zh_CN: '上一个标签页',
  },
  'settings.activate_after_closing_prev_act': {
    en: 'previously active tab',
    ru: 'последнюю активную',
    de: 'zuletzt aktiven Tab',
    zh_CN: '上一活动标签页',
  },
  'settings.activate_after_closing_none': {
    en: 'off',
    ru: 'выкл',
    de: 'nichts',
    zh_CN: '无',
  },
  'settings.activate_after_closing_prev_rule': {
    en: 'Previous tab rule',
    ru: 'Правило предыдущей вкладки',
    de: 'Vorherige Tab-Regel',
    zh_CN: '上一个标签页规则',
  },
  'settings.activate_after_closing_next_rule': {
    en: 'Next tab rule',
    ru: 'Правило следующей вкладки',
    de: 'Nächste Tab-Regel',
    zh_CN: '下一个标签页规则',
  },
  'settings.activate_after_closing_rule_tree': {
    en: 'tree',
    ru: 'дерево',
    de: 'Zweig',
    zh_CN: '树状',
  },
  'settings.activate_after_closing_rule_visible': {
    en: 'visible',
    ru: 'видимая',
    de: 'Sichtbar',
    zh_CN: '可见的',
  },
  'settings.activate_after_closing_rule_any': {
    en: 'any',
    ru: 'любая',
    de: 'Alle',
    zh_CN: '所有',
  },
  'settings.activate_after_closing_global': {
    en: 'Globally',
    ru: 'Глобально',
    de: 'Global',
    zh_CN: '全局',
  },

  'settings.tabs_url_in_tooltip': {
    en: 'Show URL in tooltip',
    ru: 'Показывать URL во всплывающей подсказке',
    de: 'Zeige URL in Tooltip',
  },
  'settings.tabs_url_in_tooltip_full': {
    en: 'full',
    ru: 'полный',
    de: 'Vollständig',
  },
  'settings.tabs_url_in_tooltip_stripped': {
    en: 'stripped',
    ru: 'сокращенный',
    de: 'Gekürzt',
  },
  'settings.tabs_url_in_tooltip_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Gar nicht',
    zh_CN: '无',
  },

  'settings.activate_after_closing_no_folded': {
    en: 'Ignore folded tabs',
    ru: 'Игнорировать свернутые вкладки',
    de: 'Ignoriere eingeklappte Tabs',
    zh_CN: '忽略折叠的标签页',
  },
  'settings.activate_after_closing_no_discarded': {
    en: 'Ignore discarded tabs',
    ru: 'Игнорировать выгруженные вкладки',
    de: 'Ignoriere entladene Tabs',
    zh_CN: '忽略丢弃的标签页',
  },
  'settings.ask_new_bookmark_place': {
    en: 'Ask where to store bookmarks',
    ru: 'Спрашивать куда сохранить закладки',
    de: 'Frage, wo Lesezeichen gespeichert werden sollen',
    zh_CN: '询问存储书签的位置',
  },
  'settings.tabs_rm_undo_note': {
    en: 'Show undo notification on closing multiple tabs',
    ru: 'Показывать уведомление о закрытии нескольких вкладок',
    de: 'Zeige "Rückgängig"-Meldung nach Schließen mehrerer Tabs',
    zh_CN: '在关闭多个标签页时显示撤消通知',
  },
  'settings.native_highlight': {
    en: 'Highlight native tabs (in top horizontal bar) along with tabs in sidebar',
    ru: 'Выделять стандартные вкладки (в верхней панели) вместе с вкладками в боковой панели',
    de: 'Hebe native Tabs (in horizontaler Leiste oben) ebenso hervor, wie Tabs in Seitenleiste',
    zh_CN: '突出显示本机标签页（在顶部水平栏中）以及侧边栏中的标签页',
  },
  'settings.tabs_unread_mark': {
    en: 'Show mark on unread tabs',
    ru: 'Показывать метку на непрочитанных вкладках',
    de: 'Zeige Markierung an ungelesenen Tabs',
    zh_CN: '在未读标签页上显示标记',
  },
  'settings.tabs_update_mark': {
    en: 'Show mark on tabs with updated title',
    ru: 'Показывать метку на вкладках с обновленным заголовком',
    de: 'Zeige Markierung an Tabs mit aktualisiertem Titel',
  },
  'settings.tabs_update_mark_all': {
    en: 'on',
    ru: 'вкл',
    de: 'Ein',
  },
  'settings.tabs_update_mark_pin': {
    en: 'only for pinned',
    ru: 'только для закрепленных',
    de: 'Nur für angeheftete',
  },
  'settings.tabs_update_mark_norm': {
    en: 'only for not pinned',
    ru: 'только для не закрепленных',
    de: 'Nur für nicht angeheftete',
  },
  'settings.tabs_update_mark_none': {
    en: 'off',
    ru: 'выкл',
    de: 'Aus',
  },
  'settings.tabs_reload_limit': {
    en: 'Limit the count of simultaneously reloading tabs',
    ru: 'Ограничить количество одновременно перезагружаемых вкладок',
    de: 'Beschränke die Anzahl gleichzeitig neu ladender Tabs',
    zh_CN: '限制同时重新加载标签页的数量',
  },
  'settings.tabs_reload_limit_notif': {
    en: 'Show notification with the reloading progress',
    ru: 'Показывать уведомление со статусом перезагрузки',
    de: 'Zeige Benachrichtigung mit Fortschritt des neu Ladens',
    zh_CN: '显示重新加载进度的通知',
  },
  'settings.tabs_panel_switch_act_move': {
    en: 'Switch panel after moving active tab to another panel',
    ru: 'Переключать панель после перемещения активной вкладки на другую панель',
    de: 'Wechsle Panel nach bewegen aktiver Tabs in anderes Panel',
    zh_CN: '将活动标签页移动到另一个面板后切换面板',
  },
  'settings.show_new_tab_btns': {
    en: 'Show new tab buttons',
    ru: 'Показывать кнопки создания новых вкладок',
    de: 'Zeige "Neuer Tab"-Schaltflächen',
    zh_CN: '显示新标签页按钮',
  },
  'settings.new_tab_bar_position': {
    en: 'Position',
    ru: 'Положение',
    de: 'Position',
    zh_CN: '地址',
  },
  'settings.new_tab_bar_position_after_tabs': {
    en: 'after tabs',
    ru: 'после вкладок',
    de: 'Nach Tabs',
    zh_CN: '标签页后',
  },
  'settings.new_tab_bar_position_bottom': {
    en: 'bottom',
    ru: 'снизу',
    de: 'Unten',
    zh_CN: '底部',
  },
  'settings.open_sub_panel_on_mouse_hover': {
    en: 'Open bookmarks sub-panel on mouse hover',
    ru: 'Открывать подпанель закладок при наведении мыши',
    de: 'Öffne Lesezeichen Unter-Panel bei Maus-Hover',
  },
  'settings.discard_inactive_panel_tabs_delay': {
    en: 'Unload tabs of inactive panel after delay',
    ru: 'Выгружать вкладки неактивных панелей c задержкой',
    de: 'Entlade Tabs inaktiver Panels nach Verzögerung',
    zh_CN: '超过延迟时间后卸载非活动面板的标签页',
  },
  'settings.discard_inactive_panel_tabs_delay_sec': {
    en: n => (n === 1 ? 'second' : 'seconds'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'секунда'
      if (NUM_234_RE.test(n.toString())) return 'секунды'
      return 'секунд'
    },
    de: n => (n === 1 ? 'Sekunde' : 'Sekunden'),
    zh_CN: '秒',
  },
  'settings.discard_inactive_panel_tabs_delay_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
    de: n => (n === 1 ? 'Minute' : 'Minuten'),
    zh_CN: '分',
  },
  'settings.tabs_second_click_act_prev': {
    en: 'Backward activation when clicking on the active tab',
    ru: 'Обратная активация при нажатии на активную вкладку ',
    de: 'Beim Klicken auf aktiven Tab Aktivierung umkehren',
    zh_CN: '单击活动标签页时向后激活',
  },
  'settings.colorize_tabs': {
    en: 'Colorize tabs',
    ru: 'Раскрашивать вкладки',
    de: 'Tabs einfärben',
  },
  'settings.colorize_tabs_src': {
    en: 'Generate color from',
    ru: 'Источник для генерации цвета',
    de: 'Generiere Farbe aus',
  },
  'settings.colorize_tabs_src_domain': {
    en: 'domain',
    ru: 'доменное имя',
    de: 'Domäne',
  },
  'settings.colorize_tabs_src_container': {
    en: 'container',
    ru: 'контейнер',
    de: 'Umgebung',
  },

  // - New tab position
  'settings.new_tab_position': {
    en: 'Position of new tab',
    ru: 'Позиция новых вкладок',
    de: 'Position neuer Tabs',
    zh_CN: '新标签页的位置',
  },
  'settings.move_new_tab_pin': {
    en: 'Place new tab opened from pinned tab',
    ru: 'Открытые из закрепленных вкладок',
    de: 'Platziere Tab, das von angeheftetem Tab geöffnet wird',
    zh_CN: '从固定标签页打开的新标签页的位置',
  },
  'settings.move_new_tab_pin_start': {
    en: 'panel start',
    ru: 'начало панели',
    de: 'Anfang des Panels',
    zh_CN: '面板起始位置',
  },
  'settings.move_new_tab_pin_end': {
    en: 'panel end',
    ru: 'конец панели',
    de: 'Ende des Panels',
    zh_CN: '面板末尾位置',
  },
  'settings.move_new_tab_pin_none': {
    en: 'use general rule',
    ru: 'использовать общее правило',
    de: 'Allgemeine Regel anwenden',
    // zh_CN: '无',
  },
  'settings.move_new_tab_parent': {
    en: 'Place new tab opened from another tab',
    ru: 'Открытые из другой вкладки',
    de: 'Platziere Tab, das von anderem Tab geöffnete wird',
    zh_CN: '从其它标签页打开的新标签页的位置',
  },
  'settings.move_new_tab_parent_before': {
    en: 'before parent',
    ru: 'перед родительской',
    de: 'Vor Ursprungstab',
    zh_CN: '父标签之前',
  },
  'settings.move_new_tab_parent_sibling': {
    en: 'after parent',
    ru: 'после родительской',
    de: 'Nach Ursprungstab',
    zh_CN: '父标签之后',
  },
  'settings.move_new_tab_parent_first_child': {
    en: 'first child',
    ru: 'первая дочерняя',
    de: 'Als erstes Unterelement',
    zh_CN: '第一个子标签',
  },
  'settings.move_new_tab_parent_last_child': {
    en: 'last child',
    ru: 'последняя дочерняя',
    de: 'Als letztes Unterelement',
    zh_CN: '最后一个子标签',
  },
  'settings.move_new_tab_parent_start': {
    en: 'panel start',
    ru: 'начало панели',
    de: 'Anfang des Panels',
    zh_CN: '面板起始位置',
  },
  'settings.move_new_tab_parent_end': {
    en: 'panel end',
    ru: 'конец панели',
    de: 'Ende des Panels',
    zh_CN: '面板末尾位置',
  },
  'settings.move_new_tab_parent_default': {
    en: 'do not move it',
    ru: 'не перемещать',
    de: 'Nicht bewegen',
  },
  'settings.move_new_tab_parent_none': {
    en: 'use general rule',
    ru: 'использовать общее правило',
    de: 'Allgemeine Regel verwenden',
  },
  'settings.move_new_tab_parent_act_panel': {
    en: 'Only if panel of parent tab is active',
    ru: 'Только если панель родительской вкладки активна',
    de: 'Nur, wenn Panel des übergeordneten Tabs aktiv ist',
    zh_CN: '仅当父标签页的面板处于活动状态时',
  },
  'settings.move_new_tab': {
    en: 'Place new tab (general rule)',
    ru: 'Общее правило',
    de: 'Neuen Tab platzieren (allgemeine Regel)',
    // zh_CN: '新标签的位置（对于其他情况）',
  },
  'settings.move_new_tab_start': {
    en: 'panel start',
    ru: 'начало панели',
    de: 'Anfang des Panels',
    zh_CN: '面板起始位置',
  },
  'settings.move_new_tab_end': {
    en: 'panel end',
    ru: 'конец панели',
    de: 'Ende des Panels',
    zh_CN: '面板末尾位置',
  },
  'settings.move_new_tab_before': {
    en: 'before active tab',
    ru: 'перед активной вкладкой',
    de: 'Vor aktivem Tab',
    zh_CN: '活动标签页之前',
  },
  'settings.move_new_tab_after': {
    en: 'after active tab',
    ru: 'после активной вкладкой',
    de: 'Nach aktivem Tab',
    zh_CN: '活动标签页之后',
  },
  'settings.move_new_tab_first_child': {
    en: 'first child of active tab',
    ru: 'первая дочерняя вкладка активной',
    de: 'Erstes Unterelement des aktiven Tabs',
    zh_CN: '活动标签页的第一个子标签',
  },
  'settings.move_new_tab_last_child': {
    en: 'last child of active tab',
    ru: 'последняя дочерняя вкладка активной',
    de: 'Letztes Unterelement des aktiven Tabs',
    zh_CN: '活动标签页的最后一个子标签',
  },
  'settings.move_new_tab_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Nichts',
    zh_CN: '无',
  },

  // - Pinned tabs
  'settings.pinned_tabs_title': {
    en: 'Pinned tabs',
    ru: 'Закрепленные вкладки',
    de: 'Angeheftete Tabs',
    zh_CN: '固定标签页',
  },
  'settings.pinned_tabs_position': {
    en: 'Pinned tabs position',
    ru: 'Расположение закрепленных вкладок',
    de: 'Position angehefteter Tabs',
    zh_CN: '固定标签页位置',
  },
  'settings.pinned_tabs_position_top': {
    en: 'globally - top',
    ru: 'глобально - вверху',
    de: 'Global - Oben',
    zh_CN: '顶侧',
  },
  'settings.pinned_tabs_position_left': {
    en: 'globally - left',
    ru: 'глобально - слева',
    de: 'Global - Links',
    zh_CN: '左侧',
  },
  'settings.pinned_tabs_position_right': {
    en: 'globally - right',
    ru: 'глобально - справа',
    de: 'Global - Rechts',
    zh_CN: '右侧',
  },
  'settings.pinned_tabs_position_panel': {
    en: 'in panel - top',
    ru: 'на панели - сверху',
    de: 'Im Panel - Oben',
    zh_CN: '面板',
  },
  'settings.pinned_tabs_list': {
    en: 'Show titles of pinned tabs',
    ru: 'Показывать заголовки закрепленных вкладок',
    de: 'Zeige Namen angehefteter Tabs',
    zh_CN: '显示固定标签页的标题',
  },
  'settings.pinned_auto_group': {
    en: 'Group tabs that were opened from a pinned tab',
    ru: 'Группировать вкладки, которые были открыты из закрепленной вкладки.',
    de: 'Gruppiere Tabs, die von angehefteten Tabs geöffnet wurden',
    zh_CN: '对从固定标签页打开的标签进行分组',
  },

  // - Tabs tree
  'settings.tabs_tree_title': {
    en: 'Tabs tree',
    ru: 'Древовидное отображение вкладок',
    de: 'Tab-Baum',
    zh_CN: '树状标签页',
  },
  'settings.tabs_tree_layout': {
    en: 'Tabs tree structure',
    ru: 'Древовидное отображение вкладок',
    de: 'Tab-Baum Struktur',
    zh_CN: '标签页树状结构',
  },
  'settings.group_on_open_layout': {
    en: 'Create sub-tree on opening link in new tab',
    ru: 'Создать поддерево при открытии ссылки в новой вкладке',
    de: 'Erstelle Unterebene beim Öffnen von Links in neuem Tab',
    zh_CN: '新标签页中打开链接时创建子树',
  },
  'settings.tabs_tree_limit': {
    en: 'Tabs tree level limit',
    ru: 'Максимальный уровень вложенности вкладок',
    de: 'Tab-Baum Ebenenlimit',
    zh_CN: '限制标签页树级别',
  },
  'settings.tabs_tree_limit_1': {
    en: '1',
    ru: '1',
    de: '1',
    zh_CN: '1',
  },
  'settings.tabs_tree_limit_2': {
    en: '2',
    ru: '2',
    de: '2',
    zh_CN: '2',
  },
  'settings.tabs_tree_limit_3': {
    en: '3',
    ru: '3',
    de: '3',
    zh_CN: '3',
  },
  'settings.tabs_tree_limit_4': {
    en: '4',
    ru: '4',
    de: '4',
    zh_CN: '4',
  },
  'settings.tabs_tree_limit_5': {
    en: '5',
    ru: '5',
    de: '5',
    zh_CN: '5',
  },
  'settings.tabs_tree_limit_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Keines',
    zh_CN: '无',
  },
  'settings.hide_folded_tabs': {
    en: 'Hide folded tabs',
    ru: 'Скрывать свернутые вкладки',
    de: 'Verstecke eingeklappte Tabs',
    zh_CN: '隐藏已折叠标签页',
  },
  'settings.auto_fold_tabs': {
    en: 'Auto fold tabs',
    ru: 'Автоматически сворачивать вкладки',
    de: 'Tabs automatisch einklappen',
    zh_CN: '自动折叠标签页',
  },
  'settings.auto_fold_tabs_except': {
    en: 'Max count of open branches',
    ru: 'Максимальное количество открытых веток',
    de: 'Maximalzahl offener Zweige',
    zh_CN: '打开分支上限',
  },
  'settings.auto_fold_tabs_except_1': {
    en: '1',
    ru: '1',
    de: '1',
    zh_CN: '1',
  },
  'settings.auto_fold_tabs_except_2': {
    en: '2',
    ru: '2',
    de: '2',
    zh_CN: '2',
  },
  'settings.auto_fold_tabs_except_3': {
    en: '3',
    ru: '3',
    de: '3',
    zh_CN: '3',
  },
  'settings.auto_fold_tabs_except_4': {
    en: '4',
    ru: '4',
    de: '4',
    zh_CN: '4',
  },
  'settings.auto_fold_tabs_except_5': {
    en: '5',
    ru: '5',
    de: '5',
    zh_CN: '5',
  },
  'settings.auto_fold_tabs_except_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Keiner',
    zh_CN: '无',
  },
  'settings.auto_exp_tabs': {
    en: 'Auto expand tab on activation',
    ru: 'Автоматически разворачивать вкладки',
    de: 'Tabs bei Aktivierung automatisch ausklappen',
    zh_CN: '激活时自动展开标签页',
  },
  'settings.rm_child_tabs': {
    en: 'Close child tabs along with parent',
    ru: 'Закрывать дочерние вкладки вместе с родительской',
    de: 'Untergeordnete Tabs zusammen mit übergeordneten schließen',
    zh_CN: '与父项一起关闭子标签页',
  },
  'settings.rm_child_tabs_all': {
    en: 'all',
    ru: 'все',
    de: 'Alle',
    zh_CN: '所有',
  },
  'settings.rm_child_tabs_folded': {
    en: 'folded',
    ru: 'свернутые',
    de: 'Eingeklappte',
    zh_CN: '已折叠的',
  },
  'settings.rm_child_tabs_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Keine',
    zh_CN: '无',
  },
  'settings.tabs_child_count': {
    en: 'Show count of descendants on the folded tab',
    ru: 'Показывать количество потомков на свернутой вкладке',
    de: 'Wenn eingeklappt, zeige Zahl der untergeordneten Tabs',
    zh_CN: '在折叠标签上显示后代数量',
  },
  'settings.tabs_lvl_dots': {
    en: 'Show marks to indicate tabs sub-tree levels',
    ru: 'Показывать отметки уровней вложенности',
    de: 'Zeige Markierungen für Abstufung der Unterebenen der Tabs',
    zh_CN: '显示标记以表示标签页子树的级别',
  },
  'settings.discard_folded': {
    en: 'Unload folded tabs',
    ru: 'Выгружать свернутые вкладки',
    de: 'Eingeklappte Tabs entladen',
    zh_CN: '卸载已折叠的标签页',
  },
  'settings.discard_folded_delay': {
    en: 'With delay',
    ru: 'Через',
    de: 'Mit Verzögerung',
    zh_CN: '延迟',
  },
  'settings.discard_folded_delay_sec': {
    en: n => (n === 1 ? 'second' : 'seconds'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'секунда'
      if (NUM_234_RE.test(n.toString())) return 'секунды'
      return 'секунд'
    },
    de: n => (n === 1 ? 'Sekunde' : 'Sekunden'),
    zh_CN: '秒',
  },
  'settings.discard_folded_delay_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
    de: n => (n === 1 ? 'Minute' : 'Minuten'),
    zh_CN: '分',
  },
  'settings.tabs_tree_bookmarks': {
    en: 'Preserve tree on creating bookmarks',
    ru: 'Сохранять древовидную структуру при создании закладок',
    de: 'Baumstruktur beim Erstellen von Lesezeichen erhalten',
    zh_CN: '保存创建书签的树',
  },
  'settings.tree_rm_outdent': {
    en: 'After closing parent tab, outdent',
    ru: 'После закрытия родительской вкладки понизить уровень',
    de: 'Nach Schließen von übergeordnetem Tab ausrücken',
    zh_CN: '关闭父标签页后减小缩进',
  },
  'settings.tree_rm_outdent_branch': {
    en: 'whole branch',
    ru: 'всей ветви',
    de: 'Ganzen Zweig',
    zh_CN: '整个分支',
  },
  'settings.tree_rm_outdent_first_child': {
    en: 'first child',
    ru: 'первой дочерней вкладки',
    de: 'Erstes Unterelement',
    zh_CN: '第一个子标签',
  },
  'settings.colorize_branches': {
    en: 'Colorize branches',
    ru: 'Раскрашивать ветки',
    de: 'Zweige einfärben',
  },
  'settings.colorize_branches_src': {
    en: 'Generate color from',
    ru: 'Источник для генерации цвета',
    de: 'Generiere Farbe aus',
  },
  'settings.colorize_branches_src_url': {
    en: 'URL',
  },
  'settings.colorize_branches_src_domain': {
    en: 'domain',
    ru: 'доменное имя',
    de: 'Domäne',
  },

  // - Bookmarks
  'settings.bookmarks_title': {
    en: 'Bookmarks',
    ru: 'Закладки',
    de: 'Lesezeichen',
    zh_CN: '书签',
  },
  'settings.bookmarks_panel': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
    de: 'Lesezeichen-Panel',
    zh_CN: '书签面板',
  },
  'settings.bookmarks_layout': {
    en: 'Bookmarks layout',
    ru: 'Тип отображения',
    de: 'Lesezeichen Layout',
    zh_CN: '书签布局',
  },
  'settings.bookmarks_layout_tree': {
    en: 'tree',
    ru: 'дерево',
    de: 'Baum',
    zh_CN: '树状',
  },
  'settings.bookmarks_layout_history': {
    en: 'history',
    ru: 'история',
    de: 'Chronik',
    zh_CN: '历史',
  },
  'settings.warn_on_multi_bookmark_delete': {
    en: 'Warn on trying delete multiple bookmarks',
    ru: 'Предупреждать об удалении нескольких закладкок',
    de: 'Warne beim Löschen mehrerer Lesezeichen',
    zh_CN: '尝试删除多个书签时弹出警告',
  },
  'settings.warn_on_multi_bookmark_delete_any': {
    en: 'any',
    ru: 'любых',
    de: 'Immer',
    zh_CN: '所有',
  },
  'settings.warn_on_multi_bookmark_delete_collapsed': {
    en: 'collapsed',
    ru: 'свернутых',
    de: 'Eingeklappte',
    zh_CN: '已折叠的',
  },
  'settings.warn_on_multi_bookmark_delete_none': {
    en: 'none',
    ru: 'нет',
    de: 'Nie',
    zh_CN: '无',
  },
  'settings.auto_close_bookmarks': {
    en: 'Auto-close folders',
    ru: 'Автоматически сворачивать папки',
    de: 'Ordner automatisch schließen',
    zh_CN: '自动关闭文件夹',
  },
  'settings.auto_rm_other': {
    en: 'Delete open bookmarks from "Other Bookmarks" folder',
    ru: 'Удалять открытые закладки из папки "Другие закладки"',
    de: 'Entferne geöffnete Lesezeichen aus "Weitere Lesezeichen"-Ordner',
    zh_CN: '从“其他书签”文件夹中删除打开的书签',
  },
  'settings.show_bookmark_len': {
    en: 'Show folder size',
    ru: 'Показывать размер папки',
    de: 'Zeige Ordnergröße',
    zh_CN: '显示文件夹大小',
  },
  'settings.highlight_open_bookmarks': {
    en: 'Mark open bookmarks',
    ru: 'Отмечать открытые закладки',
    de: 'Kennzeichne geöffnete Lesezeichen',
    zh_CN: '标记打开的书签',
  },
  'settings.activate_open_bookmark_tab': {
    en: 'Go to open tab instead of opening new one',
    ru: 'Переходить на открытую вкладку вместо открытия новой',
    de: 'Wechsle zu offenem Tab, statt einen neuen zu öffnen',
    zh_CN: '转到打开的标签而不是打开新的标签',
  },
  'settings.bookmarks_rm_undo_note': {
    en: 'Show undo notification after deleting bookmarks',
    ru: 'Показывать уведомление об удалении нескольких закладок',
    de: 'Zeige "Rückgängig"-Meldung nachdem Lesezeichen gelöscht wurden',
    zh_CN: '删除书签后显示撤消通知',
  },
  'settings.fetch_bookmarks_favs': {
    en: 'Fetch favicons',
    ru: 'Загрузить иконки',
    de: 'Favicons herunterladen',
    zh_CN: '获取网站图标',
  },
  'settings.fetch_bookmarks_favs_stop': {
    en: 'Stop fetching',
    ru: 'Остановить загрузку',
    de: 'Herunterladen stoppen',
    zh_CN: '停止获取',
  },
  'settings.fetch_bookmarks_favs_done': {
    en: 'done',
    ru: 'завершено',
    de: 'Fertig',
    zh_CN: '已完成',
  },
  'settings.fetch_bookmarks_favs_errors': {
    en: 'errors',
    ru: 'ошибок',
    de: 'Fehler',
    zh_CN: '错误',
  },
  'settings.load_bookmarks_on_demand': {
    en: 'Load bookmarks on demand',
    ru: 'Инициализоровать сервис закладок только по необходимости',
    de: 'Lade Lesezeichen bei Bedarf',
    zh_CN: '按需加载书签',
  },
  'settings.pin_opened_bookmarks_folder': {
    en: 'Pin opened folder when scrolling',
    ru: 'Закреплять открытую папку при прокрутке',
    de: 'Geöffneten Ordner beim Scrollen anheften',
    zh_CN: '滚动时固定已打开的文件夹',
  },

  // - History
  'settings.history_title': {
    en: 'History',
    ru: 'История',
    de: 'Chronik',
    zh_CN: '历史',
  },
  'settings.load_history_on_demand': {
    en: 'Initialize history service on demand',
    ru: 'Инициализоровать сервис истории только по необходимости',
    zh_CN: '按需初始化历史服务',
    de: 'Chronik-Dienst bei Bedarf initialisieren',
  },

  // - Appearance
  'settings.appearance_title': {
    en: 'Appearance',
    ru: 'Вид',
    de: 'Aussehen',
    zh_CN: '外观',
  },
  'settings.font_size': {
    en: 'Font size',
    ru: 'Размер шрифта',
    de: 'Schriftgröße',
    zh_CN: '字体大小',
  },
  'settings.font_size_xxs': {
    en: 'XXS',
    ru: 'XXS',
    de: 'XXS',
    zh_CN: 'XXS',
  },
  'settings.font_size_xs': {
    en: 'XS',
    ru: 'XS',
    de: 'XS',
    zh_CN: 'XS',
  },
  'settings.font_size_s': {
    en: 'S',
    ru: 'S',
    de: 'S',
    zh_CN: 'S',
  },
  'settings.font_size_m': {
    en: 'M',
    ru: 'M',
    de: 'M',
    zh_CN: 'M',
  },
  'settings.font_size_l': {
    en: 'L',
    ru: 'L',
    de: 'L',
    zh_CN: 'L',
  },
  'settings.font_size_xl': {
    en: 'XL',
    ru: 'XL',
    de: 'XL',
    zh_CN: 'XL',
  },
  'settings.font_size_xxl': {
    en: 'XXL',
    ru: 'XXL',
    de: 'XXL',
    zh_CN: 'XXL',
  },
  'settings.theme': {
    en: 'Theme',
    ru: 'Тема',
    de: 'Theme',
    zh_CN: '主题',
  },
  'settings.theme_proton': {
    en: 'proton',
    ru: 'proton',
    de: 'Proton',
    zh_CN: 'proton',
  },
  'settings.theme_compact': {
    en: 'compact',
    ru: 'compact',
    de: 'Kompakt',
    zh_CN: 'compact',
  },
  'settings.theme_plain': {
    en: 'plain',
    ru: 'plain',
    de: 'Schlicht',
    zh_CN: 'plain',
  },
  'settings.theme_none': {
    en: 'none',
    ru: 'нет',
    de: 'Keins',
    zh_CN: '无',
  },
  'settings.switch_color_scheme': {
    en: 'Color scheme',
    ru: 'Цветовая схема',
    de: 'Farbschema',
    zh_CN: '配色方案',
  },
  'settings.color_scheme_dark': {
    en: 'dark',
    ru: 'темная',
    de: 'Dunkel',
    zh_CN: '暗黑',
  },
  'settings.color_scheme_light': {
    en: 'light',
    ru: 'светлая',
    de: 'Hell',
    zh_CN: '明亮',
  },
  'settings.color_scheme_sys': {
    en: 'auto: dark/light',
    ru: 'авто: темная/светлая',
    de: 'Auto: dunkel/hell',
    zh_CN: '自动: 暗黑/明亮',
  },
  'settings.color_scheme_ff': {
    en: 'firefox',
    ru: 'firefox',
    de: 'Firefox',
    zh_CN: 'firefox',
  },
  'settings.bg_noise': {
    en: 'Frosted background',
    ru: 'Матовый задний фон',
    de: 'Frostiger Hintergrund',
    zh_CN: '磨砂背景',
  },
  'settings.animations': {
    en: 'Animations',
    ru: 'Анимации',
    de: 'Animationen',
    zh_CN: '动画',
  },
  'settings.animation_speed': {
    en: 'Animations speed',
    ru: 'Скорость анимации',
    de: 'Animationsgeschwindigkeit',
    zh_CN: '动画速度',
  },
  'settings.animation_speed_fast': {
    en: 'fast',
    ru: 'быстрая',
    de: 'Schnell',
    zh_CN: '快',
  },
  'settings.animation_speed_norm': {
    en: 'normal',
    ru: 'средняя',
    de: 'Normal',
    zh_CN: '正常',
  },
  'settings.animation_speed_slow': {
    en: 'slow',
    ru: 'медленная',
    de: 'Langsam',
    zh_CN: '慢',
  },
  'settings.edit_styles': {
    en: 'Edit styles',
    ru: 'Редактировать стили',
    de: 'Stile anpassen',
    zh_CN: '编辑样式',
  },
  'settings.edit_theme': {
    en: 'Edit theme',
    ru: 'Редактировать тему',
    de: 'Theme anpassen',
    zh_CN: '编辑主题',
  },
  'settings.appearance_notes_title': {
    en: 'Notes:',
    ru: 'Примечания:',
    de: 'Hinweis:',
    zh_CN: '说明:',
  },
  'settings.appearance_notes': {
    en: '- To apply theme color to Sidebery buttons in browser interface set "svg.context-properties.content.enabled" to "true" in about:config page.',
    ru: '- Чтобы применить цвет темы к кнопкам Sidebery в интерфейсе браузера, установите «svg.context-properties.content.enabled» в «true» на странице about:config.',
    de: '- Um Theme-Farbe auf Sidebery-Schaltflächen in Browseroberfläche anzuwenden, setze "svg.context-properties.content.enabled" auf "true" auf about:config Seite.',
    zh_CN:
      '- 为了将主题颜色应用于浏览器界面的Sidebery按钮，需要在about:config页面中设置 "svg.context-properties.content.enabled "的值为 "true".',
  },

  // - Snapshots
  'settings.snapshots_title': {
    en: 'Snapshots',
    ru: 'Снепшоты',
    de: 'Schnappschüsse',
    zh_CN: '快照',
  },
  'settings.snap_notify': {
    en: 'Show notification after snapshot creation',
    ru: 'Показать уведомление после создания снепшота',
    de: 'Zeige Benachrichtigung nach Erstellen von Schnappschuss',
    zh_CN: '创建快照后显示通知',
  },
  'settings.snap_exclude_private': {
    en: 'Exclude private windows',
    ru: 'Исключать приватные окна',
    de: 'Private Fenster ausschließen',
    zh_CN: '排除隐私窗口',
  },
  'settings.snap_interval': {
    en: 'Auto-snapshots interval',
    ru: 'Интервал авто-снепшотов',
    de: 'Auto-Schnappschuss Intervall',
    zh_CN: '自动快照间隔',
  },
  'settings.snap_interval_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
    de: n => (n === 1 ? 'Minute' : 'Minuten'),
    zh_CN: '分',
  },
  'settings.snap_interval_hr': {
    en: n => (n === 1 ? 'hour' : 'hours'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'час'
      if (NUM_234_RE.test(n.toString())) return 'часа'
      return 'часов'
    },
    de: n => (n === 1 ? 'Stunde' : 'Stunden'),
    zh_CN: '小时',
  },
  'settings.snap_interval_day': {
    en: n => (n === 1 ? 'day' : 'days'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'день'
      if (NUM_234_RE.test(n.toString())) return 'дня'
      return 'дней'
    },
    de: n => (n === 1 ? 'Tag' : 'Tage'),
    zh_CN: '日',
  },
  'settings.snap_interval_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Keines',
    zh_CN: '无',
  },
  'settings.snap_limit': {
    en: 'Snapshots limit',
    ru: 'Лимиты',
    de: 'Schnappschuss Limit',
    zh_CN: '快照上限',
  },
  'settings.snap_limit_snap': {
    en: n => (n === 1 ? 'snapshot' : 'snapshots'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'снепшот'
      if (NUM_234_RE.test(n.toString())) return 'снепшота'
      return 'снепшотов'
    },
    de: n => (n === 1 ? 'Schnappschuss' : 'Schnappschüsse'),
    zh_CN: '快照',
  },
  'settings.snap_limit_kb': {
    en: n => (n === 1 ? 'kbyte' : 'kbytes'),
    ru: (n = 0): string => {
      if (NUM_234_RE.test(n.toString())) return 'кбайта'
      return 'кбайт'
    },
    de: n => (n === 1 ? 'kbyte' : 'kbytes'),
    zh_CN: '千字节',
  },
  'settings.snap_limit_day': {
    en: n => (n === 1 ? 'day' : 'days'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'день'
      if (NUM_234_RE.test(n.toString())) return 'дня'
      return 'дней'
    },
    de: n => (n === 1 ? 'Tag' : 'Tage'),
    zh_CN: '日',
  },
  'settings.snapshots_view_label': {
    en: 'View snapshots',
    ru: 'Просмотреть снепшоты',
    de: 'Schnappschüsse ansehen',
    zh_CN: '查看快照',
  },
  'settings.make_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
    de: 'Erstelle Schnappschuss',
    zh_CN: '创建快照',
  },
  'settings.rm_all_snapshots': {
    en: 'Remove all snapshots',
    ru: 'Удалить все снепшоты',
    de: 'Entferne alle Schnappschüsse',
    zh_CN: '删除所有快照',
  },
  'settings.apply_snapshot': {
    en: 'apply',
    ru: 'применить',
    de: 'Anwenden',
    zh_CN: '应用',
  },
  'settings.rm_snapshot': {
    en: 'remove',
    ru: 'удалить',
    de: 'Entfernen',
    zh_CN: '删除',
  },

  // - Mouse
  'settings.mouse_title': {
    en: 'Mouse',
    ru: 'Мышь',
    de: 'Maus',
    zh_CN: '鼠标',
  },
  'settings.h_scroll_action': {
    en: 'Use horizontal scroll to',
    ru: 'Использовать горизонтальную прокрутку для',
    de: 'Nutze horizontales Scrollen für',
  },
  'settings.h_scroll_action_switch_panels': {
    en: 'switch panels',
    ru: 'переключения панелей',
    de: 'Panel wechseln',
  },
  'settings.h_scroll_action_switch_act_tabs': {
    en: 'switch recently active tabs',
    de: 'Zuletzt aktive Tabs wechseln',
    ru: 'переключения вкладок в порядке активации',
  },
  'settings.h_scroll_action_none': {
    en: 'nothing',
    de: 'Nichts',
    ru: 'ничего',
  },
  'settings.scroll_through_tabs': {
    en: 'Switch tabs with scroll wheel',
    ru: 'Переключать вкладки с помощью колеса прокрутки',
    zh_CN: '使用滚轮切换标签页',
    de: 'Wechsle Tabs mit dem Scrollrad',
  },
  'settings.scroll_through_tabs_panel': {
    en: 'panel',
    ru: 'на панели',
    de: 'Im Panel',
    zh_CN: '面板',
  },
  'settings.scroll_through_tabs_global': {
    en: 'global',
    ru: 'глобально',
    de: 'Global',
    zh_CN: '全局',
  },
  'settings.scroll_through_tabs_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Nie',
    zh_CN: '无',
  },
  'settings.scroll_through_visible_tabs': {
    en: 'Skip folded tabs',
    ru: 'Пропускать свернутые',
    de: 'Überspringe eingeklappte Tabs',
    zh_CN: '跳过已折叠的标签',
  },
  'settings.scroll_through_tabs_skip_discarded': {
    en: 'Skip discarded tabs',
    ru: 'Пропускать выгруженые',
    de: 'Überspringe entladene Tabs',
    zh_CN: '跳过已丢弃的标签',
  },
  'settings.scroll_through_tabs_except_overflow': {
    en: 'Except if panel is overflowing',
    de: 'Außer, wenn Panel überläuft',
    ru: 'За исключением случаев, когда панель переполнена',
    zh_CN: '溢出面板除外',
  },
  'settings.scroll_through_tabs_cyclic': {
    en: 'Cyclically',
    ru: 'Зациклить',
    de: 'Zyklisch',
    zh_CN: '循环',
  },
  'settings.scroll_through_tabs_scroll_area': {
    en: 'Scroll area width (px)',
    ru: 'Ширина зоны для скролла (px)',
    de: 'Größe des Scrollbereichs (px)',
  },
  'settings.scroll_through_tabs_scroll_area_note': {
    en: 'Positive - at the right, negative - at the left side of the panel',
    ru: 'Положительное значение - справа, отрицательное - слева на панели',
    de: 'Positiv - rechte Seite, Negativ - linke Seite des Panels',
  },
  'settings.auto_menu_multi_sel': {
    en: 'Automatically open context menu on right-button multi-selection',
    ru: 'Автоматически открывать контекстное меню при множественном выборе правой кнопкой',
    de: 'Bei Rechtsklick Mehrfachauswahl automatisch Kontextmenü öffnen',
  },
  'settings.auto_menu_multi_sel_note': {
    en: 'Only for non-native context menu',
    ru: 'Только для несистемного контекстного меню',
    de: 'Nur bei nicht-nativem Kontextmenü',
  },
  'settings.long_click_delay': {
    en: 'Long click delay (ms)',
    ru: 'Задержка длительного нажатия (мс)',
    zh_CN: '长按延迟（毫秒）',
    de: 'Dauer für langen Klick (ms)',
  },
  'settings.wheel_threshold': {
    en: 'Set threshold for switching between panels and tabs with mouse wheel',
    ru: 'Установить порог для переключения между панелями и вкладками с помощью колесика мыши',
    de: 'Grenzwert für Mausrad-Wechsel zwischen Panels und Tabs',
  },
  'settings.wheel_threshold_y': {
    en: 'Vertical scrolling (px)',
    ru: 'Вертикальная прокрутка (px)',
    de: 'Vertikales Scrollen (px)',
  },
  'settings.wheel_threshold_x': {
    en: 'Horizontal scrolling (px)',
    ru: 'Горизонтальная прокрутка (px)',
    de: 'Horizontales Scrollen (px)',
  },

  'settings.nav_actions_sub_title': {
    en: 'Navigation bar actions',
    ru: 'Действия над навигацией',
    zh_CN: '导航栏操作',
    de: 'Aktionen mit Navigationsleiste',
  },

  'settings.tab_actions_sub_title': {
    en: 'Tab actions',
    ru: 'Действия над вкладками',
    de: 'Aktionen mit Tabs',
    zh_CN: '标签页操作',
  },
  'settings.tab_double_click': {
    en: 'Double click on tab',
    ru: 'Двойной клик по вкладке',
    de: 'Doppelklick auf Tab',
    zh_CN: '双击标签页',
  },
  'settings.activate_on_mouseup': {
    en: 'Activate tab on mouse button release',
    ru: 'Активировать вкладку при отпускании кнопки мыши',
    de: 'Aktiviere Tab beim Loslassen der Maustaste',
    zh_CN: '释放鼠标按钮时激活标签页',
  },
  'settings.shift_selection_from_active': {
    en: 'Start shift+click selection from the active tab',
    ru: 'Начинать выделение по shift+клику с активной вкладки',
    zh_CN: '活动标签页中启用 shift + 点击 进行选择',
    de: 'Starte Umschalt+Klick Auswahl beim aktiven Tab',
  },
  'settings.tab_long_left_click': {
    en: 'Long left click on tab',
    ru: 'Длительное нажатие левой кнопки мыши по вкладке',
    zh_CN: '长按左击标签页',
    de: 'Langer Linksklick auf Tab',
  },
  'settings.tab_long_right_click': {
    en: 'Long right click on tab',
    ru: 'Длительное нажатие правой кнопки мыши по вкладке',
    zh_CN: '长按右击标签页',
    de: 'Langer Rechtsklick auf Tab',
  },
  'settings.tab_close_middle_click': {
    en: 'Middle click on close tab button',
    ru: 'Нажатие средней кнопкой мыши по кнопке закрытия вкладки',
    zh_CN: '中键单击关闭标签页按钮',
    de: 'Klicken mit mittlerer Maustaste auf "Schließen"-Knopf',
  },
  'settings.tab_action_reload': {
    en: 'reload',
    ru: 'перезагрузить',
    de: 'Neu laden',
    zh_CN: '重新加载',
  },
  'settings.tab_action_duplicate': {
    en: 'duplicate',
    ru: 'дублировать',
    de: 'Duplizieren',
    zh_CN: '克隆',
  },
  'settings.tab_action_pin': {
    en: 'pin',
    ru: 'закрепить',
    de: 'Anheften',
    zh_CN: '固定',
  },
  'settings.tab_action_mute': {
    en: 'mute',
    ru: 'выключить звук',
    zh_CN: '静音',
    de: 'Stumm schalten',
  },
  'settings.tab_action_clear_cookies': {
    en: 'clear cookies',
    ru: 'удалить cookies',
    zh_CN: '清除Cookies',
    de: 'Cookies löschen',
  },
  'settings.tab_action_exp': {
    en: 'expand',
    ru: 'развернуть',
    zh_CN: '展开',
    de: 'Ausklappen',
  },
  'settings.tab_action_new_after': {
    en: 'new sibling tab',
    ru: 'новая вкладка',
    zh_CN: '新建兄弟标签页',
    de: 'Neuer Tab auf gleicher Ebene',
  },
  'settings.tab_action_new_child': {
    en: 'new child tab',
    ru: 'новая дочерняя вкладка',
    de: 'Neuer untergeordneter Tab',
    zh_CN: '新建子标签页',
  },
  'settings.tab_action_close': {
    en: 'close tab',
    ru: 'закрыть вкладку',
    de: 'Tab schließen',
    zh_CN: '关闭标签页',
  },
  'settings.tab_action_discard': {
    en: 'unload',
    ru: 'выгрузить',
    de: 'Entladen',
    zh_CN: '卸载',
  },
  'settings.tab_action_none': {
    en: 'none',
    ru: 'выкл',
    zh_CN: '无',
    de: 'Nichts',
  },

  'settings.tabs_panel_actions_sub_title': {
    en: 'Tabs panel actions',
    ru: 'Действия над панелью c вкладками',
    zh_CN: '标签页面板操作',
    de: 'Aktionen mit Tab-Panels',
  },
  'settings.tabs_panel_left_click_action': {
    en: 'Left click on tabs panel',
    ru: 'Левый клик по панели с вкладками',
    zh_CN: '左击标签页面板',
    de: 'Linksklick auf Tab-Panel',
  },
  'settings.tabs_panel_double_click_action': {
    en: 'Double click on tabs panel',
    ru: 'Двойной клик по панели с вкладками',
    zh_CN: '双击标签页面板',
    de: 'Doppelklick auf Tab-Panel',
  },
  'settings.tabs_panel_right_click_action': {
    en: 'Right click on tabs panel',
    ru: 'Правый клик по панели с вкладками',
    de: 'Rechtsklick auf Tab-Panel',
    zh_CN: '右击标签页面板',
  },
  'settings.tabs_panel_middle_click_action': {
    en: 'Middle click on tabs panel',
    ru: 'Средний клик по панели с вкладками',
    zh_CN: '中键单击标签页面板',
    de: 'Mittlere Maustaste auf Tab-Panel',
  },
  'settings.tabs_panel_action_tab': {
    en: 'create tab',
    ru: 'создать вкладку',
    de: 'Tab erstellen',
    zh_CN: '创建标签页',
  },
  'settings.tabs_panel_action_prev': {
    en: 'previous panel',
    ru: 'пред. панель',
    de: 'Vorheriges Panel',
    zh_CN: '前一个面板',
  },
  'settings.tabs_panel_action_next': {
    en: 'next panel',
    ru: 'след. панель',
    de: 'Nächstes Panel',
    zh_CN: '后一个面板',
  },
  'settings.tabs_panel_action_expand': {
    en: 'expand/fold',
    ru: 'развернуть/свернуть',
    zh_CN: '展开/折叠',
    de: 'Ein-/Ausklappen',
  },
  'settings.tabs_panel_action_parent': {
    en: 'activate parent tab',
    ru: 'перейти к родительской вкладке',
    zh_CN: '激活父标签页',
    de: 'Obersten Tab aktivieren',
  },
  'settings.tabs_panel_action_menu': {
    en: 'show menu',
    ru: 'открыть меню',
    de: 'Menü anzeigen',
    zh_CN: '展示菜单',
  },
  'settings.tabs_panel_action_collapse': {
    en: 'collapse inactive branches',
    ru: 'свернуть неактивные ветки',
    de: 'Inaktive Zweige einklappen',
    zh_CN: '折叠非活动分支',
  },
  'settings.tabs_panel_action_undo': {
    en: 'undo tab close',
    ru: 'восстановить закрытую вкладку',
    zh_CN: '撤消关闭标签页',
    de: '"Tab schließen" rückgängig machen',
  },
  'settings.tabs_panel_action_rm_act_tab': {
    en: 'close active tab',
    ru: 'закрыть активную вкладку',
    de: 'Aktiven Tab schließen',
    zh_CN: '关闭活动标签',
  },
  'settings.tabs_panel_action_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Nichts',
    zh_CN: '无',
  },
  'settings.mouse.bookmarks_title': {
    en: 'Bookmarks actions',
    ru: 'Действия над закладками',
    de: 'Aktionen mit Lesezeichen',
  },
  'settings.mouse.bookmarks.left_click_action': {
    en: 'Left-click on the bookmark',
    ru: 'Левый клик по закладке',
    de: 'Linksklick auf Lesezeichen',
  },
  'settings.mouse.bookmarks.left_click_action_open_in_act': {
    en: 'open in active tab',
    de: 'Öffne im aktiven Tab',
    ru: 'открыть в активной вкладке',
  },
  'settings.mouse.bookmarks.left_click_action_open_in_new': {
    en: 'open in new tab',
    de: 'Öffne in neuem Tab',
    ru: 'открыть в новой вкладке',
  },
  'settings.mouse.bookmarks.new_tab_activate': {
    en: 'Activate the new tab',
    ru: 'Активировать новую вкладку',
    de: 'Neuen Tab aktivieren',
  },
  'settings.mouse.bookmarks.new_tab_pos': {
    en: 'Position of the new tab',
    ru: 'Положение новой вкладки',
    de: 'Position des neuen Tabs',
  },
  'settings.mouse.bookmarks.new_tab_pos_default': {
    en: 'default',
    ru: 'по умолчанию',
    de: 'Standard',
  },
  'settings.mouse.bookmarks.new_tab_pos_after': {
    en: 'after active tab',
    de: 'Nach aktivem Tab',
    ru: 'после активной вкладки',
  },
  'settings.mouse.bookmarks.mid_click_action': {
    en: 'Middle-click on the bookmark',
    ru: 'Средний клик по закладке',
    de: 'Mittelklick auf Lesezeichen',
  },
  'settings.mouse.bookmarks.mid_click_action_open_in_new': {
    en: 'open in new tab',
    de: 'Öffne in neuem Tab',
    ru: 'открыть в новой вкладке',
  },
  'settings.mouse.bookmarks.mid_click_action_edit': {
    en: 'edit',
    ru: 'редактировать',
    de: 'Ändern',
  },
  'settings.mouse.bookmarks.mid_click_action_delete': {
    en: 'delete',
    ru: 'удалить',
    de: 'Löschen',
  },

  // - Keybindings
  'settings.kb_title': {
    en: 'Keybindings',
    ru: 'Клавиши',
    zh_CN: '按键绑定',
    de: 'Tastenbelegung',
  },
  'settings.kb_input': {
    en: 'Press new shortcut',
    ru: 'Нажмете новое сочетание клавиш',
    zh_CN: '按下新的快捷键',
    de: 'Drücke neues Tastenkürzel',
  },
  'settings.kb_err_duplicate': {
    en: 'Already exists',
    ru: 'Уже существует',
    de: 'Existiert bereits',
    zh_CN: '已存在',
  },
  'settings.kb_err_invalid': {
    en: 'Invalid shortcut',
    ru: 'Недопустимое сочетание клавиш',
    zh_CN: '无效的快捷键',
    de: 'Ungültiges Tastenkürzel',
  },
  'settings.kb_general': {
    en: 'General',
    de: 'Allgemein',
    ru: 'Общие',
  },
  'settings.kb_switching_panel': {
    en: 'Switching between panels',
    ru: 'Переключение панелей',
    de: 'Zwischen Panels wechseln',
  },
  'settings.kb_switching_tab': {
    en: 'Switching between tabs',
    ru: 'Переключение вкладок',
    de: 'Zwischen Tabs wechseln',
  },
  'settings.kb_create_remove_tabs': {
    en: 'Creating / Removing tabs',
    ru: 'Создание / Закрытие вкладок',
    de: 'Erstelle / Entferne Tabs',
  },
  'settings.kb_selections': {
    en: 'Selected (or active) elements',
    ru: 'Выделенные (или активные) элементы',
    de: 'Ausgewählte (oder aktive) Elemente',
  },
  'settings.kb_branches': {
    en: 'Branches',
    ru: 'Ветви',
    de: 'Zweige',
  },
  'settings.kb_active_tabs_history': {
    en: 'Tabs activation history',
    ru: 'История активации вкладок',
    de: 'Tab-Aktivierungschronik',
  },
  'settings.kb_move_tabs': {
    en: 'Moving tabs',
    ru: 'Перемещение вкладок',
    de: 'Tabs verschieben',
  },
  'settings.reset_kb': {
    en: 'Reset Keybindings',
    ru: 'Сбросить клав. настройки',
    de: 'Tastenbelegung zurücksetzen',
    zh_CN: '重置快捷键',
  },
  'settings.toggle_kb': {
    en: 'Enable/Disable Keybindings',
    ru: 'Включить / отключить сочетания клавиш',
    zh_CN: '启用/禁用按键绑定',
    de: 'Tastenbelegung aktiviere/deaktiviere',
  },
  'settings.enable_kb': {
    en: 'Enable Keybindings',
    ru: 'Включить сочетания клавиш',
    zh_CN: '启用按键绑定',
    de: 'Aktiviere Tastenbelegung',
  },
  'settings.disable_kb': {
    en: 'Disable Keybindings',
    ru: 'Отключить сочетания клавиш',
    de: 'Deaktiviere Tastenbelegung',
    zh_CN: '禁用按键绑定',
  },

  // - Permissions
  'settings.permissions_title': {
    en: 'Permissions',
    ru: 'Разрешения',
    de: 'Berechtigungen',
    zh_CN: '权限',
  },
  'settings.all_urls_label': {
    en: 'Accessing web requests data:',
    ru: 'Данные веб-сайтов:',
    de: 'Zugriff auf Daten für Webanfragen:',
    zh_CN: '访问网络请求数据：',
  },
  'settings.all_urls_info': {
    en: 'Required for:\n- Cleaning cookies\n- Proxy and URL rules of containers\n- Screenshots for the group page and windows selection panel\n- Changing the User-Agent per container',
    ru: 'Необходимо для:\n- Удаления cookies\n- Прокси и url-правил контейнеров\n- Скриншотов на групповой странице и на панели выбора окна',
    de: 'Benötigt für:\n- Cookies löschen\n- Proxy und URL Regeln für Umgebungen\n- Screenshots für die Gruppenseite und Fensterauswahl-Panel\n- User-Agent per Umgebung ändern',
    zh_CN:
      '需要：\n- 清除Cookies\n- 容器的代理和 URL 规则\n- 分组页面和窗口选择面板的屏幕快照\n- 更改每个容器的用户代理',
  },
  'settings.perm.bookmarks_label': {
    en: 'Bookmarks:',
    ru: 'Управление закладками:',
    de: 'Lesezeichen:',
    zh_CN: '书签:',
  },
  'settings.perm.bookmarks_info': {
    en: 'Required for:\n- Bookmarks panels',
    ru: 'Required for:\n- Панели закладок',
    zh_CN: '需要:\n-书签面板',
    de: 'Benötigt für:\n- Lesezeichen-Panels',
  },
  'settings.tab_hide_label': {
    en: 'Hiding tabs:',
    ru: 'Скрытие вкладок:',
    de: 'Tabs verstecken:',
    zh_CN: '隐藏标签页：',
  },
  'settings.tab_hide_info': {
    en: 'Required for:\n- Hiding tabs in inactive panels\n- Hiding folded tabs',
    ru: 'Необходимо для:\n- Скрывания вкладок неактивных панелей\n- Скрывания свернутых вкладок',
    zh_CN: '需要：\n-隐藏非活动面板中的标签页\n-隐藏折叠的标签页',
    de: 'Benötigt für:\n- Verstecken von Tabs in inaktiven Panels\n- Eingeklappte Tabs verstecken',
  },
  'settings.clipboard_write_label': {
    en: 'Writing to clipboard:',
    ru: 'Запись в буфер обмена:',
    de: 'In Zwischenablage schreiben:',
    zh_CN: '写入剪贴板：',
  },
  'settings.clipboard_write_info': {
    en: 'Required for:\n- Copying URLs of tabs/bookmarks through context menu',
    ru: 'Необходимо для:\n- Копирования ссылок вкладок/закладок',
    de: 'Benötigt für:\n- URLs von Tabs/Lesezeichen über Kontextmenü kopieren',
    zh_CN: '需要：\n-通过上下文菜单复制标签页/书签的 URL',
  },
  'settings.history_label': {
    en: 'History:',
    ru: 'История:',
    de: 'Chronik:',
    zh_CN: '历史:',
  },
  'settings.history_info': {
    en: 'Required for:\n- History panel',
    ru: 'Необходимо для:\n- Панель истории',
    de: 'Benötigt für:\n- Chronik-Panel',
    zh_CN: '需要:\n-历史面板',
  },

  // - Storage
  'settings.storage_title': {
    en: 'Storage',
    ru: 'Данные',
    de: 'Speicher',
    zh_CN: '存储',
  },
  'settings.storage_delete_prop': {
    en: 'delete',
    ru: 'удалить',
    de: 'Löschen',
    zh_CN: '删除',
  },
  'settings.storage_edit_prop': {
    en: 'edit',
    ru: 'редактировать',
    zh_CN: '编辑',
    de: 'Ändern',
  },
  'settings.storage_open_prop': {
    en: 'open',
    ru: 'открыть',
    de: 'Öffnen',
    zh_CN: '打开',
  },
  'settings.storage_delete_confirm': {
    en: 'Delete property ',
    ru: 'Удалить поле ',
    de: 'Feld löschen ',
    zh_CN: '删除属性 ',
  },
  'settings.update_storage_info': {
    en: 'Update',
    ru: 'Обновить',
    de: 'Aktualisieren',
    zh_CN: '更新',
  },
  'settings.clear_storage_info': {
    en: 'Delete everything',
    ru: 'Удалить все',
    de: 'Alles löschen',
    zh_CN: '删除所有内容',
  },
  'settings.clear_storage_confirm': {
    en: 'Are you sure you want to delete all Sidebery data?',
    ru: 'Вы действительно хотите удалить все данные?',
    de: 'Wirklich alle Sidebery-Daten löschen?',
    zh_CN: '确定要删除 Sidebery 所有的数据吗？',
  },
  'settings.favs_title': {
    en: 'Cached favicons',
    ru: 'Кэшированные иконки сайтов',
    de: 'Zwischengespeicherte Favicons',
    zh_CN: '已缓存的图标',
  },

  // - Sync
  'settings.sync_title': {
    en: 'Sync',
    ru: 'Синхронизация',
    de: 'Sync',
    zh_CN: '同步',
  },
  'settings.sync_name': {
    en: 'Profile name for sync',
    ru: 'Имя профиля для синхронизации',
    de: 'Profilname für Sync',
    zh_CN: '用于同步的配置文件名称',
  },
  'settings.sync_name_or': {
    en: 'e.g: Firefox Beta Home',
    ru: 'напр. Firefox Домашний',
    de: 'z.B. Firefox Beta Home',
    zh_CN: '例如 Firefox Beta Home',
  },
  'settings.sync_save_settings': {
    en: 'Save settings to sync storage',
    ru: 'Сохранять настройки в синхронизируемое хранилище',
    de: 'Einstellungen im Sync-Speicher sichern',
    zh_CN: '保存设置至同步存储',
  },
  'settings.sync_save_ctx_menu': {
    en: 'Save context menu to sync storage',
    de: 'Kontextmenü im Sync-Speicher sichern',
    ru: 'Сохранять контекстное меню в синхронизируемое хранилище',
    zh_CN: '保存上下文菜单至同步存储',
  },
  'settings.sync_save_styles': {
    en: 'Save styles to sync storage',
    de: 'Stile im Sync-Speicher sichern',
    ru: 'Сохранять стили в синхронизируемое хранилище',
    zh_CN: '保存样式至同步存储',
  },
  'settings.sync_save_kb': {
    en: 'Save keybindings to sync storage',
    ru: 'Сохранять сочетания клавиш в синхронизируемое хранилище',
    zh_CN: '保存按键绑定至同步存储',
    de: 'Tastenbelegung im Sync-Speicher sichern',
  },
  'settings.sync_auto_apply': {
    en: 'Automatically apply changes',
    ru: 'Автоматически применять изменения',
    de: 'Änderungen automatisch anwenden',
    zh_CN: '自动应用更改',
  },
  'settings.sync_settings_title': {
    en: 'Settings',
    ru: 'Настройки',
    de: 'Einstellungen',
    zh_CN: '设置',
  },
  'settings.sync_ctx_menu_title': {
    en: 'Context menu',
    ru: 'Контекстное меню',
    de: 'Kontextmenü',
    zh_CN: '上下文菜单',
  },
  'settings.sync_styles_title': {
    en: 'Styles',
    ru: 'Стили',
    de: 'Stile',
    zh_CN: '样式',
  },
  'settings.sync_kb_title': {
    en: 'Keybindings',
    ru: 'Сочетания клавиш',
    de: 'Tastenbelegung',
    zh_CN: '按键绑定',
  },
  'settings.sync_apply_btn': {
    en: 'Apply',
    ru: 'Применить',
    de: 'Anwenden',
    zh_CN: '应用',
  },
  'settings.sync_delete_btn': {
    en: 'Delete',
    ru: 'Удалить',
    de: 'Löschen',
    zh_CN: '删除',
  },
  'settings.sync_update_btn': {
    en: 'Update synced data',
    ru: 'Обновить данные',
    de: 'Synchronisierte Daten aktualisieren',
    zh_CN: '更新同步数据',
  },
  'settings.sync_apply_confirm': {
    en: 'Are you sure you want to apply synced data?',
    ru: 'Вы действительно хотите применить синхронизированные данные?',
    de: 'Möchten Sie die synchronisierten Daten wirklich anwenden?',
    zh_CN: '您确定要应用同步数据吗？',
  },
  'settings.sync.apply_err': {
    en: 'Cannot apply synchronized data',
    ru: 'Невозможно применить синхронизированные данные',
    de: 'Kann synchronisierte Daten nicht anwenden',
    zh_CN: '无法应用同步数据',
  },
  'settings.sync_notes_title': {
    en: 'Notes:',
    ru: 'Примечания:',
    de: 'Hinweis:',
    zh_CN: '说明:',
  },
  'settings.sync_notes': {
    en: `Sidebery uses Firefox syncronization so:
- You need to login to Firefox account to get it working
- To be sure that data is uploaded to Firefox sync server you need to press the "Sync now" button in the Firefox settings or in your profile in the main menu (the three-line button)`,
    ru: `Sidebery использует синхронизацию Firefox, поэтому:
- Чтобы синхронизация работала, вам нужно зайти в Firefox аккаунт
- Чтобы быть уверенным в том, что данные загрузились на сервер синхронизации Firefox, необходимо нажать на кнопку "Синхронизировать" в настройках или в вашем профиле в главном меню`,
    de: `Sidebery nutzt die Synchronisation von Firefox, deshalb:
- müssen Sie sich in Ihrem Firefox Konto einloggen, damit es funktioniert
- um sicher zu gehen, dass die Daten auf die Firefox Sync Server hochgeladen werden, müssen Sie in den Firefox Einstellungen oder in Ihrem Profil im Hauptmenü (Drei-Striche-Menü) auf "Jetzt synchronisieren" drücken `,
  },

  // - Help
  'settings.help_title': {
    en: 'Help',
    ru: 'Помощь',
    de: 'Hilfe',
    zh_CN: '帮助',
  },
  'settings.debug_info': {
    en: 'Show debug info',
    ru: 'Отладочная информация',
    de: 'Debug Informationen anzeigen',
    zh_CN: '显示调试信息',
  },
  'settings.log_lvl': {
    en: 'Log level',
    ru: 'Уровень логов',
    de: 'Log-Level',
    zh_CN: '日志级别',
  },
  'settings.log_lvl_0': {
    en: 'none',
    ru: 'выкл',
    de: 'Nichts',
    zh_CN: '无',
  },
  'settings.log_lvl_1': {
    en: 'errors',
    ru: 'ошибки',
    de: 'Fehler',
    zh_CN: '错误',
  },
  'settings.log_lvl_2': {
    en: 'warnings',
    ru: 'предупреждения',
    de: 'Warnungen',
    zh_CN: '警告',
  },
  'settings.log_lvl_3': {
    en: 'all',
    ru: 'все',
    de: 'Alles',
    zh_CN: '所有',
  },
  'settings.copy_devtools_url': {
    en: 'Copy devtools URL',
    ru: 'Скопировать URL страницы разработчика',
    de: 'Kopiere Devtools URL',
    zh_CN: '复制开发工具 URL',
  },
  'settings.repo_issue': {
    en: 'Open issue',
    ru: 'Создать github issue',
    de: 'Öffne Github Issue',
    zh_CN: '打开issue',
  },
  'settings.repo_bug': {
    en: 'Report a bug',
    ru: 'Сообщить об ошибке',
    de: 'Einen Bug melden',
    zh_CN: '报告错误',
  },
  'settings.repo_feature': {
    en: 'Suggest a feature',
    ru: 'Предложить новую функцию',
    de: 'Ein Feature vorschlagen',
    zh_CN: '功能建议',
  },
  'settings.reset_settings': {
    en: 'Reset settings',
    ru: 'Сбросить настройки',
    de: 'Einstellungen zurücksetzen',
    zh_CN: '重置设置',
  },
  'settings.reset_confirm': {
    en: 'Are you sure you want to reset settings?',
    ru: 'Вы уверены, что хотите сбросить настройки?',
    de: 'Sind Sie sicher, dass Sie Ihre Einstellungen zurücksetzen möchten?',
    zh_CN: '您确定要重置设置吗？',
  },
  'settings.ref_rm': {
    en: 'Will be removed; open an issue if you need this feature.',
    ru: 'Will be removed, open an issue if you need this feature.',
    de: 'Wird entfernt; öffnen Sie ein Github Issue, falls Sie dieses Feature benötigen.',
    zh_CN: '将被删除；如果您需要此功能，请提交issue。',
  },
  'settings.help_exp_data': {
    en: 'Export addon data',
    ru: 'Экспорт данных расширения',
    de: 'Add-on-Daten exportieren',
    zh_CN: '导出',
  },
  'settings.help_imp_data': {
    en: 'Import addon data',
    ru: 'Импорт данных расширения',
    de: 'Add-on-Daten importieren',
    zh_CN: '导入',
  },
  'settings.help_imp_perm': {
    en: 'Additional permissions are required',
    ru: 'Необходимы дополнительные разрешения',
    de: 'Zusätzliche Berechtigungen werden benötigt',
    zh_CN: '需要额外的权限',
  },
  'settings.export_title': {
    en: 'Select what to export',
    ru: 'Выберете данные для экспорта',
    de: 'Daten zum Export auswählen',
    zh_CN: '选择要导出的内容',
  },
  'settings.import_title': {
    en: 'Select what to import',
    ru: 'Выберете данные для импорта',
    de: 'Daten zum Import auswählen',
    zh_CN: '选择要导入的内容',
  },
  'settings.backup_all': {
    en: 'All',
    ru: 'Все',
    de: 'Alles',
    zh_CN: '全部',
  },
  'settings.backup_containers': {
    en: 'Containers config',
    ru: 'Конфигурация контейнеры',
    de: 'Einstellungen für Umgebungen',
    zh_CN: '容器配置',
  },
  'settings.backup_settings': {
    en: 'Settings',
    ru: 'Настройки',
    de: 'Einstellungen',
    zh_CN: '设置',
  },
  'settings.backup_styles': {
    en: 'Styles',
    ru: 'Стили',
    de: 'Stile',
    zh_CN: '样式',
  },
  'settings.backup_snapshots': {
    en: 'Snapshots',
    ru: 'Снепшоты',
    de: 'Screenshots',
    zh_CN: '快照',
  },
  'settings.backup_favicons': {
    en: 'Sites icons cache',
    ru: 'Кэш иконок сайтов',
    de: 'Favicon-Cache',
    zh_CN: '站点图标缓存',
  },
  'settings.backup_kb': {
    en: 'Keybindings',
    ru: 'Сочетания клавиш',
    de: 'Tastenbelegung',
    zh_CN: '按键绑定',
  },
  'settings.backup_parse_err': {
    en: 'Wrong format of imported data',
    ru: 'Неправильный формат импортированных данных',
    de: 'Falsches Format der importierten Daten',
    zh_CN: '导入数据格式错误',
  },
  'settings.reload_addon': {
    en: 'Reload add-on',
    ru: 'Перезагрузить расширение',
    de: 'Add-on neu laden',
    zh_CN: '重新加载插件',
  },

  // ---
  // -- Snapshots viewer
  // -
  'snapshot.window_title': {
    en: 'Window',
    ru: 'Окно',
    de: 'Fenster',
    zh_CN: '窗口',
  },
  'snapshot.btn_open': {
    en: 'Open',
    ru: 'Открыть',
    de: 'Öffnen',
    zh_CN: '打开',
  },
  'snapshot.btn_apply': {
    en: 'Apply',
    ru: 'Применить',
    de: 'Anwenden',
    zh_CN: '应用',
  },
  'snapshot.btn_remove': {
    en: 'Remove',
    ru: 'Удалить',
    de: 'Entfernen',
    zh_CN: '删除',
  },
  'snapshot.btn_create_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
    de: 'Schnappschuss erstellen',
    zh_CN: '创建快照',
  },
  'snapshot.btn_open_all_win': {
    en: 'Open all windows',
    ru: 'Открыть все окна',
    de: 'Alle Fenster öffnen',
    zh_CN: '打开所有窗口',
  },
  'snapshot.btn_open_win': {
    en: 'Open window',
    ru: 'Открыть окно',
    de: 'Fenster öffnen',
    zh_CN: '打开窗口',
  },
  'snapshot.btn_create_first': {
    en: 'Create first snapshot',
    ru: 'Создать первый снепшот',
    de: 'Ersten Schnappschuss erstellen',
    zh_CN: '创建第一张快照',
  },
  'snapshot.snap_win': {
    en: n => (n === 1 ? 'window' : 'windows'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'окно'
      if (NUM_234_RE.test(n.toString())) return 'окна'
      return 'окон'
    },
    de: 'Fenster',
    zh_CN: '窗口',
  },
  'snapshot.snap_ctr': {
    en: n => (n === 1 ? 'container' : 'containers'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'контейнер'
      if (NUM_234_RE.test(n.toString())) return 'контейнера'
      return 'контейнеров'
    },
    de: n => (n === 1 ? 'Umgebung' : 'Umgebungen'),
    zh_CN: '窗口',
  },
  'snapshot.snap_tab': {
    en: n => (n === 1 ? 'tab' : 'tabs'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'вкладка'
      if (NUM_234_RE.test(n.toString())) return 'вкладки'
      return 'вкладок'
    },
    de: n => (n === 1 ? 'Tab' : 'Tabs'),
    zh_CN: '标签页',
  },
  'snapshot.selected': {
    en: 'Selected:',
    ru: 'Выбрано:',
    de: 'Ausgewählt:',
    zh_CN: '已选中:',
  },
  'snapshot.sel.open_in_panel': {
    en: 'Open in current panel',
    ru: 'Открыть в текущей панели',
    de: 'Im aktuellen Panel öffnen',
    zh_CN: '在当前面板中打开',
  },
  'snapshot.sel.reset_sel': {
    en: 'Reset selection',
    ru: 'Сбросить',
    de: 'Auswahl zurücksetzen',
    zh_CN: '重置选择',
  },

  // ---
  // -- Styles editor
  // -
  'styles.reset_styles': {
    en: 'Reset CSS variables',
    ru: 'Сбросить CSS переменные',
    de: 'CSS Variablen zurücksetzen',
    zh_CN: '重置 CSS 变量',
  },
  'styles.css_sidebar': {
    en: 'Sidebar',
    ru: 'Боковая панель',
    de: 'Seitenleiste',
    zh_CN: '侧边栏',
  },
  'styles.css_group': {
    en: 'Group page',
    ru: 'Групповая страница',
    de: 'Gruppenseite',
    zh_CN: '分组页面',
  },
  'styles.css_placeholder': {
    en: 'Write custom CSS here...',
    ru: 'Write custom CSS here...',
    de: 'Eigenes CSS hier schreiben...',
    zh_CN: '在此处编写自定义 CSS...',
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
    de: `HINWEIS: für derzeit verfügbare CSS-Selectors den Debugger verwenden:
  - Klicke auf "Kopiere Devtools URL" in der Leiste unten
  - Öffne neuen Tab mit dieser URL 
  - Wähle Frame zum inspizieren aus
	- Klicke auf rechteckiges Symbol (mit drei Teilstücken) oben rechts auf der Debugger Seite
	- Wähle "/sidebar/index.html" für Seitenleisten Frame
	- Wähle "/page.group/group.html" für Gruppenseiten Frame
  - "Inspector" Tab durchsehen`,
  },
  'styles.vars_group.other': {
    en: 'Other',
    ru: 'Прочие',
    de: 'Andere',
    zh_CN: '其他',
  },
  'styles.vars_group.animation': {
    en: 'Animation speed',
    ru: 'Скорость анимации',
    de: 'Animationsgeschwindigkeit',
    zh_CN: '动画速度',
  },
  'styles.vars_group.buttons': {
    en: 'Buttons',
    ru: 'Кнопки',
    de: 'Schaltflächen',
    zh_CN: '按钮',
  },
  'styles.vars_group.scroll': {
    en: 'Scroll',
    ru: 'Скрол',
    de: 'Scrollen',
    zh_CN: '滚动',
  },
  'styles.vars_group.menu': {
    en: 'Context menu',
    ru: 'Контекстное меню',
    de: 'Kontextmenü',
    zh_CN: '上下文菜单',
  },
  'styles.vars_group.nav': {
    en: 'Navigation bar',
    ru: 'Панель навигации',
    de: 'Navigationsleiste',
    zh_CN: '导航栏',
  },
  'styles.vars_group.pinned_dock': {
    en: 'Pinned tabs dock',
    ru: 'Область закрепленных вкладок',
    de: 'Bereich für angeheftete Tabs',
    zh_CN: '固定标签页停靠',
  },
  'styles.vars_group.tabs': {
    en: 'Tabs',
    ru: 'Вкладки',
    de: 'Tabs',
    zh_CN: '标签页',
  },
  'styles.vars_group.bookmarks': {
    en: 'Bookmarks',
    ru: 'Закладки',
    de: 'Lesezeichen',
    zh_CN: '书签',
  },
}

if (!window.translations) window.translations = setupPageTranslations
else Object.assign(window.translations, setupPageTranslations)
