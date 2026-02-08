import { SidebarConfig } from './sidebar'
import { Container } from './containers'
import * as E from 'src/enums'

export interface Snapshot {
  id: ID
  time: number
  containers: Record<ID, Container> | E.SnapStoreMode.Unchanged
  sidebar: SidebarConfig | E.SnapStoreMode.Unchanged
  tabs: (SnapTab | E.SnapStoreMode.Unchanged)[][][]
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
  folded: boolean
  private: boolean
}

export interface SnapPanelState {
  id: ID
  tabs: SnapTabState[]
  name: string
  iconSVG: string
  iconIMG?: string
  color?: string
  folded: boolean
}

export interface SnapTab {
  url: string
  title: string
  panelId: ID
  lvl?: number
  pinned?: boolean
  folded?: boolean
  containerId?: string
  customTitle?: string
  customColor?: string
  priv?: boolean
}
export interface SnapTabState extends SnapTab {
  ref: SnapTab
  id?: ID
  parentId?: ID
  containerIcon?: string
  containerColor?: string
  domain?: string
  iconSVG?: string
  sel?: boolean
  folded: boolean
  isParent: boolean
  invisible: boolean
  branchLen: number
}

export interface SnapExportTypes {
  JSON?: boolean
  Markdown?: boolean
}

export interface SnapExportInfo {
  id: ID
  time: number
  containers: Record<ID, Container>
  sidebar: SidebarConfig
  tabs: SnapTab[][][]
  jsonFile?: Blob
  md?: string
  mdFile?: Blob
}
