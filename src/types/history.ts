export type NativeHistoryItem = browser.history.HistoryItem
export type NativeVisit = browser.history.VisitItem

export interface Visit {
  id: string
  dayId: string
  url: string
  decodedUrl: string
  domain: string
  title: string
  noTitle: boolean
  time: number
  timeStr: string
  tooltip: string

  reactive: {
    title: string
    tooltip: string
    sel: boolean
    moreVisits?: ID[]
  }
}

export interface HistoryDay {
  id: string
  title: string
  visits: ID[]
}
