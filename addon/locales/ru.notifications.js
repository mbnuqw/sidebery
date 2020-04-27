export default {
  'notif.hide_ctrl': { message: 'Скрыть' },
  'notif.undo_ctrl': { message: 'Восстановить' },
  'notif.tabs_rm_post': { message: ' вкладок было закрыто' },
  'notif.bookmarks_rm_post': {
    message: [' закладка была удалена', ' закладки было удалено', ' закладок было удалено'],
    plur: [/^(1|(\d*?)[^1]1)$/, /^([234]|(\d*?)[^1][234])$/],
  },
  'notif.bookmarks_sort': { message: 'Сортировка закладок...' },
  'notif.snapshot_created': { message: 'Снепшот создан' },
  'notif.view_snapshot': { message: 'Посмотреть' },
  'notif.tabs_err': { message: 'Обнаружено неправильное положение вкладок' },
  'notif.tabs_err_fix': { message: 'Обновить вкладки' },
  'notif.tabs_reloading': { message: 'Перезагрузка вкладок' },
  'notif.tabs_reloading_stop': { message: 'Остановить' },
}
