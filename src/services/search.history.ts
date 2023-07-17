import { History } from 'src/services/history'
import { Sidebar } from 'src/services/sidebar'
import { Search } from 'src/services/search'
import { Selection } from 'src/services/selection'

export async function onHistorySearch(noSel?: boolean): Promise<void> {
  History.reactive.ready = History.ready = false

  if (Search.reactive.value) {
    let first
    try {
      const result = await browser.history.search({
        text: Search.reactive.value,
        maxResults: 100,
        startTime: 0,
      })
      const norm = await History.normalizeHistory(result, true)
      History.reactive.filtered = norm
      first = History.reactive.filtered[0]
    } catch (err) {
      History.reactive.filtered = undefined
    }

    if (first && !noSel) {
      Selection.resetSelection()
      Selection.selectHistory(first.id)
      History.scrollToHistoryItem(first.id)
    }
  } else {
    History.reactive.filtered = undefined
    if (Search.prevValue) Selection.resetSelection()
  }

  History.reactive.ready = History.ready = true
}

export function onHistorySearchNext(): void {
  if (!History.ready || !History.reactive.filtered) return

  const selId = Selection.getFirst()
  let index = History.reactive.filtered.findIndex(t => t.id === selId)

  index += 1
  if (index < 0 || index >= History.reactive.filtered.length) return

  Selection.resetSelection()
  const item = History.reactive.filtered[index]
  if (item) {
    Selection.selectHistory(item.id)
    History.scrollToHistoryItem(item.id)
  }
}

export function onHistorySearchPrev(): void {
  if (!History.ready || !History.reactive.filtered) return

  const selId = Selection.getFirst()
  let index = History.reactive.filtered.findIndex(t => t.id === selId)

  index -= 1
  if (index < 0 || index >= History.reactive.filtered.length) return

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
