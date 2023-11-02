import { NUM_1_RE, NUM_234_RE } from './dict.common'

export const sidebarTranslations: Translations = {
  // ---
  // -- Search
  // -
  'bar.search.placeholder': {
    en: 'Search...',
    ru: 'Поиск...',
    de: 'Suche...',
    zh_CN: '搜索...',
    zh_TW: '搜尋...',
  },

  // ---
  // -- Confirm dialogs
  // -
  'confirm.warn_title': {
    en: 'Warning',
    ru: 'Внимание',
    de: 'Warnung',
    zh: '警告',
  },
  'confirm.tabs_close_pre': {
    en: 'Are you sure you want to close ',
    ru: 'Вы действительно хотите закрыть ',
    de: 'Möchten Sie diese ',
    zh_CN: '你确定要关闭 ',
    zh_TW: '你確定要關閉 ',
  },
  'confirm.tabs_close_post': {
    en: ' tabs?',
    ru: (n = 0) => (NUM_234_RE.test(n.toString()) ? ' вкладки?' : ' вкладок?'),
    de: ' Tabs wirklich schließen?',
    zh_CN: ' 标签页吗？',
    zh_TW: ' 分頁嗎？',
  },
  'confirm.bookmarks_delete': {
    en: 'Are you sure you want to delete selected bookmarks?',
    ru: 'Вы действительно хотите удалить выбранные закладки?',
    de: 'Möchten Sie die gewählten Lesezeichen wirklich löschen?',
    zh_CN: '你确定要删除选定的书签吗？',
    zh_TW: '你確定要刪除選定的書籤嗎？',
  },

  // ---
  // -- Panel
  // -
  'panel.nothing_found': {
    en: 'Nothing found',
    ru: 'Ничего не найдено',
    de: 'Nichts gefunden',
    zh: '未找到',
  },
  'panel.nothing': {
    en: 'Nothing...',
    ru: 'Ничего...',
    de: 'Nichts...',
    zh_CN: '无...',
    zh_TW: '無...',
  },

  // ---
  // -- History panel
  // -
  'panel.history.fav_tooltip': {
    en: 'Show history of this site',
    ru: 'Показать историю этого сайта',
    zh_CN: '显示该站点的历史记录',
    zh_TW: '顯示此網站的歷史紀錄',
  },
  'panel.history.show_more': {
    en: '...hidden visits:',
    ru: '...скрытых записей:',
    zh_CN: '...隐藏的访问：',
    zh_TW: '...隱藏的紀錄：',
  },

  // ---
  // -- New tab bar
  // -
  'newTabBar.new_tab': {
    en: 'Open a new tab',
    ru: 'Открыть новую вкладку',
    zh_CN: '打开一个新标签',
    zh_TW: '開啟一個新分頁',
  },
  'newTabBar.in_default_container': {
    en: ' in default container',
    ru: ' в стандартном контейнере',
    zh_CN: ' 在默认容器中',
    zh_TW: ' 在預設容器中',
  },
  'newTabBar.in_container_prefix': {
    en: ' in "',
    ru: ' в контейнере "',
    zh_CN: ' 在 "',
    zh_TW: ' 在「',
  },
  'newTabBar.in_container_postfix': {
    en: '" container',
    ru: '"',
    zh_CN: '" 容器中',
    zh_TW: '」容器中',
  },
  'newTabBar.mid_child': {
    en: 'Middle click: Open a child tab',
    ru: 'Средняя кнопка мыши: Открыть новую дочернюю вкладку',
    zh_CN: '中键单击：打开子选项卡',
    zh_TW: '中鍵點選：開啟子分頁',
  },
  'newTabBar.mid_reopen': {
    en: 'Middle click: Reopen active tab',
    ru: 'Средняя кнопка мыши: Переоткрыть активную вкладку',
    zh_CN: '中键点击：重新打开活动标签',
    zh_TW: '中鍵點選：重新開啟當前分頁',
  },

  // ---
  // -- Popups
  // -
  // - Tabs panel removing
  'popup.tabs_panel_removing.title': {
    en: 'Removing panel',
    ru: 'Удаление панели',
    de: 'Entferne Panel',
    zh: '移除面板',
  },
  'popup.tabs_panel_removing.attach': {
    en: 'Attach tabs to neighbour panel',
    ru: 'Присоединить вкладки к соседней панели',
    de: 'Tabs an benachbartes Panel anheften',
    zh_CN: '将标签附加到相邻面板',
    zh_TW: '將分頁附加到相鄰面板',
  },
  'popup.tabs_panel_removing.leave': {
    en: 'Leave tabs untouched',
    ru: 'Оставить вкладки',
    de: 'Tabs behalten',
    zh_CN: '保持标签页不变',
    zh_TW: '保持分頁不變',
  },
  'popup.tabs_panel_removing.save': {
    en: 'Save panel to bookmarks and close tabs',
    ru: 'Сохранить панель в закладки и закрыть вкладки',
    de: 'Panel in Lesezeichen speichern und Tabs schließen',
    zh_CN: '将面板保存到书签并关闭标签页',
    zh_TW: '將面板儲存到書籤並關閉分頁',
  },
  'popup.tabs_panel_removing.close': {
    en: 'Close tabs',
    ru: 'Закрыть вкладки',
    de: 'Tabs schließen',
    zh_CN: '关闭标签页',
    zh_TW: '關閉分頁',
  },
  'popup.tabs_panel_removing.other_win_note': {
    en: 'Note: Tabs of this panel in other windows will be moved to the neighbour panel',
    ru: 'Вкладки этой панели в других окнах будут перемещены на соседнюю панель',
    de: 'Tabs dieses Panels in anderen Fenstern werden zum benachbarten Panel oder nach links verschoben',
    zh_CN: '注意：此面板在其他窗口中的标签页将移动到相邻面板或左侧',
    zh_TW: '注意：其他視窗中屬於此面板的分頁將附加到相鄰面板',
  },
  // - What to do with old unused bookmarks on saving tabs panel
  'popup.wtdwOldBookmarks.title': {
    en: folderName => `Tabs have been saved in "${folderName}" folder`,
    ru: folderName => `Вкладки были сохранены в папке "${folderName}"`,
    de: folderName => `Tabs wurden im Ordner "${folderName}" gespeichert`,
    zh_CN: folderName => `标签页已保存在 "${folderName}" 文件夹中`,
    zh_TW: folderName => `分頁已儲存在「${folderName}」資料夾中`,
  },
  'popup.wtdwOldBookmarks.note': {
    en: 'Delete old bookmarks in that folder?',
    ru: 'Удалить старые закладки в этой папке?',
    de: 'Alte Lesezeichen in diesem Ordner löschen?',
    zh_CN: '删除该文件夹中的旧书签？',
    zh_TW: '刪除該資料夾中的舊書籤？',
  },
  'popup.wtdwOldBookmarks.checkbox_label': {
    en: "Remember and don't ask again",
    ru: 'Запомнить и больше не спрашивать',
    zh_CN: '记住，不要再问',
    zh_TW: '記住，不再詢問',
  },
  'popup.wtdwOldBookmarks.delete': {
    en: 'Delete',
    ru: 'Удалить',
    de: 'Löschen',
    zh_CN: '删除',
    zh_TW: '刪除',
  },
  'popup.wtdwOldBookmarks.keep': {
    en: 'Keep',
    ru: 'Оставить',
    de: 'Behalten',
    zh: '保留',
  },
  // - Container config popup
  'popup.container.title': {
    en: 'Container',
    ru: 'Контейнер',
    de: 'Umgebung',
    zh: '容器',
  },
  'popup.container.name_placeholder': {
    en: 'Container name',
    ru: 'Название контейнера',
    zh_CN: '容器名称',
    zh_TW: '容器名稱',
  },
  // - Panel config popup
  'popup.tabs_panel.title': {
    en: 'Tabs panel',
    ru: 'Панель вкладок',
    de: 'Tab-Panel',
    zh_CN: '标签页面板',
    zh_TW: '分頁面板',
  },
  'popup.bookmarks_panel.title': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
    de: 'Lesezeichen-Panel',
    zh_CN: '书签面板',
    zh_TW: '書籤面板',
  },
  'popup.common.name_label': {
    en: 'Name',
    ru: 'Имя',
    de: 'Name',
    zh_CN: '名称',
    zh_TW: '名稱',
  },
  'popup.common.icon_label': {
    en: 'Icon',
    ru: 'Иконка',
    de: 'Symbol',
    zh_CN: '图标',
    zh_TW: '圖示',
  },
  'popup.common.color_label': {
    en: 'Color',
    ru: 'Цвет',
    de: 'Farbe',
    zh_CN: '颜色',
    zh_TW: '顏色',
  },
  'popup.common.btn_more': {
    en: 'More options...',
    ru: 'Больше опций...',
    de: 'Weitere Optionen...',
    zh_CN: '更多选项...',
    zh_TW: '更多選項...',
  },
  // - Group config popup
  'popup.group_config.popup_title': {
    en: 'Group',
    ru: 'Группа',
    de: 'Gruppe',
    zh_CN: '组',
    zh_TW: '組',
  },
  'popup.group_config.title': {
    en: 'Title',
    ru: 'Название',
    de: 'Name',
    zh_CN: '标题',
    zh_TW: '標題',
  },
  'popup.group_config.title_placeholder': {
    en: 'Group title',
    ru: 'Название группы',
    de: 'Gruppenname',
    zh_CN: '组标题',
    zh_TW: '組標題',
  },

  // ---
  // -- Sub-panels
  // -
  'sub_panel.bookmarks_panel.title': {
    en: 'Bookmarks',
    ru: 'Закладки',
    zh_CN: '书签',
    zh_TW: '書籤',
  },
  'sub_panel.bookmarks_panel.root_title': {
    en: 'All Bookmarks',
    ru: 'Все закладки',
    zh_CN: '全部书签',
    zh_TW: '全部書籤',
  },
  'sub_panel.rct_panel.title': {
    en: 'Recently closed tabs',
    ru: 'Недавно закрытые вкладки',
    zh_CN: '最近关闭的标签页',
    zh_TW: '最近關閉的分頁',
  },
  'sub_panel.history_panel.title': {
    en: 'History',
    ru: 'История',
    zh_CN: '历史',
    zh_TW: '歷史',
  },

  // ---
  // -- Drag and Drop tooltips
  // -
  'dnd.tooltip.bookmarks_panel': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
    de: 'Lesezeichen-Panel',
    zh_CN: '书签面板',
    zh_TW: '書籤面板',
  },
  'dnd.tooltip.tabs_panel': {
    en: 'panel',
    ru: 'панель',
    de: 'Panel',
    zh: '面板',
  },
  'dnd.tooltip.tabs': {
    en: 'tabs',
    ru: (n = 0) => {
      if (NUM_1_RE.test(n.toString())) return 'вкладка'
      if (NUM_234_RE.test(n.toString())) return 'вкладки'
      return 'вкладок'
    },
    de: 'Tabs',
    zh_CN: '标签页',
    zh_TW: '分頁',
  },
  'dnd.tooltip.bookmarks': {
    en: 'bookmarks',
    ru: (n = 0) => {
      if (NUM_1_RE.test(n.toString())) return 'закладка'
      if (NUM_234_RE.test(n.toString())) return 'закладки'
      return 'закладок'
    },
    de: 'Lesezeichen',
    zh_CN: '书签',
    zh_TW: '書籤',
  },
  'dnd.tooltip.nav_item': {
    en: 'Navigation element',
    ru: 'Элемент навигации',
    de: 'Navigationselement',
    zh_CN: '导航元素',
    zh_TW: '導覽元件',
  },
  'dnd.tooltip.new_tab': {
    en: 'New tab',
    ru: 'Новая вкладка',
    zh_CN: '新标签页',
    zh_TW: '新分頁',
  },

  // ---
  // -- Navigation bar
  // -
  'nav.show_hidden_tooltip': {
    en: 'Show hidden panels',
    ru: 'Показать скрытые панели',
    de: 'Versteckte Panels anzeigen',
    zh_CN: '显示隐藏的面板',
    zh_TW: '顯示隱藏的面板',
  },
  'nav.btn_settings': {
    en: 'Settings',
    ru: 'Настройки',
    de: 'Einstellungen',
    zh_CN: '设置',
    zh_TW: '設定',
  },
  'nav.btn_add_tp': {
    en: 'Create tabs panel',
    ru: 'Создать панель вкладок',
    de: 'Tab-Panel erstellen',
    zh_CN: '创建标签页面板',
    zh_TW: '建立分頁面板',
  },
  'nav.btn_search': {
    en: 'Search',
    ru: 'Поиск',
    de: 'Suchen',
    zh_CN: '搜索',
    zh_TW: '搜尋',
  },
  'nav.btn_create_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
    de: 'Schnappschuss erstellen',
    zh_CN: '创建快照',
    zh_TW: '建立快照',
  },
  'nav.btn_remute_audio_tabs': {
    en: 'Mute/Unmute audible tabs',
    ru: 'Приглушить/Включить вкладки со звуком',
    de: 'Stummschalten hörbarer Tabs an/aus',
    zh_CN: '静音/取消静音有声标签页',
    zh_TW: '靜音/取消靜音有聲分頁',
  },
  'nav.btn_collapse': {
    en: 'Collapse all',
    ru: 'Свернуть все',
    de: 'Alle einklappen',
    zh_CN: '全部折叠',
    zh_TW: '全部折疊',
  },
  'nav.tabs_panel_tooltip_mid_rm_all': {
    en: 'Middle click: Close tabs',
    ru: 'Средняя кнопка мыши: Закрыть влкадки',
    zh_CN: '中键点击：关闭全部标签',
    zh_TW: '中鍵點選：關閉全部分頁',
  },
  'nav.tabs_panel_tooltip_mid_rm_rmp': {
    en: 'Middle click: Close tabs and remove panel',
    ru: 'Средняя кнопка мыши: Закрыть вкладки и удалить панель',
    zh_CN: '中键点击：关闭标签并移除面板',
    zh_TW: '中鍵點選：關閉分頁並移除面板',
  },
  'nav.tabs_panel_tooltip_mid_rm_act_tab': {
    en: 'Middle click: Close active tab',
    ru: 'Средняя кнопка мыши: Закрыть активную вкладку',
    zh_CN: '中键单击：关闭活动标签页',
    zh_TW: '中鍵點選：關閉當前分頁',
  },
  'nav.tabs_panel_tooltip_mid_discard': {
    en: 'Middle click: Unload tabs',
    ru: 'Средняя кнопка мыши: Выгрузить вкладки',
    zh_CN: '中键单击：卸载标签页',
    zh_TW: '中鍵點選：卸載分頁',
  },
  'nav.tabs_panel_tooltip_mid_hide': {
    en: 'Middle click: Hide panel',
    ru: 'Средняя кнопка мыши: Скрыть панель',
    zh_CN: '中键单击：隐藏面板',
    zh_TW: '中鍵點選：隱藏面板',
  },
  'nav.tabs_panel_tooltip_mid_bookmark': {
    en: 'Middle click: Save to bookmarks',
    ru: 'Средняя кнопка мыши: Сохранить в закладки',
    zh_CN: '中键点击：保存到书签',
    zh_TW: '中鍵點選：儲存到書籤',
  },
  'nav.tabs_panel_tooltip_mid_bkm_rmp': {
    en: 'Middle click: Save to bookmarks and remove panel',
    ru: 'Средняя кнопка мыши: Сохранить в закладки и удалить панель',
    zh_CN: '中键点击：保存到书签并移除面板',
    zh_TW: '中鍵點選：儲存到書籤並移除面板',
  },
  'nav.tabs_panel_tooltip_mid_convert': {
    en: 'Middle click: Convert to bookmarks panel',
    ru: 'Средняя кнопка мыши: Конвертировать в панель закладок',
    zh_CN: '中键单击：转换到书签面板',
    zh_TW: '中鍵點選：轉換到書籤面板',
  },
  'nav.tabs_panel_tooltip_mid_conv_hide': {
    en: 'Middle click: Convert to bookmarks and hide panel',
    ru: 'Средняя кнопка мыши: Конвертировать в панель закладок и скрыть',
    zh_CN: '中键单击：转换为书签并隐藏面板',
    zh_TW: '中鍵點選：轉換為書籤並隱藏面板',
  },
  'nav.bookmarks_panel_tooltip_mid_convert': {
    en: 'Middle click: Convert to tabs panel',
    ru: 'Средняя кнопка мыши: Конвертировать в панель вкладок',
    zh_CN: '中键单击：转换为标签面板',
    zh_TW: '中鍵點選：轉換為分頁面板',
  },

  // ---
  // -- Notifications
  // -
  'notif.hide_tooltip': {
    en: 'Hide notification',
    ru: 'Скрыть уведомление',
    de: 'Benachrichtigung verbergen',
    zh_CN: '隐藏通知',
    zh_TW: '隱藏通知',
  },
  'notif.undo_ctrl': {
    en: 'Undo',
    ru: 'Восстановить',
    de: 'Rückgängig',
    zh_CN: '撤消',
    zh_TW: '復原',
  },
  'notif.tabs_rm_post': {
    en: ' tabs closed',
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return ' вкладка закрыта'
      if (NUM_234_RE.test(n.toString())) return ' вкладки закрыты'
      return ' вкладок закрыто'
    },
    de: 'Tabs geschlossen',
    zh_CN: ' 标签页已关闭',
    zh_TW: ' 分頁已關閉',
  },
  'notif.bookmarks_create_err': {
    en: 'Cannot create bookmark',
    ru: 'Невозможно создать закладку',
    zh_CN: ' 无法创建书签',
    zh_TW: ' 無法建立書籤',
  },
  'notif.bookmarks_rm_post': {
    en: n => (n === 1 ? ' bookmark removed' : ' bookmarks removed'),
    ru: (n = 0): string => {
      if (NUM_1_RE.test(n.toString())) return ' закладка удалена'
      if (NUM_234_RE.test(n.toString())) return ' закладки удалены'
      return ' закладок удалено'
    },
    de: 'Lesezeichen entfernt',
    zh_CN: ' 书签已删除',
    zh_TW: ' 書籤已刪除',
  },
  'notif.bookmarks_sort': {
    en: 'Sorting bookmarks...',
    ru: 'Сортировка закладок...',
    de: 'Sortiere Lesezeichen...',
    zh_CN: '书签排序',
    zh_TW: '書籤排序',
  },
  'notif.snapshot_created': {
    en: 'Snapshot created',
    ru: 'Снепшот создан',
    de: 'Schnappschuss erstellt',
    zh_CN: '快照已创建',
    zh_TW: '快照已建立',
  },
  'notif.view_snapshot': {
    en: 'View',
    ru: 'Посмотреть',
    de: 'Ansehen',
    zh_CN: '查看',
    zh_TW: '檢視',
  },
  'notif.tabs_err': {
    en: 'Wrong tabs position detected',
    ru: 'Обнаружено неправильное положение вкладок',
    de: 'Falsche Tab-Position erkannt',
    zh_CN: '检测到错误的标签页位置',
    zh_TW: '偵測到錯誤的分頁位置',
  },
  'notif.tabs_err_fix': {
    en: 'Update tabs',
    ru: 'Обновить вкладки',
    de: 'Tabs aktualisieren',
    zh_CN: '更新标签页',
    zh_TW: '更新分頁',
  },
  'notif.tabs_reloading': {
    en: 'Reloading tabs',
    ru: 'Перезагрузка вкладок',
    de: 'Tabs neu laden',
    zh_CN: '重新加载标签页',
    zh_TW: '重新載入分頁',
  },
  'notif.tabs_reloading_stop': {
    en: 'Stop',
    ru: 'Остановить',
    de: 'Stopp',
    zh: '停止',
  },
  'notif.tabs_panel_saving_bookmarks': {
    en: 'Saving to bookmarks...',
    ru: 'Сохранение в закладки...',
    de: 'Speichere in Lesezeichen...',
    zh_CN: '保存到书签...',
    zh_TW: '儲存到書籤...',
  },
  'notif.tabs_panel_saved_bookmarks': {
    en: 'Panel saved',
    ru: 'панель сохранена в',
    de: 'Panel gespeichert',
    zh_CN: '面板已保存',
    zh_TW: '面板已儲存',
  },
  'notif.tabs_panel_updated_bookmarks': {
    en: 'Bookmarks updated',
    ru: 'закладки обновлены в',
    de: 'Lesezeichen aktualisiert',
    zh_CN: '书签已更新',
    zh_TW: '書籤已更新',
  },
  'notif.converting': {
    en: 'Converting...',
    ru: 'Конвертация...',
    de: 'Konvertiere...',
    zh_CN: '转换中...',
    zh_TW: '轉換中...',
  },
  'notif.tabs_panel_to_bookmarks_err': {
    en: 'Cannot save tabs panel to bookmarks',
    ru: 'Невозможно сохранить панель вкладок в закладки',
    de: 'Kann Tab-Panel nicht in Lesezeichen speichern',
    zh_CN: '无法将标签页面板保存到书签',
    zh_TW: '無法將分頁面板儲存到書籤',
  },
  'notif.tabs_panel_to_bookmarks_err.folder': {
    en: 'Cannot create destination folder',
    ru: 'Невозможно создать папку для панели',
    de: 'Zielordner kann nicht erstellt werden',
    zh_CN: '无法创建目标文件夹',
    zh_TW: '無法建立目標資料夾',
  },
  'notif.tabs_panel_to_bookmarks_err.folder_upd': {
    en: 'Cannot update destination folder',
    ru: 'Невозможно обновить папку для панели',
    de: 'Kann Zielordner nicht aktualisieren',
    zh_CN: '无法更新目标文件夹',
    zh_TW: '無法更新目標資料夾',
  },
  'notif.tabs_panel_to_bookmarks_err.bookmarks': {
    en: 'Cannot create bookmarks',
    ru: 'Невозможно создать закладки',
    de: 'Lesezeichen können nicht erstellt werden',
    zh_CN: '无法创建书签',
    zh_TW: '無法建立書籤',
  },
  'notif.restore_from_bookmarks_err': {
    en: 'Cannot restore panel from bookmarks',
    ru: 'Невозможно восстановить панель из закладок',
    de: 'Kann Panel aus Lesezeichen nicht wiederherstellen',
    zh_CN: '无法从书签恢复面板',
    zh_TW: '無法從書籤復原面板',
  },
  'notif.restore_from_bookmarks_err.root': {
    en: 'Root folder not found',
    ru: 'Корневая папка не найдена',
    de: 'Quellordner nicht gefunden',
    zh_CN: '未找到根文件夹',
    zh_TW: '未找到根資料夾',
  },
  'notif.restore_from_bookmarks_ok': {
    en: 'The tab panel has been successfully restored',
    ru: 'Панель вкладок успешно восстановлена',
    de: 'Tab-Panel wiederhergestellt',
    zh_CN: '标签页面板已恢复',
    zh_TW: '分頁面板已復原',
  },
  'notif.panel_conv': {
    en: 'The panel has been successfully converted',
    ru: 'Панель успешно преобразована',
    zh_TW: '面板已成功被轉換',
  },
  'notif.panel_bkmrkd': {
    en: 'The panel has been successfully bookmarked',
    ru: 'Панель успешно добавлена в закладки',
    zh_TW: '面板已成功加入書籤',
  },
  'notif.done': {
    en: 'Done',
    ru: 'Готово',
    de: 'Fertig',
    zh: '已完成',
  },
  'notif.new_bookmark': {
    en: 'New bookmark added',
    ru: 'Новая закладка добавлена',
    de: 'Neues Lesezeichen hinzugefügt',
    zh_CN: '书签已添加',
    zh_TW: '書籤已加入',
  },
  'notif.bookmarks_sub_panel.no_root.title': {
    en: 'Cannot find root folder',
    ru: 'Невозможно найти корневую папку',
    de: 'Kann Quellordner nicht finden',
    zh_CN: '找不到根文件夹',
    zh_TW: '找不到根資料夾',
  },
  'notif.bookmarks_sub_panel.no_root.details': {
    en: 'Try to re-save tabs panel',
    ru: 'Попробуйте пересохранить панель вкладок',
    de: 'Versuche Tab-Panel neu zu speichern',
    zh_CN: '尝试重新保存标签页面板',
    zh_TW: '嘗試重新儲存分頁面板',
  },
  'notif.bookmarks_sub_panel.no_root.save': {
    en: 'Save',
    ru: 'Сохранить',
    de: 'Speichern',
    zh_CN: '保存',
    zh_TW: '儲存',
  },
  'notif.proxy_auth_err': {
    en: 'Proxy authentication error',
    ru: 'Ошибка аутентификации прокси',
    de: 'Proxy-Authentifizierungsfehler',
    zh_CN: '代理认证错误',
    zh_TW: '代理認證錯誤',
  },
  'notif.proxy_auth_err_details': {
    en: 'Check the proxy settings to make sure that they are correct.',
    ru: 'Проверьте настройки прокси, чтобы убедиться, что они верны.',
    de: 'Überprüfen Sie die Proxy-Einstellungen, um sicherzustellen, dass sie korrekt sind.',
    zh_CN: '检查代理设置以确保它们是正确的',
    zh_TW: '檢查代理設定以確保它們是正確的',
  },
  'notif.proxy_auth_err_ctrl': {
    en: 'Open settings',
    ru: 'Открыть настройки',
    de: 'Einstellungen öffnen',
    zh_CN: '打开设置',
    zh_TW: '開啟設定',
  },
  'notif.history_del_sites': {
    en: 'Clearing history',
    ru: 'Очистка истории',
    de: 'Verlauf löschen',
    zh_CN: '清除历史记录',
    zh_TW: '清除歷史紀錄',
  },
  'notif.history_del_sites_nothing': {
    en: 'Nothing to clear',
    ru: 'Нечего очищать',
    de: 'Nichts zu löschen',
    zh_CN: '没有内容可清除',
    zh_TW: '沒有內容可清除',
  },
  'notif.cc.err': {
    en: 'Unable to clear cookies',
    ru: 'Не удалось очистить куки',
    de: 'Cookies können nicht gelöscht werden',
    zh_CN: '无法清除 Cookie',
    zh_TW: '無法清除 Cookie',
  },
  'notif.cc.err_url': {
    en: 'Incorrect URL: ',
    ru: 'Неверный URL: ',
    de: 'Falsche URL: ',
    zh_CN: '不正确的网址：',
    zh_TW: '不正確的網址：',
  },
  'notif.cc.ok': {
    en: 'Cookies was cleared',
    ru: 'Cookies были очищены',
    de: 'Cookies wurden gelöscht',
    zh: 'Cookie 已清除',
  },

  // ---
  // -- Colors
  // -
  'colors.toolbar': {
    en: 'Default',
    ru: 'Стандартный',
    de: 'Standard',
    zh_CN: '默认',
    zh_TW: '預設',
  },
  'colors.blue': {
    en: 'Blue',
    ru: 'Синий',
    de: 'Blau',
    zh_CN: '蓝色',
    zh_TW: '藍色',
  },
  'colors.turquoise': {
    en: 'Turquoise',
    ru: 'Бирюзовый',
    de: 'Türkis',
    zh_CN: '青绿色',
    zh_TW: '青綠色',
  },
  'colors.green': {
    en: 'Green',
    ru: 'Зеленый',
    de: 'Grün',
    zh_CN: '绿色',
    zh_TW: '綠色',
  },
  'colors.yellow': {
    en: 'Yellow',
    ru: 'Желтый',
    de: 'Gelb',
    zh_CN: '黄色',
    zh_TW: '黃色',
  },
  'colors.orange': {
    en: 'Orange',
    ru: 'Оранжевый',
    de: 'Orange',
    zh: '橙色',
  },
  'colors.red': {
    en: 'Red',
    ru: 'Красный',
    de: 'Rot',
    zh_CN: '红色',
    zh_TW: '紅色',
  },
  'colors.pink': {
    en: 'Pink',
    ru: 'Розовый',
    de: 'Pink',
    zh: '粉色',
  },
  'colors.purple': {
    en: 'Purple',
    ru: 'Фиолетовый',
    de: 'Lila',
    zh: '紫色',
  },
}

if (!window.translations) window.translations = sidebarTranslations
else Object.assign(window.translations, sidebarTranslations)
