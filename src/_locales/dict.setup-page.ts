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
    zh_TW: '名稱...',
  },
  'container.icon_label': {
    en: 'Icon',
    ru: 'Иконка',
    de: 'Symbol',
    zh_CN: '图标',
    zh_TW: '圖標',
  },
  'container.color_label': {
    en: 'Color',
    ru: 'Цвет',
    de: 'Farbe',
    zh_CN: '颜色',
    zh_TW: '顏色',
  },
  'container.reopen_rules_label': {
    en: 'Include / Exclude tab by URL',
    ru: 'Включить / исключить вкладку по URL',
    zh_CN: '按 URL 包含/排除标签页',
    zh_TW: '按 URL 包含/排除選項卡',
  },
  'container.manage_reopen_rules_label': {
    en: 'Manage rules',
    ru: 'Управление правилами',
    zh_CN: '管理规则',
    zh_TW: '管理規則',
  },
  'container.proxy_label': {
    en: 'Proxy',
    ru: 'Прокси',
    de: 'Proxy',
    zh: '代理'
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
    zh_TW: '代理DNS',
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
    zh_TW: '無',
  },
  'container.rules_include': {
    en: 'Include URLs',
    ru: 'Включать вкладки',
    de: 'URLs einschließen',
    zh_CN: 'URL 列表',
    zh_TW: '包含網址',
  },
  'container.rules_include_tooltip': {
    en: 'Reopen tabs with matched URLs in this container.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    ru: 'Переоткрывать вкладки с совпадающими url в этом контейнере.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    de: 'Tabs mit passender URL in dieser Umgebung neu öffnen.\nNewline Getrennte Liste von "Substrings" oder "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    zh_CN:
      '在此容器中重新打开匹配此URL列表的标签页。\n以换行符分割的 字符串 或 /正则/ 列表:\n    example.com\n    /^(some)?regex$/\n    ...',
    zh_TW:
      '重新打開此容器中具有匹配 URL 的選項卡。\n換行符分隔的“字符串”或“/regex/”列表：\n example.com\n /^(some)?regex$/\n ...',
  },
  'container.rules_exclude': {
    en: 'Exclude URLs',
    ru: 'Исключать вкладки',
    de: 'URLs ausschließen',
    zh_CN: 'URL 排除列表',
    zh_TW: '排除網址',
  },
  'container.rules_exclude_tooltip': {
    en: 'Reopen tabs with matched URL in default container.\nNewline separated list of "substrings" or "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    ru: 'Переоткрывать вкладки с совпадающими url из этого контейнера в стандартном.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    de: 'Tabs mit passender URL in Standardumgebung neu öffnen.\nNewline Getrennte Liste von "Substrings" oder "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
    zh_CN:
      '在默认容器中重新打开匹配此URL列表的标签页。\n以换行符分割的 字符串 或 /正则/ 列表:\n    example.com\n    /^(some)?regex$/\n    ...',
    zh_TW:
      '在默認容器中重新打開具有匹配 URL 的選項卡。\n“字符串”或“/regex/”的換行符分隔列表：\n example.com\n /^(some)?regex$/\n ...',
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
    zh_TW: '名稱...',
  },
  'panel.icon_label': {
    en: 'Icon',
    ru: 'Иконка',
    de: 'Symbol',
    zh_CN: '图标',
    zh_TW: '圖標',
  },
  'panel.color_label': {
    en: 'Color',
    ru: 'Цвет',
    de: 'Farbe',
    zh: '颜色'
  },
  'panel.lock_panel_label': {
    en: 'Prevent auto-switching from this panel',
    ru: 'Запретить автоматическое переключение с этой панели',
    de: 'Automatisches Wechseln aus diesem Panel verhindern',
    zh_CN: '防止从此面板自动切换',
    zh_TW: '防止從此面板自動切換',
  },
  'panel.temp_mode_label': {
    en: 'Switch back to previously active tabs panel after mouse leave',
    ru: 'Переключаться на последнюю активную панель вкладок, если курсор мыши убран',
    de: 'Beim Loslassen der Maus zurück zum zuvor aktiven Tab Panel wechseln',
    zh_CN: '鼠标离开后切换回之前活动的标签页面板',
    zh_TW: '鼠標離開後切換回之前活動的標籤頁面板',
  },
  'panel.skip_on_switching': {
    en: 'Skip this panel when switching panels',
    ru: 'Пропускать эту панель при переключении панелей',
    de: 'Beim Wechseln der Panels dieses Panel überspringen',
    zh_CN: '切换面板时跳过此面板',
    zh_TW: '切換面板時跳過此面板',
  },
  'panel.no_empty_label': {
    en: 'Create new tab after the last one is closed',
    ru: 'Создавать новую вкладку после закрытия последней',
    de: 'Erstelle neuen Tab, nachdem der letzte geschlossen wurde',
    zh_CN: '关闭最后一个标签页后创建新标签页',
    zh_TW: '關閉最後一個標籤頁後創建新標籤頁',
  },
  'panel.new_tab_ctx': {
    en: 'Container of new tab',
    ru: 'Контейнер новой вкладки',
    de: 'Umgebung des neuen Tabs',
    zh_CN: '新标签页的容器',
    zh_TW: '新標籤頁的容器',
  },
  'panel.new_tab_ctx_reopen': {
    en: 'Detect externally opened tab and reopen it in the target container on the first web request (global setting)',
    ru: 'Обнаруживать открытую извне вкладку и переотрывать ее в целевом контейнере при первом веб запросе (глобальная настройка)',
    zh_CN: '检测外部打开的选项卡并在第一个 Web 请求时在目标容器中重新打开它（全局设置）',
    zh_TW: '檢測外部打開的選項卡並在第一個 Web 請求時在目標容器中重新打開它（全局設置）',
  },
  'panel.drop_tab_ctx': {
    en: 'Reopen tab that was dropped to this panel in container:',
    ru: 'Переоткрыть вкладку, переброшенную в эту панель, в контейнере:',
    de: 'Tabs, welche in dieses Panel verschoben werden in Umgebung neu öffnen',
    zh_CN: '在容器中重新打开拖放到此面板的标签页:',
    zh_TW: '在容器中重新打開拖放到此面板的選項卡',
  },
  'panel.move_tab_ctx': {
    en: 'Move tab to this panel if it is opened in container:',
    ru: 'Перемещать вкладки выбранного контейнера в эту панель',
    de: 'Verschiebe Tabs in dieses Panel, wenn sie in Umgebung geöffnet werden',
    zh_CN: '如果在容器中打开标签页，则将选项卡移动到此面板：',
    zh_TW: '如果在容器中打開選項卡，則將選項卡移動到此面板：',
  },
  'panel.move_tab_ctx_nochild': {
    en: 'Except child tabs',
    ru: 'За исключением дочерних вкладок',
    de: 'Mit Ausnahme von Unter-Tabs',
    zh_CN: '排除子标签页',
    zh_TW: '排除子標籤頁',
  },
  'panel.move_rules_active': {
    en: 'Move tabs to this panel',
    ru: 'Перемещать вкладки в эту панель',
    zh_CN: '将选项卡移动到此面板',
    zh_TW: '將選項卡移動到此面板',
  },
  'panel.ctr_tooltip_none': {
    en: 'Not set',
    ru: 'Не задан',
    de: 'Nicht festgelegt',
    zh_CN: '未设置',
    zh_TW: '未設置',
  },
  'panel.panel_tooltip_none': {
    en: 'Not set',
    ru: 'Не задана',
    de: 'Nicht festgelegt',
    zh_CN: '未设置',
    zh_TW: '未設置',
  },
  'panel.ctr_tooltip_default': {
    en: 'No container',
    ru: 'Без контейнера',
    de: 'Keine Umgebung',
    zh_CN: '无容器',
    zh_TW: '無容器',
  },
  'panel.url_rules': {
    en: 'Move tabs with matched URLs to this panel',
    ru: 'Перемещать вкладки с совпадающими адресами в эту панель',
    de: 'Verschiebe Tabs mit passender URL in dieses Panel',
    zh_CN: '将匹配 URL 列表的标签页移动到此面板',
    zh_TW: '將匹配 URL 列表的標籤頁移動到此面板',
  },
  'panel.auto_convert': {
    en: 'Convert to source tabs panel on opening bookmark',
    ru: 'При открытии закладки преобразовать в исходную панель вкладок',
    de: 'Beim Öffnen von Lesezeichen zum ursprünglichen Tab-Panel wechseln',
    zh_CN: '打开书签时切换到源标签页面板',
    zh_TW: '打開書籤時切換到源標籤頁面板',
  },
  'panel.custom_icon': {
    en: 'Custom icon',
    ru: 'Пользовательская иконка',
    de: 'Benutzerdefiniertes Symbol',
    zh_CN: '自定义图标',
    zh_TW: '自定義圖標',
  },
  'panel.custom_icon_text_btn': {
    en: 'Text',
    de: 'Text',
    ru: 'Текст',
    zh: '文本'
  },
  'panel.custom_icon_url_btn': {
    en: 'URL',
  },
  'panel.custom_icon_file_btn': {
    en: 'File',
    ru: 'Файл',
    zh: '文件'
  },
  'panel.custom_icon_note': {
    en: 'Text value syntax: "text::color::CSS-font-value"',
    ru: 'Синтаксис текстового значения: "символы::CSS-цвет::CSS-шрифт"',
    de: 'Textwerte-Syntax: "Text::Farbe::CSS-Schriftart-Wert"',
    zh_CN: '文本值语法：“text::color::CSS-font-value”',
    zh_TW: '文本值語法：“text::color::CSS-font-value”',
  },
  'panel.custom_icon_colorize': {
    en: 'Colorize custom icon with selected color',
    ru: 'Раскрасить пользовательский значок выбранным цветом',
    zh_CN: '使用所选颜色为自定义图标着色',
    zh_TW: '使用所選顏色為自定義圖標著色',
  },
  'panel.custom_icon_load': {
    en: 'Load',
    ru: 'Загрузить',
    de: 'Laden',
    zh_CN: '加载',
    zh_TW: '加載',
  },
  'panel.custom_icon_text_placeholder': {
    en: 'e.g. A::#000000ff::700 32px Roboto',
    ru: 'A::#000000ff::700 32px Roboto',
    de: 'z.B. A::#000000ff::700 32px Roboto',
    zh: '例如 A::#000000ff::700 32px Roboto'
  },
  'panel.custom_icon_url_placeholder': {
    en: 'Custom icon URL...',
    ru: 'Ссылка на иконку...',
    zh_CN: '自定义图标网址...',
    zh_TW: '自定義圖標網址...',
  },
  'panel.url_label': {
    en: 'URL',
  },
  'panel.root_id_label': {
    en: 'Root folder',
    ru: 'Корневая папка',
    de: 'Quellordner',
    zh_CN: '根文件夹',
    zh_TW: '根文件夾',
  },
  'panel.root_id_wrong': {
    en: 'Cannot find such folder, please choose the new one',
    ru: 'Не удается найти такую папку, выберите новую',
    de: 'Kann diesen Ordner nicht finden, bitte neuen wählen',
    zh_CN: '找不到这样的文件夹',
    zh_TW: '找不到這樣的文件夾',
  },
  'panel.root_id.choose': {
    en: 'Choose folder',
    ru: 'Выбрать папку',
    de: 'Ordner auswählen',
    zh_CN: '选择文件夹',
    zh_TW: '選擇文件夾',
  },
  'panel.root_id.reset': {
    en: 'Reset',
    ru: 'Сбросить',
    de: 'Zurücksetzen',
    zh: '重置'
  },
  'panel.bookmarks_view_mode': {
    en: 'View mode',
    ru: 'Тип отображения',
    de: 'Anzeigemodus',
    zh_CN: '视图模式',
    zh_TW: '視圖模式',
  },
  'panel.bookmarks_view_mode_tree': {
    en: 'tree',
    ru: 'древовидная структура',
    de: 'Baumstruktur',
    zh_CN: '树状',
    zh_TW: '樹狀',
  },
  'panel.bookmarks_view_mode_history': {
    en: 'history',
    ru: 'хронологический список',
    de: 'Chronik',
    zh_CN: '历史',
    zh_TW: '歷史',
  },
  'panel.tab_move_rules': {
    en: 'Move tabs to this panel',
    ru: 'Перемещать вкладки на эту панель',
    zh_CN: '将标签页移动到此面板',
    zh_TW: '將選項卡移動到此面板',
  },
  'panel.tab_move_rules_manage_btn': {
    en: 'Manage rules',
    ru: 'Управление правилами',
    zh_CN: '管理规则',
    zh_TW: '管理規則',
  },
  'panel.move_excluded_to': {
    en: 'Move unmatched (excluded) tabs to panel',
    ru: 'Перемещать остальные (исключенные) вкладки на панель',
    zh_CN: '将不匹配（排除）的标签页移动到面板',
    zh_TW: '將不匹配（排除）的選項卡移動到面板',
  },
  'panel.tab_move_rules_manage_badge': {
    en: 'Manage moving rules',
    ru: 'Управление правилами перемещения',
    zh_CN: '管理移动规则',
    zh_TW: '管理移動規則',
  },
  'panel.new_tab_shortcuts': {
    en: 'Additional "New tab" shortcuts',
    ru: 'Дополнительные кнопки для создания новой вкладки',
    de: 'Zusätzliche "Neuer Tab" Schaltflächen',
    zh_CN: '额外的“新建标签”按钮',
    zh_TW: '額外的“新標籤”快捷方式',
  },
  'panel.new_tab_shortcuts_manage_btn': {
    en: 'Manage shortcuts',
    ru: 'Управление ярлыками',
    zh: '管理快捷方式'
  },

  // ---
  // -- Settings
  // -
  'settings.nav_settings': {
    en: 'Settings',
    ru: 'Настройки',
    de: 'Einstellungen',
    zh_CN: '设置',
    zh_TW: '設置',
  },
  'settings.nav_settings_general': {
    en: 'General',
    ru: 'Основные',
    de: 'Allgemein',
    zh_CN: '通用',
    zh_TW: '全局設置',
  },
  'settings.nav_settings_menu': {
    en: 'Menu',
    ru: 'Меню',
    de: 'Menü',
    zh_CN: '菜单',
    zh_TW: '菜單',
  },
  'settings.nav_settings_nav': {
    en: 'Navigation bar',
    ru: 'Навигация',
    de: 'Navigationsleiste',
    zh_CN: '导航栏',
    zh_TW: '導航欄',
  },
  'settings.nav_settings_group': {
    en: 'Group page',
    ru: 'Групповая страница',
    de: 'Gruppenseite',
    zh_CN: '分组页面',
    zh_TW: '分組頁面',
  },
  'settings.nav_settings_containers': {
    en: 'Containers',
    ru: 'Контейнеры',
    de: 'Umgebungen',
    zh: '容器'
  },
  'settings.nav_settings_dnd': {
    en: 'Drag and Drop',
    ru: 'Перетаскивание',
    de: 'Drag and Drop',
    zh: '拖拽'
  },
  'settings.nav_settings_search': {
    en: 'Search',
    ru: 'Поиск',
    de: 'Suche',
    zh: '搜索'
  },
  'settings.nav_settings_tabs': {
    en: 'Tabs',
    ru: 'Вкладки',
    de: 'Tabs',
    zh_CN: '标签页',
    zh_TW: '標籤頁',
  },
  'settings.nav_settings_new_tab_position': {
    en: 'Position of new tab',
    ru: 'Позиция новых вкладок',
    de: 'Position neuer Tabs',
    zh_CN: '新标签页的位置',
    zh_TW: '新標籤頁的位置',
  },
  'settings.nav_settings_pinned_tabs': {
    en: 'Pinned tabs',
    ru: 'Закрепленные вкладки',
    de: 'Angeheftete Tabs',
    zh_CN: '固定的标签页',
    zh_TW: '固定的標籤頁',
  },
  'settings.nav_settings_tabs_tree': {
    en: 'Tabs tree',
    ru: 'Дерево вкладок',
    de: 'Tab-Baum',
    zh_CN: '树状标签页',
    zh_TW: '樹狀標籤頁',
  },
  'settings.nav_settings_bookmarks': {
    en: 'Bookmarks',
    ru: 'Закладки',
    de: 'Lesezeichen',
    zh_CN: '书签',
    zh_TW: '書籤',
  },
  'settings.nav_settings_history': {
    en: 'History',
    ru: 'История',
    de: 'Chronik',
    zh_CN: '历史',
    zh_TW: '歷史',
  },
  'settings.nav_settings_appearance': {
    en: 'Appearance',
    ru: 'Вид',
    de: 'Erscheinungsbild',
    zh_CN: '外观',
    zh_TW: '外觀',
  },
  'settings.nav_settings_snapshots': {
    en: 'Snapshots',
    ru: 'Снепшоты',
    de: 'Schnappschüsse',
    zh: '快照'
  },
  'settings.nav_settings_mouse': {
    en: 'Mouse',
    ru: 'Мышь',
    de: 'Maus',
    zh_CN: '鼠标',
    zh_TW: '鼠標',
  },
  'settings.nav_settings_keybindings': {
    en: 'Keybindings',
    ru: 'Клавиши',
    de: 'Tastenbelegung',
    zh_CN: '按键绑定',
    zh_TW: '按鍵綁定',
  },
  'settings.nav_settings_permissions': {
    en: 'Permissions',
    ru: 'Разрешения',
    de: 'Berechtigungen',
    zh_CN: '权限',
    zh_TW: '權限',
  },
  'settings.nav_settings_storage': {
    en: 'Storage',
    ru: 'Данные',
    de: 'Speicher',
    zh_CN: '存储',
    zh_TW: '存儲',
  },
  'settings.nav_settings_sync': {
    en: 'Sync',
    ru: 'Синхронизация',
    de: 'Sync',
    zh: '同步'
  },
  'settings.nav_settings_help': {
    en: 'Help',
    ru: 'Помощь',
    de: 'Hilfe',
    zh_CN: '帮助',
    zh_TW: '幫助',
  },
  'settings.nav_menu_editor': {
    en: 'Menu editor',
    ru: 'Редактор меню',
    de: 'Menü-Editor',
    zh_CN: '菜单编辑器',
    zh_TW: '菜單編輯器',
  },
  'settings.nav_menu_editor_tabs': {
    en: 'Tabs',
    ru: 'Вкладки',
    de: 'Tabs',
    zh_CN: '标签页',
    zh_TW: '標籤頁',
  },
  'settings.nav_menu_editor_tabs_panel': {
    en: 'Tabs panel',
    ru: 'Панель вкладок',
    de: 'Tab-Panel',
    zh_CN: '标签页面板',
    zh_TW: '標籤頁面板',
  },
  'settings.nav_menu_editor_bookmarks': {
    en: 'Bookmarks',
    ru: 'Закладки',
    de: 'Lesezeichen',
    zh_CN: '书签',
    zh_TW: '書籤',
  },
  'settings.nav_menu_editor_bookmarks_panel': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
    de: 'Lesezeichen-Panel',
    zh_CN: '书签面板',
    zh_TW: '書籤面板',
  },
  'settings.nav_styles_editor': {
    en: 'Styles editor',
    ru: 'Редактор стилей',
    de: 'Stil-Editor',
    zh_CN: '样式编辑器',
    zh_TW: '樣式編輯器',
  },
  'settings.nav_snapshots': {
    en: 'Snapshots viewer',
    ru: 'Снепшоты',
    de: 'Schnappschuss-Viewer',
    zh: '快照查看器'
  },
  'settings.nav_keybindings': {
    en: 'Keybindings',
    ru: 'Клавиши',
    de: 'Tastenbelegung',
    zh_CN: '按键绑定',
    zh_TW: '按鍵綁定',
  },

  // - Details controls
  'settings.ctrl_save': {
    en: 'SAVE',
    ru: 'СОХРАНИТЬ',
    de: 'SPEICHERN',
    zh: '保存'
  },
  'settings.ctrl_update': {
    en: 'UPDATE',
    ru: 'ОБНОВИТЬ',
    de: 'AKTUALISIEREN',
    zh: '更新'
  },
  'settings.ctrl_copy': {
    en: 'COPY',
    ru: 'СКОПИРОВАТЬ',
    de: 'KOPIEREN',
    zh_CN: '复制',
    zh_TW: '複製',
  },
  'settings.ctrl_close': {
    en: 'CLOSE',
    ru: 'ЗАКРЫТЬ',
    de: 'SCHLIEẞEN',
    zh_CN: '关闭',
    zh_TW: '關閉',
  },

  // - General
  'settings.general_title': {
    en: 'General',
    ru: 'Основные',
    de: 'Allgemein',
    zh: '通用'
  },
  'settings.native_scrollbars': {
    en: 'Use native scroll-bars',
    ru: 'Использовать системные скроллбары',
    de: 'Native Scrollleiste verwenden',
    zh_CN: '使用原生滚动条',
    zh_TW: '使用原生滾動條',
  },
  'settings.native_scrollbars_thin': {
    en: 'Use thin scroll-bars',
    ru: 'Использовать узкие скроллбары',
    de: 'Dünne Scrollleiste verwenden',
    zh_CN: '使用细滚动条',
    zh_TW: '使用細滾動條',
  },
  'settings.native_scrollbars_left': {
    en: 'Show scroll-bar at the left side',
    ru: 'Показать полосу прокрутки слева',
    de: 'Scrollleiste auf der linken Seite anzeigen',
    zh_CN: '在左边显示滚动条',
    zh_TW: '在左邊顯示滾動條',
  },
  'settings.sel_win_screenshots': {
    en: 'Show screenshots in the window selection menu when moving tabs via context menu',
    ru: 'Показывать скриншоты в меню выбора окна при перемещении вкладок через контекстное меню',
    de: 'Screenshots im Fenster-Auswahl-Menü anzeigen',
    zh_CN: '在窗口选择菜单中显示屏幕截图',
    zh_TW: '在窗口選擇菜單中顯示屏幕截圖',
  },
  'settings.update_sidebar_title': {
    en: "Use active panel's name as sidebar title",
    ru: 'Использовать имя активной панели в качестве заголовка боковой панели',
    de: 'Name des aktiven Panels als Seitenleistenname verwenden',
    zh_CN: '使用活动面板的名称作为侧边栏标题',
    zh_TW: '使用活動面板的名稱作為側邊欄標題',
  },
  'settings.mark_window': {
    en: "Add preface to the browser window's title if Sidebery sidebar is active",
    ru: 'Добавлять префикс к заголовку окна, если боковая панель Sidebery активна',
    de: 'Präfix zu Fenstername des Browsers hinzufügen, wenn Sidebery-Seitenleiste geöffnet ist',
    zh_CN: '如果 Sidebery 侧边栏处于活动状态，则在浏览器窗口的标题中添加前言',
    zh_TW: '如果 Sidebery 側邊欄處於活動狀態，則在瀏覽器窗口的標題中添加前言',
  },
  'settings.mark_window_preface': {
    en: 'Preface value',
    ru: 'Значение префикса',
    de: 'Präfix',
    zh_CN: '前言值设置',
    zh_TW: '前言值設置',
  },
  'settings.storage_btn': {
    en: "Sidebery's data:",
    ru: 'Данные Sidebery:',
    de: 'Sidebery-Daten',
    zh_CN: 'Sidebery 的数据:',
    zh_TW: 'Sidebery 的數據',
  },
  'settings.permissions_btn': {
    en: 'Permissions',
    ru: 'Разрешения',
    de: 'Berechtigungen',
    zh_CN: '权限',
    zh_TW: '權限',
  },

  // - Context menu
  'settings.ctx_menu_title': {
    en: 'Context menu',
    ru: 'Контекстное меню',
    de: 'Kontextmenü',
    zh_CN: '上下文菜单',
    zh_TW: '上下文菜單',
  },
  'settings.ctx_menu_native': {
    en: 'Use native context menu',
    ru: 'Использовать системное контекстное меню',
    de: 'Natives Kontextmenü verwenden',
    zh_CN: '使用本机上下文菜单',
    zh_TW: '使用本機上下文菜單',
  },
  'settings.ctx_menu_render_inact': {
    en: 'Render inactive options',
    ru: 'Отображать неактивные элементы',
    de: 'Inaktive Optionen rendern',
    zh_CN: '渲染非活动选项',
    zh_TW: '渲染非活動選項',
  },
  'settings.ctx_menu_render_icons': {
    en: 'Render icons',
    ru: 'Отображать иконки',
    de: 'Symbole rendern',
    zh_CN: '渲染图标',
    zh_TW: '渲染圖標',
  },
  'settings.ctx_menu_ignore_ctr': {
    en: 'Ignore containers',
    ru: 'Не отображать контейнеры',
    de: 'Umgebungen ignorieren',
    zh: '忽略容器'
  },
  'settings.ctx_menu_ignore_ctr_or': {
    en: 'e.g. /^tmp.+/, Google, Facebook',
    ru: 'пример: /^tmp.+/, Google, Facebook',
    de: 'z.B. /^tmp.+/, Google, Facebook',
    zh: '例如 /^tmp.+/, Google, Facebook'
  },
  'settings.ctx_menu_ignore_ctr_note': {
    en: 'Use comma-separated list of container names or /regexp/',
    ru: 'Список названий или /regexp/ через запятую',
    de: 'Komma-getrennte Liste von Umgebungsnamen oder /regexp/ verwenden',
    zh_CN: '使用逗号分隔的容器名称列表或 /regexp/',
    zh_TW: '使用逗號分隔的容器名稱列表或 /regexp/',
  },
  'settings.ctx_menu_editor': {
    en: 'Edit context menu',
    ru: 'Редактировать меню',
    de: 'Kontextmenü bearbeiten',
    zh_CN: '编辑上下文菜单',
    zh_TW: '編輯上下文菜單',
  },

  // - Navigation bar
  // TODO: rename 'nav' to 'navbar'
  'settings.nav_title': {
    en: 'Navigation bar',
    ru: 'Навигация',
    de: 'Navigationsleiste',
    zh_CN: '导航栏',
    zh_TW: '導航欄',
  },
  'settings.nav_bar_layout': {
    en: 'Layout',
    ru: 'Расположение',
    de: 'Layout',
    zh_CN: '布局',
    zh_TW: '佈局',
  },
  'settings.nav_bar_layout_horizontal': {
    en: 'horizontal',
    ru: 'горизонтальное',
    de: 'Horizontal',
    zh: '水平排列'
  },
  'settings.nav_bar_layout_vertical': {
    en: 'vertical',
    ru: 'вертикальное',
    de: 'Vertikal',
    zh: '垂直排列'
  },
  'settings.nav_bar_layout_hidden': {
    en: 'hidden',
    ru: 'скрытое',
    de: 'Versteckt',
    zh_CN: '隐藏',
    zh_TW: '隱藏',
  },
  'settings.nav_bar_inline': {
    en: 'Show navigation bar in one line',
    ru: 'В одну строку',
    de: 'Zeige Navigationsleiste in einer Zeile',
    zh_CN: '在一行中显示导航栏',
    zh_TW: '在一行中顯示導航欄',
  },
  'settings.nav_bar_side': {
    en: 'Side',
    ru: 'Сторона',
    de: 'Seite',
    zh_CN: '侧面设置',
    zh_TW: '側面設置',
  },
  'settings.nav_bar_side_left': {
    en: 'left',
    ru: 'левая',
    de: 'Links',
    zh_CN: '移动侧栏到左侧',
    zh_TW: '移動側欄到左側',
  },
  'settings.nav_bar_side_right': {
    en: 'right',
    ru: 'правая',
    de: 'Rechts',
    zh_CN: '移动侧栏到右侧',
    zh_TW: '移動側欄到右側',
  },
  'settings.nav_btn_count': {
    en: 'Show count of tabs/bookmarks',
    ru: 'Показывать количество вкладок/закладок',
    de: 'Zeige Anzahl der Tabs/Lesezeichen',
    zh_CN: '显示标签页/书签的数量',
    zh_TW: '顯示標籤頁/書籤的數量',
  },
  'settings.hide_empty_panels': {
    en: 'Hide empty tabs panels',
    ru: 'Скрывать пустые панели вкладок',
    de: 'Verstecke leere Tab-Panels',
    zh_CN: '隐藏空标签页面板',
    zh_TW: '隱藏空標籤頁面板',
  },
  'settings.hide_discarded_tab_panels': {
    en: 'Hide tab panel with all tabs unloaded',
    ru: 'Скрывать панель вкладок, если все ее вкладки выгружены',
    zh_CN: '隐藏标签面板并卸载所有标签',
    zh_TW: '隱藏標籤面板並卸載所有標籤',
  },
  'settings.nav_switch_panels_delay': {
    en: 'Min delay between panels switching (ms)',
    ru: 'Минимальная задержка между переключениями панелей (мс)',
    de: 'Mindestverzögerung beim Wechsel zwischen Panels (ms)',
    zh_CN: '面板切换的最小延迟（毫秒）',
    zh_TW: '面板切換之間的最小延遲（毫秒）',
  },
  'settings.bottom_bar': {
    en: 'Bottom bar of tabs panel',
    ru: 'Нижняя полоса панели вкладок',
    zh_CN: '标签面板的底部按钮',
    zh_TW: '標籤面板的底部按鈕',
  },
  'settings.sub_panel.recently_closed_tabs': {
    en: 'Recently closed tabs sub panel',
    ru: 'Подпанель недавно закрытых вкладок',
    zh_CN: '最近关闭的标签页子面板',
    zh_TW: '最近關閉的標籤頁子面板',
  },
  'settings.sub_panel.bookmarks': {
    en: 'Bookmarks sub panel',
    ru: 'Подпанель закладок',
    zh_CN: '书签子面板',
    zh_TW: '書籤子面板',
  },
  'settings.sub_panel.history': {
    en: 'History sub panel',
    ru: 'Подпанель истории',
    zh_CN: '历史子面板',
    zh_TW: '歷史子面板',
  },
  'settings.nav_act_tabs_panel_left_click': {
    en: 'Left click on active tabs panel',
    ru: 'Клик левой кнопкой мыши по активной панели вкладок',
    de: 'Linksklick auf aktives Tab-Panel',
    zh_CN: '左键单击活动的标签页面板',
    zh_TW: '左鍵單擊活動選項卡面板',
  },
  'settings.nav_act_tabs_panel_left_click_scroll': {
    en: 'scroll to start/end',
    ru: 'проскроллить к началу/концу',
    de: 'Scrolle zum Anfang/Ende',
    zh_CN: '滚动到顶部/底部',
    zh_TW: '滾動到頂部/底部',
  },
  'settings.nav_act_tabs_panel_left_click_new_tab': {
    en: 'create tab',
    ru: 'создать вкладку',
    de: 'Erstelle Tab',
    zh_CN: '新建标签页',
    zh_TW: '新建標籤頁',
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
    zh_TW: '左鍵單擊活動的書籤面板',
  },
  'settings.nav_act_bookmarks_panel_left_click_scroll': {
    en: 'scroll to start/end',
    ru: 'проскроллить к началу/концу',
    de: 'Scrolle zum Anfang/Ende',
    zh_CN: '滚动到顶部/底部',
    zh_TW: '滾動到頂部/底部',
  },
  'settings.nav_act_bookmarks_panel_left_click_none': {
    en: 'none',
    ru: 'ничего',
    de: 'Nichts',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.nav_tabs_panel_mid_click': {
    en: 'Middle click on tabs panel',
    ru: 'Клик средней кнопкой мыши по панели вкладок',
    de: 'Mittlere Maustaste auf Tab-Panel',
    zh_CN: '中键单击标签页面板',
    zh_TW: '中鍵單擊標籤頁面板',
  },
  'settings.nav_tabs_panel_mid_click_rm_act_tab': {
    en: 'close active tab',
    ru: 'закрыть активную вкладку',
    de: 'Schließe aktiven Tab',
    zh_CN: '关闭活动标签页',
    zh_TW: '關閉活動標籤頁',
  },
  'settings.nav_tabs_panel_mid_click_rm_all': {
    en: 'close tabs',
    ru: 'закрыть вкладки',
    de: 'Schließe Tabs',
    zh_CN: '关闭标签页',
    zh_TW: '關閉標籤頁',
  },
  'settings.nav_tabs_panel_mid_click_rm_rmp': {
    en: 'close tabs and remove panel',
    ru: 'закрыть вкладки и удалить панель',
    de: 'Schließe Tabs und entferne Panel',
    zh_CN: '关闭标签页并移除面板',
    zh_TW: '關閉標籤頁並移除面板',
  },
  'settings.nav_tabs_panel_mid_click_discard': {
    en: 'unload tabs',
    ru: 'выгрузить вкладки',
    de: 'Entlade Tabs',
    zh_CN: '卸载标签页',
    zh_TW: '卸載標籤頁',
  },
  'settings.nav_tabs_panel_mid_click_hide': {
    en: 'hide panel',
    ru: 'скрыть панель',
    de: 'Verstecke Panel',
    zh_CN: '隐藏面板',
    zh_TW: '隱藏面板',
  },
  'settings.nav_tabs_panel_mid_click_bookmark': {
    en: 'save panel to bookmarks',
    ru: 'сохранить панель в закладки',
    de: 'Speichere Panel in Lesezeichen',
    zh_CN: '将面板保存到书签',
    zh_TW: '將面板保存到書籤',
  },
  'settings.nav_tabs_panel_mid_click_bkm_rmp': {
    en: 'save to bookmarks and remove panel',
    ru: 'сохранить в закладки и удалить панель',
    de: 'Speichere in Lesezeichen und entferne Panel',
    zh_CN: '保存到书签并移除面板',
    zh_TW: '保存到書籤並移除面板',
  },
  'settings.nav_tabs_panel_mid_click_convert': {
    en: 'convert to bookmarks',
    ru: 'конвертировать в панель закладок',
    de: 'Konvertiere in Lesezeichen',
    zh_CN: '转换为书签',
    zh_TW: '轉換為書籤',
  },
  'settings.nav_tabs_panel_mid_click_conv_hide': {
    en: 'convert to bookmarks panel and hide',
    ru: 'конвертировать в панель закладок и скрыть',
    de: 'Konvertiere in Lesezeichen-Panel und verstecke',
    zh_CN: '转换为书签面板并隐藏',
    zh_TW: '轉換為書籤面板並隱藏',
  },
  'settings.nav_tabs_panel_mid_click_none': {
    en: 'none',
    ru: 'ничего',
    de: 'Nichts',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.nav_bookmarks_panel_mid_click': {
    en: 'Middle click on bookmarks panel',
    ru: 'Клик средней кнопкой мыши по панели закладок',
    de: 'Mittlere Maustaste auf Lesezeichen-Panel',
    zh_CN: '在书签面板上单击鼠标中键',
    zh_TW: '在書籤面板上單擊鼠標中鍵',
  },
  'settings.nav_bookmarks_panel_mid_click_convert': {
    en: 'convert to tabs',
    ru: 'конвертировать во вкладки',
    de: 'Konvertiere in Tabs',
    zh_CN: '转换为标签',
    zh_TW: '轉換為標籤',
  },
  'settings.nav_bookmarks_panel_mid_click_none': {
    en: 'none',
    ru: 'ничего',
    de: 'Nichts',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.nav_switch_panels_wheel': {
    en: 'Switch panels with mouse wheel over navigation bar',
    ru: 'Переключать панели с помощью колеса мыши над панелью навигации',
    de: 'Wechsle Panels mittels Mausrad über Navigationsleiste',
    zh_CN: '在导航栏上使用鼠标滚轮切换面板',
    zh_TW: '在導航欄上使用鼠標滾輪切換面板',
  },
  'settings.nav_bar_enabled': {
    en: 'Enabled elements',
    ru: 'Активированные элементы',
    de: 'Aktivierte Elemente',
    zh_CN: '已启用的元素',
    zh_TW: '已啟用的元素',
  },
  'settings.nav_bar.no_elements': {
    en: 'No elements',
    ru: 'Нет элементов',
    de: 'Keine Elemente',
    zh_CN: '无元素',
    zh_TW: '無元素',
  },
  'settings.nav_bar.inact_note': {
    en: '(Inactive)',
    ru: '(Неактивно)',
    de: '(Inaktiv)',
    zh: '(未激活)'
  },
  'settings.nav_bar.available_elements': {
    en: 'Available elements',
    ru: 'Доступные элементы',
    de: 'Verfügbare Elemente',
    zh: '可用元素'
  },
  'settings.nav_bar_btn_tabs_panel': {
    en: 'Tabs panel',
    ru: 'Панель вкладок',
    de: 'Tab-Panel',
    zh_CN: '标签页面板',
    zh_TW: '標籤頁面板',
  },
  'settings.nav_bar_btn_bookmarks_panel': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
    de: 'Lesezeichen-Panel',
    zh_CN: '书签面板',
    zh_TW: '書籤面板',
  },
  'settings.nav_bar_btn_sp': {
    en: 'Space',
    ru: 'Пространство',
    de: 'Leerraum',
    zh_CN: '空白',
    zh_TW: '空白空間',
  },
  'settings.nav_bar_btn_sd': {
    en: 'Delimiter',
    ru: 'Разделитель',
    de: 'Abgrenzung',
    zh: '分隔符'
  },
  'settings.nav_bar_btn_hdn': {
    en: 'Hidden panels',
    ru: 'Скрытые панели',
    de: 'Versteckte Panels',
    zh_CN: '隐藏面板',
    zh_TW: '隱藏面板',
  },
  'settings.nav_bar_btn_history': {
    en: 'History panel',
    ru: 'История',
    de: 'Chronik-Panel',
    zh_CN: '历史面板',
    zh_TW: '歷史面板',
  },
  'settings.nav_bar_btn_settings': {
    en: 'Settings',
    ru: 'Настройки',
    de: 'Einstellungen',
    zh_CN: '设置',
    zh_TW: '設置',
  },
  'settings.nav_bar_btn_add_tp': {
    en: 'Create tabs panel',
    ru: 'Создать панель вкладок',
    de: 'Tab-Panel erstellen',
    zh_CN: '创建标签页面板',
    zh_TW: '創建標籤頁面板',
  },
  'settings.nav_bar_btn_search': {
    en: 'Search',
    ru: 'Поиск',
    de: 'Suche',
    zh: '搜索'
  },
  'settings.nav_bar_btn_create_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
    de: 'Schnappschuss erstellen',
    zh_CN: '创建快照',
    zh_TW: '創建快照',
  },
  'settings.nav_bar_btn_remute_audio_tabs': {
    en: 'Mute/Unmute audible tabs',
    ru: 'Приглушить/Включить вкладки со звуком',
    de: 'Stumm/Laut schalten hörbarer Tabs',
    zh_CN: '静音/取消静音有声标签页',
    zh_TW: '靜音/取消靜音有聲標籤頁',
  },
  'settings.nav_bar_btn_collapse': {
    en: 'Collapse all',
    de: 'Alle einklappen',
    ru: 'Свернуть все',
    zh_CN: '折叠全部',
    zh_TW: '折疊全部',
  },
  'settings.nav_rm_tabs_panel_confirm_pre': {
    en: 'Delete "',
    ru: 'Удалить панель "',
    de: 'Lösche "',
    zh: '删除 "'
  },
  'settings.nav_rm_tabs_panel_confirm_post': {
    en: '" panel?\nAll tabs of this panel will be assigned to nearest tabs panel.',
    ru: '"?\n Все вкладки этой панели будут присоединены к соседней панели.',
    de: '" Panel?\nAlle Tabs dieses Panels werden dem nächsten Tab-Panel zugeordnet.',
    zh_CN: '" 面板吗?\n此面板的所有标签页都将分配给最近的标签页面板。',
    zh_TW: '" 面板？\n該面板的所有選項卡都將分配給最近的選項卡面板。',
  },
  'settings.nav_rm_bookmarks_panel_confirm_pre': {
    en: 'Delete "',
    ru: 'Удалить панель "',
    de: 'Lösche "',
    zh_CN: '删除 "',
    zh_TW: '删除',
  },
  'settings.nav_rm_bookmarks_panel_confirm_post': {
    en: '" panel?',
    ru: '"?',
    de: '" Panel?',
    zh: '" 面板吗?'
  },

  // - Group page
  'settings.group_title': {
    en: 'Group page',
    ru: 'Групповая страница',
    de: 'Gruppenseite',
    zh_CN: '分组页面',
    zh_TW: '分組頁面',
  },
  'settings.group_layout': {
    en: 'Layout of tabs',
    ru: 'Отображение',
    de: 'Tab-Layout',
    zh_CN: '标签页的布局',
    zh_TW: '標籤頁的佈局',
  },
  'settings.group_layout_grid': {
    en: 'grid',
    ru: 'сетка',
    de: 'Gitter',
    zh_CN: '网格',
    zh_TW: '網格',
  },
  'settings.group_layout_list': {
    en: 'list',
    ru: 'список',
    de: 'Liste',
    zh: '列表'
  },

  // - Containers
  'settings.containers_title': {
    en: 'Containers',
    ru: 'Контейнеры',
    de: 'Umgebung',
    zh: '容器'
  },
  'settings.contianer_remove_confirm_prefix': {
    en: 'Are you sure you want to delete "',
    ru: 'Вы действительно хотите удалить контейнер "',
    de: 'Möchten Sie die "',
    zh_CN: '你确定要删除 "',
    zh_TW: '你確定要刪除 "',
  },
  'settings.contianer_remove_confirm_postfix': {
    en: '" container?',
    ru: '"?',
    de: '" Umgebung wirklich löschen?',
    zh_CN: '" 容器吗?',
    zh_TW: '" 容器嗎?',
  },
  'settings.containers_create_btn': {
    en: 'Create container',
    ru: 'Создать контейнер',
    de: 'Umgebung erstellen',
    zh_CN: '创建容器',
    zh_TW: '創建容器',
  },

  // - Drag and drop
  'settings.dnd_title': {
    en: 'Drag and Drop',
    ru: 'Перетаскивание',
    de: 'Drag and Drop',
    zh: '拖拽'
  },
  'settings.dnd_tab_act': {
    en: 'Activate tab on hover',
    ru: 'Активировать вкладку при наведении',
    de: 'Tabs beim darüber Hovern aktivieren',
    zh_CN: '悬停时激活标签页',
    zh_TW: '懸停時激活標籤頁',
  },
  'settings.dnd_tab_act_delay': {
    en: 'With delay (ms)',
    ru: 'С задержкой (мс)',
    de: 'Mit Verzögerung (ms)',
    zh_CN: '延迟 (毫秒)',
    zh_TW: '延遲 (毫秒)',
  },
  'settings.dnd_mod': {
    en: 'With pressed key',
    ru: 'При нажатии на',
    de: 'Mit Tastendruck',
    zh_CN: '仅当按下',
    zh_TW: '僅當按下',
  },
  'settings.dnd_mod_alt': {
    en: 'alt',
    ru: 'alt',
    de: 'Alt',
    zh: 'alt'
  },
  'settings.dnd_mod_shift': {
    en: 'shift',
    ru: 'shift',
    de: 'Umschalt',
    zh: 'shift'
  },
  'settings.dnd_mod_ctrl': {
    en: 'ctrl',
    ru: 'ctrl',
    de: 'Strg',
    zh: 'ctrl'
  },
  'settings.dnd_mod_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Kein',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.dnd_outside': {
    en: 'Action on drag-and-drop to the outside of sidebar',
    ru: 'Действие при перетаскивании за пределы боковой панели',
    de: 'Aktion beim Drag-and-Drop aus der Seitenleiste hinaus',
    zh_CN: '拖放到侧边栏外部执行操作',
    zh_TW: '拖放到側邊欄外部執行操作',
  },
  'settings.dnd_outside_win': {
    en: 'Open in new window',
    de: 'In neuem Fenster öffnen',
    ru: 'Открыть в новом окне',
    zh_CN: '打开一个新的窗口',
    zh_TW: '打開一個新的窗口',
  },
  'settings.dnd_outside_data': {
    en: 'Pass dragged data to the target',
    ru: 'Передать данные получателю',
    de: 'Daten auf Ziel übertragen',
    zh_CN: '将被拖动的数据传递给目标对象',
    zh_TW: '將被拖動的數據傳遞給目標對象',
  },
  'settings.settings.dnd_outside_note': {
    en: 'Press the "Alt" key before dragging to invert this option',
    ru: 'Нажмите клавишу «Alt» перед перетаскиванием, чтобы инвертировать эту опцию',
    de: 'Drücke "Alt"-Taste vor dem Ziehen, um diese Option zu invertieren',
    zh_CN: '再拖动之前按下 Alt，则执行相反的操作。',
    zh_TW: '再拖動之前按下 Alt，則執行相反的操作。',
  },
  'settings.dnd_exp': {
    en: 'Expand/Fold the branch on hovering over the',
    ru: 'Развернуть/свернуть ветвь при наведении на',
    de: 'Zweig ein-/ausklappen beim Bewegen über',
    zh_CN: '展开/折叠分支当悬停在',
    zh_TW: '展開/折疊分支當懸停在',
  },
  'settings.dnd_exp_pointer': {
    en: "pointer's triangle",
    ru: 'треугольник указателя',
    de: 'Dreieck des Indikators',
    zh_CN: '下拉三角形指针',
    zh_TW: '下拉三角形指針',
  },
  'settings.dnd_exp_hover': {
    en: 'tab/bookmark',
    ru: 'вкладку/закладку',
    de: 'Tab/Lesezeichen',
    zh_CN: '标签页/书签',
    zh_TW: '標籤頁/書籤',
  },
  'settings.dnd_exp_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Nie',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.dnd_exp_delay': {
    en: 'With delay (ms)',
    ru: 'С задержкой (мс)',
    de: 'Mit Verzögerung (ms)',
    zh_CN: '延迟 (毫秒)',
    zh_TW: '延遲 (毫秒)',
  },
  'settings.dnd_act_tab_from_link': {
    en: 'Activate tab created from a dragged link',
    ru: 'Активировать вкладку, созданную из перетаскиваемой ссылки',
    zh_CN: '激活从拖动的链接创建的标签页',
    zh_TW: '激活從拖動的鏈接創建的選項卡',
  },
  'settings.dnd_act_search_tab': {
    en: 'Activate tab created to search for dragged text',
    ru: 'Активировать вкладку, созданную для поиска перетаскиваемого текста',
    zh_CN: '激活从拖动的文本创建的搜索标签页',
    zh_TW: '激活從拖動的文本創建的搜索標籤頁',
  },
  'settings.dnd_move_tabs': {
    en: 'Close tabs after dropping them to bookmarks',
    ru: 'Закрывать вкладки после перетаскивания их в закладки',
    zh_CN: '将标签放入书签后关闭标签页',
    zh_TW: '將標籤放入書籤後關閉選項卡',
  },
  'settings.dnd_move_tabs_note': {
    en: 'Note: Ctrl+Drop will preserve the tabs',
    ru: 'Примечание: Ctrl+Drop сохранит вкладки',
    zh_CN: '注意：Ctrl+Drop 将保留标签页',
    zh_TW: '注意：Ctrl+Drop 將保留選項卡',
  },
  'settings.dnd_move_bookmarks': {
    en: 'Delete bookmarks after dropping them to tabs',
    ru: 'Удалять закладки после перетаскивания их во вкладки',
    zh_CN: '将书签拖放到标签后删除书签',
    zh_TW: '將書籤拖放到標籤後刪除書籤',
  },
  'settings.dnd_move_bookmarks_note': {
    en: 'Note: Ctrl+Drop will preserve the bookmarks',
    ru: 'Примечание: Ctrl+Drop сохранит закладки',
    zh_CN: '注意：Ctrl+Drop 将保留书签',
    zh_TW: '注意：Ctrl+Drop 將保留書籤',
  },

  // - Search;
  'settings.search_title': {
    en: 'Search',
    ru: 'Поиск',
    de: 'Suche',
    zh: '搜索'
  },
  'settings.search_bar_mode': {
    en: 'Search bar mode',
    ru: 'Режим панели',
    de: 'Modus der Suchleiste',
    zh_CN: '搜索栏模式',
    zh_TW: '搜索欄模式',
  },
  'settings.search_bar_mode_static': {
    en: 'always shown',
    ru: 'активный',
    de: 'Immer anzeigen',
    zh_CN: '总是显示',
    zh_TW: '總是顯示',
  },
  'settings.search_bar_mode_dynamic': {
    en: 'dynamic',
    ru: 'динамический',
    de: 'Dynamisch',
    zh_CN: '动态显示',
    zh_TW: '動態顯示',
  },
  'settings.search_bar_mode_none': {
    en: 'inactive',
    ru: 'скрытый',
    de: 'Inaktiv',
    zh_CN: '关闭',
    zh_TW: '關閉',
  },
  'settings.search_panel_switch': {
    en: 'Keep searching when switching panels',
    ru: 'Продолжать поиск при переключении панелей',
    de: 'Suche beim Wechseln der Panels beibehalten',
    zh_CN: '切换面板时保持搜索',
    zh_TW: '切換面板時保持搜索',
  },
  'settings.search_panel_switch_any': {
    en: 'any panel',
    ru: 'любая панель',
    de: 'Jede Panel',
    zh: '任意面板'
  },
  'settings.search_panel_switch_same_type': {
    en: 'same panel type',
    ru: 'тот же тип панели',
    de: 'Gleicher Panel-Typ',
    zh_CN: '同一类型的面板',
    zh_TW: '同一類型的面板',
  },
  'settings.search_panel_switch_none': {
    en: 'off',
    ru: 'выкл',
    de: 'Nie',
    zh_CN: '关闭',
    zh_TW: '關閉',
  },
  'settings.search.shortcuts': {
    en: 'Shortcuts',
    ru: 'Быстрый доступ',
    de: 'Tastenkombinationen',
    zh_CN: '快捷键',
    zh_TW: '快捷鍵',
  },
  'settings.search.shortcuts.note': {
    en: `Available modifiers: ctrl, alt, cmd
Examples: "*", "ctrl+$", "ctrl+alt+g"`,
    ru: `Доступные модификаторы: ctrl, alt, cmd
Примеры: "*", "ctrl+$", "ctrl+alt+g"`,
    de: `Verfügbare Modifikatoren: ctrl, alt, cmd
Beispiele: "*", "ctrl+$", "ctrl+alt+g"`,
    zh_CN: `可用修饰符：ctrl, alt, cmd
示例： "*", "ctrl+$", "ctrl+alt+g"`,
    zh_TW: `可用修飾鍵：ctrl, alt, cmd
範例： "*", "ctrl+$", "ctrl+alt+g"`,
  },
  'settings.search.bookmarks_shortcut': {
    en: 'Switch to bookmarks',
    ru: 'Перейти к закладкам',
    de: 'Zu Lesezeichen wechseln',
    zh_CN: '切换到书签',
    zh_TW: '切換到書籤',
  },
  'settings.search.history_shortcut': {
    en: 'Switch to history',
    ru: 'Перейти к истории',
    de: 'Zu Chronik wechseln',
    zh_CN: '切换到历史记录',
    zh_TW: '切換到歷史紀錄',
  },

  // - Tabs
  'settings.tabs_title': {
    en: 'Tabs',
    ru: 'Вкладки',
    de: 'Tabs',
    zh_CN: '标签页',
    zh_TW: '標籤頁',
  },
  'settings.warn_on_multi_tab_close': {
    en: 'Warn on trying to close multiple tabs',
    ru: 'Предупреждать при закрытии нескольких вкладок',
    de: 'Warne beim Schließen mehrerer Tabs',
    zh_CN: '尝试关闭多个标签页时给予提醒',
    zh_TW: '嘗試關閉多個標籤頁時給予提醒',
  },
  'settings.warn_on_multi_tab_close_any': {
    en: 'any',
    ru: 'любых',
    de: 'Alle',
    zh: '所有'
  },
  'settings.warn_on_multi_tab_close_collapsed': {
    en: 'collapsed',
    ru: 'свернутых',
    de: 'Eingeklappte',
    zh_CN: '折叠',
    zh_TW: '折疊',
  },
  'settings.warn_on_multi_tab_close_none': {
    en: 'none',
    ru: 'нет',
    de: 'Nie',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.activate_last_tab_on_panel_switching': {
    en: 'Activate last active tab on panel switching',
    ru: 'Активировать последнюю активную вкладку при переключении панелей',
    de: 'Aktiviere das zuletzt aktive Tab beim Wechseln des Panels',
    zh_CN: '在面板切换时激活上一个活动标签页',
    zh_TW: '在面板切換時激活上一個活動標籤頁',
  },
  'settings.activate_last_tab_on_panel_switching_loaded_only': {
    en: 'Except unloaded tabs',
    ru: 'За исключением выгруженных вкладок',
    zh_CN: '除了卸载的标签页',
    zh_TW: '除了卸載的標籤頁',
  },
  'settings.skip_empty_panels': {
    en: 'Skip empty panels on switching',
    ru: 'Пропускать пустые контейнеры при переключении',
    de: 'Überspringe leere Panels beim Wechseln',
    zh_CN: '切换时跳过空面板',
    zh_TW: '切換時跳過空面板',
  },
  'settings.tab_rm_btn': {
    en: 'Show close button',
    ru: 'Показывать кнопку закрытия вкладки',
    zh_CN: '显示关闭按钮',
    zh_TW: '顯示關閉按鈕',
  },
  'settings.tab_rm_btn_always': {
    en: 'always',
    ru: 'всегда',
    zh_CN: '总是',
    zh_TW: '總是',
  },
  'settings.tab_rm_btn_hover': {
    en: 'on mouse hover',
    ru: 'при наведении курсора',
    zh_CN: '鼠标悬停',
    zh_TW: '鼠標懸停',
  },
  'settings.tab_rm_btn_none': {
    en: 'no',
    ru: 'нет',
    zh: 'No'
  },
  'settings.switch_panel_after_switching_tab': {
    en: 'Automatically switch panel on activating tab of another panel',
    ru: 'Автоматически переключать панель при активации вкладки другой панели',
    zh_CN: '当激活另一个面板的标签页时自动切换面板',
    zh_TW: '當激活另一個面板的選項卡時自動切換面板',
  },
  'settings.switch_panel_after_switching_tab_always': {
    en: 'always',
    ru: 'всегда',
    zh_CN: '总是',
    zh_TW: '總是',
  },
  'settings.switch_panel_after_switching_tab_mouseleave': {
    en: 'if the mouse left the sidebar',
    ru: 'если мышь покинула боковую панель',
    zh_CN: '如果鼠标离开侧边栏',
    zh_TW: '如果鼠標離開側邊欄',
  },
  'settings.switch_panel_after_switching_tab_no': {
    en: 'no',
    ru: 'нет',
    zh: 'No'
  },
  'settings.hide_inactive_panel_tabs': {
    en: 'Hide native tabs of inactive panels',
    ru: 'Скрывать горизонтальные вкладки неактивных панелей',
    de: 'Verstecke native Tabs inaktiver Panels',
    zh_CN: '隐藏非活动面板的本机标签页',
    zh_TW: '隱藏非活動面板的本機選項卡',
  },
  'settings.activate_after_closing': {
    en: 'After closing current tab activate',
    ru: 'После закрытия текущей вкладки активировать',
    de: 'Nach Schließen des aktuellen Tabs, aktiviere',
    zh_CN: '关闭当前标签页后激活',
    zh_TW: '關閉當前選項卡後激活',
  },
  'settings.activate_after_closing_next': {
    en: 'next tab',
    ru: 'следующую',
    de: 'nächsten Tab',
    zh_CN: '下一个标签页',
    zh_TW: '下一個標籤頁',
  },
  'settings.activate_after_closing_prev': {
    en: 'previous tab',
    ru: 'предыдущую',
    de: 'vorherigen Tab',
    zh_CN: '上一个标签页',
    zh_TW: '上一個標籤頁',
  },
  'settings.activate_after_closing_prev_act': {
    en: 'previously active tab',
    ru: 'последнюю активную',
    de: 'zuletzt aktiven Tab',
    zh_CN: '上一活动标签页',
    zh_TW: '上一活動標籤頁',
  },
  'settings.activate_after_closing_none': {
    en: 'off',
    ru: 'выкл',
    de: 'nichts',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.activate_after_closing_prev_rule': {
    en: 'Previous tab rule',
    ru: 'Правило предыдущей вкладки',
    de: 'Vorherige Tab-Regel',
    zh_CN: '上一个标签页规则',
    zh_TW: '上一個標籤頁規則',
  },
  'settings.activate_after_closing_next_rule': {
    en: 'Next tab rule',
    ru: 'Правило следующей вкладки',
    de: 'Nächste Tab-Regel',
    zh_CN: '下一个标签页规则',
    zh_TW: '下一個標籤頁規則',
  },
  'settings.activate_after_closing_rule_tree': {
    en: 'tree',
    ru: 'дерево',
    de: 'Zweig',
    zh_CN: '树状',
    zh_TW: '樹狀',
  },
  'settings.activate_after_closing_rule_visible': {
    en: 'visible',
    ru: 'видимая',
    de: 'Sichtbar',
    zh_CN: '可见的',
    zh_TW: '可見的',
  },
  'settings.activate_after_closing_rule_any': {
    en: 'any',
    ru: 'любая',
    de: 'Alle',
    zh: '所有'
  },
  'settings.activate_after_closing_global': {
    en: 'Globally',
    ru: 'Глобально',
    de: 'Global',
    zh: '全局'
  },
  'settings.activate_after_closing_stay_in_panel': {
    en: 'Stay in panel to the last tab',
    ru: 'Оставаться на панели до последней вкладки',
    zh_CN: '留在面板上直到最后一个标签页',
    zh_TW: '在面板中停留到最後一個選項卡',
  },

  'settings.tabs_url_in_tooltip': {
    en: 'Show URL in tooltip',
    ru: 'Показывать URL во всплывающей подсказке',
    de: 'Zeige URL in Tooltip',
    zh_CN: '鼠标悬停标签页显示 URL',
    zh_TW: '鼠標懸停標籤頁顯示 URL',
  },
  'settings.tabs_url_in_tooltip_full': {
    en: 'full',
    ru: 'полный',
    de: 'Vollständig',
    zh: '完整显示'
  },
  'settings.tabs_url_in_tooltip_stripped': {
    en: 'stripped',
    ru: 'сокращенный',
    de: 'Gekürzt',
    zh_CN: '仅显示域',
    zh_TW: '僅顯示域',
  },
  'settings.tabs_url_in_tooltip_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Gar nicht',
    zh_CN: '不显示',
    zh_TW: '不顯示',
  },

  'settings.activate_after_closing_no_folded': {
    en: 'Ignore folded tabs',
    ru: 'Игнорировать свернутые вкладки',
    de: 'Ignoriere eingeklappte Tabs',
    zh_CN: '忽略折叠的标签页',
    zh_TW: '忽略折疊的標籤頁',
  },
  'settings.activate_after_closing_no_discarded': {
    en: 'Ignore discarded tabs',
    ru: 'Игнорировать выгруженные вкладки',
    de: 'Ignoriere entladene Tabs',
    zh_CN: '忽略丢弃的标签页',
    zh_TW: '忽略丟棄的標籤頁',
  },
  'settings.ask_new_bookmark_place': {
    en: 'Ask where to store bookmarks',
    ru: 'Спрашивать куда сохранить закладки',
    de: 'Frage, wo Lesezeichen gespeichert werden sollen',
    zh_CN: '询问存储书签的位置',
    zh_TW: '詢問存儲書籤的位置',
  },
  'settings.tabs_rm_undo_note': {
    en: 'Show undo notification on closing multiple tabs',
    ru: 'Показывать уведомление о закрытии нескольких вкладок',
    de: 'Zeige "Rückgängig"-Meldung nach Schließen mehrerer Tabs',
    zh_CN: '在关闭多个标签页时显示撤消通知',
    zh_TW: '在關閉多個標籤頁時顯示撤消通知',
  },
  'settings.native_highlight': {
    en: 'Highlight native tabs (in top horizontal bar) along with tabs in sidebar',
    ru: 'Выделять стандартные вкладки (в верхней панели) вместе с вкладками в боковой панели',
    de: 'Hebe native Tabs (in horizontaler Leiste oben) ebenso hervor, wie Tabs in Seitenleiste',
    zh_CN: '突出显示本机标签页（在顶部水平栏中）以及侧边栏中的标签页',
    zh_TW: '突出顯示本機標籤頁（在頂部水平欄中）以及側邊欄中的標籤頁',
  },
  'settings.tabs_unread_mark': {
    en: 'Show mark on unread tabs',
    ru: 'Показывать метку на непрочитанных вкладках',
    de: 'Zeige Markierung an ungelesenen Tabs',
    zh_CN: '在未读标签页上显示标记',
    zh_TW: '在未讀標籤頁上顯示標記',
  },
  'settings.tabs_update_mark': {
    en: 'Show mark on tabs with updated title',
    ru: 'Показывать метку на вкладках с обновленным заголовком',
    de: 'Zeige Markierung an Tabs mit aktualisiertem Titel',

    zh_CN: '在标签页上显示更新标题的标记',
    zh_TW: '在標籤頁上顯示更新標題的標記',
  },
  'settings.tabs_update_mark_all': {
    en: 'on',
    ru: 'вкл',
    de: 'Ein',
    zh_CN: '打开',
    zh_TW: '打開',
  },
  'settings.tabs_update_mark_pin': {
    en: 'only for pinned',
    ru: 'только для закрепленных',
    de: 'Nur für angeheftete',
    zh_CN: '仅用于固定',
    zh_TW: '僅用於固定',
  },
  'settings.tabs_update_mark_norm': {
    en: 'only for not pinned',
    ru: 'только для не закрепленных',
    de: 'Nur für nicht angeheftete',
    zh_CN: '仅用于未固定',
    zh_TW: '僅適用於未固定',
  },
  'settings.tabs_update_mark_none': {
    en: 'off',
    ru: 'выкл',
    de: 'Aus',
    zh_CN: '关闭',
    zh_TW: '關閉',
  },
  'settings.tabs_update_mark_first': {
    en: 'Including the first title change with new URL',
    ru: 'Включая первое изменение заголовка с новым URL',
    zh_CN: '包括使用新 URL 的第一次标题更改',
    zh_TW: '包括使用新 URL 的第一次標題更改',
  },
  'settings.tabs_reload_limit': {
    en: 'Limit the count of simultaneously reloading tabs',
    ru: 'Ограничить количество одновременно перезагружаемых вкладок',
    de: 'Beschränke die Anzahl gleichzeitig neu ladender Tabs',
    zh_CN: '限制同时重新加载标签页的数量',
    zh_TW: '限制同時重新加載標籤頁的數量',
  },
  'settings.tabs_reload_limit_notif': {
    en: 'Show notification with the reloading progress',
    ru: 'Показывать уведомление со статусом перезагрузки',
    de: 'Zeige Benachrichtigung mit Fortschritt des neu Ladens',
    zh_CN: '显示重新加载进度的通知',
    zh_TW: '顯示重新加載進度的通知',
  },
  'settings.tabs_panel_switch_act_move': {
    en: 'Switch panel after manually moving active tab to another panel',
    ru: 'Переключать панель после ручного перемещения активной вкладки на другую панель',
    // de: 'Wechsle Panel nach bewegen aktiver Tabs in anderes Panel',
    zh_CN: '手动移动活动选项卡后将面板切换到另一个面板',
    zh_TW: '手動移動活動選項卡後將面板切換到另一個面板',
  },
  'settings.tabs_panel_switch_act_move_auto': {
    en: 'Switch panel after auto moving active tab to another panel',
    ru: 'Переключать панель после автоматического перемещения активной вкладки на другую панель',
    zh_CN: '自动移动活动选项卡后将面板切换到另一个面板',
    zh_TW: '自動移動活動選項卡後將面板切換到另一個面板',
  },
  'settings.show_new_tab_btns': {
    en: 'Show new tab buttons',
    ru: 'Показывать кнопки создания новых вкладок',
    de: 'Zeige "Neuer Tab"-Schaltflächen',
    zh_CN: '显示新标签页按钮',
    zh_TW: '顯示新標籤頁按鈕',
  },
  'settings.new_tab_bar_position': {
    en: 'Position',
    ru: 'Положение',
    de: 'Position',
    zh: '位置'
  },
  'settings.new_tab_bar_position_after_tabs': {
    en: 'after tabs',
    ru: 'после вкладок',
    de: 'Nach Tabs',
    zh_CN: '标签页后',
    zh_TW: '標籤頁後',
  },
  'settings.new_tab_bar_position_bottom': {
    en: 'bottom',
    ru: 'снизу',
    de: 'Unten',
    zh: '底部'
  },
  // 'settings.tab_warmup_on_hover': {
  //   en: 'Preload tab contents on mouse hover (tab warmup)',
  //   ru: 'Предварительная прогрузка вкладки при наведении мыши',
  //   de: 'Tab-Inhalte beim Bewegen der Maus vorladen (Tab-Aufwärmen)',
  // },
  'settings.select_active_tab_first': {
    en: 'Select the active tab first',
    ru: 'Выделять сначала активную вкладку',
    zh_CN: '位置首先选择活动选项卡（键盘导航）',
    zh_TW: '首先選擇活動選項卡（鍵盤導航）',
  },
  'settings.open_sub_panel_on_mouse_hover': {
    en: 'Open bookmarks sub-panel on mouse hover',
    ru: 'Открывать подпанель закладок при наведении мыши',
    de: 'Öffne Lesezeichen Unter-Panel bei Maus-Hover',
    zh_CN: '在鼠标悬停时打开书签子面板',
    zh_TW: '在鼠標懸停時打開書籤子麵板',
  },
  'settings.discard_inactive_panel_tabs_delay': {
    en: 'Unload tabs of inactive panel after delay',
    ru: 'Выгружать вкладки неактивных панелей c задержкой',
    de: 'Entlade Tabs inaktiver Panels nach Verzögerung',
    zh_CN: '超过延迟时间后卸载非活动面板的标签页',
    zh_TW: '超過延遲時間後卸載非活動面板的標籤頁',
  },
  'settings.discard_inactive_panel_tabs_delay_sec': {
    en: n => (n === 1 ? 'second' : 'seconds'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'секунда'
      if (NUM_234_RE.test(n.toString())) return 'секунды'
      return 'секунд'
    },
    de: n => (n === 1 ? 'Sekunde' : 'Sekunden'),
    zh: '秒'
  },
  'settings.discard_inactive_panel_tabs_delay_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
    de: n => (n === 1 ? 'Minute' : 'Minuten'),
    zh: '分'
  },
  'settings.tabs_second_click_act_prev': {
    en: 'Activate previously active tab when clicking on the active tab (Tab flip',
    ru: 'Активировать ранее активную вкладку при нажатии на активную вкладку',
    de: 'Beim Klicken auf aktiven Tab Aktivierung umkehren',
    zh_CN: '单击活动标签页时向后激活',
    zh_TW: '單擊活動標籤頁時向後激活',
  },
  'settings.tabs_second_click_act_prev_panel_only': {
    ru: 'Только в активной панели',
    en: 'Only in the active panel',
    zh_CN: '仅在活动面板中',
    zh_TW: '僅在活動面板中',
  },

  // - New tab position
  'settings.new_tab_position': {
    en: 'Position of new tab',
    ru: 'Позиция новых вкладок',
    de: 'Position neuer Tabs',
    zh_CN: '新标签页的位置',
    zh_TW: '新標籤頁的位置',
  },
  'settings.move_new_tab_pin': {
    en: 'Place new tab opened from pinned tab',
    ru: 'Открытые из закрепленных вкладок',
    de: 'Platziere Tab, das von angeheftetem Tab geöffnet wird',
    zh_CN: '从固定标签页打开的新标签页的位置',
    zh_TW: '從固定標籤頁打開的新標籤頁的位置',
  },
  'settings.move_new_tab_pin_start': {
    en: 'panel start',
    ru: 'начало панели',
    de: 'Anfang des Panels',
    zh: '面板起始位置'
  },
  'settings.move_new_tab_pin_end': {
    en: 'panel end',
    ru: 'конец панели',
    de: 'Ende des Panels',
    zh: '面板末尾位置'
  },
  'settings.move_new_tab_pin_none': {
    en: 'use general rule',
    ru: 'использовать общее правило',
    de: 'Allgemeine Regel anwenden',
    zh_CN: '使用通用规则',
    zh_TW: '使用通用規則',
  },
  'settings.move_new_tab_parent': {
    en: 'Place new tab opened from another tab',
    ru: 'Открытые из другой вкладки',
    de: 'Platziere Tab, das von anderem Tab geöffnete wird',
    zh_CN: '从其它标签页打开的新标签页的位置',
    zh_TW: '從其它標籤頁打開的新標籤頁的位置',
  },
  'settings.move_new_tab_parent_before': {
    en: 'before parent',
    ru: 'перед родительской',
    de: 'Vor Ursprungstab',
    zh_CN: '父标签之前',
    zh_TW: '父標籤之前',
  },
  'settings.move_new_tab_parent_sibling': {
    en: 'after parent',
    ru: 'после родительской',
    de: 'Nach Ursprungstab',
    zh_CN: '父标签之后',
    zh_TW: '父標籤之後',
  },
  'settings.move_new_tab_parent_first_child': {
    en: 'first child',
    ru: 'первая дочерняя',
    de: 'Als erstes Unterelement',
    zh_CN: '第一个子标签',
    zh_TW: '第一個子標籤',
  },
  'settings.move_new_tab_parent_last_child': {
    en: 'last child',
    ru: 'последняя дочерняя',
    de: 'Als letztes Unterelement',
    zh_CN: '最后一个子标签',
    zh_TW: '最後一個子標籤',
  },
  'settings.move_new_tab_parent_start': {
    en: 'panel start',
    ru: 'начало панели',
    de: 'Anfang des Panels',
    zh: '面板起始位置'
  },
  'settings.move_new_tab_parent_end': {
    en: 'panel end',
    ru: 'конец панели',
    de: 'Ende des Panels',
    zh: '面板末尾位置'
  },
  'settings.move_new_tab_parent_default': {
    en: 'do not move it',
    ru: 'не перемещать',
    de: 'Nicht bewegen',
    zh_CN: '不要移动它',
    zh_TW: '不要移動它',
  },
  'settings.move_new_tab_parent_none': {
    en: 'use general rule',
    ru: 'использовать общее правило',
    de: 'Allgemeine Regel verwenden',
    zh_CN: '使用通用规则',
    zh_TW: '使用通用規則',
  },
  'settings.move_new_tab_parent_act_panel': {
    en: 'Only if panel of parent tab is active',
    ru: 'Только если панель родительской вкладки активна',
    de: 'Nur, wenn Panel des übergeordneten Tabs aktiv ist',
    zh_CN: '仅当父标签页的面板处于活动状态时',
    zh_TW: '僅當父標籤頁的面板處於活動狀態時',
  },
  'settings.ignore_folded_parent': {
    en: 'Open a new tab one level down if the parent tab is folded',
    ru: 'Открывать новую вкладку на уровень ниже, если родительская вкладка свернута',
    de: 'Öffne neuen Tab eine Ebene tiefer, wenn übergeordneter Tab eingeklappt ist',
    zh_CN: '如果父标签页已折叠，则在下一级打开新标签页',
    zh_TW: '如果父標籤頁已折疊，則在下一級打開新標籤頁',
  },
  'settings.move_new_tab': {
    en: 'Place new tab (general rule)',
    ru: 'Общее правило',
    de: 'Neuen Tab platzieren (allgemeine Regel)',
    zh_CN: '新标签的位置（通用规则）',
    zh_TW: '新標籤的位置（通用規則）',
  },
  'settings.move_new_tab_start': {
    en: 'panel start',
    ru: 'начало панели',
    de: 'Anfang des Panels',
    zh: '面板起始位置'
  },
  'settings.move_new_tab_end': {
    en: 'panel end',
    ru: 'конец панели',
    de: 'Ende des Panels',
    zh: '面板末尾位置'
  },
  'settings.move_new_tab_before': {
    en: 'before active tab',
    ru: 'перед активной вкладкой',
    de: 'Vor aktivem Tab',
    zh_CN: '活动标签页之前',
    zh_TW: '活動標籤頁之前',
  },
  'settings.move_new_tab_after': {
    en: 'after active tab',
    ru: 'после активной вкладки',
    de: 'Nach aktivem Tab',
    zh_CN: '活动标签页之后',
    zh_TW: '活動標籤頁之後',
  },
  'settings.move_new_tab_first_child': {
    en: 'first child of active tab',
    ru: 'первая дочерняя вкладка активной',
    de: 'Erstes Unterelement des aktiven Tabs',
    zh_CN: '活动标签页的第一个子标签',
    zh_TW: '活動標籤頁的第一個子標籤',
  },
  'settings.move_new_tab_last_child': {
    en: 'last child of active tab',
    ru: 'последняя дочерняя вкладка активной',
    de: 'Letztes Unterelement des aktiven Tabs',
    zh_CN: '活动标签页的最后一个子标签',
    zh_TW: '活動標籤頁的最後一個子標籤',
  },
  'settings.move_new_tab_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Nichts',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.move_new_tab_active_pin': {
    en: 'If active tab is pinned',
    de: 'Wenn die aktive Tab angeheftet ist',
    ru: 'Если активная вкладка закреплена',
    zh_CN: '如果活动选项卡已固定',
    zh_TW: '如果活動選項卡已固定',
  },

  // - Pinned tabs
  'settings.pinned_tabs_title': {
    en: 'Pinned tabs',
    ru: 'Закрепленные вкладки',
    de: 'Angeheftete Tabs',
    zh_CN: '固定标签页',
    zh_TW: '固定標籤頁',
  },
  'settings.pinned_tabs_position': {
    en: 'Pinned tabs position',
    ru: 'Расположение закрепленных вкладок',
    de: 'Position angehefteter Tabs',
    zh_CN: '固定标签页位置',
    zh_TW: '固定標籤頁位置',
  },
  'settings.pinned_tabs_position_top': {
    en: 'globally - top',
    ru: 'глобально - вверху',
    de: 'Global - Oben',
    zh_CN: '全局 - 顶侧',
    zh_TW: '全局 - 頂側',
  },
  'settings.pinned_tabs_position_left': {
    en: 'globally - left',
    ru: 'глобально - слева',
    de: 'Global - Links',
    zh_CN: '全局 - 左侧',
    zh_TW: '全局 - 左側',
  },
  'settings.pinned_tabs_position_right': {
    en: 'globally - right',
    ru: 'глобально - справа',
    de: 'Global - Rechts',
    zh_CN: '全局 - 右侧',
    zh_TW: '全局 - 右側',
  },
  'settings.pinned_tabs_position_panel': {
    en: 'in panel - top',
    ru: 'на панели - сверху',
    de: 'Im Panel - Oben',
    zh_CN: '面板 - 顶部',
    zh_TW: '面板 - 頂部',
  },
  'settings.pinned_tabs_list': {
    en: 'Show titles of pinned tabs',
    ru: 'Показывать заголовки закрепленных вкладок',
    de: 'Zeige Namen angehefteter Tabs',
    zh_CN: '显示固定标签页的标题',
    zh_TW: '顯示固定標籤頁的標題',
  },
  'settings.pinned.no_unload': {
    en: 'Prevent pinned tabs from unloading',
    ru: 'Предотвращать выгрузку закрепленных вкладок',
    de: 'Verhindere Entladen von angehefteten Tabs',
    zh_CN: '阻止卸载固定标签页',
    zh_TW: '阻止卸載固定標籤頁',
  },
  'settings.pinned_auto_group': {
    en: 'Group tabs that were opened from a pinned tab',
    ru: 'Группировать вкладки, которые были открыты из закрепленной вкладки.',
    de: 'Gruppiere Tabs, die von angehefteten Tabs geöffnet wurden',
    zh_CN: '对从固定标签页打开的标签进行分组',
    zh_TW: '對從固定標籤頁打開的標籤進行分組',
  },

  // - Tabs tree
  'settings.tabs_tree_title': {
    en: 'Tabs tree',
    ru: 'Древовидное отображение вкладок',
    de: 'Tab-Baum',
    zh_CN: '树状标签页',
    zh_TW: '樹狀標籤頁',
  },
  'settings.tabs_tree_layout': {
    en: 'Tabs tree structure',
    ru: 'Древовидное отображение вкладок',
    de: 'Tab-Baum Struktur',
    zh_CN: '标签页树状结构',
    zh_TW: '標籤頁樹狀結構',
  },
  'settings.group_on_open_layout': {
    en: 'Create sub-tree on opening link in new tab',
    ru: 'Создать поддерево при открытии ссылки в новой вкладке',
    de: 'Erstelle Unterebene beim Öffnen von Links in neuem Tab',
    zh_CN: '新标签页中打开链接时创建子树',
    zh_TW: '新標籤頁中打開鏈接時創建子樹',
  },
  'settings.tabs_tree_limit': {
    en: 'Tabs tree level limit',
    ru: 'Максимальный уровень вложенности вкладок',
    de: 'Tab-Baum Ebenenlimit',
    zh_CN: '限制标签页树级别',
    zh_TW: '限制標籤頁樹級別',
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
    zh_TW: '',
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
    zh_TW: '無',
  },
  'settings.hide_folded_tabs': {
    en: 'Hide native tabs in folded branch',
    ru: 'Скрывать нативные вкладки в свернутой ветке',
    de: 'Verstecke eingeklappte Tabs',
    zh_CN: '隐藏已折叠标签页',
    zh_TW: '隱藏已折疊標籤頁',
  },
  'settings.hide_folded_parent': {
    en: 'Also hide the parent tab',
    ru: 'Также скрывать родительскую вкладку',
    zh_CN: '隐藏父标签页',
    zh_TW: '隱藏父標籤頁',
  },
  'settings.hide_folded_parent_any': {
    en: 'any tab',
    ru: 'любую вкладку',
    zh_CN: '任意标签页',
    zh_TW: '任意標籤頁',
  },
  'settings.hide_folded_parent_group': {
    en: 'group tab',
    ru: 'группу вкладку',
    zh_CN: '分组标签页',
    zh_TW: '分組標籤頁',
  },
  'settings.hide_folded_parent_none': {
    en: 'off',
    ru: 'выкл',
    zh_CN: '关闭',
    zh_TW: '關閉',
  },
  'settings.auto_fold_tabs': {
    en: 'Auto fold tabs',
    ru: 'Автоматически сворачивать вкладки',
    de: 'Tabs automatisch einklappen',
    zh_CN: '自动折叠标签页',
    zh_TW: '自動折疊標籤頁',
  },
  'settings.auto_fold_tabs_except': {
    en: 'Max count of open branches',
    ru: 'Максимальное количество открытых веток',
    de: 'Maximalzahl offener Zweige',
    zh: '分支上限'
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
    zh_TW: '激活時自動展開標籤頁',
  },
  'settings.auto_exp_tabs_on_new': {
    en: 'Auto expand branch on creating a new child tab',
    ru: 'Автоматически разворачивать ветку при создании новой дочерней вкладки',
    zh_CN: '创建新的子选项卡时自动展开分支',
    zh_TW: '創建新的子選項卡時自動展開分支',
  },
  'settings.rm_child_tabs': {
    en: 'Close child tabs along with parent',
    ru: 'Закрывать дочерние вкладки вместе с родительской',
    de: 'Untergeordnete Tabs zusammen mit übergeordneten schließen',
    zh_CN: '与父项一起关闭子标签页',
    zh_TW: '與父項一起關閉子標籤頁',
  },
  'settings.rm_child_tabs_all': {
    en: 'all',
    ru: 'все',
    de: 'Alle',
    zh: '所有'
  },
  'settings.rm_child_tabs_folded': {
    en: 'folded',
    ru: 'свернутые',
    de: 'Eingeklappte',
    zh_CN: '已折叠的',
    zh_TW: '已折疊的',
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
    zh_TW: '在折疊標籤上顯示後代數量',
  },
  'settings.tabs_lvl_dots': {
    en: 'Show marks to indicate tabs sub-tree levels',
    ru: 'Показывать отметки уровней вложенности',
    de: 'Zeige Markierungen für Abstufung der Unterebenen der Tabs',
    zh_CN: '显示标记以表示标签页子树的级别',
    zh_TW: '顯示標記以表示標籤頁子樹的級別',
  },
  'settings.discard_folded': {
    en: 'Unload folded tabs',
    ru: 'Выгружать свернутые вкладки',
    de: 'Eingeklappte Tabs entladen',
    zh_CN: '卸载已折叠的标签页',
    zh_TW: '卸載已折疊的標籤頁',
  },
  'settings.discard_folded_delay': {
    en: 'With delay',
    ru: 'Через',
    de: 'Mit Verzögerung',
    zh_CN: '延迟',
    zh_TW: '延遲',
  },
  'settings.discard_folded_delay_sec': {
    en: n => (n === 1 ? 'second' : 'seconds'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'секунда'
      if (NUM_234_RE.test(n.toString())) return 'секунды'
      return 'секунд'
    },
    de: n => (n === 1 ? 'Sekunde' : 'Sekunden'),
    zh: '秒'
  },
  'settings.discard_folded_delay_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
    de: n => (n === 1 ? 'Minute' : 'Minuten'),
    zh: '分'
  },
  'settings.tabs_tree_bookmarks': {
    en: 'Preserve tree on creating bookmarks',
    ru: 'Сохранять древовидную структуру при создании закладок',
    de: 'Baumstruktur beim Erstellen von Lesezeichen erhalten',
    zh_CN: '保存创建书签的树',
    zh_TW: '保存創建書籤的樹',
  },
  'settings.tree_rm_outdent': {
    en: 'After closing parent tab, outdent',
    ru: 'После закрытия родительской вкладки понизить уровень',
    de: 'Nach Schließen von übergeordnetem Tab ausrücken',
    zh_CN: '关闭父标签页后减小缩进',
    zh_TW: '關閉父標籤頁後減小縮進',
  },
  'settings.tree_rm_outdent_branch': {
    en: 'whole branch',
    ru: 'всей ветви',
    de: 'Ganzen Zweig',
    zh_CN: '整个分支',
    zh_TW: '整個分支',
  },
  'settings.tree_rm_outdent_first_child': {
    en: 'first child',
    ru: 'первой дочерней вкладки',
    de: 'Erstes Unterelement',
    zh_CN: '第一个子标签',
    zh_TW: '第一個子標籤',
  },

  // - Tabs colorization
  'settings.tabs_colorization_title': {
    en: 'Tabs colorization',
    ru: 'Раскрашивание вкладок',
    zh_CN: '标签着色',
    zh_TW: '標籤著色',
  },
  'settings.colorize_tabs': {
    en: 'Colorize tabs',
    ru: 'Раскрашивать вкладки',
    de: 'Tabs einfärben',
    zh_CN: '着色标签页',
    zh_TW: '著色標籤頁',
  },
  'settings.colorize_tabs_src': {
    en: 'Generate color from',
    ru: 'Источник для генерации цвета',
    de: 'Generiere Farbe aus',
    zh_CN: '生成颜色来自',
    zh_TW: '生成顏色來自',
  },
  'settings.colorize_tabs_src_domain': {
    en: 'domain',
    ru: 'доменное имя',
    de: 'Domäne',
    zh: '域名'
  },
  'settings.colorize_tabs_src_container': {
    en: 'container',
    ru: 'контейнер',
    de: 'Umgebung',
    zh: '容器'
  },
  'settings.colorize_branches': {
    en: 'Colorize branches',
    ru: 'Раскрашивать ветки',
    de: 'Zweige einfärben',
    zh: '着色分支'
  },
  'settings.colorize_branches_src': {
    en: 'Generate color from',
    ru: 'Источник для генерации цвета',
    de: 'Generiere Farbe aus',
    zh_CN: '生成颜色来自',
    zh_TW: '生成顏色來自',
  },
  'settings.colorize_branches_src_url': {
    en: 'URL',
  },
  'settings.colorize_branches_src_domain': {
    en: 'domain',
    ru: 'доменное имя',
    de: 'Domäne',
    zh: '域名'
  },
  'settings.tabs.inherit_custom_color': {
    en: 'Inherit custom (manually set) color in the child tabs',
    ru: 'Наследовать пользовательский (установленный вручную) цвет в дочерних вкладках',
    zh_CN: '在子选项卡中继承自定义（手动设置）颜色',
    zh_TW: '在子選項卡中繼承自定義（手動設置）顏色',
  },

  // - Native tabs
  'settings.tabs_native_title': {
    en: 'Native (horizontal) tabs',
    ru: 'Нативные (горизонтальные) вкладки',
    de: 'Native (horizontale) Tabs',
    zh_CN: '原生（水平）标签页',
    zh_TW: '原生（水平）標籤頁',
  },

  // - Bookmarks
  'settings.bookmarks_title': {
    en: 'Bookmarks',
    ru: 'Закладки',
    de: 'Lesezeichen',
    zh_CN: '书签',
    zh_TW: '書籤',
  },
  'settings.bookmarks_panel': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
    de: 'Lesezeichen-Panel',
    zh_CN: '书签面板',
    zh_TW: '書籤面板',
  },
  'settings.bookmarks_layout': {
    en: 'Bookmarks layout',
    ru: 'Тип отображения',
    de: 'Lesezeichen Layout',
    zh_CN: '书签布局',
    zh_TW: '書籤佈局',
  },
  'settings.bookmarks_layout_tree': {
    en: 'tree',
    ru: 'дерево',
    de: 'Baum',
    zh_CN: '树状',
    zh_TW: '樹狀',
  },
  'settings.bookmarks_layout_history': {
    en: 'history',
    ru: 'история',
    de: 'Chronik',
    zh_CN: '历史',
    zh_TW: '歷史',
  },
  'settings.warn_on_multi_bookmark_delete': {
    en: 'Warn on trying delete multiple bookmarks',
    ru: 'Предупреждать об удалении нескольких закладкок',
    de: 'Warne beim Löschen mehrerer Lesezeichen',
    zh_CN: '尝试删除多个书签时弹出警告',
    zh_TW: '嘗試刪除多個書籤時彈出警告',
  },
  'settings.warn_on_multi_bookmark_delete_any': {
    en: 'any',
    ru: 'любых',
    de: 'Immer',
    zh: '所有'
  },
  'settings.warn_on_multi_bookmark_delete_collapsed': {
    en: 'collapsed',
    ru: 'свернутых',
    de: 'Eingeklappte',
    zh_CN: '已折叠的',
    zh_TW: '已折疊的',
  },
  'settings.warn_on_multi_bookmark_delete_none': {
    en: 'none',
    ru: 'нет',
    de: 'Nie',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.auto_close_bookmarks': {
    en: 'Auto-close folders',
    ru: 'Автоматически сворачивать папки',
    de: 'Ordner automatisch schließen',
    zh_CN: '自动关闭文件夹',
    zh_TW: '自動關閉文件夾',
  },
  'settings.auto_rm_other': {
    en: 'Auto-delete on opening bookmarks from the "Other Bookmarks" folder',
    ru: 'Удалять открываемые закладки из папки "Другие закладки"',
    de: 'Entferne geöffnete Lesezeichen aus "Weitere Lesezeichen"-Ordner',
    zh_CN: '从“其他书签”文件夹中打开书签时自动删除',
    zh_TW: '從“其他書籤”文件夾中打開書籤時自動刪除',
  },
  'settings.show_bookmark_len': {
    en: 'Show folder size',
    ru: 'Показывать размер папки',
    de: 'Zeige Ordnergröße',
    zh_CN: '显示文件夹大小',
    zh_TW: '顯示文件夾大小',
  },
  'settings.highlight_open_bookmarks': {
    en: 'Mark open bookmarks',
    ru: 'Отмечать открытые закладки',
    de: 'Kennzeichne geöffnete Lesezeichen',
    zh_CN: '标记打开的书签',
    zh_TW: '標記打開的書籤',
  },
  'settings.activate_open_bookmark_tab': {
    en: 'Go to open tab instead of opening new one',
    ru: 'Переходить на открытую вкладку вместо открытия новой',
    de: 'Wechsle zu offenem Tab, statt einen neuen zu öffnen',
    zh_CN: '转到打开的标签而不是打开新的标签',
    zh_TW: '轉到打開的標籤而不是打開新的標籤',
  },
  'settings.bookmarks_rm_undo_note': {
    en: 'Show undo notification after deleting bookmarks',
    ru: 'Показывать уведомление об удалении нескольких закладок',
    de: 'Zeige "Rückgängig"-Meldung nachdem Lesezeichen gelöscht wurden',
    zh_CN: '删除书签后显示撤消通知',
    zh_TW: '刪除書籤後顯示撤消通知',
  },
  'settings.fetch_bookmarks_favs': {
    en: 'Fetch favicons',
    ru: 'Загрузить иконки',
    de: 'Favicons herunterladen',
    zh_CN: '获取网站图标',
    zh_TW: '獲取網站圖標',
  },
  'settings.fetch_bookmarks_favs_stop': {
    en: 'Stop fetching',
    ru: 'Остановить загрузку',
    de: 'Herunterladen stoppen',
    zh_CN: '停止获取',
    zh_TW: '停止獲取',
  },
  'settings.fetch_bookmarks_favs_done': {
    en: 'done',
    ru: 'завершено',
    de: 'Fertig',
    zh: '已完成'
  },
  'settings.fetch_bookmarks_favs_errors': {
    en: 'errors',
    ru: 'ошибок',
    de: 'Fehler',
    zh_CN: '错误',
    zh_TW: '錯誤',
  },
  'settings.load_bookmarks_on_demand': {
    en: 'Load bookmarks on demand',
    ru: 'Инициализоровать сервис закладок только по необходимости',
    de: 'Lade Lesezeichen bei Bedarf',
    zh_CN: '按需加载书签',
    zh_TW: '按需加載書籤',
  },
  'settings.pin_opened_bookmarks_folder': {
    en: 'Always show open folders when scrolling',
    ru: 'Всегда показывать открытые папки при прокрутке',
    de: 'Geöffneten Ordner beim Scrollen anheften',
    zh_CN: '滚动时固定已打开的文件夹',
    zh_TW: '滾動時固定已打開的文件夾',
  },
  'settings.old_bookmarks_after_save': {
    en: 'What to do with old bookmarks after saving tabs panel',
    ru: 'Что делать со старыми закладками после сохранения панели вкладок',
    zh_CN: '保存标签面板后如何处理旧书签',
    zh_TW: '保存標籤面板後如何處理舊書籤',
  },
  'settings.old_bookmarks_after_save_ask': {
    en: 'ask',
    ru: 'спросить',
    zh_CN: '询问',
    zh_TW: '詢問',
  },
  'settings.old_bookmarks_after_save_del': {
    en: 'delete',
    ru: 'удалить',
    zh: '刪除'
  },
  'settings.old_bookmarks_after_save_keep': {
    en: 'keep',
    ru: 'оставить',
    zh: '保留'
  },

  // - History
  'settings.history_title': {
    en: 'History',
    ru: 'История',
    de: 'Chronik',
    zh_CN: '历史',
    zh_TW: '歷史',
  },
  'settings.load_history_on_demand': {
    en: 'Initialize history service on demand',
    ru: 'Инициализоровать сервис истории только по необходимости',
    zh_CN: '按需初始化历史服务',
    zh_TW: '按需初始化歷史服務',
    de: 'Chronik-Dienst bei Bedarf initialisieren',
  },

  // - Appearance
  'settings.appearance_title': {
    en: 'Appearance',
    ru: 'Вид',
    de: 'Aussehen',
    zh_CN: '外观',
    zh_TW: '外觀',
  },
  'settings.font_size': {
    en: 'Font size',
    ru: 'Размер шрифта',
    de: 'Schriftgröße',
    zh_CN: '字体大小',
    zh_TW: '字體大小',
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
    zh_TW: '主題',
  },
  'settings.theme_proton': {
    en: 'proton',
    ru: 'proton',
    de: 'Proton',
    zh_CN: '质子',
    zh_TW: '質子',
  },
  'settings.theme_plain': {
    en: 'plain',
    ru: 'plain',
    de: 'Schlicht',
    zh: '淡雅',
  },
  'settings.density': {
    en: 'Density',
    ru: 'Размер элементов',
    de: 'Dichte',
    zh: '排列方式'
  },
  'settings.density_compact': {
    en: 'compact',
    ru: 'компактный',
    de: 'Kompakt',
    zh_CN: '紧凑',
    zh_TW: '緊湊',
  },
  'settings.density_default': {
    en: 'default',
    ru: 'стандартный',
    de: 'Standard',
    zh_CN: '默认',
    zh_TW: '默認',
  },
  'settings.density_loose': {
    en: 'relaxed',
    ru: 'свободный',
    de: 'Locker',
    zh_CN: '宽松',
    zh_TW: '鬆鬆',
  },
  'settings.switch_color_scheme': {
    en: 'Color scheme',
    ru: 'Цветовая схема',
    de: 'Farbschema',
    zh: '配色方案'
  },
  'settings.color_scheme_dark': {
    en: 'dark',
    ru: 'темная',
    de: 'Dunkel',
    zh: '暗黑'
  },
  'settings.color_scheme_light': {
    en: 'light',
    ru: 'светлая',
    de: 'Hell',
    zh: '明亮'
  },
  'settings.color_scheme_sys': {
    en: 'auto: dark/light',
    ru: 'авто: темная/светлая',
    de: 'Auto: dunkel/hell',
    zh_CN: '自动: 暗黑/明亮',
    zh_TW: '自動: 暗黑/明亮',
  },
  'settings.color_scheme_ff': {
    en: 'firefox',
    ru: 'firefox',
    de: 'Firefox',
    zh: 'Firefox'
  },
  'settings.bg_noise': {
    en: 'Frosted background',
    ru: 'Матовый задний фон',
    de: 'Frostiger Hintergrund',
    zh: '磨砂背景'
  },
  'settings.animations': {
    en: 'Animations',
    ru: 'Анимации',
    de: 'Animationen',
    zh_CN: '动画',
    zh_TW: '動畫',
  },
  'settings.animation_speed': {
    en: 'Animations speed',
    ru: 'Скорость анимации',
    de: 'Animationsgeschwindigkeit',
    zh_CN: '动画速度',
    zh_TW: '動畫速度',
  },
  'settings.animation_speed_fast': {
    en: 'fast',
    ru: 'быстрая',
    de: 'Schnell',
    zh: '快'
  },
  'settings.animation_speed_norm': {
    en: 'normal',
    ru: 'средняя',
    de: 'Normal',
    zh: '正常'
  },
  'settings.animation_speed_slow': {
    en: 'slow',
    ru: 'медленная',
    de: 'Langsam',
    zh: '慢'
  },
  'settings.edit_styles': {
    en: 'Edit styles',
    ru: 'Редактировать стили',
    de: 'Stile anpassen',
    zh_CN: '编辑样式',
    zh_TW: '編輯樣式',
  },
  'settings.edit_theme': {
    en: 'Edit theme',
    ru: 'Редактировать тему',
    de: 'Theme anpassen',
    zh_CN: '编辑主题',
    zh_TW: '編輯主題',
  },
  'settings.appearance_notes_title': {
    en: 'Notes:',
    ru: 'Примечания:',
    de: 'Hinweis:',
    zh_CN: '说明:',
    zh_TW: '說明',
  },
  'settings.appearance_notes': {
    en: '- To apply theme color to Sidebery buttons in browser interface set "svg.context-properties.content.enabled" to "true" in about:config page.',
    ru: '- Чтобы применить цвет темы к кнопкам Sidebery в интерфейсе браузера, установите «svg.context-properties.content.enabled» в «true» на странице about:config.',
    de: '- Um Theme-Farbe auf Sidebery-Schaltflächen in Browseroberfläche anzuwenden, setze "svg.context-properties.content.enabled" auf "true" auf about:config Seite.',
    zh_CN:
      '- 为了将主题颜色应用于浏览器界面的 Sidebery 按钮，需要在about:config页面中设置 "svg.context-properties.content.enabled "的值为 "true".',
    zh_TW:
      '- 要將主題顏色應用於瀏覽器界面中的 Sidebery 按鈕，請在 about:config 頁面中將“svg.context-properties.content.enabled”設置為“true”。',
  },

  // - Snapshots
  'settings.snapshots_title': {
    en: 'Snapshots',
    ru: 'Снепшоты',
    de: 'Schnappschüsse',
    zh: '快照'
  },
  'settings.snap_notify': {
    en: 'Show notification after snapshot creation',
    ru: 'Показать уведомление после создания снепшота',
    de: 'Zeige Benachrichtigung nach Erstellen von Schnappschuss',
    zh_CN: '创建快照后显示通知',
    zh_TW: '創建快照後顯示通知',
  },
  'settings.snap_exclude_private': {
    en: 'Exclude private windows',
    ru: 'Исключать приватные окна',
    de: 'Private Fenster ausschließen',
    zh_CN: '排除隐私窗口',
    zh_TW: '排除隱私窗口',
  },
  'settings.snap_interval': {
    en: 'Auto-snapshots interval',
    ru: 'Интервал авто-снепшотов',
    de: 'Auto-Schnappschuss Intervall',
    zh_CN: '自动快照间隔',
    zh_TW: '自動快照間隔',
  },
  'settings.snap_auto_export': {
    en: 'Auto export (on every snapshot)',
    ru: 'Автоэкспорт (при каждом снимке)',
    de: 'Auto-Export (bei jedem Snapshot)',
    zh_CN: '自动导出（每次快照时）',
  },
  'settings.snap_auto_export_type': {
    en: 'Auto export format(s)',
    ru: 'Формат(ы) автоэкспорта',
    de: 'Auto-Export Format(e)',
    zh_CN: '自动导出格式',
  },
  'settings.snap_auto_export_type_json': {
    en: 'json',
  },
  'settings.snap_auto_export_type_md': {
    en: 'md',
  },
  'settings.snap_auto_export_type_both': {
    en: 'both',
    ru: 'оба',
    de: 'beide',
    zh_CN: '以上两者',
    zh_TW: '以上兩者',
  },
  'settings.snap_export_md_tree': {
    en: 'Full-tree structure in Markdown',
    ru: 'Полная древовидная структура в Markdown',
    de: 'Vollständige Baumstruktur in Markdown',
    zh_CN: 'Markdown 中的完整树结构',
    zh_TW: 'Markdown 中的完整樹結構',
  },
  'settings.snap_export_md_tree_note': {
    en: 'Add additional indents and bullets to window and panel items.',
    ru: 'Добавить дополнительные отступы и маркеры к пунктам окон и панелей.',
    de: 'Füge zusätzliche Einrückungen und Aufzählungszeichen zu Fenster- und Panel-Elementen hinzu.',
    zh_CN: '为窗口和面板项目添加额外的缩进和项目符号。',
    zh_TW: '為視窗和面板項目添加額外的縮進和項目符號。',
  },
  'settings.snap_export_path': {
    en: 'Path with file name',
    ru: 'Путь с именем файла',
    de: 'Pfad mit Dateinamen',
    zh_CN: '路径和文件名',
    zh_TW: '路徑和文件名',
  },
  'settings.snap_export_path_note': {
    en: `Note: Path is relative to the downloads folder.
%Y - year; %M - month; %D - day; %h - hour; %m - minute; %s - second`,
    ru: `Примечание: Путь указывается относительно папки загрузок.
%Y - год; %M - месяц; %D - день; %h - час; %m - минута; %s - секунда`,
    de: `Hinweis: Pfad ist relativ zum Download-Ordner.
%Y - Jahr; %M - Monat; %D - Tag; %h - Stunde; %m - Minute; %s - Sekunde`,
    zh_CN: `注意：路径是相对于下载文件夹的。
%Y - 年; %M - 月; %D - 日; %h - 小时; %m - 分钟; %s - 秒`,
    zh_TW: `注意：路徑是相对于下載檔案夾的。
%Y - 年; %M - 月; %D - 日; %h - 小時; %m - 分鐘; %s - 秒`,
  },
  'settings.snap_export_path_ph': {
    en: 'Sidebery/snapshot-%Y.%M.%D-%h.%m.%s',
    ru: 'Sidebery/snapshot-%Y.%M.%D-%h.%m.%s',
    de: 'Sidebery/snapshot-%Y.%M.%D-%h.%m.%s',
    zh: 'Sidebery/快照-%Y.%M.%D-%h.%m.%s',
  },
  'settings.snap_interval_min': {
    en: n => (n === 1 ? 'minute' : 'minutes'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'минута'
      if (NUM_234_RE.test(n.toString())) return 'минуты'
      return 'минут'
    },
    de: n => (n === 1 ? 'Minute' : 'Minuten'),
    zh: '分'
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
    zh_TW: '小時',
  },
  'settings.snap_interval_day': {
    en: n => (n === 1 ? 'day' : 'days'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'день'
      if (NUM_234_RE.test(n.toString())) return 'дня'
      return 'дней'
    },
    de: n => (n === 1 ? 'Tag' : 'Tage'),
    zh: '天'
  },
  'settings.snap_interval_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Keines',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.snap_limit': {
    en: 'Snapshots limit',
    ru: 'Лимиты',
    de: 'Schnappschuss Limit',
    zh: '快照上限'
  },
  'settings.snap_limit_snap': {
    en: n => (n === 1 ? 'snapshot' : 'snapshots'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'снепшот'
      if (NUM_234_RE.test(n.toString())) return 'снепшота'
      return 'снепшотов'
    },
    de: n => (n === 1 ? 'Schnappschuss' : 'Schnappschüsse'),
    zh: '快照'
  },
  'settings.snap_limit_kb': {
    en: n => (n === 1 ? 'kbyte' : 'kbytes'),
    ru: (n = 0): string => {
      if (NUM_234_RE.test(n.toString())) return 'кбайта'
      return 'кбайт'
    },
    de: n => (n === 1 ? 'kbyte' : 'kbytes'),
    zh_CN: '千字节',
    zh_TW: n => (n === 1 ? 'kbyte' : 'kbytes'),
  },
  'settings.snap_limit_day': {
    en: n => (n === 1 ? 'day' : 'days'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'день'
      if (NUM_234_RE.test(n.toString())) return 'дня'
      return 'дней'
    },
    de: n => (n === 1 ? 'Tag' : 'Tage'),
    zh: '天'
  },
  'settings.snapshots_view_label': {
    en: 'View snapshots',
    ru: 'Просмотреть снепшоты',
    de: 'Schnappschüsse ansehen',
    zh: '查看快照'
  },
  'settings.make_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
    de: 'Erstelle Schnappschuss',
    zh_CN: '创建快照',
    zh_TW: '創建快照',
  },
  'settings.rm_all_snapshots': {
    en: 'Remove all snapshots',
    ru: 'Удалить все снепшоты',
    de: 'Entferne alle Schnappschüsse',
    zh_CN: '删除所有快照',
    zh_TW: '刪除所有快照',
  },
  'settings.apply_snapshot': {
    en: 'apply',
    ru: 'применить',
    de: 'Anwenden',
    zh_CN: '应用',
    zh_TW: '應用',
  },
  'settings.rm_snapshot': {
    en: 'remove',
    ru: 'удалить',
    de: 'Entfernen',
    zh_CN: '删除',
    zh_TW: '刪除',
  },

  // - Mouse
  'settings.mouse_title': {
    en: 'Mouse',
    ru: 'Мышь',
    de: 'Maus',
    zh_CN: '鼠标',
    zh_TW: '鼠標',
  },
  'settings.h_scroll_action': {
    en: 'Use horizontal scroll to',
    ru: 'Использовать горизонтальную прокрутку для',
    de: 'Nutze horizontales Scrollen für',
    zh_CN: '使用滚轮水平滚动',
    zh_TW: '使用滾輪水平滾動',
  },
  'settings.h_scroll_action_switch_panels': {
    en: 'switch panels',
    ru: 'переключения панелей',
    de: 'Panel wechseln',
    zh_CN: '切换面板',
    zh_TW: '切換面板',
  },
  'settings.h_scroll_action_switch_act_tabs': {
    en: 'switch recently active tabs',
    de: 'Zuletzt aktive Tabs wechseln',
    ru: 'переключения вкладок в порядке активации',
    zh_CN: '切换到最近活动的标签页',
    zh_TW: '切換到最近活動的標籤頁',
  },
  'settings.h_scroll_action_none': {
    en: 'do nothing',
    de: 'Nichts',
    ru: 'ничего',
    zh_CN: '无动作',
    zh_TW: '無動作',
  },
  'settings.scroll_through_tabs': {
    en: 'Switch tabs with scroll wheel',
    ru: 'Переключать вкладки с помощью колеса прокрутки',
    zh_CN: '使用滚轮切换标签页',
    zh_TW: '使用滾輪切換標籤頁',
    de: 'Wechsle Tabs mit dem Scrollrad',
  },
  'settings.scroll_through_tabs_panel': {
    en: 'in panel',
    ru: 'на панели',
    de: 'Im Panel',
    zh: '在面板中'
  },
  'settings.scroll_through_tabs_global': {
    en: 'globally',
    ru: 'глобально',
    de: 'Global',
    zh: '全局'
  },
  'settings.scroll_through_tabs_psp': {
    en: 'preselect in panel',
    ru: 'предварительное выделение в панели',
    de: 'Vorauswahl im Panel',
    zh_CN: '在面板中预选',
    zh_TW: '在面板中預選',
  },
  'settings.scroll_through_tabs_psg': {
    en: 'preselect globally',
    ru: 'предварительное выделение глобально',
    de: 'Global vorauswählen',
    zh_CN: '全局预选',
    zh_TW: '全局預選',
  },
  'settings.scroll_through_tabs_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Nie',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.scroll_through_tabs_preselect_note': {
    en: 'Select tab with scroll wheel and activate it after mouse leave',
    ru: 'Выделять вкладку с помощью колеса прокрутки и активировать ее, когда курсор мыши убран',
    de: 'Wähle Tab mit dem Scrollrad aus und aktiviere ihn nach Verlassen der Maus',
    zh_CN: '使用滚轮选择标签页，并在鼠标离开后激活它',
    zh_TW: '使用滾輪選擇標籤頁，並在滑鼠離開後啟用它',
  },
  'settings.scroll_through_visible_tabs': {
    en: 'Skip folded tabs',
    ru: 'Пропускать свернутые',
    de: 'Überspringe eingeklappte Tabs',
    zh_CN: '跳过已折叠的标签',
    zh_TW: '跳過已折疊的標籤',
  },
  'settings.scroll_through_tabs_skip_discarded': {
    en: 'Skip unloaded tabs',
    ru: 'Пропускать выгруженые',
    de: 'Überspringe entladene Tabs',
    zh_CN: '跳过已丢弃的标签',
    zh_TW: '跳過已丟棄的標籤',
  },
  'settings.scroll_through_tabs_except_overflow': {
    en: 'Unless panel is overflowing',
    de: 'Außer, wenn Panel überläuft',
    ru: 'За исключением случаев, когда панель переполнена',
    zh: '溢出面板除外'
  },
  'settings.scroll_through_tabs_cyclic': {
    en: 'Cyclically',
    ru: 'Зациклить',
    de: 'Zyklisch',
    zh_CN: '循环',
    zh_TW: '循環',
  },
  'settings.scroll_through_tabs_scroll_area': {
    en: 'Scroll area width (px)',
    ru: 'Ширина зоны для скролла (px)',
    de: 'Größe des Scrollbereichs (px)',
    zh_CN: '滚动区域宽度 (px)',
    zh_TW: '滾動區域寬度 (px)',
  },
  'settings.scroll_through_tabs_scroll_area_note': {
    en: 'Positive - at the right, negative - at the left side of the panel',
    ru: 'Положительное значение - справа, отрицательное - слева на панели',
    de: 'Positiv - rechte Seite, Negativ - linke Seite des Panels',
    zh_CN: '正数 - 在面板右侧，负数 - 在面板左侧',
    zh_TW: '正数 - 面板左侧滚动 负数 - 面板右侧滚动',
  },
  'settings.auto_menu_multi_sel': {
    en: 'Automatically open context menu on right-button multi-selection',
    ru: 'Автоматически открывать контекстное меню при множественном выборе правой кнопкой',
    de: 'Bei Rechtsklick Mehrfachauswahl automatisch Kontextmenü öffnen',
    zh_CN: '右键多选时自动打开上下文菜单',
    zh_TW: '右鍵多選時自動打開上下文菜單',
  },
  'settings.auto_menu_multi_sel_note': {
    en: 'Only for non-native context menu',
    ru: 'Только для несистемного контекстного меню',
    de: 'Nur bei nicht-nativem Kontextmenü',
    zh_CN: '仅适用于非原生上下文菜单',
    zh_TW: '僅適用於非原生上下文菜單',
  },
  'settings.multiple_middle_close': {
    en: 'Use multi-selection when closing tabs with middle-click',
    ru: 'Использовать множественный выбор при закрытии вкладок средней кнопкой мыши',
    de: 'Verwenden Sie die Mehrfachauswahl, wenn Sie Tabs mit einem Mittelklick schließen',
    zh_CN: '使用中键单击关闭选项卡时使用多选',
    zh_TW: '使用中鍵單擊關閉選項卡時使用多選',
  },
  'settings.multiple_middle_close_note': {
    en: 'Selected tabs will be closed on releasing the button',
    ru: 'Выбранные вкладки будут закрыты при отпускании кнопки',
    de: 'Ausgewählte Registerkarten werden beim Loslassen der Schaltfläche geschlossen',
    zh_CN: '释放按钮时将关闭选定的选项卡',
    zh_TW: '釋放按鈕時將關閉選定的選項卡',
  },
  'settings.long_click_delay': {
    en: 'Long click delay (ms)',
    ru: 'Задержка длительного нажатия (мс)',
    zh_CN: '长按延迟（毫秒）',
    zh_TW: '長按延遲（毫秒）',
    de: 'Dauer für langen Klick (ms)',
  },
  'settings.wheel_threshold': {
    en: 'Set threshold for switching between panels and tabs with mouse wheel',
    ru: 'Установить порог для переключения между панелями и вкладками с помощью колесика мыши',
    de: 'Grenzwert für Mausrad-Wechsel zwischen Panels und Tabs',
    zh_CN: '设置使用鼠标滚轮在面板和选项卡之间切换的阈值',
    zh_TW: '設置使用鼠標滾輪在面板和選項卡之間切換的閾值',
  },
  'settings.wheel_threshold_y': {
    en: 'Vertical scrolling (px)',
    ru: 'Вертикальная прокрутка (px)',
    de: 'Vertikales Scrollen (px)',
    zh_CN: '垂直滚动 (px)',
    zh_TW: '垂直滾動 (px)',
  },
  'settings.wheel_threshold_x': {
    en: 'Horizontal scrolling (px)',
    ru: 'Горизонтальная прокрутка (px)',
    de: 'Horizontales Scrollen (px)',
    zh_CN: '水平滚动 (px)',
    zh_TW: '水平滾動 (px)',
  },

  'settings.nav_actions_sub_title': {
    en: 'Navigation bar actions',
    ru: 'Действия над навигацией',
    zh_CN: '导航栏操作',
    zh_TW: '導航欄操作',
    de: 'Aktionen mit Navigationsleiste',
  },

  'settings.tab_actions_sub_title': {
    en: 'Tab actions',
    ru: 'Действия над вкладками',
    de: 'Aktionen mit Tabs',
    zh_CN: '标签页操作',
    zh_TW: '標籤頁操作',
  },
  'settings.tab_double_click': {
    en: 'Double click on tab',
    ru: 'Двойной клик по вкладке',
    de: 'Doppelklick auf Tab',
    zh_CN: '双击标签页',
    zh_TW: '雙擊標籤頁',
  },
  'settings.activate_on_mouseup': {
    en: 'Activate tab on mouse button release',
    ru: 'Активировать вкладку при отпускании кнопки мыши',
    de: 'Aktiviere Tab beim Loslassen der Maustaste',
    zh_CN: '释放鼠标按钮时激活标签页',
    zh_TW: '釋放鼠標按鈕時激活標籤頁',
  },
  'settings.shift_selection_from_active': {
    en: 'Start shift+click selection from the active tab',
    ru: 'Начинать выделение по shift+клику с активной вкладки',
    zh_CN: '活动标签页中启用 shift + 点击 进行选择',
    zh_TW: '活動標籤頁中啟用 shift + 點擊 進行選擇',
    de: 'Starte Umschalt+Klick Auswahl beim aktiven Tab',
  },
  'settings.tab_long_left_click': {
    en: 'Long left click on tab',
    ru: 'Длительное нажатие левой кнопки мыши по вкладке',
    zh_CN: '长按左击标签页',
    zh_TW: '長按左擊標籤頁',
    de: 'Langer Linksklick auf Tab',
  },
  'settings.tab_long_right_click': {
    en: 'Long right click on tab',
    ru: 'Длительное нажатие правой кнопки мыши по вкладке',
    zh_CN: '长按右击标签页',
    zh_TW: '長按右擊標籤頁',
    de: 'Langer Rechtsklick auf Tab',
  },
  'settings.tab_middle_click': {
    en: 'Middle click on tab',
    ru: 'Нажатие средней кнопкой мыши по вкладке',
    zh_CN: '中键单击标签页',
    zh_TW: '中鍵單擊標籤頁',
    de: 'Mittlerer Klick auf Tab',
  },
  'settings.tab_middle_click_ctrl': {
    en: 'With Ctrl key pressed',
    ru: 'С зажатой клавишей Ctrl',
    de: 'Mit gedrückter Strg-Taste',
    zh_CN: '按住 Ctrl 键',
    zh_TW: '按住 Ctrl 鍵',
  },
  'settings.tab_middle_click_shift': {
    en: 'With Shift key pressed',
    ru: 'С зажатой клавишей Shift',
    de: 'Mit gedrückter Shift-Taste',
    zh_CN: '按住 Shift 键',
    zh_TW: '按住 Shift 鍵',
  },
  'settings.tab_close_middle_click': {
    en: 'Middle click on close tab button',
    ru: 'Нажатие средней кнопкой мыши по кнопке закрытия вкладки',
    zh_CN: '中键单击关闭标签页按钮',
    zh_TW: '中鍵單擊關閉標籤頁按鈕',
    de: 'Klicken mit mittlerer Maustaste auf "Schließen"-Knopf',
  },
  'settings.tab_action_reload': {
    en: 'reload',
    ru: 'перезагрузить',
    de: 'Neu laden',
    zh_CN: '重新加载',
    zh_TW: '重新加載',
  },
  'settings.tab_action_duplicate': {
    en: 'duplicate',
    ru: 'дублировать',
    de: 'Duplizieren',
    zh_CN: '复制',
    zh_TW: '複製',
  },
  'settings.tab_action_pin': {
    en: 'pin',
    ru: 'закрепить',
    de: 'Anheften',
    zh: '固定'
  },
  'settings.tab_action_mute': {
    en: 'mute',
    ru: 'выключить звук',
    zh_CN: '静音',
    zh_TW: '靜音',
    de: 'Stumm schalten',
  },
  'settings.tab_action_clear_cookies': {
    en: 'clear cookies',
    ru: 'удалить cookies',
    de: 'Cookies löschen',
    zh: '清除 Cookies'
  },
  'settings.tab_action_exp': {
    en: 'expand',
    ru: 'развернуть',
    zh_CN: '展开',
    zh_TW: '展開',
    de: 'Ausklappen',
  },
  'settings.tab_action_new_after': {
    en: 'new sibling tab',
    ru: 'новая вкладка',
    zh_CN: '新建兄弟标签页',
    zh_TW: '新建兄弟標籤頁',
    de: 'Neuer Tab auf gleicher Ebene',
  },
  'settings.tab_action_new_child': {
    en: 'new child tab',
    ru: 'новая дочерняя вкладка',
    de: 'Neuer untergeordneter Tab',
    zh_CN: '新建子标签页',
    zh_TW: '新建子標籤頁',
  },
  'settings.tab_action_close': {
    en: 'close tab',
    ru: 'закрыть вкладку',
    de: 'Tab schließen',
    zh_CN: '关闭标签页',
    zh_TW: '關閉標籤頁',
  },
  'settings.tab_action_discard': {
    en: 'unload',
    ru: 'выгрузить',
    de: 'Entladen',
    zh_CN: '卸载',
    zh_TW: '卸載',
  },
  'settings.tab_action_edit_title': {
    en: 'edit title',
    ru: 'редактировать заголовок',
    zh_CN: '编辑标题',
    zh_TW: '編輯標題',
  },
  'settings.tab_action_none': {
    en: 'none',
    ru: 'выкл',
    zh_CN: '无',
    zh_TW: '無',
    de: 'Nichts',
  },

  'settings.tabs_panel_actions_sub_title': {
    en: 'Tabs panel actions',
    ru: 'Действия над панелью c вкладками',
    zh_CN: '标签页面板操作',
    zh_TW: '標籤頁面板操作',
    de: 'Aktionen mit Tab-Panels',
  },
  'settings.tabs_panel_left_click_action': {
    en: 'Left click on tabs panel',
    ru: 'Левый клик по панели с вкладками',
    zh_CN: '左击标签页面板',
    zh_TW: '左擊標籤頁面板',
    de: 'Linksklick auf Tab-Panel',
  },
  'settings.tabs_panel_double_click_action': {
    en: 'Double click on tabs panel',
    ru: 'Двойной клик по панели с вкладками',
    zh_CN: '双击标签页面板',
    zh_TW: '雙擊標籤頁面板',
    de: 'Doppelklick auf Tab-Panel',
  },
  'settings.tabs_panel_right_click_action': {
    en: 'Right click on tabs panel',
    ru: 'Правый клик по панели с вкладками',
    de: 'Rechtsklick auf Tab-Panel',
    zh_CN: '右击标签页面板',
    zh_TW: '右擊標籤頁面板',
  },
  'settings.tabs_panel_middle_click_action': {
    en: 'Middle click on tabs panel',
    ru: 'Средний клик по панели с вкладками',
    zh_CN: '中键单击标签页面板',
    zh_TW: '中鍵單擊標籤頁面板',
    de: 'Mittlere Maustaste auf Tab-Panel',
  },
  'settings.tabs_panel_action_tab': {
    en: 'create tab',
    ru: 'создать вкладку',
    de: 'Tab erstellen',
    zh_CN: '创建标签页',
    zh_TW: '創建標籤頁',
  },
  'settings.tabs_panel_action_prev': {
    en: 'previous panel',
    ru: 'пред. панель',
    de: 'Vorheriges Panel',
    zh_CN: '前一个面板',
    zh_TW: '前一個面板',
  },
  'settings.tabs_panel_action_next': {
    en: 'next panel',
    ru: 'след. панель',
    de: 'Nächstes Panel',
    zh_CN: '后一个面板',
    zh_TW: '後一個面板',
  },
  'settings.tabs_panel_action_expand': {
    en: 'expand/fold',
    ru: 'развернуть/свернуть',
    zh_CN: '展开/折叠',
    zh_TW: '展開/折疊',
    de: 'Ein-/Ausklappen',
  },
  'settings.tabs_panel_action_parent': {
    en: 'activate parent tab',
    ru: 'перейти к родительской вкладке',
    zh_CN: '激活父标签页',
    zh_TW: '激活父標籤頁',
    de: 'Obersten Tab aktivieren',
  },
  'settings.tabs_panel_action_menu': {
    en: 'show menu',
    ru: 'открыть меню',
    de: 'Menü anzeigen',
    zh_CN: '展示菜单',
    zh_TW: '展示菜單',
  },
  'settings.tabs_panel_action_collapse': {
    en: 'collapse inactive branches',
    ru: 'свернуть неактивные ветки',
    de: 'Inaktive Zweige einklappen',
    zh_CN: '折叠非活动分支',
    zh_TW: '折疊非活動分支',
  },
  'settings.tabs_panel_action_undo': {
    en: 'undo tab close',
    ru: 'восстановить закрытую вкладку',
    zh_CN: '撤消关闭标签页',
    zh_TW: '撤消關閉標籤頁',
    de: '"Tab schließen" rückgängig machen',
  },
  'settings.tabs_panel_action_rm_act_tab': {
    en: 'close active tab',
    ru: 'закрыть активную вкладку',
    de: 'Aktiven Tab schließen',
    zh_CN: '关闭活动标签',
    zh_TW: '關閉活動標籤',
  },
  'settings.tabs_panel_action_none': {
    en: 'none',
    ru: 'выкл',
    de: 'Nichts',
    zh_CN: '无',
    zh_TW: '無',
  },
  'settings.mouse.new_tab_button_title': {
    en: 'New Tab button actions',
    de: 'Aktionen für neue Tab-Schaltflächen',
    ru: 'Взаимодействия с кнопкой "Новая вкладка"',
    zh_CN: '新选项卡按钮操作',
    zh_TW: '新選項卡按鈕操作',
  },
  'settings.mouse.new_tab_middle_click_action': {
    en: 'Middle click on New Tab button',
    de: 'Mittlere Maustaste auf Schaltfläche "Neuer Tab"',
    ru: 'Средний клик по кнопке "Новая вкладка"',
    zh_CN: '中键单击新标签按钮',
    zh_TW: '中鍵單擊新標籤按鈕',
  },
  'settings.mouse.new_tab_action_new_child': {
    en: 'open new child tab',
    de: 'Öffnen Sie eine neue Unterregisterkarte',
    ru: 'открыть новую дочернюю вкладку',
    zh_CN: '打开新的子标签',
    zh_TW: '打開新的子標籤',
  },
  'settings.mouse.new_tab_action_reopen': {
    en: 'apply container or URL',
    de: 'Container oder URL anwenden',
    ru: 'применить контейнер или URL',
    zh_CN: '应用容器或 URL',
    zh_TW: '應用容器或 URL',
  },

  'settings.mouse.bookmarks_title': {
    en: 'Bookmarks actions',
    ru: 'Действия над закладками',
    de: 'Aktionen mit Lesezeichen',
    zh_CN: '书签动作',
    zh_TW: '書籤動作',
  },
  'settings.mouse.bookmarks.left_click_action': {
    en: 'Left-click on the bookmark',
    ru: 'Левый клик по закладке',
    de: 'Linksklick auf Lesezeichen',
    zh_CN: '左击书签',
    zh_TW: '左擊書籤',
  },
  'settings.mouse.bookmarks.left_click_action_open_in_act': {
    en: 'open in active tab',
    de: 'Öffne im aktiven Tab',
    ru: 'открыть в активной вкладке',
    zh_CN: '在活动标签页打开',
    zh_TW: '在活動標籤頁打開',
  },
  'settings.mouse.bookmarks.left_click_action_open_in_new': {
    en: 'open in new tab',
    de: 'Öffne in neuem Tab',
    ru: 'открыть в новой вкладке',
    zh_CN: '在新标签页打开',
    zh_TW: '在新標籤頁打開',
  },
  'settings.mouse.bookmarks.new_tab_activate': {
    en: 'Activate the new tab',
    ru: 'Активировать новую вкладку',
    de: 'Neuen Tab aktivieren',
    zh_CN: '激活新标签页',
    zh_TW: '激活新標籤頁',
  },
  'settings.mouse.bookmarks.new_tab_rm': {
    en: 'Remove clicked bookmark',
    ru: 'Удалить исходную закладку',
    zh_CN: '删除点击的书签',
    zh_TW: '刪除點擊的書籤',
  },
  'settings.mouse.bookmarks.new_tab_pos': {
    en: 'Position of the new tab',
    ru: 'Положение новой вкладки',
    de: 'Position des neuen Tabs',
    zh_CN: '新标签页位置',
    zh_TW: '新標籤頁位置',
  },
  'settings.mouse.bookmarks.new_tab_pos_default': {
    en: 'default',
    ru: 'по умолчанию',
    de: 'Standard',
    zh_CN: '默认',
    zh_TW: '默認',
  },
  'settings.mouse.bookmarks.new_tab_pos_after': {
    en: 'after active tab',
    de: 'Nach aktivem Tab',
    ru: 'после активной вкладки',
    zh_CN: '活动标签页之后',
    zh_TW: '活動標籤頁之後',
  },
  'settings.mouse.bookmarks.mid_click_action': {
    en: 'Middle-click on the bookmark',
    ru: 'Средний клик по закладке',
    de: 'Mittelklick auf Lesezeichen',
    zh_CN: '中键点击书签',
    zh_TW: '中鍵點擊書籤',
  },
  'settings.mouse.bookmarks.mid_click_action_open_in_new': {
    en: 'open in new tab',
    de: 'Öffne in neuem Tab',
    ru: 'открыть в новой вкладке',
    zh_CN: '在新标签页打开',
    zh_TW: '在新標籤頁打開',
  },
  'settings.mouse.bookmarks.mid_click_action_edit': {
    en: 'edit',
    ru: 'редактировать',
    de: 'Ändern',
    zh_CN: '编辑',
    zh_TW: '編輯',
  },
  'settings.mouse.bookmarks.mid_click_action_delete': {
    en: 'delete',
    ru: 'удалить',
    de: 'Löschen',
    zh_CN: '删除',
    zh_TW: '刪除',
  },

  'settings.mouse.history_title': {
    en: 'History items actions',
    ru: 'Действия над элементами истории',
    de: 'Aktionen mit Chronik-Einträgen',
    zh_CN: '历史项目操作',
    zh_TW: '歷史項目操作',
  },
  'settings.mouse.history.left_click_action': {
    en: 'Left-click on the history item',
    ru: 'Левый клик по элементу истории',
    de: 'Linksklick auf Chronik-Eintrag',
    zh_CN: '左击历史项目',
    zh_TW: '左擊歷史項目',
  },
  'settings.mouse.history.left_click_action_open_in_act': {
    en: 'open in active tab',
    de: 'Öffne im aktiven Tab',
    ru: 'открыть в активной вкладке',
    zh_CN: '在活动标签页打开',
    zh_TW: '在活動標籤頁打開',
  },
  'settings.mouse.history.left_click_action_open_in_new': {
    en: 'open in new tab',
    de: 'Öffne in neuem Tab',
    ru: 'открыть в новой вкладке',
    zh_CN: '在新标签页打开',
    zh_TW: '在新標籤頁打開',
  },
  'settings.mouse.history.new_tab_activate': {
    en: 'Activate the new tab',
    ru: 'Активировать новую вкладку',
    de: 'Neuen Tab aktivieren',
    zh_CN: '激活新标签页',
    zh_TW: '激活新標籤頁',
  },
  'settings.mouse.history.new_tab_pos': {
    en: 'Position of the new tab',
    ru: 'Положение новой вкладки',
    de: 'Position des neuen Tabs',
    zh_CN: '新标签页位置',
    zh_TW: '新標籤頁位置',
  },
  'settings.mouse.history.new_tab_pos_default': {
    en: 'default',
    ru: 'по умолчанию',
    de: 'Standard',
    zh_CN: '默认',
    zh_TW: '默認',
  },
  'settings.mouse.history.new_tab_pos_after': {
    en: 'after active tab',
    de: 'Nach aktivem Tab',
    ru: 'после активной вкладки',
    zh_CN: '活动标签页之后',
    zh_TW: '活動標籤頁之後',
  },
  'settings.mouse.history.mid_click_action': {
    en: 'Middle-click on the history item',
    ru: 'Средний клик по элементу истории',
    de: 'Mittelklick auf Chronik-Eintrag',
    zh_CN: '中键点击历史项目',
    zh_TW: '中鍵點擊歷史項目',
  },
  'settings.mouse.history.mid_click_action_open_in_new': {
    en: 'open in new tab',
    de: 'Öffne in neuem Tab',
    ru: 'открыть в новой вкладке',
    zh_CN: '在新标签页打开',
    zh_TW: '在新標籤頁打開',
  },
  'settings.mouse.history.mid_click_action_forget_visit': {
    en: 'forget visit',
    ru: 'забыть запись',
    de: 'Besuch vergessen',
    zh_CN: '删除此记录',
    zh_TW: '刪除此記錄',
  },

  // - Keybindings
  'settings.kb_title': {
    en: 'Keybindings',
    ru: 'Клавиши',
    zh_CN: '按键绑定',
    zh_TW: '按鍵綁定',
    de: 'Tastenbelegung',
  },
  'settings.kb_input': {
    en: 'Press new shortcut',
    ru: 'Нажмете новое сочетание клавиш',
    zh_CN: '按下新的快捷键',
    zh_TW: '按下新的快捷鍵',
    de: 'Drücke neues Tastenkürzel',
  },
  'settings.kb_err_duplicate': {
    en: 'Already exists',
    ru: 'Уже существует',
    de: 'Existiert bereits',
    zh: '已存在'
  },
  'settings.kb_err_invalid': {
    en: 'Invalid shortcut',
    ru: 'Недопустимое сочетание клавиш',
    zh_CN: '无效的快捷键',
    zh_TW: '無效的快捷鍵',
    de: 'Ungültiges Tastenkürzel',
  },
  'settings.kb_override_popup_title': {
    en: 'Keybinding is already in use.\nOverride?',
    ru: 'Сочетание клавиш уже используется.\nПереопределить?',
    de: 'Tastenkürzel wird bereits verwendet.\nÜberschreiben?',
    zh_CN: '快捷键已被使用。\n是否覆盖？',
    zh_TW: '快捷鍵已被使用。\n是否覆蓋？',
  },
  'settings.kb_override_popup_note_shortcut': {
    en: shortcut => `Shortcut: "${shortcut}"`,
    ru: shortcut => `Сочетание клавиш: "${shortcut}"`,
    de: shortcut => `Tastenkürzel: "${shortcut}"`,
    zh_CN: shortcut => `快捷键: "${shortcut}"`,
    zh_TW: shortcut => `快捷鍵: "${shortcut}"`,
  },
  'settings.kb_override_popup_note_used': {
    en: usedIn => `Used in: "${usedIn}"`,
    ru: usedIn => `Используется в: "${usedIn}"`,
    de: usedIn => `Verwendet in: "${usedIn}"`,
    zh_CN: usedIn => `用于: "${usedIn}"`,
    zh_TW: usedIn => `用於: "${usedIn}"`,
  },
  'settings.kb_general': {
    en: 'General',
    de: 'Allgemein',
    ru: 'Общие',
    zh: '通用'
  },
  'settings.kb_switching_panel': {
    en: 'Switching between panels',
    ru: 'Переключение панелей',
    de: 'Zwischen Panels wechseln',
    zh_CN: '切换面板',
    zh_TW: '切換面板',
  },
  'settings.kb_scroll_active_panel': {
    en: 'Scrolling the active panel',
    ru: 'Прокрутка активной панели',
    de: 'Scrollen des aktiven Panels',
    zh_CN: '滚动活动面板',
    zh_TW: '捲動活動面板',
  },
  'settings.kb_tabs': {
    en: 'Tabs',
    ru: 'Вкладки',
    de: 'Tabs',
    zh_CN: '标签页',
    zh_TW: '標籤頁',
  },
  'settings.kb_tabs_open': {
    en: 'Open a new tab',
    ru: 'Открыть новую вкладку',
    de: 'Neuen Tab öffnen',
    zh_CN: '打开新标签页',
    zh_TW: '打開新標籤頁',
  },
  'settings.kb_rm': {
    en: 'Close tab(s) / Delete bookmarks',
    ru: 'Close tab(s) / Delete bookmarks',
    de: 'Tab(s) schließen / Lesezeichen löschen',
    zh_CN: '关闭标签页 / 删除书签',
    zh_TW: '關閉標籤頁 / 刪除書籤',
  },
  'settings.kb_switching_tab': {
    en: 'Switching between tabs',
    ru: 'Переключение вкладок',
    de: 'Zwischen Tabs wechseln',
    zh_CN: '切换标签',
    zh_TW: '切換標籤',
  },
  'settings.kb_create_remove_tabs': {
    en: 'Creating / Removing tabs',
    ru: 'Создание / Закрытие вкладок',
    de: 'Erstelle / Entferne Tabs',
    zh_CN: '创建 / 删除标签',
    zh_TW: '創建 / 刪除標籤',
  },
  'settings.kb_selections': {
    en: 'Selecting elements',
    ru: 'Выделение элементов',
    de: 'Elemente auswählen',
    zh_CN: '选择元素',
    zh_TW: '選擇元素',
  },
  'settings.kb_sel_tabs_bookmarks': {
    en: 'Selecting tabs / bookmarks',
    ru: 'Выделение вкладок / закладок',
    de: 'Tabs / Lesezeichen auswählen',
    zh_CN: '选择标签页 / 书签',
    zh_TW: '選擇標籤頁 / 書籤',
  },
  'settings.kb_selecting_up_down': {
    en: 'Selecting up / down',
    ru: 'Выделение вверх / вниз',
    de: 'Nach oben / unten auswählen',
    zh_CN: '向上 / 向下选择',
    zh_TW: '向上 / 向下選擇',
  },
  'settings.kb_select_act_note': {
    en: '- activate selected tab\n- open selected bookmark\n- fold/unfold an active tab branch or a selected bookmarks folder\n- activate selected context-menu option\n- activate selected panel',
    ru: '- активировать выделенную вкладку\n- открыть выделенную закладку\n- свернуть/развернуть ветку активной вкладки или выделенную папку закладок\n- активировать выделенный пункт контекстного меню\n- активировать выделенную панель',
    de: '- Aktiviere ausgewählten Tab\n- Öffne ausgewähltes Lesezeichen\n- Klappe aktiven Tab-Zweig oder ausgewählten Lesezeichen-Ordner ein/aus\n- Aktiviere ausgewählte Kontextmenü-Option\n- Aktiviere ausgewähltes Panel',
    zh_CN: '- 激活选定的标签页\n- 打开选定的书签\n- 折叠/展开活动标签页分支或选定的书签文件夹\n- 激活选定的上下文菜单选项\n- 激活选定的面板',
    zh_TW: '- 激活選定的標籤頁\n- 打開選定的書籤\n- 折疊/展開活動標籤頁分支或選定的書籤文件夾\n- 激活選定的上下文菜單選項\n- 激活選定的面板',
  },
  'settings.kb_unloading_tabs': {
    en: 'Unload tabs',
    ru: 'Выгрузить вкладки',
    de: 'Tabs entladen',
    zh_CN: '卸载标签页',
    zh_TW: '卸載標籤頁',
  },
  'settings.kb_branches': {
    en: 'Branches',
    ru: 'Ветви',
    de: 'Zweige',
    zh: '分支'
  },
  'settings.kb_active_tabs_history': {
    en: 'Tabs activation history',
    ru: 'История активации вкладок',
    de: 'Tab-Aktivierungschronik',
    zh_CN: '标签页激活历史',
    zh_TW: '選項卡激活歷史',
  },
  'settings.kb_move_tabs': {
    en: 'Moving tabs',
    ru: 'Перемещение вкладок',
    de: 'Tabs verschieben',
    zh_CN: '移动标签',
    zh_TW: '移動標籤',
  },
  'settings.reset_kb': {
    en: 'Reset Keybindings',
    ru: 'Сбросить клав. настройки',
    de: 'Tastenbelegung zurücksetzen',
    zh_CN: '重置快捷键',
    zh_TW: '重置快捷鍵',
  },
  'settings.toggle_kb': {
    en: 'Enable/Disable Keybindings',
    ru: 'Включить / отключить сочетания клавиш',
    zh_CN: '启用/禁用按键绑定',
    zh_TW: '啟用/禁用按鍵綁定',
    de: 'Tastenbelegung aktiviere/deaktiviere',
  },
  'settings.enable_kb': {
    en: 'Enable Keybindings',
    ru: 'Включить сочетания клавиш',
    zh_CN: '启用按键绑定',
    zh_TW: '啟用按鍵綁定',
    de: 'Aktiviere Tastenbelegung',
  },
  'settings.disable_kb': {
    en: 'Disable Keybindings',
    ru: 'Отключить сочетания клавиш',
    de: 'Deaktiviere Tastenbelegung',
    zh_CN: '禁用按键绑定',
    zh_TW: '禁用按鍵綁定',
  },

  // - Permissions
  'settings.permissions_title': {
    en: 'Permissions',
    ru: 'Разрешения',
    de: 'Berechtigungen',
    zh_CN: '权限',
    zh_TW: '權限',
  },
  'settings.all_urls_label': {
    en: 'Accessing web requests data:',
    ru: 'Данные веб-сайтов:',
    de: 'Zugriff auf Daten für Webanfragen:',
    zh_CN: '访问网络请求数据：',
    zh_TW: '訪問網絡請求數據：',
  },
  'settings.all_urls_info': {
    en: 'Required for:\n- Cleaning cookies\n- Proxy and URL rules of containers\n- Screenshots for the group page and windows selection panel\n- Changing the User-Agent per container',
    ru: 'Необходимо для:\n- Удаления cookies\n- Прокси и url-правил контейнеров\n- Скриншотов на групповой странице и на панели выбора окна',
    de: 'Benötigt für:\n- Cookies löschen\n- Proxy und URL Regeln für Umgebungen\n- Screenshots für die Gruppenseite und Fensterauswahl-Panel\n- User-Agent per Umgebung ändern',
    zh_CN:
      '需要：\n- 清除 Cookies \n- 容器的代理和 URL 规则\n- 分组页面和窗口选择面板的屏幕快照\n- 更改每个容器的用户代理',
    zh_TW:
      '需要：\n- 清除 cookie\n- 容器的代理和 URL 規則\n- 組頁面和窗口選擇面板的屏幕快照\n- 更改每個容器的用戶代理',
  },
  'settings.perm.bookmarks_label': {
    en: 'Bookmarks:',
    ru: 'Управление закладками:',
    de: 'Lesezeichen:',
    zh_CN: '书签:',
    zh_TW: '書籤',
  },
  'settings.perm.bookmarks_info': {
    en: 'Required for:\n- Bookmarks panels',
    ru: 'Required for:\n- Панели закладок',
    zh_CN: '需要:\n-书签面板',
    zh_TW: '需要:\n-書籤面板',
    de: 'Benötigt für:\n- Lesezeichen-Panels',
  },
  'settings.tab_hide_label': {
    en: 'Hiding tabs:',
    ru: 'Скрытие вкладок:',
    de: 'Tabs verstecken:',
    zh_CN: '隐藏标签页：',
    zh_TW: '隱藏標籤頁：',
  },
  'settings.tab_hide_info': {
    en: 'Required for:\n- Hiding tabs in inactive panels\n- Hiding folded tabs',
    ru: 'Необходимо для:\n- Скрывания вкладок неактивных панелей\n- Скрывания свернутых вкладок',
    zh_CN: '需要：\n-隐藏非活动面板中的标签页\n-隐藏折叠的标签页',
    zh_TW: '需要：\n- 隱藏非活動面板中的選項卡\n- 隱藏折疊的選項卡',
    de: 'Benötigt für:\n- Verstecken von Tabs in inaktiven Panels\n- Eingeklappte Tabs verstecken',
  },
  'settings.clipboard_write_label': {
    en: 'Writing to clipboard:',
    ru: 'Запись в буфер обмена:',
    de: 'In Zwischenablage schreiben:',
    zh_CN: '写入剪贴板：',
    zh_TW: '寫入剪貼板：',
  },
  'settings.clipboard_write_info': {
    en: 'Required for:\n- Copying URLs of tabs/bookmarks through context menu',
    ru: 'Необходимо для:\n- Копирования ссылок вкладок/закладок',
    de: 'Benötigt für:\n- URLs von Tabs/Lesezeichen über Kontextmenü kopieren',
    zh_CN: '需要：\n-通过上下文菜单复制标签页/书签的 URL',
    zh_TW: '需要：\n- 通過上下文菜單複制選項卡/書籤的 URL',
  },
  'settings.history_label': {
    en: 'History:',
    ru: 'История:',
    de: 'Chronik:',
    zh_CN: '历史:',
    zh_TW: '歷史',
  },
  'settings.history_info': {
    en: 'Required for:\n- History panel',
    ru: 'Необходимо для:\n- Панель истории',
    de: 'Benötigt für:\n- Chronik-Panel',
    zh: '需要:\n-历史面板'
  },
  'settings.perm.downloads_label': {
    en: 'Downloads:',
    ru: 'Загрузки:',
    de: 'Downloads:',
    zh_CN: '下载:',
    zh_TW: '下載:',
  },
  'settings.perm.downloads_info': {
    en: 'Required for:\n- Snapshot auto export',
    ru: 'Необходимо для:\n- Авто экспорта снепшотов',
    de: 'Benötigt für:\n- Snapshot-Auto-Export',
    zh_CN: '需要：\n-快照自动导出',
    zh_TW: '需要：\n-快照自動導出',
  },

  // - Storage
  'settings.storage_title': {
    en: 'Storage',
    ru: 'Данные',
    de: 'Speicher',
    zh_CN: '存储',
    zh_TW: '存儲',
  },
  'settings.storage_delete_prop': {
    en: 'delete',
    ru: 'удалить',
    de: 'Löschen',
    zh_CN: '删除',
    zh_TW: '刪除',
  },
  'settings.storage_edit_prop': {
    en: 'edit',
    ru: 'редактировать',
    zh_CN: '编辑',
    zh_TW: '編輯',
    de: 'Ändern',
  },
  'settings.storage_open_prop': {
    en: 'open',
    ru: 'открыть',
    de: 'Öffnen',
    zh_CN: '打开',
    zh_TW: '打開',
  },
  'settings.storage_delete_confirm': {
    en: 'Delete property ',
    ru: 'Удалить поле ',
    de: 'Feld löschen ',
    zh_CN: '删除属性 ',
    zh_TW: '刪除屬性',
  },
  'settings.update_storage_info': {
    en: 'Update',
    ru: 'Обновить',
    de: 'Aktualisieren',
    zh: '更新'
  },
  'settings.clear_storage_info': {
    en: 'Delete everything',
    ru: 'Удалить все',
    de: 'Alles löschen',
    zh_CN: '删除所有内容',
    zh_TW: '刪除所有內容',
  },
  'settings.clear_storage_confirm': {
    en: 'Are you sure you want to delete all Sidebery data?',
    ru: 'Вы действительно хотите удалить все данные?',
    de: 'Wirklich alle Sidebery-Daten löschen?',
    zh_CN: '确定要删除 Sidebery 所有的数据吗？',
    zh_TW: '確定要刪除 Sidebery 所有的數據嗎？',
  },
  'settings.favs_title': {
    en: 'Cached favicons',
    ru: 'Кэшированные иконки сайтов',
    de: 'Zwischengespeicherte Favicons',
    zh_CN: '已缓存的图标',
    zh_TW: '已緩存的圖標',
  },

  // - Sync
  'settings.sync_title': {
    en: 'Sync',
    ru: 'Синхронизация',
    de: 'Sync',
    zh: '同步'
  },
  'settings.sync_name': {
    en: 'Profile name for sync',
    ru: 'Имя профиля для синхронизации',
    de: 'Profilname für Sync',
    zh_CN: '用于同步的配置文件名称',
    zh_TW: '用於同步的配置文件名稱',
  },
  'settings.sync_name_or': {
    en: 'e.g: Firefox Beta Home',
    ru: 'напр. Firefox Домашний',
    de: 'z.B. Firefox Beta Home',
    zh: '例如 Firefox Beta Home'
  },
  'settings.sync_save_settings': {
    en: 'Save settings to sync storage',
    ru: 'Сохранять настройки в синхронизируемое хранилище',
    de: 'Einstellungen im Sync-Speicher sichern',
    zh_CN: '保存设置至同步存储',
    zh_TW: '保存設置至同步存儲',
  },
  'settings.sync_save_ctx_menu': {
    en: 'Save context menu to sync storage',
    de: 'Kontextmenü im Sync-Speicher sichern',
    ru: 'Сохранять контекстное меню в синхронизируемое хранилище',
    zh_CN: '保存上下文菜单至同步存储',
    zh_TW: '保存上下文菜單至同步存儲',
  },
  'settings.sync_save_styles': {
    en: 'Save styles to sync storage',
    de: 'Stile im Sync-Speicher sichern',
    ru: 'Сохранять стили в синхронизируемое хранилище',
    zh_CN: '保存样式至同步存储',
    zh_TW: '保存樣式至同步存儲',
  },
  'settings.sync_save_kb': {
    en: 'Save keybindings to sync storage',
    ru: 'Сохранять сочетания клавиш в синхронизируемое хранилище',
    zh_CN: '保存按键绑定至同步存储',
    zh_TW: '保存按鍵綁定至同步存儲',
    de: 'Tastenbelegung im Sync-Speicher sichern',
  },
  'settings.sync_auto_apply': {
    en: 'Automatically apply changes',
    ru: 'Автоматически применять изменения',
    de: 'Änderungen automatisch anwenden',
    zh_CN: '自动应用更改',
    zh_TW: '自動應用更改',
  },
  'settings.sync_settings_title': {
    en: 'Settings',
    ru: 'Настройки',
    de: 'Einstellungen',
    zh_CN: '设置',
    zh_TW: '設置',
  },
  'settings.sync_ctx_menu_title': {
    en: 'Context menu',
    ru: 'Контекстное меню',
    de: 'Kontextmenü',
    zh_CN: '上下文菜单',
    zh_TW: '上下文菜單',
  },
  'settings.sync_styles_title': {
    en: 'Styles',
    ru: 'Стили',
    de: 'Stile',
    zh_CN: '样式',
    zh_TW: '樣式',
  },
  'settings.sync_kb_title': {
    en: 'Keybindings',
    ru: 'Сочетания клавиш',
    de: 'Tastenbelegung',
    zh_CN: '按键绑定',
    zh_TW: '按鍵綁定',
  },
  'settings.sync_apply_btn': {
    en: 'Apply',
    ru: 'Применить',
    de: 'Anwenden',
    zh_CN: '应用',
    zh_TW: '應用',
  },
  'settings.sync_delete_btn': {
    en: 'Delete',
    ru: 'Удалить',
    de: 'Löschen',
    zh_CN: '删除',
    zh_TW: '刪除',
  },
  'settings.sync_update_btn': {
    en: 'Update synced data',
    ru: 'Обновить данные',
    de: 'Synchronisierte Daten aktualisieren',
    zh_CN: '更新同步数据',
    zh_TW: '更新同步數據',
  },
  'settings.sync_apply_confirm': {
    en: 'Are you sure you want to apply synced data?',
    ru: 'Вы действительно хотите применить синхронизированные данные?',
    de: 'Möchten Sie die synchronisierten Daten wirklich anwenden?',
    zh_CN: '您确定要应用同步数据吗？',
    zh_TW: '您確定要應用同步數據嗎',
  },
  'settings.sync.apply_err': {
    en: 'Cannot apply synchronized data',
    ru: 'Невозможно применить синхронизированные данные',
    de: 'Kann synchronisierte Daten nicht anwenden',
    zh_CN: '无法应用同步数据',
    zh_TW: '無法應用同步數據',
  },
  'settings.sync_notes_title': {
    en: 'Notes:',
    ru: 'Примечания:',
    de: 'Hinweis:',
    zh_CN: '说明:',
    zh_TW: '說明:',
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
    zh_CN: `Sidebery 使用 Firefox 同步，因此：
- 您需要登录到 Firefox 帐户才能运行
- 要确保数据已上传到 Firefox 同步服务器，您需要在 Firefox 设置或主菜单的个人资料中按“立即同步”按钮（三行按钮）`,
    zh_TW: `Sidebery 使用 Firefox 同步，因此：
- 您需要登錄到 Firefox 帳戶才能運行
- 要確保數據已上傳到 Firefox 同步服務器，您需要在 Firefox 設置或主菜單的個人資料中按“立即同步”按鈕（三行按鈕）`,
  },

  // - Help
  'settings.help_title': {
    en: 'Help',
    ru: 'Помощь',
    de: 'Hilfe',
    zh_CN: '帮助',
    zh_TW: '幫助',
  },
  'settings.debug_info': {
    en: 'Show debug info',
    ru: 'Отладочная информация',
    de: 'Debug Informationen anzeigen',
    zh_CN: '显示调试信息',
    zh_TW: '顯示調試信息',
  },
  'settings.log_lvl': {
    en: 'Log level',
    ru: 'Уровень логов',
    de: 'Log-Level',
    zh_CN: '日志级别',
    zh_TW: '日誌級別',
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
    zh_TW: '錯誤',
  },
  'settings.log_lvl_2': {
    en: 'warnings',
    ru: 'предупреждения',
    de: 'Warnungen',
    zh: '警告'
  },
  'settings.log_lvl_3': {
    en: 'all',
    ru: 'все',
    de: 'Alles',
    zh: '所有'
  },
  'settings.copy_devtools_url': {
    en: 'Copy devtools URL',
    ru: 'Скопировать URL страницы разработчика',
    de: 'Kopiere Devtools URL',
    zh_CN: '复制开发工具 URL',
    zh_TW: '複製開發工具 URL',
  },
  'settings.repo_issue': {
    en: 'Open issue',
    ru: 'Создать github issue',
    de: 'Öffne Github Issue',
    zh_CN: '打开issue',
    zh_TW: '打開 issue',
  },
  'settings.repo_bug': {
    en: 'Report a bug',
    ru: 'Сообщить об ошибке',
    de: 'Einen Bug melden',
    zh_CN: '报告错误',
    zh_TW: '報告錯誤',
  },
  'settings.repo_feature': {
    en: 'Suggest a feature',
    ru: 'Предложить новую функцию',
    de: 'Ein Feature vorschlagen',
    zh_CN: '功能建议',
    zh_TW: '功能建議',
  },
  'settings.reset_settings': {
    en: 'Reset settings',
    ru: 'Сбросить настройки',
    de: 'Einstellungen zurücksetzen',
    zh_CN: '重置设置',
    zh_TW: '重置設置',
  },
  'settings.reset_confirm': {
    en: 'Are you sure you want to reset settings?',
    ru: 'Вы уверены, что хотите сбросить настройки?',
    de: 'Sind Sie sicher, dass Sie Ihre Einstellungen zurücksetzen möchten?',
    zh_CN: '您确定要重置设置吗？',
    zh_TW: '您確定要重置設置嗎？',
  },
  'settings.ref_rm': {
    en: 'Will be removed; open an issue if you need this feature.',
    ru: 'Will be removed, open an issue if you need this feature.',
    de: 'Wird entfernt; öffnen Sie ein Github Issue, falls Sie dieses Feature benötigen.',
    zh_CN: '将被删除；如果您需要此功能，请提交issue。',
    zh_TW: '將被刪除；如果您需要此功能，請提交issue。',
  },
  'settings.help_exp_data': {
    en: 'Export addon data',
    ru: 'Экспорт данных расширения',
    de: 'Add-on-Daten exportieren',
    zh_CN: '导出',
    zh_TW: '導出',
  },
  'settings.help_imp_data': {
    en: 'Import addon data',
    ru: 'Импорт данных расширения',
    de: 'Add-on-Daten importieren',
    zh_CN: '导入',
    zh_TW: '導入',
  },
  'settings.help_imp_perm': {
    en: 'Additional permissions are required',
    ru: 'Необходимы дополнительные разрешения',
    de: 'Zusätzliche Berechtigungen werden benötigt',
    zh_CN: '需要额外的权限',
    zh_TW: '需要額外的權限',
  },
  'settings.export_title': {
    en: 'Select what to export',
    ru: 'Выберете данные для экспорта',
    de: 'Daten zum Export auswählen',
    zh_CN: '选择要导出的内容',
    zh_TW: '選擇要導出的內容',
  },
  'settings.import_title': {
    en: 'Select what to import',
    ru: 'Выберете данные для импорта',
    de: 'Daten zum Import auswählen',
    zh_CN: '选择要导入的内容',
    zh_TW: '選擇要導入的內容',
  },
  'settings.backup_all': {
    en: 'All',
    ru: 'Все',
    de: 'Alles',
    zh: '全部'
  },
  'settings.backup_containers': {
    en: 'Containers config',
    ru: 'Конфигурация контейнеры',
    de: 'Einstellungen für Umgebungen',
    zh: '容器配置'
  },
  'settings.backup_settings': {
    en: 'Settings',
    ru: 'Настройки',
    de: 'Einstellungen',
    zh_CN: '设置',
    zh_TW: '設置',
  },
  'settings.backup_styles': {
    en: 'Styles',
    ru: 'Стили',
    de: 'Stile',
    zh_CN: '样式',
    zh_TW: '樣式',
  },
  'settings.backup_snapshots': {
    en: 'Snapshots',
    ru: 'Снепшоты',
    de: 'Screenshots',
    zh: '快照'
  },
  'settings.backup_favicons': {
    en: 'Sites icons cache',
    ru: 'Кэш иконок сайтов',
    de: 'Favicon-Cache',
    zh_CN: '站点图标缓存',
    zh_TW: '站點圖標緩存',
  },
  'settings.backup_kb': {
    en: 'Keybindings',
    ru: 'Сочетания клавиш',
    de: 'Tastenbelegung',
    zh_CN: '按键绑定',
    zh_TW: '按鍵綁定',
  },
  'settings.backup_parse_err': {
    en: 'Wrong format of imported data',
    ru: 'Неправильный формат импортированных данных',
    de: 'Falsches Format der importierten Daten',
    zh_CN: '导入数据格式错误',
    zh_TW: '導入數據格式錯誤',
  },
  'settings.reload_addon': {
    en: 'Reload add-on',
    ru: 'Перезагрузить расширение',
    de: 'Add-on neu laden',
    zh_CN: '重新加载插件',
    zh_TW: '重新加載插件',
  },

  // ---
  // -- Snapshots viewer
  // -
  'snapshot.window_title': {
    en: 'Window',
    ru: 'Окно',
    de: 'Fenster',
    zh: '窗口'
  },
  'snapshot.global_pin_title': {
    en: 'Pinned tabs',
    ru: 'Закрепленные вкладки',
  },
  'snapshot.btn_open': {
    en: 'Open',
    ru: 'Открыть',
    de: 'Öffnen',
    zh_CN: '打开',
    zh_TW: '打開',
  },
  'snapshot.btn_apply': {
    en: 'Apply',
    ru: 'Применить',
    de: 'Anwenden',
    zh_CN: '应用',
    zh_TW: '應用',
  },
  'snapshot.btn_remove': {
    en: 'Remove snapshot',
    ru: 'Удалить снепшот',
    de: 'Entfernen',
    zh_CN: '删除',
    zh_TW: '刪除',
  },
  'snapshot.btn_create_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
    de: 'Schnappschuss erstellen',
    zh_CN: '创建快照',
    zh_TW: '創建快照',
  },
  'snapshot.btn_import_snapshot': {
    en: 'Import snapshot',
    ru: 'Импортировать снепшот',
    zh_CN: '導入快照',
    zh_TW: '导入快照',
  },
  'snapshot.btn_export_snapshot': {
    en: 'Export snapshot',
    ru: 'Экспортировать снепшот',
    zh_CN: '导出快照',
    zh_TW: '導出快照',
  },
  'snapshot.btn_export_snapshot_json': {
    en: 'Save as JSON',
    ru: 'Сохранить как JSON',
    zh_CN: '另存为 JSON',
    zh_TW: '另存為 JSON',
  },
  'snapshot.btn_export_snapshot_md': {
    en: 'Save as Markdown',
    ru: 'Сохранить как Markdown',
    zh_CN: '另存为 Markdown',
    zh_TW: '另存為 Markdown',
  },
  'snapshot.btn_export_snapshot_md_note': {
    en: 'No reverse import support',
    ru: 'Без поддержки обратного импорта',
    zh_CN: '不支持反向导入',
    zh_TW: '不支持反嚮導入',
  },
  'snapshot.btn_copy_snapshot_md': {
    en: 'Copy as Markdown',
    ru: 'Копировать как Markdown',
    zh_CN: '复制为 Markdown',
    zh_TW: '複製為 Markdown',
  },
  'snapshot.btn_open_all_win': {
    en: 'Open all windows',
    ru: 'Открыть все окна',
    de: 'Alle Fenster öffnen',
    zh_CN: '打开所有窗口',
    zh_TW: '打開所有窗口',
  },
  'snapshot.btn_open_win': {
    en: 'Open window',
    ru: 'Открыть окно',
    de: 'Fenster öffnen',
    zh_CN: '打开窗口',
    zh_TW: '打開窗口',
  },
  'snapshot.btn_create_first': {
    en: 'Create first snapshot',
    ru: 'Создать первый снепшот',
    de: 'Ersten Schnappschuss erstellen',
    zh_CN: '创建第一张快照',
    zh_TW: '創建第一張快照',
  },
  'snapshot.snap_win': {
    en: n => (n === 1 ? 'window' : 'windows'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'окно'
      if (NUM_234_RE.test(n.toString())) return 'окна'
      return 'окон'
    },
    de: 'Fenster',
    zh: '窗口'
  },
  'snapshot.snap_ctr': {
    en: n => (n === 1 ? 'container' : 'containers'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return 'контейнер'
      if (NUM_234_RE.test(n.toString())) return 'контейнера'
      return 'контейнеров'
    },
    de: n => (n === 1 ? 'Umgebung' : 'Umgebungen'),
    zh: '容器'
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
    zh_TW: '標籤頁',
  },
  'snapshot.selected': {
    en: 'Selected:',
    ru: 'Выбрано:',
    de: 'Ausgewählt:',
    zh_CN: '已选中:',
    zh_TW: '已選中',
  },
  'snapshot.sel.open_in_panel': {
    en: 'Open in current panel',
    ru: 'Открыть в текущей панели',
    de: 'Im aktuellen Panel öffnen',
    zh_CN: '在当前面板中打开',
    zh_TW: '在當前面板中打開',
  },
  'snapshot.sel.reset_sel': {
    en: 'Reset selection',
    ru: 'Сбросить',
    de: 'Auswahl zurücksetzen',
    zh_CN: '重置选择',
    zh_TW: '重置選擇',
  },

  // ---
  // -- Styles editor
  // -
  'styles.reset_styles': {
    en: 'Reset CSS variables',
    ru: 'Сбросить CSS переменные',
    de: 'CSS Variablen zurücksetzen',
    zh_CN: '重置 CSS 变量',
    zh_TW: '重置 CSS 變量',
  },
  'styles.css_sidebar': {
    en: 'Sidebar',
    ru: 'Боковая панель',
    de: 'Seitenleiste',
    zh_CN: '侧边栏',
    zh_TW: '側邊欄',
  },
  'styles.css_group': {
    en: 'Group page',
    ru: 'Групповая страница',
    de: 'Gruppenseite',
    zh_CN: '分组页面',
    zh_TW: '分組頁面',
  },
  'styles.css_placeholder': {
    en: 'Write custom CSS here...',
    ru: 'Вводите правила CSS здесь...',
    de: 'Eigenes CSS hier schreiben...',
    zh_CN: '在此处编写自定义 CSS...',
    zh_TW: '在此處編寫自定義 CSS...',
  },
  'styles.css_selectors_instruction': {
    en: `NOTE: To get currently available css-selectors use debugger:
  - Click "Copy devtools URL" button in the bottom bar
  - Open a new tab with that URL
  - Select frame to inspect
    - Click on the rectangular icon (with three sections) in top-right area of the debugger page
    - Select "/sidebar/sidebar.html" for sidebar frame
    - Select "/sidebery/group.html" for group page frame
  - Browse "Inspector" tab`,
    de: `HINWEIS: für derzeit verfügbare CSS-Selectors den Debugger verwenden:
  - Klicke auf "Kopiere Devtools URL" in der Leiste unten
  - Öffne neuen Tab mit dieser URL 
  - Wähle Frame zum inspizieren aus
	- Klicke auf rechteckiges Symbol (mit drei Teilstücken) oben rechts auf der Debugger Seite
	- Wähle "/sidebar/sidebar.html" für Seitenleisten Frame
	- Wähle "/sidebery/group.html" für Gruppenseiten Frame
  - "Inspector" Tab durchsehen`,
    zh_CN: `注意事项：要获取当前可用的 CSS 选择器，请使用调试器：
  - 点击底部的 "复制开发工具 URL" 按钮
  - 用一个新标签打开这个 URL
  - 选择要检查的框架
    - 点击调试页面右上方的矩形图标（由三个小矩形组成）
    - 选择 "/sidebar/sidebar.html" 侧边栏框架
    - 选择 "/sidebery/group.html" 分组页面框架
  - 浏览 "检查" 标签`,
    zh_TW: `注意：要獲取當前可用的 css-selectors，請使用調試器：
   - 單擊底部欄中的“複製 開發工具 URL”按鈕
   - 使用該 URL 打開新標籤
   - 選擇要檢查的框架
     - 單擊調試器頁面右上角的矩形圖標（包含三個部分）
     - 為側邊欄框架選擇“/sidebar/sidebar.html”
     - 為群組頁面框架選擇“/sidebery/group.html”
   - 瀏覽“檢查”選項卡`,
  },
  'styles.vars_group.other': {
    en: 'Other',
    ru: 'Прочие',
    de: 'Andere',
    zh: '其他'
  },
  'styles.vars_group.animation': {
    en: 'Animation speed',
    ru: 'Скорость анимации',
    de: 'Animationsgeschwindigkeit',
    zh_CN: '动画速度',
    zh_TW: '動畫速度',
  },
  'styles.vars_group.buttons': {
    en: 'Buttons',
    ru: 'Кнопки',
    de: 'Schaltflächen',
    zh_CN: '按钮',
    zh_TW: '按鈕',
  },
  'styles.vars_group.scroll': {
    en: 'Scroll',
    ru: 'Скрол',
    de: 'Scrollen',
    zh_CN: '滚动',
    zh_TW: '滾動',
  },
  'styles.vars_group.menu': {
    en: 'Context menu',
    ru: 'Контекстное меню',
    de: 'Kontextmenü',
    zh_CN: '上下文菜单',
    zh_TW: '上下文菜單',
  },
  'styles.vars_group.nav': {
    en: 'Navigation bar',
    ru: 'Панель навигации',
    de: 'Navigationsleiste',
    zh_CN: '导航栏',
    zh_TW: '導航欄',
  },
  'styles.vars_group.pinned_dock': {
    en: 'Pinned tabs dock',
    ru: 'Область закрепленных вкладок',
    de: 'Bereich für angeheftete Tabs',
    zh_CN: '固定标签页停靠',
    zh_TW: '固定標籤頁停靠',
  },
  'styles.vars_group.tabs': {
    en: 'Tabs',
    ru: 'Вкладки',
    de: 'Tabs',
    zh: '标签页'
  },
  'styles.vars_group.bookmarks': {
    en: 'Bookmarks',
    ru: 'Закладки',
    de: 'Lesezeichen',
    zh_CN: '书签',
    zh_TW: '書籤',
  },
}

if (!window.translations) window.translations = setupPageTranslations
else Object.assign(window.translations, setupPageTranslations)
