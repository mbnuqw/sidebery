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
  },

  // ---
  // -- Confirm dialogs
  // -
  'confirm.warn_title': {
    en: 'Warning',
    ru: 'Внимание',
    de: 'Warnung',
    zh_CN: '警告',
  },
  'confirm.tabs_close_pre': {
    en: 'Are you sure you want to close ',
    ru: 'Вы действительно хотите закрыть ',
    de: 'Möchten Sie diese ',
    zh_CN: '你确定要关闭 ',
  },
  'confirm.tabs_close_post': {
    en: ' tabs?',
    ru: (n = 0) => (NUM_234_RE.test(n.toString()) ? ' вкладки?' : ' вкладок?'),
    de: ' Tabs wirklich schließen?',
    zh_CN: ' 标签页吗?',
  },
  'confirm.bookmarks_delete': {
    en: 'Are you sure you want to delete selected bookmarks?',
    ru: 'Вы действительно хотите удалить выбранные закладки?',
    de: 'Möchten Sie die gewählten Lesezeichen wirklich löschen?',
    zh_CN: '您确定要删除选定的书签吗？',
  },

  // ---
  // -- Panel
  // -
  'panel.nothing_found': {
    en: 'Nothing found',
    ru: 'Ничего не найдено',
    de: 'Nichts gefunden',
    zh_CN: '未找到',
  },
  'panel.nothing': {
    en: 'Nothing...',
    ru: 'Ничего...',
    de: 'Nichts...',
    zh_CN: '无...',
  },

  // ---
  // -- Popups
  // -
  // - Tabs panel removing
  'popup.tabs_panel_removing.title': {
    en: 'Removing panel',
    ru: 'Удаление панели',
    de: 'Entferne Paneel',
    zh_CN: '移除面板',
  },
  'popup.tabs_panel_removing.attach': {
    en: 'Attach tabs to neighbour panel',
    ru: 'Присоединить вкладки к соседней панели',
    de: 'Tabs an benachbartes Paneel anheften',
    zh_CN: '将标签连接到相邻面板上',
  },
  'popup.tabs_panel_removing.leave': {
    en: 'Leave tabs untouched',
    ru: 'Оставить вкладки',
    de: 'Tabs behalten',
    zh_CN: '保持标签页不变',
  },
  'popup.tabs_panel_removing.save': {
    en: 'Save panel to bookmarks and close tabs',
    ru: 'Сохранить панель в закладки и закрыть вкладки',
    de: 'Paneel in Lesezeichen speichern und Tabs schließen',
    zh_CN: '将面板保存到书签并关闭标签页',
  },
  'popup.tabs_panel_removing.close': {
    en: 'Close tabs',
    ru: 'Закрыть вкладки',
    de: 'Tabs schließen',
    zh_CN: '关闭标签页',
  },
  'popup.tabs_panel_removing.other_win_note': {
    en: 'Note: Tabs of this panel in other windows will be moved to the neighbour panel or left',
    ru: 'Вкладки этой панели в других окнах будут перемещены на соседнюю панель или оставлены',
    de: 'Tabs dieses Paneels in anderen Fenstern werden zum benachbarten Paneel oder nach links verschoben',
    zh_CN: '注意：此面板在其他窗口中的标签页将移动到相邻面板或左侧',
  },
  // - What to do with old unused bookmarks on saving tabs panel
  'popup.wtdwOldBookmarks.title': {
    en: 'Delete unused bookmarks?',
    ru: 'Удалить неиспользуемые закладки',
    de: 'Ungenutzte Lesezeichen löschen?',
  },
  'popup.wtdwOldBookmarks.delete': {
    en: 'Delete',
    ru: 'Удалить',
    de: 'Löschen',
  },
  'popup.wtdwOldBookmarks.leave': {
    en: 'Keep',
    ru: 'Оставить',
    de: 'Behalten',
  },
  // - Container fast-config popup
  'panel.fast_conf.title': {
    en: 'Container',
    ru: 'Контейнер',
    de: 'Umgebung',
    zh_CN: '容器',
  },
  // - Panel fast-config popup
  'panel.fast_conf.title_tabs': {
    en: 'Tabs panel',
    ru: 'Панель вкладок',
    de: 'Tab-Paneel',
    zh_CN: '标签页面板',
  },
  'panel.fast_conf.title_bookmarks': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
    de: 'Lesezeichen-Paneel',
    zh_CN: '书签面板',
  },
  'panel.fast_conf.name': {
    en: 'Name',
    ru: 'Имя',
    de: 'Name',
    zh_CN: '名称',
  },
  'panel.fast_conf.icon': {
    en: 'Icon',
    ru: 'Иконка',
    de: 'Symbol',
    zh_CN: '图标',
  },
  'panel.fast_conf.color': {
    en: 'Color',
    ru: 'Цвет',
    de: 'Farbe',
    zh_CN: '颜色',
  },
  'panel.fast_conf.btn_more': {
    en: 'More options...',
    ru: 'Больше опций...',
    de: 'Weitere Optionen...',
    zh_CN: '更多选项...',
  },
  // - Group config popup
  'popup.group_config.popup_title': {
    en: 'Group',
    ru: 'Группа',
    de: 'Gruppe',
  },
  'popup.group_config.title': {
    en: 'Title',
    ru: 'Название',
    de: 'Name',
  },
  'popup.group_config.title_placeholder': {
    en: 'Group title',
    ru: 'Название группы',
    de: 'Gruppenname',
  },

  // ---
  // -- Drag and Drop tooltips
  // -
  'dnd.tooltip.bookmarks_panel': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
    de: 'Lesezeichen-Paneel',
    zh_CN: '书签面板',
  },
  'dnd.tooltip.tabs_panel': {
    en: 'panel',
    ru: 'панель',
    de: 'Paneel',
    zh_CN: '面板',
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
  },
  'dnd.tooltip.nav_item': {
    en: 'Navigation element',
    ru: 'Элемент навигации',
    de: 'Navigationselement',
    zh_CN: '导航元素',
  },

  // ---
  // -- Navigation bar
  // -
  'nav.show_hidden_tooltip': {
    en: 'Show hidden panels',
    ru: 'Показать скрытые панели',
    de: 'Versteckte Paneele anzeigen',
    zh_CN: '显示隐藏的面板',
  },
  'nav.btn_settings': {
    en: 'Settings',
    ru: 'Настройки',
    de: 'Einstellungen',
    zh_CN: '设置',
  },
  'nav.btn_add_tp': {
    en: 'Create tabs panel',
    ru: 'Создать панель вкладок',
    de: 'Tabs-Paneel erstellen',
    zh_CN: '创建标签页面板',
  },
  'nav.btn_search': {
    en: 'Search',
    ru: 'Поиск',
    de: 'Suchen',
    zh_CN: '搜索',
  },
  'nav.btn_create_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
    de: 'Schnappschuss erstellen',
    zh_CN: '创建快照',
  },
  'nav.btn_remute_audio_tabs': {
    en: 'Mute/Unmute audible tabs',
    ru: 'Приглушить/Включить вкладки со звуком',
    de: 'Stummschalten hörbarer Tabs an/aus',
    zh_CN: '静音/取消静音有声标签页',
  },
  'nav.btn_collapse': {
    en: 'Collapse all',
    ru: 'Свернуть все',
    de: 'Alle einklappen',
  },

  // ---
  // -- Notifications
  // -
  'notif.hide_tooltip': {
    en: 'Hide notification',
    ru: 'Скрыть уведомление',
    de: 'Benachrichtigung verbergen',
    zh_CN: '隐藏通知',
  },
  'notif.undo_ctrl': {
    en: 'Undo',
    ru: 'Восстановить',
    de: 'Rückgängig',
    zh_CN: '撤消',
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
  },
  'notif.bookmarks_sort': {
    en: 'Sorting bookmarks...',
    ru: 'Сортировка закладок...',
    de: 'Sortiere Lesezeichen...',
    zh_CN: '书签排序',
  },
  'notif.snapshot_created': {
    en: 'Snapshot created',
    ru: 'Снепшот создан',
    de: 'Schnappschuss erstellt',
    zh_CN: '快照已创建',
  },
  'notif.view_snapshot': {
    en: 'View',
    ru: 'Посмотреть',
    de: 'Ansehen',
    zh_CN: '查看',
  },
  'notif.tabs_err': {
    en: 'Wrong tabs position detected',
    ru: 'Обнаружено неправильное положение вкладок',
    de: 'Falsche Tab-Position erkannt',
    zh_CN: '检测到错误的标签页位置',
  },
  'notif.tabs_err_fix': {
    en: 'Update tabs',
    ru: 'Обновить вкладки',
    de: 'Tabs aktualisieren',
    zh_CN: '更新标签页',
  },
  'notif.tabs_reloading': {
    en: 'Reloading tabs',
    ru: 'Перезагрузка вкладок',
    de: 'Tabs neu laden',
    zh_CN: '重新加载标签页',
  },
  'notif.tabs_reloading_stop': {
    en: 'Stop',
    ru: 'Остановить',
    de: 'Stopp',
    zh_CN: '停止',
  },
  'notif.tabs_panel_saving_bookmarks': {
    en: 'Saving to bookmarks...',
    ru: 'Сохранение в закладки...',
    de: 'Speichere in Lesezeichen...',
    zh_CN: '保存到书签...',
  },
  'notif.tabs_panel_saved_bookmarks': {
    en: 'Panel saved',
    ru: 'панель сохранена в',
    de: 'Paneel gespeichert',
    zh_CN: '面板已保存',
  },
  'notif.tabs_panel_updated_bookmarks': {
    en: 'Bookmarks updated',
    ru: 'закладки обновлены в',
    de: 'Lesezeichen aktualisiert',
    zh_CN: '书签已更新',
  },
  'notif.converting': {
    en: 'Converting...',
    ru: 'Конвертация...',
    de: 'Konvertiere...',
    zh_CN: '转换中...',
  },
  'notif.tabs_panel_to_bookmarks_err': {
    en: 'Cannot save tabs panel to bookmarks',
    ru: 'Невозможно сохранить панель вкладок в закладки',
    de: 'Kann Tab-Paneel nicht in Lesezeichen speichern',
    zh_CN: '无法将标签页面板保存到书签',
  },
  'notif.tabs_panel_to_bookmarks_err.folder': {
    en: 'Cannot create destination folder',
    ru: 'Невозможно создать папку для панели',
    de: 'Zielordner kann nicht erstellt werden',
    zh_CN: '无法创建目标文件夹',
  },
  'notif.tabs_panel_to_bookmarks_err.folder_upd': {
    en: 'Cannot update destination folder',
    ru: 'Невозможно обновить папку для панели',
    de: 'Kann Zielordner nicht aktualisieren',
  },
  'notif.tabs_panel_to_bookmarks_err.bookmarks': {
    en: 'Cannot create bookmarks',
    ru: 'Невозможно создать закладки',
    de: 'Lesezeichen können nicht erstellt werden',
    zh_CN: '无法创建书签',
  },
  'notif.restore_from_bookmarks_err': {
    en: 'Cannot restore panel from bookmarks',
    ru: 'Невозможно восстановить панель из закладок',
    de: 'Kann Paneel aus Lesezeichen nicht wiederherstellen',
    zh_CN: '无法从书签恢复面板',
  },
  'notif.restore_from_bookmarks_err.root': {
    en: 'Root folder not found',
    ru: 'Корневая папка не найдена',
    de: 'Quellordner nicht gefunden',
    zh_CN: '未找到根文件夹',
  },
  'notif.restore_from_bookmarks_ok': {
    en: 'Tabs panel was restored',
    ru: 'Панель вкладок восстановлена',
    de: 'Tab-Paneel wiederhergestellt',
    zh_CN: '标签页面板已恢复',
  },
  'notif.done': {
    en: 'Done',
    ru: 'Готово',
    de: 'Fertig',
    zh_CN: '已完成',
  },
  'notif.new_bookmark': {
    en: 'New bookmark added',
    ru: 'Новая закладка добавлена',
    de: 'Neues Lesezeichen hinzugefügt',
    zh_CN: '书签已添加',
  },
  'notif.bookmarks_sub_panel.no_root.title': {
    en: 'Cannot find root folder',
    ru: 'Невозможно найти корневую папку',
    de: 'Kann Quellordner nicht finden',
  },
  'notif.bookmarks_sub_panel.no_root.details': {
    en: 'Try to re-save tabs panel',
    ru: 'Попробуйте пересохранить панель вкладок',
    de: 'Versuche Tab-Paneel neu zu speichern',
  },
  'notif.bookmarks_sub_panel.no_root.save': {
    en: 'Save',
    ru: 'Сохранить',
    de: 'Speichern',
  },
}

if (!window.translations) window.translations = sidebarTranslations
else Object.assign(window.translations, sidebarTranslations)
 
