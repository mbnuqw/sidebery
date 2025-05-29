import { History } from 'src/services/history'
import { Sidebar } from 'src/services/sidebar'
import { Search } from 'src/services/search'
import * as Selection from 'src/services/selection'
import { Utils, Logs } from './_services'
import { Visit } from 'src/types'

export async function onHistorySearch(noSel?: boolean): Promise<void> {
  History.ready = false
  History.allLoaded = false
  History.reactive.loading = true

  await Utils.sleep(250)

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
      first = Utils.findFrom(History.filtered, 0, v => !v.noTitle)
    } catch (err) {
      History.filtered = undefined
    }

    History.reactive.days = History.recalcDays()

    if (first && !noSel) {
      if (Search.reactive.barIsFocused) {
        Selection.resetSelection()
      }
      History.scrollToHistoryItemDebounced(120, first.id)
    }
  } else {
    History.filtered = undefined
    History.reactive.days = History.recalcDays()
    if (Search.prevValue) Selection.resetSelection()
  }

  History.ready = true
  History.reactive.loading = false
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
