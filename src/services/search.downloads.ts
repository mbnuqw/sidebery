import { Search } from 'src/services/search'
import { DownloadItem } from 'src/types'
import { Downloads } from './downloads'
import { Selection } from './selection'

export function onDownloadsSearch(): void {
  if (Search.reactive.value) {
    const filtered: DownloadItem[] = []

    for (const item of Downloads.reactive.list) {
      if (
        Search.check(item.filename) ||
        Search.check(item.url) ||
        (item.referrer && Search.check(item.referrer))
      ) {
        filtered.push(item)
        continue
      }
    }

    Downloads.reactive.filtered = filtered

    if (Downloads.reactive.filtered.length) {
      const first = Downloads.reactive.filtered[0]
      const id = first.id > -1 ? first.id : first.uid
      if (id) {
        Selection.resetSelection()
        Selection.selectDownload(id)
      }
    }
  } else {
    Downloads.reactive.filtered = undefined
    if (Search.prevValue) Selection.resetSelection()
  }
}

export function onDownloadsSearchNext(): void {
  if (!Downloads.reactive.filtered) return

  const selId = Selection.getFirst()
  let index = Downloads.reactive.filtered.findIndex(t => t.uid === selId || t.id === selId)

  index += 1
  if (index < 0 || index >= Downloads.reactive.filtered.length) index = 0

  Selection.resetSelection()
  const item = Downloads.reactive.filtered[index]
  if (item) {
    Selection.selectDownload(item.uid)
    Downloads.scrollToDownloadItem(item.uid)
  }
}

export function onDownloadsSearchPrev(): void {
  if (!Downloads.reactive.filtered) return

  const selId = Selection.getFirst()
  let index = Downloads.reactive.filtered.findIndex(t => t.uid === selId || t.id === selId)

  index -= 1
  if (index < 0 || index >= Downloads.reactive.filtered.length) {
    index = Downloads.reactive.filtered.length - 1
  }

  Selection.resetSelection()
  const item = Downloads.reactive.filtered[index]
  if (item) {
    Selection.selectDownload(item.uid)
    Downloads.scrollToDownloadItem(item.uid)
  }
}

export function onDownloadsSearchEnter(): void {
  if (!Downloads.reactive.filtered) return

  const selId = Selection.getFirst()
  const item = Downloads.reactive.filtered.find(t => t.uid === selId || t.id === selId)
  if (!item) return

  if (item.id > -1) browser.downloads.open(item.id)
  else Downloads.openRef(item)

  Search.stop()
}
