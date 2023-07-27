import { History } from 'src/services/history'
import { Sidebar } from 'src/services/sidebar'
import { Search } from 'src/services/search'
import { Selection } from 'src/services/selection'
import * as Logs from 'src/services/logs'

export async function onHistorySearch(noSel?: boolean): Promise<void> {
  History.reactive.ready = History.ready = false
  History.reactive.days = []

  if (Search.reactive.value) {
    let first
    try {
      const result = await browser.history.search({
        text: Search.reactive.value,
        maxResults: 100,
        startTime: 0,
      })
      const norm = await History.normalizeHistory(result, false, undefined, undefined, true)
      History.filtered = norm
      first = History.filtered[0]
    } catch (err) {
      History.filtered = undefined
    }

    History.reactive.days = History.recalcDays()

    if (first && !noSel) {
      Selection.resetSelection()
      Selection.selectHistory(first.id)
      History.scrollToHistoryItemDebounced(120, first.id)
    }
  } else {
    History.filtered = undefined
    History.reactive.days = History.recalcDays()
    if (Search.prevValue) Selection.resetSelection()
  }

  History.reactive.ready = History.ready = true
}

export function onHistorySearchNext(): void {
  if (!History.ready || !History.filtered) return

  const selId = Selection.getFirst()
  let index = History.filtered.findIndex(t => t.id === selId)

  index += 1
  if (index < 0 || index >= History.filtered.length) return

  Selection.resetSelection()
  const visit = History.filtered[index]
  if (visit) {
    Selection.selectHistory(visit.id)
    History.scrollToHistoryItem(visit.id)
  }
}

export function onHistorySearchPrev(): void {
  if (!History.ready || !History.filtered) return

  const selId = Selection.getFirst()
  let index = History.filtered.findIndex(t => t.id === selId)

  index -= 1
  if (index < 0 || index >= History.filtered.length) return

  Selection.resetSelection()
  const visit = History.filtered[index]
  if (visit) {
    Selection.selectHistory(visit.id)
    History.scrollToHistoryItem(visit.id)
  }
}

export function onHistorySearchEnter(): void {
  const panel = Sidebar.panelsById.history
  if (!panel || !panel.ready || !History.filtered) return

  const selId = Selection.getFirst()
  const visit = History.filtered.find(t => t.id === selId)
  if (visit) History.open(visit, { panelId: Sidebar.getRecentTabsPanelId() }, false, true)

  Search.stop()
}
