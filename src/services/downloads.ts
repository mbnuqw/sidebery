import { DownloadItem } from 'src/types'
import * as DownloadsHandlers from 'src/services/downloads.handlers'
import * as DownloadsActions from 'src/services/downloads.actions'

export interface DownloadsState {
  list: DownloadItem[]
  filtered?: DownloadItem[]
  byId: Record<ID, DownloadItem>
}

export const STORED_LIMIT = 640

export const Downloads = {
  reactive: { list: [], byId: {} } as DownloadsState,
  listening: false,

  ...DownloadsHandlers,
  ...DownloadsActions,
}
