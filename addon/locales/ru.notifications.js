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
}
