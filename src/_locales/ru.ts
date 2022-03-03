import { PlurFn } from 'src/types'

const NUM_1_RE = /^(1|(\d*?)[^1]1)$/
const NUM_234_RE = /^([234]|(\d*?)[^1][234])$/

const dict: Record<string, PlurFn | string> = {
  // ---
  // -- Bookmarks editor
  // -
  'bookmarks_editor.name_bookmark_placeholder': 'Название закладки...',
  'bookmarks_editor.name_folder_placeholder': 'Название папки...',
  'bookmarks_editor.url_placeholder': 'Ссылка...',

  // ---
  // -- Buttons
  // -
  'btn.create': 'Создать',
  'btn.save': 'Сохранить',
  'btn.restore': 'Восстановить',
  'btn.update': 'Обновить',
  'btn.yes': 'Да',
  'btn.ok': 'Ок',
  'btn.no': 'Нет',
  'btn.cancel': 'Отмена',
  'btn.stop': 'Остановить',

  // ---
  // -- Bars
  // -
  // Search
  'bar.search.placeholder': 'Поиск...',

  // ---
  // -- Confirm dialogs
  // -
  'confirm.warn_title': 'Внимание',
  'confirm.tabs_close_pre': 'Вы действительно хотите закрыть ',
  'confirm.tabs_close_post': (n = 0) => (NUM_234_RE.test(n.toString()) ? ' вкладки?' : ' вкладок?'),
  'confirm.bookmarks_delete': 'Вы действительно хотите удалить выбранные закладки?',

  // ---
  // -- Panel
  // -
  'panel.nothing_found': 'Ничего не найдено',
  'panel.nothing': 'Ничего...',

  // ---
  // -- Tabs panel
  // -
  'panel.tabs.title': 'Вкладки',

  // ---
  // -- Bookmarks panel
  // -
  'panel.bookmarks.title': 'Закладки',
  'panel.bookmarks.req_perm': 'Панель закладок требует разрешения "Закладки".',

  // ---
  // -- History panel
  // -
  'panel.history.title': 'История',
  'panel.history.load_more': 'Прокрутитe вниз, чтобы загрузить больше',
  'panel.history.req_perm': 'Панель истории требует разрешения "История".',

  // ---
  // -- Downloads panel
  // -
  'panel.downloads.title': 'Загрузки',
  'panel.downloads.req_perm': 'Панель загрузок требует разрешения "Загрузки".',
  'panel.downloads.left': n => {
    const ms = n as number
    if (!ms || ms === -1) return 'Скоро...'
    if (ms < 60000) return `${Math.round(ms / 1000)} сек осталось`
    if (ms < 3600000) return `${Math.round(ms / 60000)} мин осталось`
    if (ms < 86400000) return `${Math.round(ms / 3600000)} ч осталось`
    return 'Когда-нибудь...'
  },
  'panel.downloads.bps': n => {
    const bps = n as number
    if (!n) return '? B/s'
    if (bps < 1024) return `${bps} B/s`
    if (bps < 1048576) return `${Math.round(bps / 1024)} KB/s`
    return `${Math.round(bps / 1048576)} MB/s`
  },

  // ---
  // -- Popups
  // -
  // - Bookmarks
  'popup.bookmarks.name_label': 'Название',
  'popup.bookmarks.location_label': 'Расположение',
  'popup.bookmarks.location_new_folder_placeholder': 'Название новой папки',
  'popup.bookmarks.recent_locations_label': 'Недавние расположения',
  'popup.bookmarks.save_in_bookmarks': 'Сохранить в закладки',
  'popup.bookmarks.edit_bookmark': 'Редактировать закладку',
  'popup.bookmarks.edit_folder': 'Редактировать папку',
  'popup.bookmarks.select_root_folder': 'Выберите корневую папку',
  'popup.bookmarks.create_bookmark': 'Создать закладку',
  'popup.bookmarks.create_folder': 'Создать папку',
  'popup.bookmarks.move_to': 'Переместить в',
  'popup.bookmarks.move': 'Переместить',
  'popup.bookmarks.create_bookmarks': 'Создать закладки',
  'popup.bookmarks.restore': 'Восстановить из папки закладок',
  'popup.bookmarks.convert_title': 'Конвертировать в закладки',
  'popup.bookmarks.convert': 'Конвертировать',
  // - Tabs panel removing
  'popup.tabs_panel_removing.title': 'Удаление панели',
  'popup.tabs_panel_removing.attach': 'Присоединить вкладки к соседней панели',
  'popup.tabs_panel_removing.leave': 'Оставить вкладки',
  'popup.tabs_panel_removing.save': 'Сохранить панель в закладки и закрыть вкладки',
  'popup.tabs_panel_removing.close': 'Закрыть вкладки',
  'popup.tabs_panel_removing.other_win_note':
    'Вкладки этой панели в других окнах будут перемещены на соседнюю панель или оставлены',
  // - Container fast-config popup
  'panel.fast_conf.title': 'Контейнер',
  // - Containers config
  'container.name_placeholder': 'Название...',
  'container.icon_label': 'Иконка',
  'container.color_label': 'Цвет',
  'container.proxy_label': 'Прокси',
  'container.proxy_host_placeholder': 'хост',
  'container.proxy_port_placeholder': 'порт',
  'container.proxy_username_placeholder': 'пользователь',
  'container.proxy_password_placeholder': 'пароль',
  'container.proxy_dns_label': 'проксировать DNS',
  'container.proxy_http': 'http',
  'container.proxy_https': 'tls',
  'container.proxy_socks4': 'socks4',
  'container.proxy_socks': 'socks5',
  'container.proxy_direct': 'выкл',
  'container.rules_include': 'Включать вкладки',
  'container.rules_include_tooltip':
    'Переоткрывать вкладки с совпадающими url в этом контейнере.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
  'container.rules_exclude': 'Исключать вкладки',
  'container.rules_exclude_tooltip':
    'Переоткрывать вкладки с совпадающими url из этого контейнера в стандартном.\nПострочный список правил "substrings" или "/regex/":\n    example.com\n    /^(some)?regex$/\n    ...',
  'container.user_agent': 'User Agent',
  'container.new_container_name': 'Контейнер',
  // - Panel config popup (sidebar)
  'panel.fast_conf.title_tabs': 'Панель вкладок',
  'panel.fast_conf.title_bookmarks': 'Панель закладок',
  'panel.fast_conf.name': 'Имя',
  'panel.fast_conf.icon': 'Иконка',
  'panel.fast_conf.color': 'Цвет',
  'panel.fast_conf.btn_more': 'Больше опций...',
  // - Panels config
  'panel.name_placeholder': 'Название...',
  'panel.icon_label': 'Иконка',
  'panel.color_label': 'Цвет',
  'panel.lock_panel_label': 'Запретить автоматическое переключение с этой панели',
  'panel.temp_mode_label':
    'Переключаться на последнюю активную панель вкладок, если курсор мыши убран',
  'panel.skip_on_switching': 'Пропускать эту панель при переключении панелей',
  'panel.no_empty_label': 'Создавать новую вкладку после закрытия последней',
  'panel.new_tab_ctx': 'Контейнер новой вкладки',
  'panel.drop_tab_ctx': 'Переоткрыть вкладку, переброшенную в эту панель, в контейнере:',
  'panel.move_tab_ctx': 'Перемещать вкладки выбранного контейнера в эту панель',
  'panel.move_tab_ctx_nochild': 'За исключением дочерних вкладок',
  'panel.ctr_tooltip_none': 'Не задан',
  'panel.ctr_tooltip_default': 'Без контейнера',
  'panel.url_rules': 'Перемещать вкладки с совпадающими адресами в эту панель',
  'panel.auto_convert': 'При открытии закладки преобразовать в исходную панель вкладок',
  'panel.custom_icon_note':
    'Base64, url или символы. Синтакс для символов: "символы::CSS-цвет::CSS-шрифт"',
  'panel.custom_icon': 'Пользовательская иконка',
  'panel.custom_icon_load': 'Загрузить',
  'panel.custom_icon_placeholder': 'A::#000000ff::700 32px Roboto',
  'panel.url_label': 'URL',
  'panel.root_id_label': 'Корневая папка',
  'panel.root_id.choose': 'Выбрать папку',
  'panel.root_id.reset': 'Сбросить',
  'panel.bookmarks_view_mode': 'Тип отображения',
  'panel.bookmarks_view_mode_tree': 'древовидная структура',
  'panel.bookmarks_view_mode_history': 'хронологический список',
  'panel.new_tab_custom_btns': 'Дополнительные кнопки для создания новой вкладки',
  'panel.new_tab_custom_btns_placeholder': 'Имя контейнера и/или URL',
  'panel.new_tab_custom_btns_note':
    'Список настроек для кнопок новой вкладки. Пример:\n  Персональный  (Открыть вкладку в контейнере "Персональный")\n  https://example.com  (Открыть вкладку с данным URL)\n  Персональный, https://example.com  (Открыть вкладку с данным URL в контейнере "Персональный")',

  // ---
  // -- Drag and Drop tooltips
  // -
  'dnd.tooltip.bookmarks_panel': 'Панель закладок',
  'dnd.tooltip.tabs_panel': 'панель',
  'dnd.tooltip.tabs': (n = 0) => {
    if (NUM_1_RE.test(n.toString())) return 'вкладка'
    if (NUM_234_RE.test(n.toString())) return 'вкладки'
    return 'вкладок'
  },
  'dnd.tooltip.bookmarks': (n = 0) => {
    if (NUM_1_RE.test(n.toString())) return 'закладка'
    if (NUM_234_RE.test(n.toString())) return 'закладки'
    return 'закладок'
  },

  // ---
  // -- Context menu
  // -
  // - Toolbar button (browserAction)
  'menu.browserAction.open_settings': 'Открыть настройки',
  'menu.browserAction.create_snapshot': 'Создать снепшот',
  // - New tab bar
  'menu.new_tab_bar.no_container': 'Не в контейнере',
  'menu.new_tab_bar.new_container': 'В новом контейнере',
  'menu.new_tab_bar.manage_containers': 'Управление контейнерами',
  // - Bookmark
  'menu.bookmark.open_in_sub_menu_name': 'Открыть в',
  'menu.bookmark.open_in_new_window': 'Открыть в новом стандартном окне',
  'menu.bookmark.open_in_new_priv_window': 'Открыть в новом приватном окне',
  'menu.bookmark.open_in_new_panel': 'Открыть в новой панели вкладок',
  'menu.bookmark.open_in_panel_': 'Открыть в панели...',
  'menu.bookmark.open_in_ctr_': 'Открыть в контейнере...',
  'menu.bookmark.open_in_default_ctr': 'Открыть в стандартном контейнере',
  'menu.bookmark.open_in_': 'Открыть в ',
  'menu.bookmark.create_bookmark': 'Создать закладку',
  'menu.bookmark.create_folder': 'Создать папку',
  'menu.bookmark.create_separator': 'Создать разделитель',
  'menu.bookmark.edit_bookmark': 'Редактировать',
  'menu.bookmark.delete_bookmark': 'Удалить',
  'menu.bookmark.sort_sub_menu_name': 'Сортировать',
  'menu.bookmark.sort_by_name': 'Сортировать по названию',
  'menu.bookmark.sort_by_name_asc': 'Сортировать по названию (А-я)',
  'menu.bookmark.sort_by_name_des': 'Сортировать по названию (я-А)',
  'menu.bookmark.sort_by_link': 'Сортировать по адресу',
  'menu.bookmark.sort_by_link_asc': 'Сортировать по адресу (А-я)',
  'menu.bookmark.sort_by_link_des': 'Сортировать по адресу (я-А)',
  'menu.bookmark.sort_by_time': 'Сортировать по времени создания',
  'menu.bookmark.sort_by_time_asc': 'Сортировать по времени (Старые-Новые)',
  'menu.bookmark.sort_by_time_des': 'Сортировать по времени (Новые-Старые)',
  'menu.bookmark.open_as_bookmarks_panel': 'Открыть как панель закладок',
  'menu.bookmark.open_as_tabs_panel': 'Открыть как панель вкладок',
  'menu.bookmark.move_to': 'Переместить в...',
  // - Bookmarks panel
  'menu.bookmark.collapse_all': 'Свернуть все папки',
  'menu.bookmark.switch_view': 'Режим отображения',
  'menu.bookmark.switch_view_history': 'Хронологическое отображение',
  'menu.bookmark.switch_view_tree': 'Древовидное отображение',
  'menu.bookmark.convert_to_tabs_panel': 'Конвертировать в панель вкладок',
  'menu.bookmark.remove_panel': 'Удалить панель',
  // - Tab
  'menu.tab.undo': 'Восстановить закрытую вкладку',
  'menu.tab.move_to_sub_menu_name': 'Переместить в',
  'menu.tab.move_to_new_window': 'Переместить в новое окно',
  'menu.tab.move_to_new_priv_window': 'Переместить в приватное окно',
  'menu.tab.move_to_another_window': 'Переместить в другое окно',
  'menu.tab.move_to_window_': 'Переместить в окно...',
  'menu.tab.move_to_panel_label': 'Переместить в панель...',
  'menu.tab.move_to_panel_': 'Переместить в ',
  'menu.tab.move_to_new_panel': 'Переместить в новую панель',
  'menu.tab.reopen_in_new_window': 'Переоткрыть в новом окне другого типа',
  'menu.tab.reopen_in_new_norm_window': 'Переоткрыть в новом стандартном окне',
  'menu.tab.reopen_in_new_priv_window': 'Переоткрыть в новом приватном окне',
  'menu.tab.reopen_in_norm_window': 'Переоткрыть в стандартном окне',
  'menu.tab.reopen_in_priv_window': 'Переоткрыть в приватном окне',
  'menu.tab.reopen_in_default_panel': 'Переоткрыть в стандартном контейнере',
  'menu.tab.reopen_in_new_container': 'Переоткрыть в новом контейнере',
  'menu.tab.reopen_in_window': 'Переоткрыть в окне другого типа',
  'menu.tab.reopen_in_sub_menu_name': 'Переоткрыть в',
  'menu.tab.reopen_in_ctr_': 'Переоткрыть в контейнере...',
  'menu.tab.reopen_in_': 'Переоткрыть в ',
  'menu.tab.reopen_in_window_': 'Переоткрыть в окне...',
  'menu.tab.group': 'Сгруппировать',
  'menu.tab.flatten': 'Сбросить вложенность',
  'menu.tab.pin': 'Закрепить',
  'menu.tab.unpin': 'Открепить',
  'menu.tab.mute': 'Выключить звук',
  'menu.tab.unmute': 'Включить звук',
  'menu.tab.clear_cookies': 'Удалить cookies',
  'menu.tab.discard': 'Выгрузить',
  'menu.tab.bookmark': 'В закладки',
  'menu.tab.bookmarks': 'В закладки',
  'menu.tab.reload': 'Перезагрузить',
  'menu.tab.duplicate': 'Дублировать',
  'menu.tab.close': 'Закрыть',
  'menu.tab.close_descendants': 'Закрыть потомки',
  'menu.tab.close_above': 'Закрыть вкладки сверху',
  'menu.tab.close_below': 'Закрыть вкладки снизу',
  'menu.tab.close_other': 'Закрыть другие вкладки',
  // - Tabs panel
  'menu.tabs_panel.mute_all_audible': 'Выключить звук',
  'menu.tabs_panel.dedup': 'Закрыть дубликаты',
  'menu.tabs_panel.reload': 'Перезагрузить вкладки',
  'menu.tabs_panel.discard': 'Выгрузить вкладки',
  'menu.tabs_panel.close': 'Закрыть вкладки',
  'menu.tabs_panel.collapse_inact_branches': 'Свернуть неактивные ветки',
  'menu.tabs_panel.remove_panel': 'Удалить панель',
  'menu.tabs_panel.bookmark': 'Сохранить в закладки',
  'menu.tabs_panel.restore_from_bookmarks': 'Восстановить из закладок',
  'menu.tabs_panel.convert_to_bookmarks_panel': 'Конвертировать в панель закладок',
  // - History
  'menu.history.open': 'Открыть',
  // - Downloads
  'menu.download.open_file': 'Открыть файл',
  'menu.download.open_page': 'Открыть страницу-источник',
  'menu.download.open_dir': 'Открыть папку',
  'menu.download.copy_full_path': 'Копировать полный путь файла',
  'menu.download.copy_ref': 'Копировать адрес страницы источника',
  'menu.download.copy_url': 'Копировать адрес скачивания',
  'menu.download.remove': 'Удалить загрузку',
  'menu.download.pause_all_active': 'Приостановить все активные',
  'menu.download.resume_all_paused': 'Продолжить все приостановленные',
  // - Common
  'menu.copy_urls': n => (n === 1 ? 'Копировать адрес' : 'Копировать адреса'),
  'menu.copy_titles': n => (n === 1 ? 'Копировать заголовок' : 'Копировать заголовки'),
  'menu.common.pin_panel': 'Закрепить панель',
  'menu.common.unpin_panel': 'Открепить панель',
  'menu.common.conf': 'Настройки панели',
  'menu.common.conf_tooltip': 'Настройки панели\nAlt: Базовые настройки панели',
  'menu.panels.unload': 'Выгрузить',
  // - Menu Editor
  'menu.editor.reset': 'Сброс',
  'menu.editor.create_separator': 'Создать разделитель',
  'menu.editor.create_sub_tooltip': 'Создать подменю',
  'menu.editor.up_tooltip': 'Вверх',
  'menu.editor.down_tooltip': 'Вниз',
  'menu.editor.disable_tooltip': 'Отключить',
  'menu.editor.tabs_title': 'Вкладки',
  'menu.editor.tabs_panel_title': 'Панель вкладок',
  'menu.editor.bookmarks_title': 'Закладки',
  'menu.editor.bookmarks_panel_title': 'Панель закладок',
  'menu.editor.inline_group_title': 'Название подменю...',
  'menu.editor.list_title': 'Список',
  'menu.editor.disabled_title': 'Отключено',

  // ---
  // -- Navigation bar
  // -
  'nav.show_hidden_tooltip': 'Показать скрытые панели',
  'nav.btn_settings': 'Настройки',
  'nav.btn_add_tp': 'Создать панель вкладок',
  'nav.btn_search': 'Поиск',
  'nav.btn_create_snapshot': 'Создать снепшот',
  'nav.btn_remute_audio_tabs': 'Приглушить/Включить вкладки со звуком',

  // ---
  // -- Notifications
  // -
  'notif.hide_tooltip': 'Скрыть уведомление',
  'notif.undo_ctrl': 'Восстановить',
  'notif.tabs_rm_post': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return ' вкладка закрыта'
    if (NUM_234_RE.test(n.toString())) return ' вкладки закрыты'
    return ' вкладок закрыто'
  },
  'notif.bookmarks_rm_post': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return ' закладка удалена'
    if (NUM_234_RE.test(n.toString())) return ' закладки удалены'
    return ' закладок удалено'
  },
  'notif.bookmarks_sort': 'Сортировка закладок...',
  'notif.snapshot_created': 'Снепшот создан',
  'notif.view_snapshot': 'Посмотреть',
  'notif.tabs_err': 'Обнаружено неправильное положение вкладок',
  'notif.tabs_err_fix': 'Обновить вкладки',
  'notif.tabs_reloading': 'Перезагрузка вкладок',
  'notif.tabs_reloading_stop': 'Остановить',
  'notif.tabs_panel_saving_bookmarks': 'Сохранение в закладки...',
  'notif.tabs_panel_saved_bookmarks': 'панель сохранена в',
  'notif.tabs_panel_updated_bookmarks': 'закладки обновлены в',
  'notif.download_in': 'В:',
  'notif.download_from': 'Из:',
  'notif.download_err': 'Ошибка:',
  'notif.download_retry': 'Перезагрузить',
  'notif.download_retry_failed': 'Невозможно перезагрузить',
  'notif.download_open_file': 'Открыть файл',
  'notif.download_open_dir': 'Открыть папку',
  'notif.converting': 'Конвертация...',
  'notif.tabs_panel_to_bookmarks_err': 'Невозможно сохранить панель вкладок в закладки',
  'notif.tabs_panel_to_bookmarks_err.folder': 'Невозможно создать папку для панели',
  'notif.tabs_panel_to_bookmarks_err.bookmarks': 'Невозможно создать закладки',
  'notif.restore_from_bookmarks_err': 'Невозможно восстановить панель из закладок',
  'notif.restore_from_bookmarks_err.root': 'Корневая папка не найдена',
  'notif.restore_from_bookmarks_ok': 'Панель вкладок восстановлена',
  'notif.done': 'Готово',
  'notif.new_bookmark': 'Новая закладка добавлена',

  // ---
  // -- Settings
  // -
  'settings.opt_true': 'вкл',
  'settings.opt_false': 'выкл',

  'settings.nav_settings': 'Настройки',
  'settings.nav_settings_general': 'Основные',
  'settings.nav_settings_menu': 'Меню',
  'settings.nav_settings_nav': 'Навигация',
  'settings.nav_settings_controlbar': 'Панель управления',
  'settings.nav_settings_group': 'Групповая страница',
  'settings.nav_settings_containers': 'Контейнеры',
  'settings.nav_settings_panels': 'Панели',
  'settings.nav_settings_dnd': 'Перетаскивание',
  'settings.nav_settings_search': 'Поиск',
  'settings.nav_settings_tabs': 'Вкладки',
  'settings.nav_settings_new_tab_position': 'Позиция новых вкладок',
  'settings.nav_settings_pinned_tabs': 'Закрепленные вкладки',
  'settings.nav_settings_tabs_tree': 'Дерево вкладок',
  'settings.nav_settings_bookmarks': 'Закладки',
  'settings.nav_settings_downloads': 'Загрузки',
  'settings.nav_settings_history': 'История',
  'settings.nav_settings_appearance': 'Вид',
  'settings.nav_settings_snapshots': 'Снепшоты',
  'settings.nav_settings_mouse': 'Мышь',
  'settings.nav_settings_keybindings': 'Клавиши',
  'settings.nav_settings_permissions': 'Разрешения',
  'settings.nav_settings_storage': 'Данные',
  'settings.nav_settings_sync': 'Синхронизация',
  'settings.nav_settings_help': 'Помощь',

  'settings.nav_menu_editor': 'Редактор меню',
  'settings.nav_menu_editor_tabs': 'Вкладки',
  'settings.nav_menu_editor_tabs_panel': 'Панель вкладок',
  'settings.nav_menu_editor_bookmarks': 'Закладки',
  'settings.nav_menu_editor_bookmarks_panel': 'Панель закладок',

  'settings.nav_styles_editor': 'Редактор стилей',
  'settings.nav_snapshots': 'Снепшоты',

  'settings.ctrl_update': 'ОБНОВИТЬ',
  'settings.ctrl_copy': 'СКОПИРОВАТЬ',
  'settings.ctrl_close': 'ЗАКРЫТЬ',

  // --- General
  'settings.general_title': 'Основные',
  'settings.native_scrollbars': 'Использовать системные скроллбары',
  'settings.native_scrollbars_thin': 'Использовать узкие скроллбары',
  'settings.sel_win_screenshots': 'Показывать скриншоты в меню выбора окна',
  'settings.update_sidebar_title':
    'Использовать имя активной панели в качестве заголовка боковой панели',
  'settings.mark_window':
    'Добавлять префикс к заголовку окна, если боковая панель Sidebery активна',
  'settings.mark_window_preface': 'Значение префикса',
  'settings.storage_btn': 'Данные Sidebery:',

  // --- Context menu
  'settings.ctx_menu_title': 'Контекстное меню',
  'settings.ctx_menu_native': 'Использовать системное контекстное меню',
  'settings.ctx_menu_render_inact': 'Отображать неактивные элементы',
  'settings.ctx_menu_render_icons': 'Отображать иконки',
  'settings.ctx_menu_ignore_ctr': 'Не отображать контейнеры',
  'settings.ctx_menu_ignore_ctr_or': 'пример: /^tmp.+/, Google, Facebook',
  'settings.ctx_menu_ignore_ctr_note': 'Список названий или /regexp/ через запятую',
  'settings.ctx_menu_editor': 'Редактировать меню',

  // --- Navigation bar
  'settings.nav_title': 'Навигация',
  'settings.nav_bar_layout': 'Расположение',
  'settings.nav_bar_layout_horizontal': 'горизонтальное',
  'settings.nav_bar_layout_vertical': 'вертикальное',
  'settings.nav_bar_layout_hidden': 'скрытое',
  'settings.nav_bar_inline': 'В одну строку',
  'settings.nav_bar_side': 'Сторона',
  'settings.nav_bar_side_left': 'левая',
  'settings.nav_bar_side_right': 'правая',
  'settings.nav_btn_count': 'Показывать количество вкладок/закладок',
  'settings.hide_empty_panels': 'Скрывать пустые панели вкладок',
  'settings.nav_act_tabs_panel_left_click': 'Клик левой кнопкой мыши по активной панели вкладок',
  'settings.nav_act_tabs_panel_left_click_new_tab': 'создать вкладку',
  'settings.nav_act_tabs_panel_left_click_none': 'ничего',
  'settings.nav_act_bookmarks_panel_left_click':
    'Клик левой кнопкой мыши по активной панели закладок',
  'settings.nav_act_bookmarks_panel_left_click_scroll': 'проскроллить к началу/концу',
  'settings.nav_act_bookmarks_panel_left_click_none': 'ничего',
  'settings.nav_tabs_panel_mid_click': 'Клик средней кнопкой мыши по панели вкладок',
  'settings.nav_tabs_panel_mid_click_rm_act_tab': 'закрыть активную вкладку',
  'settings.nav_tabs_panel_mid_click_rm_all': 'закрыть вкладки',
  'settings.nav_tabs_panel_mid_click_discard': 'выгрузить вкладки',
  'settings.nav_tabs_panel_mid_click_bookmark': 'сохранить панель в закладки',
  'settings.nav_tabs_panel_mid_click_convert': 'конвертировать в панель закладок',
  'settings.nav_tabs_panel_mid_click_none': 'ничего',
  'settings.nav_bookmarks_panel_mid_click': 'Клик средней кнопкой мыши по панели закладок',
  'settings.nav_bookmarks_panel_mid_click_convert': 'конвертировать во вкладки',
  'settings.nav_bookmarks_panel_mid_click_none': 'ничего',
  'settings.nav_switch_panels_wheel':
    'Переключать панели с помощью колеса мыши над панелью навигации',

  'settings.nav_bar_enabled': 'Активированные элементы',
  'settings.nav_bar.no_elements': 'Нет элементов',
  'settings.nav_bar.available_elements': 'Доступные элементы',
  'settings.nav_bar_btn_tabs_panel': 'Панель вкладок',
  'settings.nav_bar_btn_bookmarks_panel': 'Панель закладок',
  'settings.nav_bar_btn_history': 'История',
  'settings.nav_bar_btn_downloads': 'Загрузки',
  'settings.nav_bar_btn_sp': 'Пространство',
  'settings.nav_bar_btn_sd': 'Разделитель',
  'settings.nav_bar_btn_settings': 'Настройки',
  'settings.nav_bar_btn_add_tp': 'Создать панель вкладок',
  'settings.nav_bar_btn_search': 'Поиск',
  'settings.nav_bar_btn_create_snapshot': 'Создать снепшот',
  'settings.nav_bar_btn_remute_audio_tabs': 'Приглушить/Включить вкладки со звуком',
  'settings.nav_rm_tabs_panel_confirm_pre': 'Удалить панель "',
  'settings.nav_rm_tabs_panel_confirm_post':
    '"?\n Все вкладки этой панели будут присоединены к соседней панели.',
  'settings.nav_rm_bookmarks_panel_confirm_pre': 'Удалить панель "',
  'settings.nav_rm_bookmarks_panel_confirm_post': '"?',

  // --- Group page
  'settings.group_title': 'Групповая страница',
  'settings.group_layout': 'Отображение',
  'settings.group_layout_grid': 'сетка',
  'settings.group_layout_list': 'список',

  // --- Containers
  'settings.containers_title': 'Контейнеры',
  'settings.contianer_remove_confirm_prefix': 'Вы действительно хотите удалить контейнер "',
  'settings.contianer_remove_confirm_postfix': '"?',
  'settings.containers_create_btn': 'Создать контейнер',

  // --- Drag and drop
  'settings.dnd_title': 'Перетаскивание',
  'settings.dnd_tab_act': 'Активировать вкладку при наведении',
  'settings.dnd_tab_act_delay': 'С задержкой (мс)',
  'settings.dnd_mod': 'При нажатии на',
  'settings.dnd_mod_alt': 'alt',
  'settings.dnd_mod_shift': 'shift',
  'settings.dnd_mod_ctrl': 'ctrl',
  'settings.dnd_mod_none': 'выкл',
  'settings.dnd_exp': 'Развернуть/свернуть ветвь при наведении на',
  'settings.dnd_exp_pointer': 'треугольник указателя',
  'settings.dnd_exp_hover': 'вкладку/закладку',
  'settings.dnd_exp_none': 'выкл',
  'settings.dnd_exp_delay': 'С задержкой (мс)',

  // --- Search
  'settings.search_title': 'Поиск',
  'settings.search_bar_mode': 'Режим панели',
  'settings.search_bar_mode_static': 'активный',
  'settings.search_bar_mode_dynamic': 'динамический',
  'settings.search_bar_mode_none': 'скрытый',

  // --- Tabs
  'settings.tabs_title': 'Вкладки',
  'settings.warn_on_multi_tab_close': 'Предупреждать при закрытии нескольких вкладок',
  'settings.warn_on_multi_tab_close_any': 'любых',
  'settings.warn_on_multi_tab_close_collapsed': 'свернутых',
  'settings.warn_on_multi_tab_close_none': 'нет',
  'settings.activate_on_mouseup': 'Активировать вкладку при отпускании кнопки мыши',
  'settings.activate_last_tab_on_panel_switching':
    'Активировать последнюю активную вкладку при переключении панелей',
  'settings.skip_empty_panels': 'Пропускать пустые контейнеры при переключении',
  'settings.show_tab_rm_btn': 'Показывать кнопку закрытия вкладки при наведении курсора',
  'settings.hide_inactive_panel_tabs': 'Скрывать горизонтальные вкладки неактивных панелей',
  'settings.activate_after_closing': 'После закрытия текущей вкладки активировать',
  'settings.activate_after_closing_next': 'следующую',
  'settings.activate_after_closing_prev': 'предыдущую',
  'settings.activate_after_closing_prev_act': 'последнюю активную',
  'settings.activate_after_closing_none': 'выкл',
  'settings.activate_after_closing_prev_rule': 'Правило предыдущей вкладки',
  'settings.activate_after_closing_next_rule': 'Правило следующей вкладки',
  'settings.activate_after_closing_rule_tree': 'дерево',
  'settings.activate_after_closing_rule_visible': 'видимая',
  'settings.activate_after_closing_rule_any': 'любая',
  'settings.activate_after_closing_global': 'Глобально',
  'settings.activate_after_closing_no_folded': 'Игнорировать свернутые вкладки',
  'settings.activate_after_closing_no_discarded': 'Игнорировать выгруженные вкладки',
  'settings.shift_selection_from_active': 'Начинать выделение по shift+клику с активной вкладки',
  'settings.ask_new_bookmark_place': 'Спрашивать куда сохранить закладки',
  'settings.tabs_rm_undo_note': 'Показывать уведомление о закрытии нескольких вкладок',
  'settings.native_highlight':
    'Выделять стандартные вкладки (в верхней панели) вместе с вкладками в боковой панели',
  'settings.tabs_unread_mark': 'Показывать метку на непрочитанных вкладках',
  'settings.tabs_reload_limit': 'Ограничить количество одновременно перезагружаемых вкладок',
  'settings.tabs_reload_limit_notif': 'Показывать уведомление со статусом перезагрузки',
  'settings.tabs_panel_switch_act_move':
    'Переключать панель после перемещения активной вкладки на другую панель',
  'settings.show_new_tab_btns': 'Показывать кнопки создания новых вкладок',
  'settings.new_tab_bar_position': 'Положение',
  'settings.new_tab_bar_position_after_tabs': 'после вкладок',
  'settings.new_tab_bar_position_bottom': 'снизу',
  'settings.discard_inactive_panel_tabs_delay': 'Выгружать вкладки неактивных панелей c задержкой',
  'settings.discard_inactive_panel_tabs_delay_sec': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'секунда'
    if (NUM_234_RE.test(n.toString())) return 'секунды'
    return 'секунд'
  },
  'settings.discard_inactive_panel_tabs_delay_min': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'минута'
    if (NUM_234_RE.test(n.toString())) return 'минуты'
    return 'минут'
  },
  'settings.tabs_second_click_act_prev': 'Обратная активация при нажатии на активную вкладку ',

  // --- New tab position
  'settings.new_tab_position': 'Позиция новых вкладок',
  'settings.move_new_tab_pin': 'Открытые из закрепленных вкладок',
  'settings.move_new_tab_pin_start': 'начало панели',
  'settings.move_new_tab_pin_end': 'конец пенели',
  'settings.move_new_tab_pin_none': 'выкл',
  'settings.move_new_tab_parent': 'Открытые из другой вкладки',
  'settings.move_new_tab_parent_before': 'перед родительской',
  'settings.move_new_tab_parent_sibling': 'после родительской',
  'settings.move_new_tab_parent_first_child': 'первая дочерняя',
  'settings.move_new_tab_parent_last_child': 'последняя дочерняя',
  'settings.move_new_tab_parent_start': 'начало панели',
  'settings.move_new_tab_parent_end': 'конец пенели',
  'settings.move_new_tab_parent_default': 'по умолчанию',
  'settings.move_new_tab_parent_none': 'выкл',
  'settings.move_new_tab_parent_act_panel': 'Только если панель родительской вкладки активна',
  'settings.move_new_tab': 'Для остальных случаев',
  'settings.move_new_tab_start': 'начало панели',
  'settings.move_new_tab_end': 'конец пенели',
  'settings.move_new_tab_before': 'перед активной вкладкой',
  'settings.move_new_tab_after': 'после активной вкладкой',
  'settings.move_new_tab_first_child': 'первая дочерняя вкладка активной',
  'settings.move_new_tab_last_child': 'последняя дочерняя вкладка активной',
  'settings.move_new_tab_none': 'выкл',

  // --- Pinned tabs
  'settings.pinned_tabs_title': 'Закрепленные вкладки',
  'settings.pinned_tabs_position': 'Расположение закрепленных вкладок',
  'settings.pinned_tabs_position_top': 'вверху',
  'settings.pinned_tabs_position_left': 'слева',
  'settings.pinned_tabs_position_right': 'справа',
  'settings.pinned_tabs_position_bottom': 'внизу',
  'settings.pinned_tabs_position_panel': 'панель',
  'settings.pinned_tabs_list': 'Показывать заголовки закрепленных вкладок',
  'settings.pinned_auto_group':
    'Группировать вкладки, которые были открыты из закрепленной вкладки.',

  // --- Tabs tree
  'settings.tabs_tree_title': 'Древовидное отображение вкладок',
  'settings.tabs_tree_layout': 'Древовидное отображение вкладок',
  'settings.group_on_open_layout': 'Создать поддерево при открытии ссылки в новой вкладке',
  'settings.tabs_tree_limit': 'Максимальный уровень вложенности вкладок',
  'settings.tabs_tree_limit_1': '1',
  'settings.tabs_tree_limit_2': '2',
  'settings.tabs_tree_limit_3': '3',
  'settings.tabs_tree_limit_4': '4',
  'settings.tabs_tree_limit_5': '5',
  'settings.tabs_tree_limit_none': 'выкл',
  'settings.hide_folded_tabs': 'Скрывать свернутые вкладки',
  'settings.auto_fold_tabs': 'Автоматически сворачивать вкладки',
  'settings.auto_fold_tabs_except': 'Максимальное количество открытых веток',
  'settings.auto_fold_tabs_except_1': '1',
  'settings.auto_fold_tabs_except_2': '2',
  'settings.auto_fold_tabs_except_3': '3',
  'settings.auto_fold_tabs_except_4': '4',
  'settings.auto_fold_tabs_except_5': '5',
  'settings.auto_fold_tabs_except_none': 'выкл',
  'settings.auto_exp_tabs': 'Автоматически разворачивать вкладки',
  'settings.rm_child_tabs': 'Закрывать дочерние вкладки вместе с родительской',
  'settings.rm_child_tabs_all': 'все',
  'settings.rm_child_tabs_folded': 'свернутые',
  'settings.rm_child_tabs_none': 'выкл',
  'settings.tabs_child_count': 'Показывать количество потомков на свернутой вкладке',
  'settings.tabs_lvl_dots': 'Показывать отметки уровней вложенности',
  'settings.discard_folded': 'Выгружать свернутые вкладки',
  'settings.discard_folded_delay': 'Через',
  'settings.discard_folded_delay_sec': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'секунда'
    if (NUM_234_RE.test(n.toString())) return 'секунды'
    return 'секунд'
  },
  'settings.discard_folded_delay_min': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'минута'
    if (NUM_234_RE.test(n.toString())) return 'минуты'
    return 'минут'
  },
  'settings.tabs_tree_bookmarks': 'Сохранять древовидную структуру при создании закладок',
  'settings.tree_rm_outdent': 'После закрытия родительской вкладки понизить уровень',
  'settings.tree_rm_outdent_branch': 'всей ветви',
  'settings.tree_rm_outdent_first_child': 'первой дочерней вкладки',

  // --- Bookmarks
  'settings.bookmarks_title': 'Закладки',
  'settings.bookmarks_panel': 'Панель закладок',
  'settings.bookmarks_layout': 'Тип отображения',
  'settings.bookmarks_layout_tree': 'дерево',
  'settings.bookmarks_layout_history': 'история',
  'settings.warn_on_multi_bookmark_delete': 'Предупреждать об удалении нескольких закладкок',
  'settings.warn_on_multi_bookmark_delete_any': 'любых',
  'settings.warn_on_multi_bookmark_delete_collapsed': 'свернутых',
  'settings.warn_on_multi_bookmark_delete_none': 'нет',
  'settings.open_bookmark_new_tab': 'Открывать закладку в новой вкладке',
  'settings.mid_click_bookmark': 'При нажатии средней кнопки мыши',
  'settings.mid_click_bookmark_open_new_tab': 'открывать в новой вкладке',
  'settings.mid_click_bookmark_edit': 'редактировать',
  'settings.mid_click_bookmark_delete': 'удалять',
  'settings.act_mid_click_tab': 'Активировать вкладку',
  'settings.auto_close_bookmarks': 'Автоматически сворачивать папки',
  'settings.auto_rm_other': 'Удалять открытые закладки из папки "Другие закладки"',
  'settings.show_bookmark_len': 'Показывать размер папки',
  'settings.highlight_open_bookmarks': 'Отмечать открытые закладки',
  'settings.activate_open_bookmark_tab': 'Переходить на открытую вкладку вместо открытия новой',
  'settings.bookmarks_rm_undo_note': 'Показывать уведомление об удалении нескольких закладок',
  'settings.fetch_bookmarks_favs': 'Загрузить иконки',
  'settings.fetch_bookmarks_favs_stop': 'Остановить загрузку',
  'settings.fetch_bookmarks_favs_done': 'завершено',
  'settings.fetch_bookmarks_favs_errors': 'ошибок',
  'settings.load_bookmarks_on_demand': 'Инициализоровать сервис закладок только по необходимости',
  'settings.pin_opened_bookmarks_folder': 'Закреплять открытую папку при прокрутке',

  // --- Downloads
  'settings.downloads_title': 'Загрузки',
  'settings.load_downloads_on_demand': 'Инициализоровать сервис загрузок только по необходимости',
  'settings.show_notif_on_download_ok': 'Показать уведомление об успешной загрузке',
  'settings.show_notif_on_download_err': 'Показать уведомление о неудачной загрузке',

  // --- History
  'settings.history_title': 'История',
  'settings.load_history_on_demand': 'Инициализоровать сервис истории только по необходимости',

  // --- Appearance
  'settings.appearance_title': 'Вид',
  'settings.font_size': 'Размер шрифта',
  'settings.font_size_xxs': 'XXS',
  'settings.font_size_xs': 'XS',
  'settings.font_size_s': 'S',
  'settings.font_size_m': 'M',
  'settings.font_size_l': 'L',
  'settings.font_size_xl': 'XL',
  'settings.font_size_xxl': 'XXL',
  'settings.theme': 'Тема',
  'settings.theme_proton': 'proton',
  'settings.theme_plain': 'plain',
  'settings.theme_compact': 'compact',
  'settings.theme_none': 'нет',
  'settings.switch_color_scheme': 'Цветовая схема',
  'settings.color_scheme_dark': 'темная',
  'settings.color_scheme_light': 'светлая',
  'settings.color_scheme_sys': 'система',
  'settings.color_scheme_ff': 'firefox',
  'settings.bg_noise': 'Матовый задний фон',
  'settings.animations': 'Анимации',
  'settings.animation_speed': 'Скорость анимации',
  'settings.animation_speed_fast': 'быстрая',
  'settings.animation_speed_norm': 'средняя',
  'settings.animation_speed_slow': 'медленная',
  'settings.edit_styles': 'Редактировать стили',
  'settings.edit_theme': 'Редактировать тему',
  'settings.appearance_notes_title': 'Примечания:',
  'settings.appearance_notes':
    '- Чтобы применить цвет темы к кнопкам Sidebery в интерфейсе браузера, установите «svg.context-properties.content.enabled» в «true» на странице about:config.',

  // --- Snapshots
  'settings.snapshots_title': 'Снепшоты',
  'settings.snap_notify': 'Показать уведомление после создания снепшота',
  'settings.snap_exclude_private': 'Исключать приватные окна',
  'settings.snap_interval': 'Интервал авто-снепшотов',
  'settings.snap_interval_min': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'минута'
    if (NUM_234_RE.test(n.toString())) return 'минуты'
    return 'минут'
  },
  'settings.snap_interval_hr': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'час'
    if (NUM_234_RE.test(n.toString())) return 'часа'
    return 'часов'
  },
  'settings.snap_interval_day': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'день'
    if (NUM_234_RE.test(n.toString())) return 'дня'
    return 'дней'
  },
  'settings.snap_interval_none': 'выкл',
  'settings.snap_limit': 'Лимиты',
  'settings.snap_limit_snap': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'снепшот'
    if (NUM_234_RE.test(n.toString())) return 'снепшота'
    return 'снепшотов'
  },
  'settings.snap_limit_kb': (n = 0): string => {
    if (NUM_234_RE.test(n.toString())) return 'кбайта'
    return 'кбайт'
  },
  'settings.snap_limit_day': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'день'
    if (NUM_234_RE.test(n.toString())) return 'дня'
    return 'дней'
  },
  'settings.snapshots_view_label': 'Просмотреть снепшоты',
  'settings.make_snapshot': 'Создать снепшот',
  'settings.rm_all_snapshots': 'Удалить все снепшоты',
  'settings.apply_snapshot': 'применить',
  'settings.rm_snapshot': 'удалить',

  // --- Mouse
  'settings.mouse_title': 'Мышь',
  'settings.h_scroll_through_panels': 'Переключать панели с помощью горизонтальной прокрутки',
  'settings.scroll_through_tabs': 'Переключать вкладки с помощью колеса прокрутки',
  'settings.scroll_through_tabs_panel': 'на панели',
  'settings.scroll_through_tabs_global': 'глобально',
  'settings.scroll_through_tabs_none': 'выкл',
  'settings.scroll_through_visible_tabs': 'Пропускать свернутые',
  'settings.scroll_through_tabs_skip_discarded': 'Пропускать выгруженые',
  'settings.scroll_through_tabs_except_overflow':
    'За исключением случаев, когда панель переполнена',
  'settings.scroll_through_tabs_cyclic': 'Зациклить',
  'settings.long_click_delay': 'Задержка длительного нажатия (мс)',
  'settings.tab_double_click': 'Двойной клик по вкладке',
  'settings.tab_long_left_click': 'Длительное нажатие левой кнопки мыши по вкладке',
  'settings.tab_long_right_click': 'Длительное нажатие правой кнопки мыши по вкладке',
  'settings.tab_close_middle_click': 'Нажатие средней кнопкой мыши по кнопке закрытия вкладки',

  'settings.nav_actions_sub_title': 'Действия над навигацией',

  'settings.tab_actions_sub_title': 'Действия над вкладками',
  'settings.tab_action_reload': 'перезагрузить',
  'settings.tab_action_duplicate': 'дублировать',
  'settings.tab_action_pin': 'закрепить',
  'settings.tab_action_mute': 'выключить звук',
  'settings.tab_action_clear_cookies': 'удалить cookies',
  'settings.tab_action_exp': 'развернуть',
  'settings.tab_action_new_after': 'новая вкладка',
  'settings.tab_action_new_child': 'новая дочерняя вкладка',
  'settings.tab_action_close': 'закрыть вкладку',
  'settings.tab_action_discard': 'выгрузить',
  'settings.tab_action_none': 'выкл',

  'settings.tabs_panel_actions_sub_title': 'Действия над панелью c вкладками',
  'settings.tabs_panel_left_click_action': 'Левый клик по панели с вкладками',
  'settings.tabs_panel_double_click_action': 'Двойной клик по панели с вкладками',
  'settings.tabs_panel_right_click_action': 'Правый клик по панели с вкладками',
  'settings.tabs_panel_middle_click_action': 'Средний клик по панели с вкладками',
  'settings.tabs_panel_action_tab': 'создать вкладку',
  'settings.tabs_panel_action_prev': 'пред. панель',
  'settings.tabs_panel_action_next': 'след. панель',
  'settings.tabs_panel_action_expand': 'развернуть/свернуть',
  'settings.tabs_panel_action_parent': 'перейти к родительской вкладке',
  'settings.tabs_panel_action_menu': 'открыть меню',
  'settings.tabs_panel_action_collapse': 'свернуть неактивные ветки',
  'settings.tabs_panel_action_undo': 'восстановить закрытую вкладку',
  'settings.tabs_panel_action_rm_act_tab': 'закрыть активную вкладку',
  'settings.tabs_panel_action_none': 'выкл',

  // --- Keybindings
  'settings.kb_title': 'Клавиши',
  'settings.kb_input': 'Нажмете новое сочетание клавиш',
  'settings.kb_err_duplicate': 'Уже существует',
  'settings.kb_err_invalid': 'Недопустимое сочетание клавиш',
  'settings.reset_kb': 'Сбросить клав. настройки',
  'settings.toggle_kb': 'Включить / отключить сочетания клавиш',
  'settings.enable_kb': 'Включить сочетания клавиш',
  'settings.disable_kb': 'Отключить сочетания клавиш',

  // --- Permissions
  'settings.permissions_title': 'Разрешения',
  'settings.all_urls_label': 'Данные веб-сайтов:',
  'settings.all_urls_info':
    'Необходимо для:\n- Удаления cookies\n- Прокси и url-правил контейнеров\n- Скриншотов на групповой странице и на панели выбора окна',
  'settings.perm.bookmarks_label': 'Управление закладками:',
  'settings.perm.bookmarks_info': 'Required for:\n- Панели закладок',
  'settings.tab_hide_label': 'Скрытие вкладок:',
  'settings.tab_hide_info':
    'Необходимо для:\n- Скрывания вкладок неактивных панелей\n- Скрывания свернутых вкладок',
  'settings.clipboard_write_label': 'Запись в буфер обмена:',
  'settings.clipboard_write_info': 'Необходимо для:\n- Копирования ссылок вкладок/закладок',
  'settings.history_label': 'История:',
  'settings.history_info': 'Необходимо для:\n- Панель истории',
  'settings.downloads_label': 'Загрузки:',
  'settings.downloads_info': 'Необходимо для:\n- Панель загрузок',

  // --- Storage
  'settings.storage_title': 'Данные',
  'settings.storage_delete_prop': 'удалить',
  'settings.storage_edit_prop': 'редактировать',
  'settings.storage_open_prop': 'открыть',
  'settings.storage_delete_confirm': 'Удалить поле ',
  'settings.update_storage_info': 'Обновить',
  'settings.clear_storage_info': 'Удалить все',
  'settings.clear_storage_confirm': 'Вы действительно хотите удалить все данные?',
  'settings.favs_title': 'Кэшированные иконки сайтов',

  // --- Sync
  'settings.sync_title': 'Синхронизация',
  'settings.sync_name': 'Имя профиля для синхронизации',
  'settings.sync_name_or': 'напр. Firefox Домашний',
  'settings.sync_save_settings': 'Сохранять настройки в синхронизируемое хранилище',
  'settings.sync_save_ctx_menu': 'Сохранять контекстное меню в синхронизируемое хранилище',
  'settings.sync_save_styles': 'Сохранять стили в синхронизируемое хранилище',
  'settings.sync_auto_apply': 'Автоматически применять изменения',
  'settings.sync_settings_title': 'Настройки',
  'settings.sync_ctx_menu_title': 'Контекстное меню',
  'settings.sync_styles_title': 'Стили',
  'settings.sync_apply_btn': 'Применить',
  'settings.sync_delete_btn': 'Удалить',
  'settings.sync_update_btn': 'Обновить данные',
  'settings.sync_apply_confirm': 'Вы действительно хотите применить синхронизированные данные?',
  'settings.sync.apply_err': 'Невозможно применить синхронизированные данные',

  // --- Help
  'settings.help_title': 'Помощь',
  'settings.debug_info': 'Отладочная информация',
  'settings.log_lvl': 'Уровень логов',
  'settings.log_lvl_0': 'выкл',
  'settings.log_lvl_1': 'ошибки',
  'settings.log_lvl_2': 'предупреждения',
  'settings.log_lvl_3': 'все',
  'settings.copy_devtools_url': 'Скопировать URL страницы разработчика',
  'settings.repo_issue': 'Создать github issue',
  'settings.repo_bug': 'Сообщить об ошибке',
  'settings.repo_feature': 'Предложить новую функцию',
  'settings.reset_settings': 'Сбросить настройки',
  'settings.reset_confirm': 'Вы уверены, что хотите сбросить настройки?',
  'settings.ref_rm': 'Will be removed, open issue if you need this feature.',
  'settings.help_exp_data': 'Экспорт',
  'settings.help_imp_data': 'Импорт',
  'settings.help_imp_perm': 'Необходимы дополнительные разрешения',
  'settings.export_title': 'Выберете данные для экспорта',
  'settings.import_title': 'Выберете данные для импорта',
  'settings.backup_all': 'Все',
  'settings.backup_containers': 'Конфигурация контейнеры',
  'settings.backup_settings': 'Настройки',
  'settings.backup_styles': 'Стили',
  'settings.backup_snapshots': 'Снепшоты',
  'settings.backup_favicons': 'Кэш иконок сайтов',
  'settings.backup_kb': 'Сочетания клавиш',
  'settings.backup_parse_err': 'Неправильный формат импортированных данных',
  'settings.reload_addon': 'Перезагрузить расширение',

  // ---
  // -- Snapshots viewer
  // -
  'snapshot.window_title': 'Окно',
  'snapshot.btn_open': 'Открыть',
  'snapshot.btn_apply': 'Применить',
  'snapshot.btn_remove': 'Удалить',
  'snapshot.btn_create_snapshot': 'Создать снепшот',
  'snapshot.btn_open_all_win': 'Открыть все окна',
  'snapshot.btn_open_win': 'Открыть окно',
  'snapshot.btn_create_first': 'Создать первый снепшот',
  'snapshot.snap_win': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'окно'
    if (NUM_234_RE.test(n.toString())) return 'окна'
    return 'окон'
  },
  'snapshot.snap_ctr': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'контейнер'
    if (NUM_234_RE.test(n.toString())) return 'контейнера'
    return 'контейнеров'
  },
  'snapshot.snap_tab': (n = 0): string => {
    if (NUM_1_RE.test(n.toString())) return 'вкладка'
    if (NUM_234_RE.test(n.toString())) return 'вкладки'
    return 'вкладок'
  },
  'snapshot.selected': 'Выбрано:',
  'snapshot.sel.open_in_panel': 'Открыть в текущей панели',
  'snapshot.sel.reset_sel': 'Сбросить',

  // ---
  // -- Styles editor
  // -
  'styles.reset_styles': 'Сбросить CSS переменные',
  'styles.css_sidebar': 'Боковая панель',
  'styles.css_group': 'Групповая страница',
  'styles.css_placeholder': 'Write custom CSS here...',
  'styles.css_selectors_instruction': `NOTE: To get currently available css-selectors use debugger:
  - Click "Copy debtools URL" button in the bottom bar
  - Open new tab with that URL
  - Select frame to inspect
    - Click on the rectangular icon (with three sections) in top-right area of the debugger page
    - Select "/sidebar/index.html" for sidebar frame
    - Select "/page.group/group.html" for group page frame
  - Browse "Inspector" tab`,
  'styles.vars_group.other': 'Прочие',
  'styles.vars_group.animation': 'Скорость анимации',
  'styles.vars_group.buttons': 'Кнопки',
  'styles.vars_group.scroll': 'Скрол',
  'styles.vars_group.menu': 'Контекстное меню',
  'styles.vars_group.nav': 'Панель навигации',
  'styles.vars_group.pinned_dock': 'Область закрепленных вкладок',
  'styles.vars_group.tabs': 'Вкладки',
  'styles.vars_group.bookmarks': 'Закладки',

  // ---
  // -- Time
  // -
  'time.month_0': 'Январь',
  'time.month_1': 'Февраль',
  'time.month_2': 'Март',
  'time.month_3': 'Апрель',
  'time.month_4': 'Май',
  'time.month_5': 'Июнь',
  'time.month_6': 'Июль',
  'time.month_7': 'Август',
  'time.month_8': 'Сентябрь',
  'time.month_9': 'Октябрь',
  'time.month_10': 'Ноябрь',
  'time.month_11': 'Декабрь',
  'time.today': 'Сегодня',
  'time.yesterday': 'Вчера',
  'time.this_week': 'Эта неделя',
  'time.passed_short': ms => {
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

  // ---
  // -- Upgrade screen
  // -
  'upgrade.title': 'Обновление',
  'upgrade.btn.backup': 'Сохранить резервную копию данных',
  'upgrade.btn.continue': 'Продолжить',
  'upgrade.status.done': 'Готово',
  'upgrade.status.in_progress': 'В процессе',
  'upgrade.status.pending': 'Ожидание',
  'upgrade.status.err': 'Ошибка',
  'upgrade.status.no': 'Нет данных',
  'upgrade.initializing': 'Инициализация',
  'upgrade.settings': 'Настройки',
  'upgrade.panels_nav': 'Панели и навигация',
  'upgrade.ctx_menu': 'Контекстное меню',
  'upgrade.snapshots': 'Снепшоты',
  'upgrade.fav_cache': 'Кэш иконок',
  'upgrade.styles': 'Стили',
  'upgrade.err.get_stored': 'Невозможно получить данные старой версии',
}

export default dict
