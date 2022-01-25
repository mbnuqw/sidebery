export interface DownloadItem extends browser.downloads.DownloadItem {
  uid: ID
  dirPath?: string
  dirName?: string
  name?: string
  ext?: string
  srcDomain?: string
  startMS?: number
  leftMS?: number
  endMS?: number
  bytesPerSecond?: number
  // View only
  fileSizeStr?: string
  endTimeStr?: string
  iconImg?: string
  iconSvg?: string
  sel?: boolean
}

export interface StoredDownloadItem {
  uid: ID
  url: string
  ref: string | null
  path: string
  size: number
  start: number
  state: browser.downloads.State
}
