import { BgTab, Tab } from './tabs'

export interface Window extends browser.windows.Window {
  id: ID
  tabs?: Tab[]
}

export interface BgWindow extends browser.windows.Window {
  id: ID
  tabs: BgTab[]
  activeTabId: ID
  activePanelId: ID
}

export interface WindowChooseOption {
  id: ID
  title: string
  screen: string
  choose: () => void
  loaded?: boolean
  sel?: boolean
}

export interface WindowChoosingDetails {
  title?: string
  filter?: (window: Window) => boolean
  otherWindows?: boolean
}
