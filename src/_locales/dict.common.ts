export const NUM_1_RE = /^(1|(\d*?)[^1]1)$/
export const NUM_234_RE = /^([234]|(\d*?)[^1][234])$/

export const commonTranslations: Translations = {
  // ---
  // -- Bookmarks editor
  // -
  'bookmarks_editor.name_bookmark_placeholder': {
    en: 'Bookmark name...',
    de: 'Name des Lesezeichens...',
    hu: 'A könyvjelző neve…',
    ru: 'Название закладки...',
    zh_CN: '书签名称...',
    zh_TW: '書籤名稱...',
  },
  'bookmarks_editor.name_folder_placeholder': {
    en: 'Folder name...',
    de: 'Name des Ordners...',
    hu: 'A mappa neve…',
    ru: 'Название папки...',
    zh_CN: '文件夹名称...',
    zh_TW: '資料夾名稱...',
  },
  'bookmarks_editor.url_placeholder': {
    en: 'e.g. https://example.com',
    de: 'z.B. https://beispiel.de',
    hu: 'pl.: https://pelda.hu',
    ru: 'Ссылка...',
    zh: '例如 https://example.com',
  },

  // ---
  // -- Buttons
  // -
  'btn.create': {
    en: 'Create',
    de: 'Erstellen',
    hu: 'Létrehozás',
    ru: 'Создать',
    zh_CN: '创建',
    zh_TW: '建立',
  },
  'btn.save': {
    en: 'Save',
    de: 'Speichern',
    hu: 'Mentés',
    ru: 'Сохранить',
    zh_CN: '保存',
    zh_TW: '儲存',
  },
  'btn.restore': {
    en: 'Restore',
    de: 'Wiederherstellen',
    hu: 'Visszaállítás',
    ru: 'Восстановить',
    zh_CN: '恢复',
    zh_TW: '復原',
  },
  'btn.update': {
    en: 'Update',
    de: 'Aktualisieren',
    hu: 'Frissítés',
    ru: 'Обновить',
    zh: '更新',
  },
  'btn.yes': {
    en: 'Yes',
    de: 'Ja',
    hu: 'Igen',
    ru: 'Да',
    zh_CN: '确认',
    zh_TW: '確定',
  },
  'btn.ok': {
    en: 'Ok',
    ru: 'Ок',
    zh: '是',
  },
  'btn.no': {
    en: 'No',
    de: 'Nein',
    hu: 'Nem',
    ru: 'Нет',
    zh: '取消',
  },
  'btn.cancel': {
    en: 'Cancel',
    de: 'Abbrechen',
    hu: 'Mégsem',
    ru: 'Отмена',
    zh: '取消',
  },
  'btn.stop': {
    en: 'Stop',
    de: 'Stopp',
    hu: 'Leállítás',
    ru: 'Остановить',
    zh: '停止',
  },

  // ---
  // -- Container
  // -
  'container.new_container_name': {
    en: 'Container',
    de: 'Umgebung',
    hu: 'Konténer',
    ru: 'Контейнер',
    zh: '容器',
  },

  // ---
  // -- Tabs panel
  // -
  'panel.tabs.title': {
    en: 'Tabs',
    hu: 'Lapok',
    ru: 'Вкладки',
    zh_CN: '标签页',
    zh_TW: '分頁',
  },

  // ---
  // -- Bookmarks panel
  // -
  'panel.bookmarks.title': {
    en: 'Bookmarks',
    de: 'Lesezeichen',
    hu: 'Könyvjelzők',
    ru: 'Закладки',
    zh_CN: '书签',
    zh_TW: '書籤',
  },
  'panel.bookmarks.req_perm': {
    en: 'Bookmarks panel requires "Bookmarks" permission.',
    de: 'Lesezeichen Panel erfordert "Lesezeichen" Berechtigung',
    hu: 'A könyvjelzők eléréséhez engedély szükséges.',
    ru: 'Панель закладок требует разрешения "Закладки".',
    zh_CN: '书签面板需要"书签"权限。',
    zh_TW: '書籤面板需要「書籤」權限。',
  },

  // ---
  // -- History panel
  // -
  'panel.history.title': {
    en: 'History',
    de: 'Chronik',
    hu: 'Előzmények',
    ru: 'История',
    zh_CN: '历史',
    zh_TW: '歷史',
  },
  'panel.history.load_more': {
    en: 'Scroll to load more',
    de: 'Scrollen, um mehr zu laden',
    hu: 'Továbbiak betöltése görgetéssel',
    ru: 'Прокрутитe вниз, чтобы загрузить больше',
    zh_CN: '滚动加载更多',
    zh_TW: '捲動載入更多',
  },
  'panel.history.req_perm': {
    en: 'History panel requires "History" permission.',
    de: 'Chronik Panel erfordert "Chronik" Berechtigung',
    hu: 'Az előzmények eléréséhez engedély szükséges.',
    ru: 'Панель истории требует разрешения "История".',
    zh_CN: '历史面板需要"历史"权限。',
    zh_TW: '歷史面板需要「歷史」權限。',
  },

  // ---
  // -- Popups
  // -
  // - Bookmarks popup
  'popup.bookmarks.name_label': {
    en: 'Name',
    hu: 'Név',
    ru: 'Название',
    zh_CN: '名称',
    zh_TW: '名稱',
  },
  'popup.bookmarks.location_label': {
    en: 'Location',
    de: 'Ort',
    hu: 'Hely',
    ru: 'Расположение',
    zh_CN: '地址',
    zh_TW: '位置',
  },
  'popup.bookmarks.location_new_folder_placeholder': {
    en: 'New folder name',
    de: 'Neuer Ordner',
    hu: 'Új mappa',
    ru: 'Название новой папки',
    zh_CN: '新文件夹名称',
    zh_TW: '新資料夾名稱',
  },
  'popup.bookmarks.recent_locations_label': {
    en: 'Recent locations',
    de: 'Zuletzt besucht',
    hu: 'Legutóbbi helyek',
    ru: 'Недавние расположения',
    zh_CN: '最近地址',
    zh_TW: '最近位置',
  },
  'popup.bookmarks.save_in_bookmarks': {
    en: 'Save in bookmarks',
    de: 'Als Lesezeichen speichern',
    hu: 'Mentés a könyvjelzőkbe',
    ru: 'Сохранить в закладки',
    zh_CN: '保存至书签',
    zh_TW: '新增書籤',
  },
  'popup.bookmarks.set_folder_for_tabs_panel': {
    en: 'Set folder for this tabs panel',
    de: 'Ordner für dieses Tab-Panel festlegen',
    hu: 'Mappa választása ehhez a lappanelhoz',
    ru: 'Установить папку для этой панели вкладок',
    zh_CN: '设置此标签面板的文件夹',
    zh_TW: '設定此分頁面板的資料夾',
  },
  'popup.bookmarks.edit_bookmark': {
    en: 'Edit bookmark',
    de: 'Lesezeichen bearbeiten',
    hu: 'Könyvjelző szerkesztése',
    ru: 'Редактировать закладку',
    zh_CN: '编辑书签',
    zh_TW: '編輯書籤',
  },
  'popup.bookmarks.edit_folder': {
    en: 'Edit folder',
    de: 'Ordner bearbeiten',
    hu: 'Mappa szerkesztése',
    ru: 'Редактировать папку',
    zh_CN: '编辑文件夹',
    zh_TW: '編輯資料夾',
  },
  'popup.bookmarks.select_root_folder': {
    en: 'Select root folder',
    de: 'Quellordner auswählen',
    hu: 'A kiinduló mappa kiválasztása',
    ru: 'Выберите корневую папку',
    zh_CN: '选择根文件夹',
    zh_TW: '選取根資料夾',
  },
  'popup.bookmarks.create_bookmark': {
    en: 'Create bookmark',
    de: 'Lesezeichen erstellen',
    hu: 'Új könyvjelző',
    ru: 'Создать закладку',
    zh_CN: '创建书签',
    zh_TW: '建立書籤',
  },
  'popup.bookmarks.create_folder': {
    en: 'Create folder',
    de: 'Ordner erstellen',
    hu: 'Új mappa',
    ru: 'Создать папку',
    zh_CN: '创建文件夹',
    zh_TW: '建立資料夾',
  },
  'popup.bookmarks.move_to': {
    en: 'Move to',
    de: 'Verschieben nach',
    hu: 'Áthelyezés ide',
    ru: 'Переместить в',
    zh_CN: '移动到',
    zh_TW: '移動到',
  },
  'popup.bookmarks.move': {
    en: 'Move',
    de: 'Verschieben',
    hu: 'Áthelyezés',
    ru: 'Переместить',
    zh_CN: '移动',
    zh_TW: '移動',
  },
  'popup.bookmarks.create_bookmarks': {
    en: 'Create bookmark[s]',
    de: 'Lesezeichen erstellen',
    hu: 'Új könyvjelző létrehozása',
    ru: 'Создать закладки',
    zh_CN: '创建书签',
    zh_TW: '建立書籤',
  },
  'popup.bookmarks.restore': {
    en: 'Restore from bookmarks folder',
    de: 'Aus Lesezeichen-Ordner wiederherstellen',
    hu: 'Visszaállítás könyvjelzőmappából',
    ru: 'Восстановить из папки закладок',
    zh_CN: '从书签文件夹恢复',
    zh_TW: '從書籤資料夾復原',
  },
  'popup.bookmarks.convert_title': {
    en: 'Convert to bookmarks',
    de: 'In Lesezeichen konvertieren',
    hu: 'Átalakítás könyvjelzőkké',
    ru: 'Конвертировать в закладки',
    zh_CN: '转换为书签',
    zh_TW: '轉換為書籤',
  },
  'popup.bookmarks.convert': {
    en: 'Convert',
    de: 'Konvertieren',
    hu: 'Átalakítás',
    ru: 'Конвертировать',
    zh_CN: '转换',
    zh_TW: '轉換',
  },

  'popup.new_tab_shortcuts.title': {
    en: 'New Tab Shortcuts',
    de: 'Neue Tab-Verknüpfungen',
    hu: 'Új lap parancsikonjai',
    ru: 'Ярлыки новой вкладки',
    zh_CN: '新标签快捷方式',
    zh_TW: '新分頁捷徑',
  },
  'popup.new_tab_shortcuts.create_title': {
    en: 'Create shortcut',
    de: 'Verknüpfung erstellen',
    hu: 'Új parancsikon készítése',
    ru: 'Создать ярлык',
    zh_CN: '创建快捷方式',
    zh_TW: '建立捷徑',
  },
  'popup.new_tab_shortcuts.new_shortcut_container_label': {
    en: 'Container',
    de: 'Behälter',
    hu: 'Konténer',
    ru: 'Контейнер',
    zh: '容器',
  },
  'popup.new_tab_shortcuts.new_shortcut_default_container': {
    en: 'Default container',
    de: 'Standard-Behälter',
    hu: 'Alapértelmezett konténer',
    ru: 'Стандартный контейнер',
    zh_CN: '默认容器',
    zh_TW: '預設容器',
  },
  'popup.new_tab_shortcuts.new_shortcut_url_label': {
    en: 'URL',
    ru: 'URL-адрес',
  },
  'popup.new_tab_shortcuts.new_shortcut_url_placeholder': {
    en: 'Default new tab',
    de: 'Standard-Neuer Tab',
    hu: 'Alapértelmezett új lap',
    ru: 'Новая вкладка по умолчанию',
    zh_CN: '默认新标签',
    zh_TW: '預設新分頁',
  },
  'popup.new_tab_shortcuts.add_br_btn': {
    en: 'Add new line',
    de: 'Neue Zeile hinzufügen',
    hu: 'Elválasztó hozzáadása',
    ru: 'Добавить новую строку',
    zh_CN: '添加新行',
    zh_TW: '新增分隔線',
  },
  'popup.new_tab_shortcuts.add_shortcut_btn': {
    en: 'Add shortcut',
    de: 'Verknüpfung hinzufügen',
    hu: 'Parancsikon hozzáadása',
    ru: 'Добавить ярлык',
    zh_CN: '添加快捷方式',
    zh_TW: '新增捷徑',
  },

  'popup.tab_move_rules.title': {
    en: 'Tab auto-move rules',
    de: 'Tab Auto-Move Regeln',
    hu: 'A lapok automatikus áthelyezésének szabályai',
    ru: 'Правила автоматического перемещения вкладок',
    zh_CN: '标签页自动移动规则',
    zh_TW: '分頁自動移動規則',
  },
  'popup.tab_move_rules.editor_title.new': {
    en: 'Create auto-move rule',
    de: 'Regel erstellen',
    hu: 'Új automatikus áthelyezési szabály',
    ru: 'Создать правило',
    zh_CN: '创建自动移动规则',
    zh_TW: '建立自動移動規則',
  },
  'popup.tab_move_rules.editor_title.edit': {
    en: 'Edit auto-move rule',
    de: 'Regel bearbeiten',
    hu: 'Automatikus áthelyezési szabály szerkesztése',
    ru: 'Редактировать правило',
    zh_CN: '编辑自动移动规则',
    zh_TW: '編輯自動移動規則',
  },
  'popup.tab_move_rules.rule_name_label': {
    en: 'Name (optional)',
    hu: 'Név (opcionális)',
    ru: 'Название (опционально)',
    zh_CN: '名称（选填）',
    zh_TW: '名稱（選填）',
  },
  'popup.tab_move_rules.rule_container_label': {
    en: 'If tab is in a container',
    de: 'Wenn Tab in einem Behälter ist',
    hu: 'Ha a lap egy konténerben van',
    ru: 'Если вкладка в контейнере',
    zh_CN: '如果标签页在容器中',
    zh_TW: '如果分頁在容器中',
  },
  'popup.tab_move_rules.rule_url_label': {
    en: 'If tab has URL ("substring" or "/RegExp/")',
    de: 'Wenn Tab URL hat ("substring" oder "/RegExp/")',
    hu: 'Ha az URL illeszkedik ("szövegrészlet" vagy /RegExp/)',
    ru: 'Если вкладка имеет URL-адрес ("подстрока" или "/RegExp/")',
    zh: '如果 URL 含有 ("字符串" 或 "/RegExp/")',
  },
  'popup.tab_move_rules.rule_top_lvl_label': {
    en: 'If tab at the top level of tree',
    de: 'Wenn Tab auf der obersten Ebene des Baums ist',
    hu: 'Ha a lap legfelső szintű',
    ru: 'Если вкладка на верхнем уровне дерева',
    zh_CN: '如果标签页位于树的顶层',
    zh_TW: '如果分頁位於樹的頂層',
  },
  'popup.tab_move_rules.add_rule_btn': {
    en: 'Add rule',
    de: 'Regel hinzufügen',
    hu: 'Hozzáadás',
    ru: 'Добавить правило',
    zh_CN: '添加规则',
    zh_TW: '新增規則',
  },
  'popup.tab_move_rules.edit_rule_btn.save': {
    en: 'Save',
    de: 'Regel speichern',
    hu: 'Mentés',
    ru: 'Сохранить',
    zh_CN: '保存',
    zh_TW: '儲存',
  },
  'popup.tab_move_rules.edit_rule_btn.cancel': {
    en: 'Cancel',
    de: 'Abbrechen',
    hu: 'Mégsem',
    ru: 'Отмена',
    zh: '取消',
  },

  'popup.tab_reopen_rules.title': {
    en: 'Tab reopening rules',
    de: 'Regeln für die Wiedereröffnung der Registerkarte',
    hu: 'Lap újranyitásának szabályai',
    ru: 'Правила',
    zh_CN: '标签页重新打开规则',
    zh_TW: '分頁重新開啟規則',
  },
  'popup.tab_reopen_rules.enable_label': {
    en: 'Enable listed rules',
    de: 'Aktivieren Sie die aufgeführten Regeln',
    hu: 'A szabályok engedélyezése',
    ru: 'Включить перечисленные правила',
    zh_CN: '启用列出的规则',
    zh_TW: '啟用列出的規則',
  },
  'popup.tab_reopen_rules.editor_title.new': {
    en: 'Create new rule',
    de: 'Neue Regel erstellen',
    hu: 'Új szabály megadása',
    ru: 'Создать правило',
    zh_CN: '创建新规则',
    zh_TW: '建立新規則',
  },
  'popup.tab_reopen_rules.editor_title.edit': {
    en: 'Edit rule',
    de: 'Regel bearbeiten',
    hu: 'Szabály szerkesztése',
    ru: 'Редактировать правило',
    zh_CN: '编辑规则',
    zh_TW: '編輯規則',
  },
  'popup.tab_reopen_rules.rule_name_label': {
    en: 'Name (optional)',
    hu: 'Név (opcionális)',
    ru: 'Название (опционально)',
    zh_CN: '名称（选填）',
    zh_TW: '名稱（選填）',
  },
  'popup.tab_reopen_rules.rule_type_label': {
    en: 'Type of the rule',
    de: 'Regeltyp',
    hu: 'A szabály típusa',
    ru: 'Тип правила',
    zh_CN: '规则类型',
    zh_TW: '規則類型',
  },
  'popup.tab_reopen_rules.rule_type_include': {
    en: 'Include rule',
    de: 'Einschlussregel',
    hu: 'Befoglaló szabály',
    ru: 'Правило включения',
    zh_CN: '包括规则',
    zh_TW: '包括規則',
  },
  'popup.tab_reopen_rules.rule_type_exclude': {
    en: 'Exclude rule',
    de: 'Ausschlussregel',
    hu: 'Kizáró szabály',
    ru: 'Правило исключения',
    zh_CN: '排除规则',
    zh_TW: '排除規則',
  },
  'popup.tab_reopen_rules.rule_url_label': {
    en: 'If tab has URL ("substring" or "/RegExp/")',
    de: 'Wenn Tab URL hat ("substring" oder "/RegExp/")',
    hu: 'Ha az URL illeszkedik ("szövegrészlet" vagy /RegExp/)',
    ru: 'Если вкладка имеет URL-адрес ("подстрока" или "/RegExp/")',
    zh_CN: '如果标签页有 URL ("字符串" 或 "/RegExp/")',
    zh_TW: '如果分頁含有 URL ("字符串" 或 "/RegExp/")',
  },
  'popup.tab_reopen_rules.rule_suffix_include': {
    en: n => `...reopen it in "${n}" container`,
    de: n => `...in "${n}" Behälter wieder öffnen`,
    hu: n => `…újranyitás ebben a konténerben: ${n}`,
    ru: n => `...открыть ee в контейнере "${n}"`,
    zh_CN: n => `...在 "${n}" 容器中重新打开它`,
    zh_TW: n => `...在「${n}」容器中重新開啟它`,
  },
  'popup.tab_reopen_rules.rule_suffix_exclude': {
    en: n => `...and it is in "${n}" container, reopen it in default container.`,
    de: n => `...und es ist in "${n}" Behälter, öffnen Sie es in Standardbehälter.`,
    hu: n => `…és a jelenlegi konténere „${n}”, akkor újranyitás az alapértelmezett konténerben.`,
    ru: n => `...и она находится в контейнере "${n}", открыть ее в контейнере по умолчанию.`,
    zh_CN: n => `...而它在 "${n}" 容器中，在默认容器中重新打开它。`,
    zh_TW: n => `...而它在「${n}」容器中，則在預設容器中重新開啟它。`,
  },
  'popup.tab_reopen_rules.add_rule_btn': {
    en: 'Add rule',
    de: 'Regel hinzufügen',
    hu: 'Szabály hozzáadása',
    ru: 'Добавить правило',
    zh_CN: '添加规则',
    zh_TW: '新增規則',
  },
  'popup.tab_reopen_rules.edit_rule_btn.save': {
    en: 'Save',
    de: 'Regel speichern',
    hu: 'Mentés',
    ru: 'Сохранить',
    zh_CN: '保存',
    zh_TW: '儲存',
  },
  'popup.tab_reopen_rules.edit_rule_btn.cancel': {
    en: 'Cancel',
    de: 'Abbrechen',
    hu: 'Mégsem',
    ru: 'Отмена',
    zh: '取消',
  },

  'popup.url_rules.title': {
    en: 'Site Config',
    de: 'Seitenkonfiguration',
    hu: 'Webhelybeállítások',
    ru: 'Настройка сайта',
    zh_CN: '站点配置',
    zh_TW: '網站設定',
  },
  'popup.url_rules.match_label': {
    en: 'Select tabs by URL',
    de: 'Tabs nach URL auswählen',
    hu: 'Lapok kijelölése URL alapján',
    ru: 'Выбирать вкладки по URL',
    zh_CN: '按 URL 选择标签页',
    zh_TW: '依 URL 選取分頁',
  },
  'popup.url_rules.custom_match_placeholder': {
    en: '"substring" or "/RegExp/"',
    de: '"substring" oder "/RegExp/"',
    hu: '"szövegrészlet" vagy /RegExp/',
    ru: '"подстрока" или "/RegExp/"',
    zh: '"字符串" 或 "/RegExp/"',
  },
  'popup.url_rules.reopen_label': {
    en: 'Reopen these tabs in container:',
    de: 'Diese Tabs in Behälter wieder öffnen:',
    hu: 'Újranyitás konténerben:',
    ru: 'Открывать эти вкладки в контейнере:',
    zh_CN: '重新打开这些选项卡在：',
    zh_TW: '重開這些分頁於容器：',
  },
  'popup.url_rules.move_label': {
    en: 'Move these tabs to panel:',
    de: 'Diese Tabs in Panel verschieben:',
    hu: 'Áthelyezés panelra:',
    ru: 'Перемещать эти вкладки в панель:',
    zh_CN: '将这些选项卡移动到面板：',
    zh_TW: '將這些分頁移動到面板：',
  },
  'popup.url_rules.move_top_lvl_label': {
    en: 'If tab at the top level of tree',
    de: 'Wenn Tab auf der obersten Ebene des Baums ist',
    hu: 'Ha a lap legfelső szintű',
    ru: 'Если вкладка на верхнем уровне дерева',
    zh_CN: '如果选项卡位于树的顶层',
    zh_TW: '如果分頁位於樹的頂層',
  },

  // ---
  // -- Context menu
  // -
  // - Toolbar button (browserAction)
  'menu.browserAction.open_settings': {
    en: 'Open settings',
    de: 'Einstellungen öffnen',
    hu: 'Beállítások',
    ru: 'Открыть настройки',
    zh_CN: '打开设置',
    zh_TW: '開啟設定',
  },
  'menu.browserAction.create_snapshot': {
    en: 'Create snapshot',
    de: 'Schnappschuss erstellen',
    hu: 'Pillanatkép készítése',
    ru: 'Создать снепшот',
    zh_CN: '创建快照',
    zh_TW: '建立快照',
  },
  // - New tab bar
  'menu.new_tab_bar.no_container': {
    en: 'No Container',
    de: 'Keine Umgebung',
    hu: 'Nincs konténer',
    ru: 'Не в контейнере',
    zh_CN: '无容器',
    zh_TW: '無容器',
  },
  'menu.new_tab_bar.new_container': {
    en: 'In New Container',
    de: 'In neuer Umgebung',
    hu: 'Új konténer',
    ru: 'В новом контейнере',
    zh: '在新容器中',
  },
  'menu.new_tab_bar.manage_shortcuts': {
    en: 'Manage Shortcuts',
    hu: 'Parancsikonok kezelése',
    ru: 'Управление ярлыками',
    zh_CN: '管理快捷方式',
    zh_TW: '管理捷徑',
  },
  'menu.new_tab_bar.manage_containers': {
    en: 'Manage Containers',
    de: 'Umgebungen verwalten',
    hu: 'Konténerek kezelése',
    ru: 'Управление контейнерами',
    zh: '管理容器',
  },
  // - Bookmark
  'menu.bookmark.open_in_sub_menu_name': {
    en: 'Open in',
    de: 'Öffnen in',
    hu: 'Megnyitás itt',
    ru: 'Открыть в',
    zh_CN: '打开',
    zh_TW: '開啟',
  },
  'menu.bookmark.open_in_new_window': {
    en: 'Open in new normal window',
    de: 'Öffnen in neuem normalem Fenster',
    hu: 'Megnyitás itt: új ablak',
    ru: 'Открыть в новом стандартном окне',
    zh_CN: '新建窗口打开链接',
    zh_TW: '用新視窗開啟',
  },
  'menu.bookmark.open_in_new_priv_window': {
    en: 'Open in new private window',
    de: 'Öffnen in neuem privatem Fenster',
    hu: 'Megnyitás itt: új privát ablak',
    ru: 'Открыть в новом приватном окне',
    zh_CN: '新建隐私窗口打开链接',
    zh_TW: '用新隱私視窗開啟',
  },
  'menu.bookmark.open_in_panel_': {
    en: 'Open in panel...',
    de: 'Öffnen in Panel...',
    hu: 'Megnyitás itt: panel…',
    ru: 'Открыть в панели...',
    zh_CN: '在面板中打开...',
    zh_TW: '在面板中開啟...',
  },
  'menu.bookmark.open_in_new_panel': {
    en: 'Open in new tabs panel',
    de: 'Öffnen in neuem Tab-Panel',
    hu: 'Megnyitás itt: új lappanel',
    ru: 'Открыть в новой панели вкладок',
    zh_CN: '新标签面板中打开链接',
    zh_TW: '用新分頁面板開啟',
  },
  'menu.bookmark.open_in_ctr_': {
    en: 'Open in container...',
    de: 'Öffnen in Umgebung...',
    hu: 'Megnyitás itt: konténer…',
    ru: 'Открыть в контейнере...',
    zh_CN: '在容器中打开...',
    zh_TW: '在容器中開啟...',
  },
  'menu.bookmark.open_in_default_ctr': {
    en: 'Open in default container',
    de: 'Öffnen in Standardumgebung',
    hu: 'Megnyitás itt: alapértelmezett konténer',
    ru: 'Открыть в стандартном контейнере',
    zh_CN: '在默认容器中打开',
    zh_TW: '用預設容器開啟',
  },
  'menu.bookmark.open_in_': {
    en: 'Open in ',
    de: 'Öffnen in ',
    hu: 'Megnyitás itt: ',
    ru: 'Открыть в ',
    zh_CN: '打开在 ',
    zh_TW: '開啟於：',
  },
  'menu.bookmark.sort_sub_menu_name': {
    en: 'Sort',
    de: 'Sortieren',
    hu: 'Rendezés',
    ru: 'Сортировать',
    zh: '排序',
  },
  'menu.bookmark.sort_by_name_asc': {
    en: 'Sort by name (A-z)',
    de: 'Sortieren nach Name (A-z)',
    hu: 'Rendezés: név szerint (A–z)',
    ru: 'Сортировать по названию (А-я)',
    zh_CN: '按名称排序 (A-z)',
    zh_TW: '依名稱排序 (A-z)',
  },
  'menu.bookmark.sort_by_name_des': {
    en: 'Sort by name (z-A)',
    de: 'Sortieren nach Name (z-A)',
    hu: 'Rendezés: név szerint (z–A)',
    ru: 'Сортировать по названию (я-А)',
    zh_CN: '按名称排序 (z-A)',
    zh_TW: '依名稱排序 (z-A)',
  },
  'menu.bookmark.sort_by_link_asc': {
    en: 'Sort by URL (A-z)',
    de: 'Sortieren nach URL (A-z)',
    hu: 'Rendezés: URL szerint (A–z)',
    ru: 'Сортировать по адресу (А-я)',
    zh_CN: '按网址排序 (A-z)',
    zh_TW: '依網址排序 (A-z)',
  },
  'menu.bookmark.sort_by_link_des': {
    en: 'Sort by URL (z-A)',
    de: 'Sortieren nach URL (z-A)',
    hu: 'Rendezés: URL szerint (z–A)',
    ru: 'Сортировать по адресу (я-А)',
    zh_CN: '按网址排序 (z-A)',
    zh_TW: '依網址排序 (z-A)',
  },
  'menu.bookmark.sort_by_time_asc': {
    en: 'Sort by time (Old-New)',
    de: 'Sortieren nach Zeit (Alt-Neu)',
    hu: 'Rendezés: idő szerint (régi–új)',
    ru: 'Сортировать по времени (Старые-Новые)',
    zh_CN: '按添加时间排序（旧-新）',
    zh_TW: '依加入日期排序（舊-新）',
  },
  'menu.bookmark.sort_by_time_des': {
    en: 'Sort by time (New-Old)',
    de: 'Sortieren nach Zeit (Neu-Alt)',
    hu: 'Rendezés: idő szerint (új–régi)',
    ru: 'Сортировать по времени (Новые-Старые)',
    zh_CN: '按添加时间排序（新-旧）',
    zh_TW: '依加入日期排序（新-舊）',
  },
  'menu.bookmark.create_bookmark': {
    en: 'Create bookmark',
    de: 'Lesezeichen erstellen',
    hu: 'Új könyvjelző',
    ru: 'Создать закладку',
    zh_CN: '创建书签',
    zh_TW: '新增書籤',
  },
  'menu.bookmark.create_folder': {
    en: 'Create folder',
    de: 'Ordner erstellen',
    hu: 'Új mappa',
    ru: 'Создать папку',
    zh_CN: '创建文件夹',
    zh_TW: '新增資料夾',
  },
  'menu.bookmark.create_separator': {
    en: 'Create separator',
    de: 'Trennlinie hinzufügen',
    hu: 'Új elválasztó',
    ru: 'Создать разделитель',
    zh_CN: '创建分隔符',
    zh_TW: '新增分隔線',
  },
  'menu.bookmark.open_as_bookmarks_panel': {
    en: 'Open as bookmarks panel',
    de: 'Als Lesezeichen-Panel öffnen',
    hu: 'Megnyitás könyvjelzőpanelként',
    ru: 'Открыть как панель закладок',
    zh_CN: '作为书签面板打开',
    zh_TW: '作為書籤面板開啟',
  },
  'menu.bookmark.open_as_tabs_panel': {
    en: 'Open as tabs panel',
    de: 'Als Tab-Panel öffnen',
    hu: 'Megnyitás lappanelként',
    ru: 'Открыть как панель вкладок',
    zh_CN: '作为标签页面板打开',
    zh_TW: '作為分頁面板開啟',
  },
  'menu.bookmark.move_to': {
    en: 'Move to...',
    de: 'Verschieben nach...',
    hu: 'Áthelyezés…',
    ru: 'Переместить в...',
    zh_CN: '移动到...',
    zh_TW: '移動到...',
  },
  'menu.bookmark.edit_bookmark': {
    en: 'Edit',
    de: 'Bearbeiten',
    hu: 'Szerkesztés',
    ru: 'Редактировать',
    zh_CN: '编辑',
    zh_TW: '編輯',
  },
  'menu.bookmark.delete_bookmark': {
    en: 'Delete',
    de: 'Löschen',
    hu: 'Törlés',
    ru: 'Удалить',
    zh_CN: '删除',
    zh_TW: '刪除',
  },
  // - Bookmarks panel
  'menu.bookmark.collapse_all': {
    en: 'Collapse all folders',
    de: 'Alle Ordner einklappen',
    hu: 'Mappák becsukása',
    ru: 'Свернуть все папки',
    zh_CN: '折叠全部文件夹',
    zh_TW: '折疊全部資料夾',
  },
  'menu.bookmark.switch_view': {
    en: 'View mode',
    de: 'Anzeigemodus',
    hu: 'Nézet',
    ru: 'Режим отображения',
    zh_CN: '视图模式',
    zh_TW: '檢視模式',
  },
  'menu.bookmark.switch_view_history': {
    en: 'History view',
    de: 'Chronikansicht',
    hu: 'Előzménynézet',
    ru: 'Хронологическое отображение',
    zh_CN: '历史视图',
    zh_TW: '歷史檢視',
  },
  'menu.bookmark.switch_view_tree': {
    en: 'Tree view',
    de: 'Baumansicht',
    hu: 'Fanézet',
    ru: 'Древовидное отображение',
    zh_CN: '树状视图',
    zh_TW: '樹狀檢視',
  },
  'menu.bookmark.convert_to_tabs_panel': {
    en: 'Convert to tabs panel',
    de: 'In Tab-Panel konvertieren',
    hu: 'Átalakítás lappanellá',
    ru: 'Конвертировать в панель вкладок',
    zh_CN: '转换为标签页面板',
    zh_TW: '轉換為分頁面板',
  },
  'menu.bookmark.remove_panel': {
    en: 'Remove panel',
    de: 'Panel entfernen',
    hu: 'Panel törlése',
    ru: 'Удалить панель',
    zh: '移除面板',
  },
  // - Tab
  'menu.tab.undo': {
    en: 'Undo close tab',
    de: 'Geschlossenen Tab wiederherstellen',
    hu: 'Lapbezárás visszavonása',
    ru: 'Восстановить закрытую вкладку',
    zh_CN: '撤消关闭标签页',
    zh_TW: '回復關閉的分頁',
  },
  'menu.tab.mute': {
    en: 'Mute',
    de: 'Stumm schalten',
    hu: 'Némítás',
    ru: 'Выключить звук',
    zh_CN: '静音',
    zh_TW: '分頁靜音',
  },
  'menu.tab.unmute': {
    en: 'Unmute',
    de: 'Stummschaltung aufheben',
    hu: 'Visszahangosítás',
    ru: 'Включить звук',
    zh_CN: '取消静音',
    zh_TW: '取消分頁靜音',
  },
  'menu.tab.reload': {
    en: 'Reload',
    de: 'Neu laden',
    hu: 'Újratöltés',
    ru: 'Перезагрузить',
    zh_CN: '重新加载',
    zh_TW: '重新載入分頁',
  },
  'menu.tab.bookmark': {
    en: 'Add to bookmarks',
    de: 'Zu Lesezeichen hinzufügen',
    hu: 'Könyvjelzőzés',
    ru: 'В закладки',
    zh_CN: '添加到书签',
    zh_TW: '將分頁加入書籤',
  },
  'menu.tab.move_to_sub_menu_name': {
    en: 'Move to',
    de: 'Verschieben in',
    hu: 'Áthelyezés ide',
    ru: 'Переместить в',
    zh_CN: '移动到',
    zh_TW: '移動分頁',
  },
  'menu.tab.move_to_new_window': {
    en: 'Move to new window',
    de: 'Verschieben in neues Fenster',
    hu: 'Áthelyezés ide: új ablak',
    ru: 'Переместить в новое окно',
    zh_CN: '移动到新窗口',
    zh_TW: '移動到新視窗',
  },
  'menu.tab.move_to_new_priv_window': {
    en: 'Move to private window',
    de: 'Verschieben in privates Fenster',
    hu: 'Áthelyezés ide: új privát ablak',
    ru: 'Переместить в приватное окно',
    zh_CN: '移动到新隐私窗口',
    zh_TW: '移動到新隱私視窗',
  },
  'menu.tab.move_to_window_': {
    en: 'Move to window...',
    de: 'Verschieben in Fenster...',
    hu: 'Áthelyezés ide: ablak…',
    ru: 'Переместить в окно...',
    zh_CN: '移动到窗口...',
    zh_TW: '移動到視窗...',
  },
  'menu.tab.move_to_another_window': {
    en: 'Move to another window',
    de: 'Verschieben in anderes Fenster',
    hu: 'Áthelyezés ide: a másik ablak',
    ru: 'Переместить в другое окно',
    zh_CN: '移动到另一个窗口',
    zh_TW: '移動到另一個視窗',
  },
  'menu.tab.move_to_panel_label': {
    en: 'Move to panel...',
    de: 'Verschieben in Panel...',
    hu: 'Áthelyezés ide: panel…',
    ru: 'Переместить в панель...',
    zh_CN: '移动到面板...',
    zh_TW: '移動到面板...',
  },
  'menu.tab.move_to_panel_': {
    en: 'Move to ',
    de: 'Verschieben in ',
    hu: 'Áthelyezés ide: ',
    ru: 'Переместить в ',
    zh_CN: '移动到 ',
    zh_TW: '移動到面板：',
  },
  'menu.tab.move_to_new_panel': {
    en: 'Move to new panel',
    de: 'Verschieben in neues Panel',
    hu: 'Áthelyezés ide: új panel',
    ru: 'Переместить в новую панель',
    zh_CN: '移动到新面板',
    zh_TW: '移動到新面板',
  },
  'menu.tab.reopen_in_sub_menu_name': {
    en: 'Reopen in',
    de: 'Neu öffnen in',
    hu: 'Újranyitás itt',
    ru: 'Переоткрыть в',
    zh_CN: '重新打开',
    zh_TW: '重新開啟',
  },
  'menu.tab.reopen_in_new_window': {
    en: 'Reopen in new window of another type',
    de: 'Neu öffnen in neuem Fenster eines anderen Typs',
    hu: 'Újranyitás itt: ellenkező típusú új ablak',
    ru: 'Переоткрыть в новом окне другого типа',
    zh_CN: '用其他类型的新窗口重新打开',
    zh_TW: '用其他類型的新視窗重新開啟',
  },
  'menu.tab.reopen_in_new_norm_window': {
    en: 'Reopen in new normal window',
    de: 'Neu öffnen in neuem normalem Fenster',
    hu: 'Újranyitás itt: új ablak',
    ru: 'Переоткрыть в новом стандартном окне',
    zh_CN: '用新普通窗口重新打开',
    zh_TW: '用新普通視窗重新開啟',
  },
  'menu.tab.reopen_in_new_priv_window': {
    en: 'Reopen in new private window',
    de: 'Neu öffnen in neuem privatem Fenster',
    hu: 'Újranyitás itt: új privát ablak',
    ru: 'Переоткрыть в новом приватном окне',
    zh_CN: '用新隐私窗口重新打开',
    zh_TW: '用新隱私視窗重新開啟',
  },
  'menu.tab.reopen_in_window': {
    en: 'Reopen in window of another type',
    de: 'Neu öffnen in Fenster eines anderen Typs',
    hu: 'Újranyitás itt: ellenkező típusú ablak',
    ru: 'Переоткрыть в окне другого типа',
    zh_CN: '用其他类型的窗口重新打开',
    zh_TW: '用其他類型的視窗重新開啟',
  },
  'menu.tab.reopen_in_norm_window': {
    en: 'Reopen in normal window',
    de: 'Neu öffnen in normalem Fenster',
    hu: 'Újranyitás itt: normál ablak',
    ru: 'Переоткрыть в стандартном окне',
    zh_CN: '用普通窗口重新打开',
    zh_TW: '用普通視窗重新開啟',
  },
  'menu.tab.reopen_in_priv_window': {
    en: 'Reopen in private window',
    de: 'Neu öffnen in privatem Fenster',
    hu: 'Újranyitás itt: privát ablak',
    ru: 'Переоткрыть в приватном окне',
    zh_CN: '用隐私窗口重新打开',
    zh_TW: '用隱私視窗重新開啟',
  },
  'menu.tab.reopen_in_window_': {
    en: 'Reopen in window...',
    de: 'Neu öffnen in Fenster...',
    hu: 'Újranyitás itt: ablak…',
    ru: 'Переоткрыть в окне...',
    zh_CN: '用窗口重新打开...',
    zh_TW: '用視窗重新開啟...',
  },
  'menu.tab.reopen_in_ctr_': {
    en: 'Reopen in container...',
    de: 'Neu öffnen in Umgebung...',
    hu: 'Újranyitás itt: konténer…',
    ru: 'Переоткрыть в контейнере...',
    zh_CN: '用容器重新打开...',
    zh_TW: '用容器重新開啟...',
  },
  'menu.tab.reopen_in_default_container': {
    en: 'Reopen in default container',
    de: 'In Standardumgebung neu öffnen',
    hu: 'Újranyitás itt: alapértelmezett konténer',
    ru: 'Переоткрыть в стандартном контейнере',
    zh_CN: '用默认容器重新打开',
    zh_TW: '用預設容器重新開啟',
  },
  'menu.tab.reopen_in_': {
    en: 'Reopen in ',
    de: 'Neu öffnen in ',
    hu: 'Újranyitás itt: ',
    ru: 'Переоткрыть в ',
    zh_CN: '重新打开在 ',
    zh_TW: '重開於容器：',
  },
  'menu.tab.reopen_in_new_container': {
    en: 'Reopen in new container',
    de: 'Neu öffnen in neuer Umgebung',
    hu: 'Újranyitás itt: új konténer',
    ru: 'Переоткрыть в новом контейнере',
    zh_CN: '用新容器重新打开',
    zh_TW: '用新容器重新開啟',
  },
  'menu.tab.colorize_': {
    en: 'Set color',
    hu: 'Színbeállítás',
    ru: 'Задать цвет',
    zh_CN: '设置颜色',
    zh_TW: '設定顏色',
  },
  'menu.tab.colorize_colors': {
    en: 'Color...',
    hu: 'Szín…',
    ru: 'Цвет...',
    zh_CN: '颜色...',
    zh_TW: '顏色...',
  },
  'menu.tab.sort_sub_menu_name': {
    en: 'Sort',
    de: 'Sortieren',
    hu: 'Rendezés',
    ru: 'Сортировать',
    zh: '排序',
  },
  'menu.tab.sort_by_title_asc': {
    en: 'Sort by title (A-z)',
    de: 'Sortieren nach Titel (A-z)',
    hu: 'Rendezés: cím szerint (A–z)',
    ru: 'Сортировать по названию (А-я)',
    zh_CN: '按名称排序 (A-z)',
    zh_TW: '依名稱排序 (A-z)',
  },
  'menu.tab.sort_by_title_des': {
    en: 'Sort by title (z-A)',
    de: 'Sortieren nach Titel (z-A)',
    hu: 'Rendezés: cím szerint (z–A)',
    ru: 'Сортировать по названию (я-А)',
    zh_CN: '按名称排序 (z-A)',
    zh_TW: '依名稱排序 (z-A)',
  },
  'menu.tab.sort_by_url_asc': {
    en: 'Sort by URL (A-z)',
    de: 'Sortieren nach URL (A-z)',
    hu: 'Rendezés: URL szerint (A–z)',
    ru: 'Сортировать по адресу (А-я)',
    zh_CN: '按网址排序 (A-z)',
    zh_TW: '依網址排序 (A-z)',
  },
  'menu.tab.sort_by_url_des': {
    en: 'Sort by URL (z-A)',
    de: 'Sortieren nach URL (z-A)',
    hu: 'Rendezés: URL szerint (z–A)',
    ru: 'Сортировать по адресу (я-А)',
    zh_CN: '按网址排序 (z-A)',
    zh_TW: '依網址排序 (z-A)',
  },
  'menu.tab.sort_by_time_asc': {
    en: 'Sort by access time (Old-Recent)',
    de: 'Sortieren nach Zugriffszeit (Alt-Neu)',
    hu: 'Rendezés: idő szerint (régi–új)',
    ru: 'Сортировать по времени доступа (Старые-Новые)',
    zh_CN: '按存取时间排序（旧-新）',
    zh_TW: '依最近瀏覽時間排序（舊-新）',
  },
  'menu.tab.sort_by_time_des': {
    en: 'Sort by access time (Recent-Old)',
    de: 'Sortieren nach Zugriffszeit (Neu-Alt)',
    hu: 'Rendezés: idő szerint (új–régi)',
    ru: 'Сортировать по времени доступа (Новые-Старые)',
    zh_CN: '按存取时间排序（新-旧）',
    zh_TW: '依最近瀏覽時間排序（新-舊）',
  },
  'menu.tab.sort_tree_by_title_asc': {
    en: 'Sort tree by title (A-z)',
    de: 'Baum nach Titel sortieren (A-z)',
    hu: 'Rendezés: fa cím szerint (A–z)',
    ru: 'Сортировать дерево по названию (А-я)',
    zh_CN: '按标题对树进行排序 (A-z)',
    zh_TW: '依名稱對樹排序 (A-z)',
  },
  'menu.tab.sort_tree_by_title_des': {
    en: 'Sort tree by title (z-A)',
    de: 'Baum nach Titel sortieren (z-A)',
    hu: 'Rendezés: fa cím szerint (z–A)',
    ru: 'Сортировать дерево по названию (я-А)',
    zh_CN: '按标题对树进行排序 (z-A)',
    zh_TW: '依名稱對樹排序 (z-A)',
  },
  'menu.tab.sort_tree_by_url_asc': {
    en: 'Sort tree by URL (A-z)',
    de: 'Baum nach URL sortieren (A-z)',
    hu: 'Rendezés: fa URL szerint (A–z)',
    ru: 'Сортировать дерево по адресу (А-я)',
    zh_CN: '按 URL 对树排序 (A-z)',
    zh_TW: '依網址對樹排序 (A-z)',
  },
  'menu.tab.sort_tree_by_url_des': {
    en: 'Sort tree by URL (z-A)',
    de: 'Baum nach URL sortieren (z-A)',
    hu: 'Rendezés: fa URL szerint (z–A)',
    ru: 'Сортировать дерево по адресу (я-А)',
    zh_CN: '按 URL 对树排序 (z-A)',
    zh_TW: '依網址對樹排序 (z-A)',
  },
  'menu.tab.sort_tree_by_time_asc': {
    en: 'Sort tree by access time (Old-Recent)',
    de: 'Baum nach Zugriffszeit sortieren (Alt-Neu)',
    hu: 'Rendezés: fa idő szerint (régi–új)',
    ru: 'Сортировать дерево по времени доступа (Старые-Новые)',
    zh_CN: '按访问时间排序树（旧-新）',
    zh_TW: '依最近瀏覽時間對樹排序（舊-新）',
  },
  'menu.tab.sort_tree_by_time_des': {
    en: 'Sort tree by access time (Recent-Old)',
    de: 'Baum nach Zugriffszeit sortieren (Neu-Alt)',
    hu: 'Rendezés: fa idő szerint (új–régi)',
    ru: 'Сортировать дерево по времени доступа (Новые-Старые)',
    zh_CN: '按访问时间排序树（新-旧）',
    zh_TW: '依最近瀏覽時間對樹排序（新-舊）',
  },
  'menu.tab.pin': {
    en: 'Pin',
    de: 'Anheften',
    hu: 'Rögzítés',
    ru: 'Закрепить',
    zh_CN: '固定标签页',
    zh_TW: '釘選分頁',
  },
  'menu.tab.unpin': {
    en: 'Unpin',
    de: 'Lösen',
    hu: 'Feloldás',
    ru: 'Открепить',
    zh_CN: '取消固定标签页',
    zh_TW: '取消釘選分頁',
  },
  'menu.tab.duplicate': {
    en: 'Duplicate',
    de: 'Duplizieren',
    hu: 'Megkettőzés',
    ru: 'Дублировать',
    zh_CN: '复制标签页',
    zh_TW: '複製分頁',
  },
  'menu.tab.discard': {
    en: 'Unload',
    de: 'Entladen',
    hu: 'Kisöprés',
    ru: 'Выгрузить',
    zh_CN: '卸载标签页',
    zh_TW: '卸載分頁',
  },
  'menu.tab.edit_title': {
    en: 'Edit title',
    hu: 'Cím szerkesztése',
    ru: 'Редактировать заголовок',
    zh_CN: '编辑标题',
    zh_TW: '編輯標題',
  },
  'menu.tab.group': {
    en: 'Group',
    de: 'Gruppe',
    hu: 'Csoportosítás',
    ru: 'Сгруппировать',
    zh_CN: '分配给组',
    zh_TW: '分給群組',
  },
  'menu.tab.flatten': {
    en: 'Flatten',
    de: 'Plätten',
    hu: 'Szintcsökkentés',
    ru: 'Сбросить вложенность',
    zh_CN: '树序列化',
    zh_TW: '樹序列化',
  },
  'menu.tab.url_conf': {
    en: 'Configure site...',
    hu: 'Webhelybeállítások…',
    ru: 'Настроить сайт...',
    zh_CN: '配置站点...',
    zh_TW: '設定網站...',
  },
  'menu.tab.clear_cookies': {
    en: 'Clear cookies',
    de: 'Cookies löschen',
    hu: 'Sütik törlése',
    ru: 'Удалить cookies',
    zh: '清除 Cookie',
  },
  'menu.tab.close': {
    en: 'Close',
    de: 'Schließen',
    hu: 'Bezárás',
    ru: 'Закрыть',
    zh_CN: '关闭标签页',
    zh_TW: '關閉分頁',
  },
  'menu.tab.open_in_ctr_': {
    en: 'Open in container...',
    hu: 'Megnyitás itt: konténer…',
    ru: 'Открыть в контейнере...',
    zh_CN: '用容器打开...',
    zh_TW: '用容器開啟...',
  },
  'menu.tab.open_in_default_container': {
    en: 'Open in default container',
    hu: 'Megnyitás itt: alapértelmezett konténer',
    ru: 'Открыть в новом контейнере',
    zh_CN: '用默认容器打开',
    zh_TW: '用預設容器開啟',
  },
  'menu.tab.open_in_': {
    en: 'Open in ',
    hu: 'Megnyitás itt: ',
    ru: 'Открыть в ',
    zh_CN: '打开在 ',
    zh_TW: '開啟於容器：',
  },
  'menu.tab.close_descendants': {
    en: 'Close descendants',
    de: 'Abkömmlinge schließen',
    hu: 'Utódlapok bezárása',
    ru: 'Закрыть потомки',
    zh_CN: '关闭子选项',
    zh_TW: '關閉子孫分頁',
  },
  'menu.tab.close_branch': {
    en: 'Close branch',
    de: 'Zweig schließen',
    hu: 'Ág lapjainak bezárása',
    ru: 'Закрыть ветку',
    zh_CN: '关闭分支',
    zh_TW: '關閉分支',
  },
  'menu.tab.close_above': {
    en: 'Close tabs above',
    de: 'Tabs darüber schließen',
    hu: 'Lapok bezárása felfelé',
    ru: 'Закрыть вкладки сверху',
    zh_CN: '关闭上侧标签页',
    zh_TW: '關閉上側分頁',
  },
  'menu.tab.close_below': {
    en: 'Close tabs below',
    de: 'Tabs darunter schließen',
    hu: 'Lapok bezárása lefelé',
    ru: 'Закрыть вкладки снизу',
    zh_CN: '关闭下侧标签页',
    zh_TW: '關閉下側分頁',
  },
  'menu.tab.close_other': {
    en: 'Close other tabs',
    de: 'Andere Tabs schließen',
    hu: 'A többi lap bezárása',
    ru: 'Закрыть другие вкладки',
    zh_CN: '关闭其他标签页',
    zh_TW: '關閉其他分頁',
  },
  // - Tabs panel
  'menu.tabs_panel.mute_all_audible': {
    en: 'Mute all audible tabs',
    de: 'Alle hörbaren Tabs stummschalten',
    hu: 'Hangos lapok némítása',
    ru: 'Выключить звук',
    zh_CN: '静音全部有声标签页',
    zh_TW: '靜音全部有聲分頁',
  },
  'menu.tabs_panel.reload': {
    en: 'Reload tabs',
    de: 'Tabs neu laden',
    hu: 'Lapok újratöltése',
    ru: 'Перезагрузить вкладки',
    zh_CN: '重新加载标签页',
    zh_TW: '重新載入分頁',
  },
  'menu.tabs_panel.discard': {
    en: 'Unload tabs',
    de: 'Tabs entladen',
    hu: 'Lapok kisöprése',
    ru: 'Выгрузить вкладки',
    zh_CN: '卸载标签页',
    zh_TW: '卸載分頁',
  },
  'menu.tabs_panel.sort_all_sub_menu_name': {
    en: 'Sort all tabs',
    de: 'Sortieren Sie alle Tabs',
    hu: 'Minden lap rendezése',
    ru: 'Сортировать все вкладки',
    zh_CN: '对全部选项卡进行排序',
    zh_TW: '排序全部分頁',
  },
  'menu.tabs_panel.sort_all_by_title_asc': {
    en: 'Sort all tabs by title (A-z)',
    de: 'Sortieren Sie alle Tabs nach Titel (A-z)',
    hu: 'Minden lap rendezése: cím szerint (A–z)',
    ru: 'Сортировать все вкладки по названию (А-я)',
    zh_CN: '按标题对全部选项卡进行排序 (A-z)',
    zh_TW: '依名稱排序全部分頁 (A-z)',
  },
  'menu.tabs_panel.sort_all_by_title_des': {
    en: 'Sort all tabs by title (z-A)',
    de: 'Sortieren Sie alle Tabs nach Titel (z-A)',
    hu: 'Minden lap rendezése: cím szerint (z–A)',
    ru: 'Сортировать все вкладки по названию (я-А)',
    zh_CN: '按标题对全部选项卡进行排序 (z-A)',
    zh_TW: '依名稱排序全部分頁 (z-A)',
  },
  'menu.tabs_panel.sort_all_by_url_asc': {
    en: 'Sort all tabs by URL (A-z)',
    de: 'Sortieren Sie alle Tabs nach URL (A-z)',
    hu: 'Minden lap rendezése: URL szerint (A–z)',
    ru: 'Сортировать все вкладки по URL (А-я)',
    zh_CN: '按 URL 对全部选项卡进行排序 (A-z)',
    zh_TW: '依網址排序全部分頁 (A-z)',
  },
  'menu.tabs_panel.sort_all_by_url_des': {
    en: 'Sort all tabs by URL (z-A)',
    de: 'Sortieren Sie alle Tabs nach URL (z-A)',
    hu: 'Minden lap rendezése: URL szerint (z–A)',
    ru: 'Сортировать все вкладки по URL (я-А)',
    zh_CN: '按 URL 对全部选项卡进行排序 (z-A)',
    zh_TW: '依網址排序全部分頁 (z-A)',
  },
  'menu.tabs_panel.sort_all_by_time_asc': {
    en: 'Sort all tabs by access time (Old-Recent)',
    de: 'Sortieren Sie alle Tabs nach Zugriffszeit (Alt-Neu)',
    hu: 'Minden lap rendezése: idő szerint (régi–új)',
    ru: 'Сортировать все вкладки по времени доступа (Старые-Новые)',
    zh_CN: '按访问时间对全部选项卡进行排序（旧-新）',
    zh_TW: '依最近瀏覽時間排序全部分頁（舊-新）',
  },
  'menu.tabs_panel.sort_all_by_time_des': {
    en: 'Sort all tabs by access time (Recent-Old)',
    de: 'Sortieren Sie alle Tabs nach Zugriffszeit (Neu-Alt)',
    hu: 'Minden lap rendezése: idő szerint (új–régi)',
    ru: 'Сортировать все вкладки по времени доступа (Новые-Старые)',
    zh_CN: '按访问时间对全部选项卡进行排序（新-旧）',
    zh_TW: '依最近瀏覽時間排序全部分頁（新-舊）',
  },
  'menu.tabs_panel.sel_all': {
    en: 'Select all tabs',
    de: 'Alle Tabs auswählen',
    hu: 'Minden lap kijelölése',
    ru: 'Выделить все вкладки',
    zh_CN: '选择全部标签页',
    zh_TW: '選取全部分頁',
  },
  'menu.tabs_panel.collapse_inact_branches': {
    en: 'Collapse inactive branches',
    de: 'Inaktive Zweige einklappen',
    hu: 'Inaktív ágak becsukása',
    ru: 'Свернуть неактивные ветки',
    zh_CN: '折叠非活动分支',
    zh_TW: '折疊非作用中分支',
  },
  'menu.tabs_panel.dedup': {
    en: 'Close duplicate tabs',
    de: 'Doppelte Tabs schließen',
    hu: 'Másodpéldányok bezárása',
    ru: 'Закрыть дубликаты',
    zh_CN: '关闭复制标签页',
    zh_TW: '關閉重複分頁',
  },
  'menu.tabs_panel.close': {
    en: 'Close tabs',
    de: 'Tabs schließen',
    hu: 'Lapok bezárása',
    ru: 'Закрыть вкладки',
    zh_CN: '关闭标签页',
    zh_TW: '關閉分頁',
  },
  'menu.tabs_panel.bookmark': {
    en: 'Save to bookmarks',
    de: 'In Lesezeichen speichern',
    hu: 'Könyvjelzőzés',
    ru: 'Сохранить в закладки',
    zh_CN: '保存到书签',
    zh_TW: '儲存到書籤',
  },
  'menu.tabs_panel.restore_from_bookmarks': {
    en: 'Restore from bookmarks',
    de: 'Aus Lesezeichen wiederherstellen',
    hu: 'Visszaállítás a könyvjelzőkből',
    ru: 'Восстановить из закладок',
    zh_CN: '从书签中恢复',
    zh_TW: '從書籤中復原',
  },
  'menu.tabs_panel.convert_to_bookmarks_panel': {
    en: 'Convert to bookmarks panel',
    de: 'In Lesezeichen-Panel konvertieren',
    hu: 'Átalakítás könyvjelzőpanellá',
    ru: 'Конвертировать в панель закладок',
    zh_CN: '转换为书签面板',
    zh_TW: '轉換為書籤面板',
  },
  'menu.tabs_panel.remove_panel': {
    en: 'Remove panel',
    de: 'Panel entfernen',
    hu: 'Panel törlése',
    ru: 'Удалить панель',
    zh: '移除面板',
  },
  // - History
  'menu.history.open': {
    en: 'Open',
    de: 'Öffnen',
    hu: 'Megnyitás',
    ru: 'Открыть',
    zh_CN: '打开',
    zh_TW: '開啟',
  },
  'menu.history.delete_visits': {
    en: n => (n === 1 ? 'Forget visit' : 'Forget visits'),
    de: n => (n === 1 ? 'Besuch vergessen' : 'Besuche vergessen'),
    hu: n => (n === 1 ? 'Megtekintés törlése' : 'Megtekintések törlése'),
    ru: n => (n === 1 ? 'Забыть запись' : 'Забыть записи'),
    zh_CN: '删除记录',
    zh_TW: '刪除頁面',
  },
  'menu.history.delete_sites': {
    en: n => (n === 1 ? 'Forget site' : 'Forget sites'),
    de: n => (n === 1 ? 'Seite vergessen' : 'Seiten vergessen'),
    hu: n => (n === 1 ? 'Webhely törlése' : 'Webhelyek törlése'),
    ru: n => (n === 1 ? 'Забыть сайт' : 'Забыть сайты'),
    zh_CN: '删除该站点的全部访问记录',
    zh_TW: '刪除與此網站有關的紀錄',
  },
  // - Common
  'menu.copy_urls': {
    en: n => (n === 1 || n === undefined ? 'Copy URL' : 'Copy URLs'),
    de: n => (n === 1 || n === undefined ? 'URL kopieren' : 'URLs kopieren'),
    hu: n => (n === 1 || n === undefined ? 'Hivatkozás másolása' : 'Hivatkozások másolása'),
    ru: n => (n === 1 || n === undefined ? 'Копировать адрес' : 'Копировать адреса'),
    zh_CN: n => (n === 1 || n === undefined ? '复制网址' : '复制全部网址'),
    zh_TW: n => (n === 1 || n === undefined ? '複製網址' : '複製全部網址'),
  },
  'menu.copy_titles': {
    en: n => (n === 1 || n === undefined ? 'Copy title' : 'Copy titles'),
    de: n => (n === 1 || n === undefined ? 'Titel kopieren' : 'Mehrere Titel kopieren'),
    hu: n => (n === 1 || n === undefined ? 'Cím másolása' : 'Címek másolása'),
    ru: n => (n === 1 || n === undefined ? 'Копировать заголовок' : 'Копировать заголовки'),
    zh_CN: n => (n === 1 || n === undefined ? '复制标题' : '复制全部标题'),
    zh_TW: n => (n === 1 || n === undefined ? '複製標題' : '複製全部標題'),
  },
  'menu.common.pin_panel': {
    en: 'Pin panel',
    de: 'Panel anheften',
    hu: 'Panel rögzítése',
    ru: 'Закрепить панель',
    zh_CN: '固定标签页',
    zh_TW: '釘選分頁',
  },
  'menu.common.unpin_panel': {
    en: 'Unpin panel',
    de: 'Panel lösen',
    hu: 'Panel feloldása',
    ru: 'Открепить панель',
    zh_CN: '取消固定标签页',
    zh_TW: '取消釘選分頁',
  },
  'menu.panels.unload': {
    en: 'Unload',
    de: 'Entladen',
    hu: 'Kisöprés',
    ru: 'Выгрузить',
    zh_CN: '卸载面板',
    zh_TW: '卸載面板',
  },
  'menu.common.conf': {
    en: 'Configure panel',
    de: 'Panel konfigurieren',
    hu: 'Panelbeállítások',
    ru: 'Настройки панели',
    zh_CN: '配置面板',
    zh_TW: '設定面板',
  },
  'menu.common.conf_tooltip': {
    en: 'Configure panel\nAlt: Basic panel config',
    de: 'Panel konfigurieren\nAlt: Panel Grundkonfiguration',
    hu: 'Panelbeállítások\nAlt: alapszintű panelbeállítások',
    ru: 'Настройки панели\nAlt: Базовые настройки панели',
    zh_CN: '配置面板\nAlt: 基本面板配置',
    zh_TW: '設定面板\nAlt: 基本面板設定',
  },
  'menu.common.conf_in_sidebar': {
    en: 'Configure panel in sidebar',
    de: 'Panel in der Seitenleiste konfigurieren',
    hu: 'Panelbeállítások az oldalsávon',
    ru: 'Быстрые настройки панели',
    zh_CN: '在侧边栏中配置面板',
    zh_TW: '在側邊欄中設定面板',
  },
  'menu.panels.hide_panel': {
    en: 'Hide panel',
    de: 'Panel verstecken',
    hu: 'Panel elrejtése',
    ru: 'Скрыть панель',
    zh_CN: '隐藏面板',
    zh_TW: '隱藏面板',
  },
  // - Menu Editor
  'menu.editor.reset': {
    en: 'Reset',
    de: 'Zurücksetzen',
    hu: 'Alaphelyzet',
    ru: 'Сброс',
    zh_CN: '重置',
    zh_TW: '重設',
  },
  'menu.editor.create_separator': {
    en: 'Create separator',
    de: 'Trennlinie einfügen',
    hu: 'Új elválasztó',
    ru: 'Создать разделитель',
    zh_CN: '新建分隔条',
    zh_TW: '新增分隔線',
  },
  'menu.editor.create_sub_tooltip': {
    en: 'Create sub-menu',
    de: 'Untermenü erstellen',
    hu: 'Új almenü',
    ru: 'Создать подменю',
    zh_CN: '创建子菜单',
    zh_TW: '建立子選單',
  },
  'menu.editor.down_tooltip': {
    en: 'Move down',
    de: 'Nach unten verschieben',
    hu: 'Mozgatás le',
    ru: 'Вниз',
    zh_CN: '向下移动',
    zh_TW: '向下移動',
  },
  'menu.editor.up_tooltip': {
    en: 'Move up',
    de: 'Nach oben verschieben',
    hu: 'Mozgatás fel',
    ru: 'Вверх',
    zh_CN: '向上移动',
    zh_TW: '向上移動',
  },
  'menu.editor.disable_tooltip': {
    en: 'Disable',
    de: 'Deaktivieren',
    hu: 'Tiltás',
    ru: 'Отключить',
    zh: '禁用',
  },
  'menu.editor.tabs_title': {
    en: 'Tabs',
    de: 'Tabs',
    hu: 'Lapok',
    ru: 'Вкладки',
    zh_CN: '标签页',
    zh_TW: '分頁',
  },
  'menu.editor.tabs_panel_title': {
    en: 'Tabs panel',
    de: 'Tab-Panel',
    hu: 'Lappanel',
    ru: 'Панель вкладок',
    zh_CN: '标签页面板',
    zh_TW: '分頁面板',
  },
  'menu.editor.bookmarks_title': {
    en: 'Bookmarks',
    de: 'Lesezeichen',
    hu: 'Könyvjelzők',
    ru: 'Закладки',
    zh_CN: '书签',
    zh_TW: '書籤',
  },
  'menu.editor.bookmarks_panel_title': {
    en: 'Bookmarks panel',
    de: 'Lesezeichen-Panel',
    hu: 'Könyvjelzőpanel',
    ru: 'Панель закладок',
    zh_CN: '书签面板',
    zh_TW: '書籤面板',
  },
  'menu.editor.inline_group_title': {
    en: 'Sub-menu label...',
    de: 'Untermenü Bezeichnung...',
    hu: 'Az almenü neve…',
    ru: 'Название подменю...',
    zh_CN: '子菜单标签...',
    zh_TW: '子選單標籤...',
  },

  // ---
  // -- Settings
  // -
  'settings.opt_true': {
    en: 'on',
    de: 'Ein',
    hu: 'be',
    ru: 'вкл',
    zh_CN: '打开',
    zh_TW: '啟用',
  },
  'settings.opt_false': {
    en: 'off',
    de: 'Aus',
    hu: 'ki',
    ru: 'выкл',
    zh_CN: '关闭',
    zh_TW: '停用',
  },

  // ---
  // -- Time
  // -
  'time.month_0': {
    en: 'January',
    de: 'Januar',
    hu: 'január',
    ru: 'Январь',
    zh: '一月',
  },
  'time.month_1': {
    en: 'February',
    de: 'Februar',
    hu: 'február',
    ru: 'Февраль',
    zh: '二月',
  },
  'time.month_2': {
    en: 'March',
    de: 'März',
    hu: 'március',
    ru: 'Март',
    zh: '三月',
  },
  'time.month_3': {
    en: 'April',
    hu: 'április',
    ru: 'Апрель',
    zh: '四月',
  },
  'time.month_4': {
    en: 'May',
    de: 'Mai',
    hu: 'május',
    ru: 'Май',
    zh: '五月',
  },
  'time.month_5': {
    en: 'June',
    de: 'Juni',
    hu: 'június',
    ru: 'Июнь',
    zh: '六月',
  },
  'time.month_6': {
    en: 'July',
    de: 'Juli',
    hu: 'július',
    ru: 'Июль',
    zh: '七月',
  },
  'time.month_7': {
    en: 'August',
    hu: 'augusztus',
    ru: 'Август',
    zh: '八月',
  },
  'time.month_8': {
    en: 'September',
    hu: 'szeptember',
    ru: 'Сентябрь',
    zh: '九月',
  },
  'time.month_9': {
    en: 'October',
    de: 'Oktober',
    hu: 'október',
    ru: 'Октябрь',
    zh: '十月',
  },
  'time.month_10': {
    en: 'November',
    hu: 'november',
    ru: 'Ноябрь',
    zh: '十一月',
  },
  'time.month_11': {
    en: 'December',
    de: 'Dezember',
    hu: 'december',
    ru: 'Декабрь',
    zh: '十二月',
  },
  'time.today': {
    en: 'Today',
    de: 'Heute',
    hu: 'Ma',
    ru: 'Сегодня',
    zh: '今日',
  },
  'time.yesterday': {
    en: 'Yesterday',
    de: 'Gestern',
    hu: 'Tegnap',
    ru: 'Вчера',
    zh: '昨日',
  },
  'time.this_week': {
    en: 'This week',
    de: 'Diese Woche',
    hu: 'Ezen a héten',
    ru: 'Эта неделя',
    zh_CN: '本周',
    zh_TW: '本週',
  },
  'time.passed_short': {
    en: ms => {
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
    de: ms => {
      if (ms === undefined || typeof ms === 'string') return '?'

      const s = Math.trunc(ms / 1000)
      if (s < 60) return `${s}s`

      const rs = s % 60
      const m = (s - rs) / 60
      if (m < 60) {
        if (rs > 0) return `${m}min, ${rs}s`
        else return `${m}min`
      }

      const rm = m % 60
      const h = (m - rm) / 60
      if (h < 24) {
        if (rm > 0) return `${h}h, ${rm}min`
        else return `${h}h`
      }

      const rh = h % 24
      const d = (h - rh) / 24
      if (rh > 0) return `${d}d, ${rh}h`
      else return `${d}d`
    },
    hu: ms => {
      if (ms === undefined || typeof ms === 'string') return '?'

      const s = Math.trunc(ms / 1000)
      if (s < 60) return `${s}mp`

      const rs = s % 60
      const m = (s - rs) / 60
      if (m < 60) {
        if (rs > 0) return `${m}p, ${rs}mp`
        else return `${m}m`
      }

      const rm = m % 60
      const h = (m - rm) / 60
      if (h < 24) {
        if (rm > 0) return `${h}ó, ${rm}p`
        else return `${h}ó`
      }

      const rh = h % 24
      const d = (h - rh) / 24
      if (rh > 0) return `${d}n, ${rh}ó`
      else return `${d}d`
    },
    ru: ms => {
      if (ms === undefined || typeof ms === 'string') return '?'

      const s = Math.trunc(ms / 1000)
      if (s < 60) return `${s}с`

      const rs = s % 60
      const m = (s - rs) / 60
      if (m < 60) {
        if (rs > 0) return `${m}м, ${rs}с`
        else return `${m}м`
      }

      const rm = m % 60
      const h = (m - rm) / 60
      if (h < 24) {
        if (rm > 0) return `${h}ч, ${rm}м`
        else return `${h}ч`
      }

      const rh = h % 24
      const d = (h - rh) / 24
      if (rh > 0) return `${d}д, ${rh}ч`
      else return `${d}д`
    },
    zh_CN: ms => {
      if (ms === undefined || typeof ms === 'string') return '?'

      const s = Math.trunc(ms / 1000)
      if (s < 60) return `${s}秒`

      const rs = s % 60
      const m = (s - rs) / 60
      if (m < 60) {
        if (rs > 0) return `${m}分, ${rs}秒`
        else return `${m}分`
      }

      const rm = m % 60
      const h = (m - rm) / 60
      if (h < 24) {
        if (rm > 0) return `${h}小时, ${rm}分`
        else return `${h}小时`
      }

      const rh = h % 24
      const d = (h - rh) / 24
      if (rh > 0) return `${d}天, ${rh}小时`
      else return `${d}天`
    },
    zh_TW: ms => {
      if (ms === undefined || typeof ms === 'string') return '?'

      const s = Math.trunc(ms / 1000)
      if (s < 60) return `${s}秒`

      const rs = s % 60
      const m = (s - rs) / 60
      if (m < 60) {
        if (rs > 0) return `${m}分, ${rs}秒`
        else return `${m}分`
      }

      const rm = m % 60
      const h = (m - rm) / 60
      if (h < 24) {
        if (rm > 0) return `${h}小時, ${rm}分`
        else return `${h}小時`
      }

      const rh = h % 24
      const d = (h - rh) / 24
      if (rh > 0) return `${d}天, ${rh}小時`
      else return `${d}天`
    },
  },

  // ---
  // -- Upgrade screen
  // -
  'upgrade.title': {
    en: 'Upgrading',
    de: 'Aktualisiere',
    hu: 'Frissítés',
    ru: 'Обновление',
    zh_CN: '升级',
    zh_TW: '升級',
  },
  'upgrade.btn.backup': {
    en: 'Save backup',
    de: 'Sicherung speichern',
    hu: 'Biztonsági mentés',
    ru: 'Сохранить резервную копию данных',
    zh_CN: '保存备份',
    zh_TW: '儲存備份',
  },
  'upgrade.btn.continue': {
    en: 'Continue',
    de: 'Fortfahren',
    hu: 'Folytatás',
    ru: 'Продолжить',
    zh_CN: '继续',
    zh_TW: '繼續',
  },
  'upgrade.status.done': {
    en: 'Done',
    de: 'Abgeschlossen',
    hu: 'Kész',
    ru: 'Готово',
    zh: '已完成',
  },
  'upgrade.status.in_progress': {
    en: 'In progress',
    de: 'Läuft',
    hu: 'Folyamatban',
    ru: 'В процессе',
    zh_CN: '进行中',
    zh_TW: '進行中',
  },
  'upgrade.status.pending': {
    en: 'Pending',
    de: 'Ausstehend',
    hu: 'Függőben',
    ru: 'Ожидание',
    zh: '等待中',
  },
  'upgrade.status.err': {
    en: 'Error',
    de: 'Fehler',
    hu: 'Hiba',
    ru: 'Ошибка',
    zh_CN: '错误',
    zh_TW: '錯誤',
  },
  'upgrade.status.no': {
    en: 'No data',
    de: 'Kein Daten',
    hu: 'Nincs adat',
    ru: 'Нет данных',
    zh_CN: '没有数据',
    zh_TW: '沒有資料',
  },
  'upgrade.initializing': {
    en: 'Initializing',
    de: 'Initialisiere',
    hu: 'Előkészítés',
    ru: 'Инициализация',
    zh: '正在初始化',
  },
  'upgrade.settings': {
    en: 'Settings',
    de: 'Einstellungen',
    hu: 'Beállítások',
    ru: 'Настройки',
    zh_CN: '设置',
    zh_TW: '設定',
  },
  'upgrade.panels_nav': {
    en: 'Panels and navigation',
    de: 'Panels und Navigation',
    hu: 'Panelek és navigálás',
    ru: 'Панели и навигация',
    zh_CN: '面板和导航',
    zh_TW: '面板和導覽',
  },
  'upgrade.ctx_menu': {
    en: 'Context menu',
    de: 'Kontextmenü',
    hu: 'Környezeti menü',
    ru: 'Контекстное меню',
    zh_CN: '上下文菜单',
    zh_TW: '快捷選單',
  },
  'upgrade.snapshots': {
    en: 'Snapshots',
    de: 'Schnappschüsse',
    hu: 'Pillanatképek',
    ru: 'Снепшоты',
    zh: '快照',
  },
  'upgrade.fav_cache': {
    en: 'Favicons cache',
    de: 'Favicons Cache',
    hu: 'Webhelyikonok gyorsítótára',
    ru: 'Кэш иконок',
    zh_CN: '网站图标缓存',
    zh_TW: '網站圖示快取',
  },
  'upgrade.styles': {
    en: 'Custom styles',
    de: 'Benutzerdefinierte Stile',
    hu: 'Saját stílusok',
    ru: 'Стили',
    zh_CN: '自定义样式',
    zh_TW: '自訂樣式',
  },
  'upgrade.data_ready': {
    en: 'All data prepared',
    de: 'Alle Daten vorbereitet',
    hu: 'Az adatok feldolgozása kész',
    ru: 'Все данные подготовлены',
    zh_CN: '全部数据准备就绪',
    zh_TW: '全部資料準備就緒',
  },
  'upgrade.data_ready_note': {
    en: 'You can save a backup and continue',
    de: 'Sie können ein Backup speichern und fortfahren',
    hu: 'A folytatás előtt készíthető egy biztonsági mentés',
    ru: 'Вы можете сохранить резервную копию и продолжить',
    zh_CN: '你可以保存备份并继续',
    zh_TW: '你可以儲存備份並繼續',
  },
  'upgrade.links': {
    en: 'Updating Sidebery pages',
    de: 'Aktualisiere Sidebery Seiten',
    hu: 'A Sidebery oldalainak frissítése',
    ru: 'Обновление страниц Sidebery',
    zh_CN: '正在更新 Sidebery 页面',
    zh_TW: '正在更新 Sidebery 頁面',
  },
  'upgrade.err.backup': {
    en: 'Cannot prepare backup',
    de: 'Kann keine Sicherung vorbereiten',
    hu: 'A biztonsági mentés nem sikerült',
    ru: 'Невозможно подготовить резервную копию',
    zh_CN: '无法准备备份',
    zh_TW: '無法準備備份',
  },
  'upgrade.err.backup_note': {
    en: 'Unable to get stored data',
    de: 'Kann gespeicherte Daten nicht abrufen',
    hu: 'Nem lehet hozzáférni a tárolt adatokhoz',
    ru: 'Невозможно получить сохраненные данные',
    zh_CN: '无法获取存储的数据',
    zh_TW: '無法讀取儲存的資料',
  },
  'upgrade.err.get_stored': {
    en: 'Cannot get stored data',
    de: 'Kann gespeicherte Daten nicht abrufen',
    hu: 'Nem sikerült hozzáférni a tárolt adatokhoz',
    ru: 'Невозможно получить данные старой версии',
    zh_CN: '无法获取存储的数据',
    zh_TW: '無法讀取儲存的資料',
  },
  'upgrade.err.clear_stored': {
    en: 'Cannot clear old data',
    de: 'Kann alte Daten nicht löschen',
    hu: 'Nem lehet törölni a régi adatokat',
    ru: 'Невозможно удалить старые данные',
    zh_CN: '无法清除旧数据',
    zh_TW: '無法清除舊資料',
  },
  'upgrade.err.set_stored': {
    en: 'Cannot save new data',
    de: 'Kann neue Daten nicht speichern',
    hu: 'Nem lehet menteni az új adatokat',
    ru: 'Невозможно сохранить новые данные',
    zh_CN: '无法保存新数据',
    zh_TW: '無法儲存新資料',
  },
  'upgrade.err.finish': {
    en: 'Sidebery is unable to finish the upgrade. Try to manually remove the old version of Sidebery, reload the browser and install the new version of Sidebery.',
    de: 'Sidebery kann das Upgrade nicht abschließen. Versuchen Sie, die alte Version von Sidebery manuell zu entfernen, den Browser neu zu laden und die neue Version von Sidebery zu installieren.',
    hu: 'Nem sikerült befejezni a frissítést. Meg kell próbálni eltávolítani a Sidebery korábbi verzióját, majd a böngésző újraindítása után telepíteni az új verziót.',
    ru: 'Sidebery не может завершить обновление. Попробуйте вручную удалить старую версию Sidebery, перезагрузить браузер и установить новую версию Sidebery.',
    zh_CN: 'Sidebery 无法完成升级。请尝试手动删除旧版本的 Sidebery，重新加载浏览器并安装新版本的 Sidebery。',
    zh_TW: 'Sidebery 無法完成升級。請嘗試手動刪除舊版本的 Sidebery，重新開啟瀏覽器並安裝新版本的 Sidebery。',
  },
  'upgrade.done': {
    en: 'Sidebery successfully upgraded',
    de: 'Sidebery erfolgreich aktualisiert',
    hu: 'A Sidebery frissítése kész',
    ru: 'Sidebery успешно обновлен',
    zh_CN: 'Sidebery 升级成功',
    zh_TW: 'Sidebery 升級成功',
  },
  'upgrade.done_note': {
    en: 'Reloading...',
    de: 'Neu laden...',
    hu: 'Újratöltés…',
    ru: 'Перезагрузка...',
    zh_CN: '重新加载...',
    zh_TW: '重新載入...',
  },
}

if (!window.translations) window.translations = commonTranslations
else Object.assign(window.translations, commonTranslations)
