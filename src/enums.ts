export const enum InstanceType {
  unknown = -1,
  bg = 0,
  group = 1,
  sidebar = 2,
  setup = 3,
  search = 4,
  url = 5,
  proxy = 6,
  preview = 7,
  sync = 8,
  panelConfig = 9,
  editing = 10,
}

export const enum Err {
  TabsLocked = 1,
  Canceled = 2,
}

export const enum BkmType {
  Bookmark = 1,
  Folder = 2,
  Separator = 3,
}

export const enum DstTreePos {
  Start = 1,
  End = 2,
}

// ---
// -- Popups
// -
export const enum ConfirmationType {
  Unknown = 1,
  RmTab = 2,
}

// ---
// -- Drag and drop
// -
export const enum DragType {
  Nothing = 0,
  Tabs = 1,
  NewTab = 11,
  Bookmarks = 2,
  NavItem = 3,
  TabsPanel = 31,
  BookmarksPanel = 32,
  Native = 4,
  History = 5,
}

export const enum DropType {
  Nowhere = 0,
  Tabs = 1,
  Bookmarks = 2,
  NavItem = 3,
  TabsPanel = 31,
  BookmarksPanel = 32,
  SyncPanel = 33,
  BookmarksSubPanelBtn = 41,
  SyncSubPanelBtn = 42,
}

// ---
// -- Sidebar
// -
export const enum SubPanelType {
  Null = 0,
  RecentlyClosedTabs = 1,
  Bookmarks = 2,
  History = 3,
  Sync = 4,
}

export const enum TabsPanelRemovingMode {
  Attach = 1,
  SaveAndClose = 2,
  Close = 3,
}

export const enum TabsPanelSavingMode {
  Additive = 1,
  Exclusive = 2,
}

export const enum WheelDirection {
  Horizontal = 1,
  Vertical = 2,
}

// ---
// -- Sidebar nav bar
// -
export const enum PanelType {
  bookmarks = 1,
  tabs = 2,
  history = 4,
  sync = 5,
}

export const enum ButtonType {
  settings = 100,
  add_tp = 101,
  search = 103,
  hidden = 104,
  create_snapshot = 105,
  remute_audio_tabs = 106,
  collapse = 107,
}

export const enum SpaceType {
  dynamic = 200,
  static = 201,
}

export const enum NavItemClass {
  panel = 1,
  btn = 2,
  space = 3,
}

export const enum ItemBoundsType {
  Tab = 1,
  Bookmarks = 2,
  Header = 3,
}

// ---
// -- Selection
// -
export const enum SelectionType {
  Nothing = 0,
  Tabs = 1,
  Bookmarks = 2,
  History = 3,
  NewTabBar = 5,
  NavItem = 6,
  Header = 7,
}

// ---
// -- Context menu
// -
export const enum MenuType {
  Tabs = 1,
  Bookmarks = 2,
  History = 3,
  NewTab = 6,
  TabsPanel = 7,
  BookmarksPanel = 8,
  Panel = 9,
}

// ---
// -- Tabs
// -
export const enum TabStatus {
  Complete = 1,
  Loading = 2,
  Pending = 3,
}

export const enum MediaState {
  Muted = -1,
  Silent = 0,
  Audible = 1,
  Paused = 2,
}

export const enum LoadSrc {
  SessionOnly = 1,
}

export const enum GroupConfigResult {
  Ok = 1,
  Cancel = 2,
}

export const enum TabReopenRuleType {
  Include = 1,
  Exclude = 2,
}

// ---
// -- Snapshots
// -
export const enum SnapStoreMode {
  Unchanged = -1,
}

export const enum RemovingSnapshotResult {
  Ok = 1,
  Err = -1,
}

export const enum SnapOpenType {
  CurrentPanel = 1,
  NewWindow = 2,
  NewPrivateWindow = 3,
}

// ---
// -- Omnibox
// -
export const enum OmniCmdType {
  ReopenInContainer = 1,
  MoveToPanel = 2,
  SwitchToPanel = 3,
  MoveToGroup = 4,
}
