export interface HistoryItem extends browser.history.HistoryItem {
  favicon?: string
  tooltip?: string
  info?: string
  timeStr?: string
  sel?: boolean
  moreItems?: HistoryItem[]
}
