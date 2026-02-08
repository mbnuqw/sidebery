import * as History from 'src/services/history.fg'
import * as Sidebar from 'src/services/sidebar.fg'
import * as Search from 'src/services/search.fg'
import * as Selection from 'src/services/selection.fg'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import { Visit } from 'src/types'

export async function onHistorySearch(): Promise<void> {
  if (Search.active && !Search.prevQuery) saveScrollPositions()

  History.setReadyState(false)
  History.setAllLoadedState(false)
  History.reactive.loading = true

  await Utils.sleep(250)

  if (Search.active) {
    let first
    try {
      const result = await browser.history.search({
        text: Search.query,
        maxResults: 100,
        startTime: 0,
      })
      const norm = await History.normalizeHistory(result, false, undefined, undefined, true)
      History.setFiltered(norm)
      first = Utils.findFrom(norm, 0, v => !v.noTitle)
    } catch (err) {
      History.clearFiltered()
    }

    History.reactive.days = History.recalcDays()

    if (first) {
      if (Search.reactive.barIsFocused) {
        Selection.resetSelection()
      }
      History.scrollToHistoryItemDebounced(120, first.id)
    }
  } else {
    History.clearFiltered()
    History.reactive.days = History.recalcDays()
    restoreScrollPositions()
    if (Search.prevQuery) Selection.resetSelection()
  }

  History.setReadyState(true)
  History.reactive.loading = false
}

function saveScrollPositions() {
  if (History.subPanelScrollEl) {
    const spId = `${Sidebar.activePanelId}history`
    Sidebar.scrollPositions[spId] = History.subPanelScrollEl.scrollTop
  }
  if (History.panelScrollEl) {
    Sidebar.scrollPositions['history'] = History.panelScrollEl.scrollTop
  }
}

function restoreScrollPositions() {
  setTimeout(() => {
    if (History.subPanelScrollEl) {
      const spId = `${Sidebar.activePanelId}history`
      History.subPanelScrollEl.scrollTop = Sidebar.scrollPositions[spId] ?? 0
    }
    if (History.panelScrollEl) {
      History.panelScrollEl.scrollTop = Sidebar.scrollPositions['history'] ?? 0
    }
  }, 8)
}

export function onHistorySearchNext(): void {
  if (!History.ready || !History.filtered || History.loadingMore) return

  const selId = Selection.getFirst()
  let index = History.filtered.findIndex(t => t.id === selId)

  index += 1
  if (index === History.filtered.length) {
    if (!History.allLoaded) History.loadMore()
    return
  }
  if (index < 0 || index >= History.filtered.length) return

  let visit: Visit | undefined = History.filtered[index]
  if (visit?.noTitle) visit = Utils.findFrom(History.filtered, index + 1, v => !v.noTitle)
  if (visit) {
    Selection.resetSelection()

    if (visit.hiddenUnderParentId) {
      const parentVisit = History.byId[visit.hiddenUnderParentId]
      if (parentVisit && !parentVisit.reactive.moreActive) {
        parentVisit.reactive.moreActive = true
        visit.hiddenUnderParentId = undefined
      }
    }

    Selection.selectHistory(visit.id)
    History.scrollToHistoryItem(visit.id)
  }
}

export function onHistorySearchPrev(): void {
  if (!History.ready || !History.filtered || History.loadingMore) return

  const selId = Selection.getFirst()
  let index = History.filtered.findIndex(t => t.id === selId)

  index -= 1
  if (index < 0 || index >= History.filtered.length) return

  let visit: Visit | undefined = History.filtered[index]
  if (visit?.noTitle) visit = Utils.findLastFrom(History.filtered, index - 1, v => !v.noTitle)
  if (visit) {
    Selection.resetSelection()

    if (visit.hiddenUnderParentId) {
      const parentVisit = History.byId[visit.hiddenUnderParentId]
      if (parentVisit && !parentVisit.reactive.moreActive) {
        parentVisit.reactive.moreActive = true
        visit.hiddenUnderParentId = undefined
      }
    }

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
