import { History } from 'src/services/history'
import { Sidebar } from 'src/services/sidebar'
import { Search } from 'src/services/search'
import { Selection } from 'src/services/selection'

export async function onHistorySearch(): Promise<void> {
  const panel = Sidebar.panelsById.history
  if (!panel) return
  else panel.reactive.ready = panel.ready = false

  if (Search.reactive.value) {
    try {
      const result = await browser.history.search({
        text: Search.reactive.value,
        maxResults: 100,
        startTime: 0,
      })
      History.reactive.filtered = await History.normalizeHistory(result, false)
    } catch (err) {
      History.reactive.filtered = undefined
    }
  } else {
    History.reactive.filtered = undefined
  }

  panel.reactive.ready = panel.ready = true
}

export function onHistorySearchNext(): void {
  const panel = Sidebar.panelsById.history
  if (!panel || !panel.ready || !History.reactive.filtered) return

  const selId = Selection.getFirst()
  let index = History.reactive.filtered.findIndex(t => t.id === selId)

  index += 1
  if (index < 0 || index >= History.reactive.filtered.length) index = 0

  Selection.resetSelection()
  const item = History.reactive.filtered[index]
  if (item) {
    Selection.selectHistory(item.id)
    History.scrollToHistoryItem(item.id)
  }
}

export function onHistorySearchPrev(): void {
  const panel = Sidebar.panelsById.history
  if (!panel || !panel.ready || !History.reactive.filtered) return

  const selId = Selection.getFirst()
  let index = History.reactive.filtered.findIndex(t => t.id === selId)

  index -= 1
  if (index < 0 || index >= History.reactive.filtered.length) {
    index = History.reactive.filtered.length - 1
  }

  Selection.resetSelection()
  const item = History.reactive.filtered[index]
  if (item) {
    Selection.selectHistory(item.id)
    History.scrollToHistoryItem(item.id)
  }
}

export function onHistorySearchEnter(): void {
  const panel = Sidebar.panelsById.history
  if (!panel || !panel.ready || !History.reactive.filtered) return

  const selId = Selection.getFirst()
  const item = History.reactive.filtered.find(t => t.id === selId)
  if (item) History.openTab(item)

  Search.stop()
}
