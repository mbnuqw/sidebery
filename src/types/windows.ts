import { Tab } from './tabs'

export interface Window extends browser.windows.Window {
  tabs?: Tab[]
  sidebarPort?: browser.runtime.Port
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
