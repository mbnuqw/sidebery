export const NUM_1_RE = /^(1|(\d*?)[^1]1)$/
export const NUM_234_RE = /^([234]|(\d*?)[^1][234])$/

export const commonTranslations: Translations = {
  // ---
  // -- Bookmarks editor
  // -
  'bookmarks_editor.name_bookmark_placeholder': {
    en: 'Bookmark name...',
    ru: 'Название закладки...',
    zh_CN: '书签名称...',
  },
  'bookmarks_editor.name_folder_placeholder': {
    en: 'Folder name...',
    ru: 'Название папки...',
    zh_CN: '文件夹名称...',
  },
  'bookmarks_editor.url_placeholder': {
    en: 'e.g. https://example.com',
    ru: 'Ссылка...',
    zh_CN: '例如 https://example.com',
  },

  // ---
  // -- Buttons
  // -
  'btn.create': {
    en: 'Create',
    ru: 'Создать',
    zh_CN: '创建',
  },
  'btn.save': {
    en: 'Save',
    ru: 'Сохранить',
    zh_CN: '保存',
  },
  'btn.restore': {
    en: 'Restore',
    ru: 'Восстановить',
    zh_CN: '恢复',
  },
  'btn.update': {
    en: 'Update',
    ru: 'Обновить',
    zh_CN: '更新',
  },
  'btn.yes': {
    en: 'Yes',
    ru: 'Да',
    zh_CN: '确认',
  },
  'btn.ok': {
    en: 'Ok',
    ru: 'Ок',
    zh_CN: 'Ok',
  },
  'btn.no': {
    en: 'No',
    ru: 'Нет',
    zh_CN: 'No',
  },
  'btn.cancel': {
    en: 'Cancel',
    ru: 'Отмена',
    zh_CN: '取消',
  },
  'btn.stop': {
    en: 'Stop',
    ru: 'Остановить',
    zh_CN: '停止',
  },

  // ---
  // -- Container
  // -
  'container.new_container_name': {
    en: 'Container',
    ru: 'Контейнер',
    zh_CN: '容器',
  },

  // ---
  // -- Tabs panel
  // -
  'panel.tabs.title': {
    en: 'Tabs',
    ru: 'Вкладки',
    zh_CN: '标签页',
  },

  // ---
  // -- Bookmarks panel
  // -
  'panel.bookmarks.title': {
    en: 'Bookmarks',
    ru: 'Закладки',
    zh_CN: '书签',
  },
  'panel.bookmarks.req_perm': {
    en: 'Bookmarks panel requires "Bookmarks" permission.',
    ru: 'Панель закладок требует разрешения "Закладки".',
    zh_CN: '书签面板需要“书签”权限.',
  },

  // ---
  // -- History panel
  // -
  'panel.history.title': {
    en: 'History',
    ru: 'История',
    zh_CN: '历史',
  },
  'panel.history.load_more': {
    en: 'Scroll to load more',
    ru: 'Прокрутитe вниз, чтобы загрузить больше',
    zh_CN: '滚动加载更多',
  },
  'panel.history.req_perm': {
    en: 'History panel requires "History" permission.',
    ru: 'Панель истории требует разрешения "История".',
    zh_CN: '历史面板需要“历史”权限。',
  },

  // ---
  // -- Popups
  // -
  // - Bookmarks popup
  'popup.bookmarks.name_label': {
    en: 'Name',
    ru: 'Название',
    zh_CN: '名称',
  },
  'popup.bookmarks.location_label': {
    en: 'Location',
    ru: 'Расположение',
    zh_CN: '地址',
  },
  'popup.bookmarks.location_new_folder_placeholder': {
    en: 'New folder name',
    ru: 'Название новой папки',
    zh_CN: '新文件夹名称',
  },
  'popup.bookmarks.recent_locations_label': {
    en: 'Recent locations',
    ru: 'Недавние расположения',
    zh_CN: '最近地址',
  },
  'popup.bookmarks.save_in_bookmarks': {
    en: 'Save in bookmarks',
    ru: 'Сохранить в закладки',
    zh_CN: '保存至书签',
  },
  'popup.bookmarks.edit_bookmark': {
    en: 'Edit bookmark',
    ru: 'Редактировать закладку',
    zh_CN: '编辑书签',
  },
  'popup.bookmarks.edit_folder': {
    en: 'Edit folder',
    ru: 'Редактировать папку',
    zh_CN: '编辑文件夹',
  },
  'popup.bookmarks.select_root_folder': {
    en: 'Select root folder',
    ru: 'Выберите корневую папку',
    zh_CN: '选择根文件夹',
  },
  'popup.bookmarks.create_bookmark': {
    en: 'Create bookmark',
    ru: 'Создать закладку',
    zh_CN: '创建书签',
  },
  'popup.bookmarks.create_folder': {
    en: 'Create folder',
    ru: 'Создать папку',
    zh_CN: '创建文件夹',
  },
  'popup.bookmarks.move_to': {
    en: 'Move to',
    ru: 'Переместить в',
    zh_CN: '移动到',
  },
  'popup.bookmarks.move': {
    en: 'Move',
    ru: 'Переместить',
    zh_CN: '移动',
  },
  'popup.bookmarks.create_bookmarks': {
    en: 'Create bookmark[s]',
    ru: 'Создать закладки',
    zh_CN: '创建书签',
  },
  'popup.bookmarks.restore': {
    en: 'Restore from bookmarks folder',
    ru: 'Восстановить из папки закладок',
    zh_CN: '从书签文件夹恢复',
  },
  'popup.bookmarks.convert_title': {
    en: 'Convert to bookmarks',
    ru: 'Конвертировать в закладки',
    zh_CN: '转换为书签',
  },
  'popup.bookmarks.convert': {
    en: 'Convert',
    ru: 'Конвертировать',
    zh_CN: '转换',
  },

  // ---
  // -- Context menu
  // -
  // - Toolbar button (browserAction)
  'menu.browserAction.open_settings': {
    en: 'Open settings',
    ru: 'Открыть настройки',
    zh_CN: '打开设置',
  },
  'menu.browserAction.create_snapshot': {
    en: 'Create snapshot',
    ru: 'Создать снепшот',
    zh_CN: '创建快照',
  },
  // - New tab bar
  'menu.new_tab_bar.no_container': {
    en: 'No Container',
    ru: 'Не в контейнере',
    zh_CN: '无容器',
  },
  'menu.new_tab_bar.new_container': {
    en: 'In New Container',
    ru: 'В новом контейнере',
    zh_CN: '在新容器中',
  },
  'menu.new_tab_bar.manage_containers': {
    en: 'Manage Containers',
    ru: 'Управление контейнерами',
    zh_CN: '管理容器',
  },
  // - Bookmark
  'menu.bookmark.open_in_sub_menu_name': {
    en: 'Open in',
    ru: 'Открыть в',
    zh_CN: '打开',
  },
  'menu.bookmark.open_in_new_window': {
    en: 'Open in new normal window',
    ru: 'Открыть в новом стандартном окне',
    zh_CN: '新建窗口打开链接',
  },
  'menu.bookmark.open_in_new_priv_window': {
    en: 'Open in new private window',
    ru: 'Открыть в новом приватном окне',
    zh_CN: '新建隐私窗口打开链接',
  },
  'menu.bookmark.open_in_new_panel': {
    en: 'Open in new tabs panel',
    ru: 'Открыть в новой панели вкладок',
    zh_CN: '新标签面板中打开链接',
  },
  'menu.bookmark.open_in_panel_': {
    en: 'Open in panel...',
    ru: 'Открыть в панели...',
    zh_CN: '在面板中打开...',
  },
  'menu.bookmark.open_in_ctr_': {
    en: 'Open in container...',
    ru: 'Открыть в контейнере...',
    zh_CN: '在容器中打开...',
  },
  'menu.bookmark.open_in_default_ctr': {
    en: 'Open in default container',
    ru: 'Открыть в стандартном контейнере',
    zh_CN: '在默认容器中打开',
  },
  'menu.bookmark.open_in_': {
    en: 'Open in ',
    ru: 'Открыть в ',
    zh_CN: '打开 ',
  },
  'menu.bookmark.create_bookmark': {
    en: 'Create bookmark',
    ru: 'Создать закладку',
    zh_CN: '创建书签',
  },
  'menu.bookmark.create_folder': {
    en: 'Create folder',
    ru: 'Создать папку',
    zh_CN: '创建文件夹',
  },
  'menu.bookmark.create_separator': {
    en: 'Create separator',
    ru: 'Создать разделитель',
    zh_CN: '创建分隔符',
  },
  'menu.bookmark.edit_bookmark': {
    en: 'Edit',
    ru: 'Редактировать',
    zh_CN: '编辑',
  },
  'menu.bookmark.delete_bookmark': {
    en: 'Delete',
    ru: 'Удалить',
    zh_CN: '删除',
  },
  'menu.bookmark.sort_sub_menu_name': {
    en: 'Sort',
    ru: 'Сортировать',
    zh_CN: '排序',
  },
  'menu.bookmark.sort_by_name': {
    en: 'Sort by name',
    ru: 'Сортировать по названию',
    zh_CN: '按名称排序',
  },
  'menu.bookmark.sort_by_name_asc': {
    en: 'Sort by name (A-z)',
    ru: 'Сортировать по названию (А-я)',
    zh_CN: '按名称排序 (A-z)',
  },
  'menu.bookmark.sort_by_name_des': {
    en: 'Sort by name (z-A)',
    ru: 'Сортировать по названию (я-А)',
    zh_CN: '按名称排序 (z-A)',
  },
  'menu.bookmark.sort_by_link': {
    en: 'Sort by URL',
    ru: 'Сортировать по адресу',
    zh_CN: '按网址排序',
  },
  'menu.bookmark.sort_by_link_asc': {
    en: 'Sort by URL (A-z)',
    ru: 'Сортировать по адресу (А-я)',
    zh_CN: '按网址排序 (A-z)',
  },
  'menu.bookmark.sort_by_link_des': {
    en: 'Sort by URL (z-A)',
    ru: 'Сортировать по адресу (я-А)',
    zh_CN: '按网址排序 (z-A)',
  },
  'menu.bookmark.sort_by_time': {
    en: 'Sort by creation time',
    ru: 'Сортировать по времени создания',
    zh_CN: '按添加时间排序',
  },
  'menu.bookmark.sort_by_time_asc': {
    en: 'Sort by time (Old-New)',
    ru: 'Сортировать по времени (Старые-Новые)',
    zh_CN: '按添加时间排序 (旧-新)',
  },
  'menu.bookmark.sort_by_time_des': {
    en: 'Sort by time (New-Old)',
    ru: 'Сортировать по времени (Новые-Старые)',
    zh_CN: '按添加时间排序 (新-旧)',
  },
  'menu.bookmark.open_as_bookmarks_panel': {
    en: 'Open as bookmarks panel',
    ru: 'Открыть как панель закладок',
    zh_CN: '作为书签面板打开',
  },
  'menu.bookmark.open_as_tabs_panel': {
    en: 'Open as tabs panel',
    ru: 'Открыть как панель вкладок',
    zh_CN: '作为标签页面板打开',
  },
  'menu.bookmark.move_to': {
    en: 'Move to...',
    ru: 'Переместить в...',
    zh_CN: '移动到...',
  },
  // - Bookmarks panel
  'menu.bookmark.collapse_all': {
    en: 'Collapse all folders',
    ru: 'Свернуть все папки',
    zh_CN: '折叠所有文件夹',
  },
  'menu.bookmark.switch_view': {
    en: 'View mode',
    ru: 'Режим отображения',
    zh_CN: '视图模式',
  },
  'menu.bookmark.switch_view_history': {
    en: 'History view',
    ru: 'Хронологическое отображение',
    zh_CN: '历史视图',
  },
  'menu.bookmark.switch_view_tree': {
    en: 'Tree view',
    ru: 'Древовидное отображение',
    zh_CN: '树状视图',
  },
  'menu.bookmark.convert_to_tabs_panel': {
    en: 'Convert to tabs panel',
    ru: 'Конвертировать в панель вкладок',
    zh_CN: '转换为标签页面板',
  },
  'menu.bookmark.remove_panel': {
    en: 'Remove panel',
    ru: 'Удалить панель',
    zh_CN: '移除面板',
  },
  // - Tab
  'menu.tab.undo': {
    en: 'Undo close tab',
    ru: 'Восстановить закрытую вкладку',
    zh_CN: '撤消关闭标签页',
  },
  'menu.tab.move_to_sub_menu_name': {
    en: 'Move to',
    ru: 'Переместить в',
    zh_CN: '移动到',
  },
  'menu.tab.move_to_new_window': {
    en: 'Move to new window',
    ru: 'Переместить в новое окно',
    zh_CN: '移动到新窗口',
  },
  'menu.tab.move_to_new_priv_window': {
    en: 'Move to private window',
    ru: 'Переместить в приватное окно',
    zh_CN: '移动到隐私窗口',
  },
  'menu.tab.move_to_another_window': {
    en: 'Move to another window',
    ru: 'Переместить в другое окно',
    zh_CN: '移动到另一个窗口',
  },
  'menu.tab.move_to_window_': {
    en: 'Move to window...',
    ru: 'Переместить в окно...',
    zh_CN: '移动到窗口...',
  },
  'menu.tab.move_to_panel_label': {
    en: 'Move to panel...',
    ru: 'Переместить в панель...',
    zh_CN: '移动到面板...',
  },
  'menu.tab.move_to_panel_': {
    en: 'Move to ',
    ru: 'Переместить в ',
    zh_CN: '移动到 ',
  },
  'menu.tab.move_to_new_panel': {
    en: 'Move to new panel',
    ru: 'Переместить в новую панель',
    zh_CN: '移动到新面板',
  },
  'menu.tab.reopen_in_new_window': {
    en: 'Reopen in new window of another type',
    ru: 'Переоткрыть в новом окне другого типа',
    zh_CN: '在其他类型的新建窗口中重新打开',
  },
  'menu.tab.reopen_in_new_norm_window': {
    en: 'Reopen in new normal window',
    ru: 'Переоткрыть в новом стандартном окне',
    zh_CN: '在新建窗口中重新打开',
  },
  'menu.tab.reopen_in_new_priv_window': {
    en: 'Reopen in new private window',
    ru: 'Переоткрыть в новом приватном окне',
    zh_CN: '在新建隐私窗口中重新打开',
  },
  'menu.tab.reopen_in_norm_window': {
    en: 'Reopen in normal window',
    ru: 'Переоткрыть в стандартном окне',
    zh_CN: '在普通窗口中重新打开',
  },
  'menu.tab.reopen_in_priv_window': {
    en: 'Reopen in private window',
    ru: 'Переоткрыть в приватном окне',
    zh_CN: '在隐私窗口重新打开',
  },
  'menu.tab.reopen_in_window': {
    en: 'Reopen in window of another type',
    ru: 'Переоткрыть в стандартном контейнере',
    zh_CN: '在其他类型的窗口中重新打开',
  },
  'menu.tab.reopen_in_default_panel': {
    en: 'Reopen in default container',
    ru: 'Переоткрыть в новом контейнере',
    zh_CN: '在默认容器中重新打开',
  },
  'menu.tab.reopen_in_new_container': {
    en: 'Reopen in new container',
    ru: 'Переоткрыть в окне другого типа',
    zh_CN: '在新建容器中重新打开',
  },
  'menu.tab.reopen_in_sub_menu_name': {
    en: 'Reopen in',
    ru: 'Переоткрыть в',
    zh_CN: '重新打开',
  },
  'menu.tab.reopen_in_ctr_': {
    en: 'Reopen in container...',
    ru: 'Переоткрыть в контейнере...',
    zh_CN: '在容器中重新打开...',
  },
  'menu.tab.reopen_in_': {
    en: 'Reopen in ',
    ru: 'Переоткрыть в ',
    zh_CN: '重新打开 ',
  },
  'menu.tab.reopen_in_window_': {
    en: 'Reopen in window...',
    ru: 'Переоткрыть в окне...',
    zh_CN: '在窗口中重新打开...',
  },
  'menu.tab.group': {
    en: 'Group',
    ru: 'Сгруппировать',
    zh_CN: '分组',
  },
  'menu.tab.flatten': {
    en: 'Flatten',
    ru: 'Сбросить вложенность',
    zh_CN: '扁平化',
  },
  'menu.tab.pin': {
    en: 'Pin',
    ru: 'Закрепить',
    zh_CN: '固定标签页',
  },
  'menu.tab.unpin': {
    en: 'Unpin',
    ru: 'Открепить',
    zh_CN: '取消固定标签页',
  },
  'menu.tab.mute': {
    en: 'Mute',
    ru: 'Выключить звук',
    zh_CN: '静音',
  },
  'menu.tab.unmute': {
    en: 'Unmute',
    ru: 'Включить звук',
    zh_CN: '取消静音',
  },
  'menu.tab.clear_cookies': {
    en: 'Clear cookies',
    ru: 'Удалить cookies',
    zh_CN: '清除Cookies',
  },
  'menu.tab.discard': {
    en: 'Unload',
    ru: 'Выгрузить',
    zh_CN: '卸载页面',
  },
  'menu.tab.bookmark': {
    en: 'Add to bookmarks',
    ru: 'В закладки',
    zh_CN: '添加到书签',
  },
  'menu.tab.bookmarks': {
    en: 'Create bookmarks',
    ru: 'В закладки',
    zh_CN: '新建书签',
  },
  'menu.tab.reload': {
    en: 'Reload',
    ru: 'Перезагрузить',
    zh_CN: '重新加载',
  },
  'menu.tab.duplicate': {
    en: 'Duplicate',
    ru: 'Дублировать',
    zh_CN: '克隆标签页',
  },
  'menu.tab.close': {
    en: 'Close',
    ru: 'Закрыть',
    zh_CN: '关闭',
  },
  'menu.tab.close_descendants': {
    en: 'Close descendants',
    ru: 'Закрыть потомки',
    zh_CN: '关闭子选项',
  },
  'menu.tab.close_above': {
    en: 'Close tabs above',
    ru: 'Закрыть вкладки сверху',
    zh_CN: '关闭上侧标签页',
  },
  'menu.tab.close_below': {
    en: 'Close tabs below',
    ru: 'Закрыть вкладки снизу',
    zh_CN: '关闭下侧标签页',
  },
  'menu.tab.close_other': {
    en: 'Close other tabs',
    ru: 'Закрыть другие вкладки',
    zh_CN: '关闭其他标签页',
  },
  // - Tabs panel
  'menu.tabs_panel.mute_all_audible': {
    en: 'Mute all audible tabs',
    ru: 'Выключить звук',
    zh_CN: '静音所有有声标签页',
  },
  'menu.tabs_panel.dedup': {
    en: 'Close duplicate tabs',
    ru: 'Закрыть дубликаты',
    zh_CN: '关闭克隆标签页',
  },
  'menu.tabs_panel.reload': {
    en: 'Reload tabs',
    ru: 'Перезагрузить вкладки',
    zh_CN: '重新加载标签页',
  },
  'menu.tabs_panel.discard': {
    en: 'Unload tabs',
    ru: 'Выгрузить вкладки',
    zh_CN: '卸载标签页',
  },
  'menu.tabs_panel.close': {
    en: 'Close tabs',
    ru: 'Закрыть вкладки',
    zh_CN: '关闭标签页',
  },
  'menu.tabs_panel.collapse_inact_branches': {
    en: 'Collapse inactive branches',
    ru: 'Свернуть неактивные ветки',
    zh_CN: '折叠非活动分支',
  },
  'menu.tabs_panel.remove_panel': {
    en: 'Remove panel',
    ru: 'Удалить панель',
    zh_CN: '移除面板',
  },
  'menu.tabs_panel.bookmark': {
    en: 'Save to bookmarks',
    ru: 'Сохранить в закладки',
    zh_CN: '保存到书签',
  },
  'menu.tabs_panel.restore_from_bookmarks': {
    en: 'Restore from bookmarks',
    ru: 'Восстановить из закладок',
    zh_CN: '从书签中恢复',
  },
  'menu.tabs_panel.convert_to_bookmarks_panel': {
    en: 'Convert to bookmarks panel',
    ru: 'Конвертировать в панель закладок',
    zh_CN: '转换为书签面板',
  },
  // - History
  'menu.history.open': {
    en: 'Open',
    ru: 'Открыть',
    zh_CN: '打开',
  },
  // - Common
  'menu.copy_urls': {
    en: n => (n === 1 ? 'Copy URL' : 'Copy URLs'),
    ru: n => (n === 1 ? 'Копировать адрес' : 'Копировать адреса'),
    zh_CN: n => (n === 1 ? '复制网址' : '复制所有网址'),
  },
  'menu.copy_titles': {
    en: n => (n === 1 ? 'Copy title' : 'Copy titles'),
    ru: n => (n === 1 ? 'Копировать заголовок' : 'Копировать заголовки'),
    zh_CN: n => (n === 1 ? '复制标题' : '复制所有标题'),
  },
  'menu.common.pin_panel': {
    en: 'Pin panel',
    ru: 'Закрепить панель',
    zh_CN: '固定标签页',
  },
  'menu.common.unpin_panel': {
    en: 'Unpin panel',
    ru: 'Открепить панель',
    zh_CN: '取消固定标签页',
  },
  'menu.common.conf': {
    en: 'Configure panel',
    ru: 'Настройки панели',
    zh_CN: '配置面板',
  },
  'menu.common.conf_tooltip': {
    en: 'Configure panel\nAlt: Basic panel config',
    ru: 'Настройки панели\nAlt: Базовые настройки панели',
    zh_CN: '配置面板\nAlt: 基本面板配置',
  },
  'menu.panels.unload': {
    en: 'Unload',
    ru: 'Выгрузить',
    zh_CN: '卸载',
  },
  // - Menu Editor
  'menu.editor.reset': {
    en: 'Reset',
    ru: 'Сброс',
    zh_CN: '重置',
  },
  'menu.editor.create_separator': {
    en: 'Create separator',
    ru: 'Создать разделитель',
    zh_CN: '新建分隔条',
  },
  'menu.editor.create_sub_tooltip': {
    en: 'Create sub-menu',
    ru: 'Создать подменю',
    zh_CN: '创建子菜单',
  },
  'menu.editor.up_tooltip': {
    en: 'Move up',
    ru: 'Вверх',
    zh_CN: 'Move up',
  },
  'menu.editor.down_tooltip': {
    en: 'Move down',
    ru: 'Вниз',
    zh_CN: 'Move down',
  },
  'menu.editor.disable_tooltip': {
    en: 'Disable',
    ru: 'Отключить',
    zh_CN: '禁用',
  },
  'menu.editor.tabs_title': {
    en: 'Tabs',
    ru: 'Вкладки',
    zh_CN: '标签页',
  },
  'menu.editor.tabs_panel_title': {
    en: 'Tabs panel',
    ru: 'Панель вкладок',
    zh_CN: '标签页面板',
  },
  'menu.editor.bookmarks_title': {
    en: 'Bookmarks',
    ru: 'Закладки',
    zh_CN: '书签',
  },
  'menu.editor.bookmarks_panel_title': {
    en: 'Bookmarks panel',
    ru: 'Панель закладок',
    zh_CN: '书签面板',
  },
  'menu.editor.inline_group_title': {
    en: 'Sub-menu label...',
    ru: 'Название подменю...',
    zh_CN: '子菜单标签...',
  },
  'menu.editor.list_title': {
    en: 'List',
    ru: 'Список',
    zh_CN: '列表',
  },
  'menu.editor.disabled_title': {
    en: 'Disabled',
    ru: 'Отключено',
    zh_CN: '已禁用',
  },

  // ---
  // -- Settings
  // -
  'settings.opt_true': {
    en: 'on',
    ru: 'вкл',
    zh_CN: '打开',
  },
  'settings.opt_false': {
    en: 'off',
    ru: 'выкл',
    zh_CN: '关闭',
  },

  // ---
  // -- Time
  // -
  'time.month_0': {
    en: 'January',
    ru: 'Январь',
    zh_CN: '一月',
  },
  'time.month_1': {
    en: 'February',
    ru: 'Февраль',
    zh_CN: '二月',
  },
  'time.month_2': {
    en: 'March',
    ru: 'Март',
    zh_CN: '三月',
  },
  'time.month_3': {
    en: 'April',
    ru: 'Апрель',
    zh_CN: '四月',
  },
  'time.month_4': {
    en: 'May',
    ru: 'Май',
    zh_CN: '五月',
  },
  'time.month_5': {
    en: 'June',
    ru: 'Июнь',
    zh_CN: '六月',
  },
  'time.month_6': {
    en: 'July',
    ru: 'Июль',
    zh_CN: '七月',
  },
  'time.month_7': {
    en: 'August',
    ru: 'Август',
    zh_CN: '八月',
  },
  'time.month_8': {
    en: 'September',
    ru: 'Сентябрь',
    zh_CN: '九月',
  },
  'time.month_9': {
    en: 'October',
    ru: 'Октябрь',
    zh_CN: '十月',
  },
  'time.month_10': {
    en: 'November',
    ru: 'Ноябрь',
    zh_CN: '十一月',
  },
  'time.month_11': {
    en: 'December',
    ru: 'Декабрь',
    zh_CN: '十二月',
  },
  'time.today': {
    en: 'Today',
    ru: 'Сегодня',
    zh_CN: '今日',
  },
  'time.yesterday': {
    en: 'Yesterday',
    ru: 'Вчера',
    zh_CN: '昨日',
  },
  'time.this_week': {
    en: 'This week',
    ru: 'Эта неделя',
    zh_CN: 'This 本周',
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
  },

  // ---
  // -- Upgrade screen
  // -
  'upgrade.title': {
    en: 'Upgrading',
    ru: 'Обновление',
    zh_CN: '升级',
  },
  'upgrade.btn.backup': {
    en: 'Save backup',
    ru: 'Сохранить резервную копию данных',
    zh_CN: '保存备份',
  },
  'upgrade.btn.continue': {
    en: 'Continue',
    ru: 'Продолжить',
    zh_CN: '继续',
  },
  'upgrade.status.done': {
    en: 'Done',
    ru: 'Готово',
    zh_CN: '已完成',
  },
  'upgrade.status.in_progress': {
    en: 'In progress',
    ru: 'В процессе',
    zh_CN: '进行中',
  },
  'upgrade.status.pending': {
    en: 'Pending',
    ru: 'Ожидание',
    zh_CN: '等待中',
  },
  'upgrade.status.err': {
    en: 'Error',
    ru: 'Ошибка',
    zh_CN: '错误',
  },
  'upgrade.status.no': {
    en: 'No data',
    ru: 'Нет данных',
    zh_CN: '没有数据',
  },
  'upgrade.initializing': {
    en: 'Initializing',
    ru: 'Инициализация',
    zh_CN: '正在初始化',
  },
  'upgrade.settings': {
    en: 'Settings',
    ru: 'Настройки',
    zh_CN: '设置',
  },
  'upgrade.panels_nav': {
    en: 'Panels and navigation',
    ru: 'Панели и навигация',
    zh_CN: '面板和导航',
  },
  'upgrade.ctx_menu': {
    en: 'Context menu',
    ru: 'Контекстное меню',
    zh_CN: '上下文菜单',
  },
  'upgrade.snapshots': {
    en: 'Snapshots',
    ru: 'Снепшоты',
    zh_CN: '快照',
  },
  'upgrade.fav_cache': {
    en: 'Favicons cache',
    ru: 'Кэш иконок',
    zh_CN: '网站图标缓存',
  },
  'upgrade.styles': {
    en: 'Custom styles',
    ru: 'Стили',
    zh_CN: '自定义样式',
  },
  'upgrade.err.get_stored': {
    en: 'Cannot get stored data',
    ru: 'Невозможно получить данные старой версии',
    zh_CN: '无法获取存储的数据',
  },
}

if (!window.translations) window.translations = commonTranslations
else Object.assign(window.translations, commonTranslations)
