import { SidebarConfig, OldPanelConfig } from './sidebar'
import { Container } from './containers'

export const enum SnapStoreMode {
  Unchanged = -1,
}

export interface Snapshot {
  id: ID
  time: number
  containers: Record<ID, Container> | SnapStoreMode.Unchanged
  sidebar: SidebarConfig | SnapStoreMode.Unchanged
  tabs: (SnapTab | SnapStoreMode.Unchanged)[][][]
}
export interface NormalizedSnapshot extends Snapshot {
  containers: Record<ID, Container>
  sidebar: SidebarConfig
  tabs: SnapTab[][][]
}
export interface SnapshotState extends NormalizedSnapshot {
  windows: SnapWindowState[]
  dateStr: string
  timeStr: string
  sizeStr: string
  winCount: number
  tabsCount: number
}

export interface SnapWindowState {
  id: ID
  panels: SnapPanelState[]
  tabsLen: number
}

export interface SnapPanelState {
  id: ID
  tabs: SnapTabState[]
  name: string
  iconSVG: string
  iconIMG?: string
  color?: string
}

export interface SnapTab {
  url: string
  title: string
  panelId: ID
  lvl?: number
  pinned?: boolean
  containerId?: string
  customTitle?: string
  customColor?: string
}
export interface SnapTabState extends SnapTab {
  id?: ID
  parentId?: ID
  containerIcon?: string
  containerColor?: string
  domain?: string
  iconSVG?: string
  sel?: boolean
}

export const enum RemovingSnapshotResult {
  Ok = 1,
  Err = -1,
}

// OLD STUFF //

export interface Snapshot_v4 {
  id?: ID
  time?: number
  containersById?: Record<ID, SnapContainerV4>
  panels?: OldPanelConfig[]
  windows?: Record<ID, SnapWinV4>
}

interface SnapContainerV4 {
  id?: string
  color?: browser.ColorName
  icon?: string
  name?: string
}

interface SnapWinV4 {
  items?: SnapTabV4[]
}

interface SnapTabV4 {
  id?: ID
  url?: string
  title?: string
  panel?: ID
  lvl?: number
  ctr?: string
  pinned?: boolean
}
