declare namespace browser {
  interface EventTarget<T> {
    addListener: (listener: T) => void
    removeListener: (listener: T) => void
    hasListener: (listener: T) => boolean
  }

  type KbModifiers = 'Shift' | 'Alt' | 'Command' | 'Ctrl' | 'MacCtrl'

  interface Manifest {
    version: string
  }

  interface ImageDetails {
    format?: 'jpeg' | 'png'
    quality?: number
    scale?: number
  }

  type ColorName =
    | 'blue'
    | 'turquoise'
    | 'green'
    | 'yellow'
    | 'orange'
    | 'red'
    | 'pink'
    | 'purple'
    | 'toolbar'

  /**
   * Runtime
   *
   * This module provides information about your extension and the environment
   * it's running in.
   *
   * It also provides messaging APIs enabling you to:
   * - Communicate between different parts of your extension. For advice on
   * choosing between the messaging options, see Choosing between one-off
   * messages and connection-based messaging.
   * - Communicate with other extensions.
   * - Communicate with native applications.
   */
  namespace runtime {
    type Error = {
      message: string
    }

    type Sender = {
      id?: string
    }

    type Port = {
      name: string
      disconnect: () => void
      error?: Error
      onDisconnect: EventTarget<DisconnectListener>
      onMessage: EventTarget<PortMessageListener>
      postMessage: <T>(msg: T) => void
      sender?: Sender
    }

    interface EventTarget<T> {
      addListener: <T>(listener: T) => void
      removeListener: <T>(listener: T) => void
    }

    type DisconnectListener = (port: Port) => void

    type PortMessageListener = <T>(msg: T) => void

    interface ConnectInfo {
      name?: string
      includeTlsChannelId?: boolean
    }

    type PlatformOs = 'mac' | 'win' | 'android' | 'linux' | 'openbsd' | 'cros'

    interface PlatformInfo {
      os: PlatformOs
      arch: 'arm' | 'x86-32' | 'x86-64'
    }

    interface BrowserInfo {
      name: string
      vendor: string
      version: string
      buildID: string
    }

    function sendMessage<T, R>(msg: T): Promise<R>
    function getURL(resource: string): string
    function openOptionsPage(): void
    function getManifest(): Manifest
    function getPlatformInfo(): Promise<PlatformInfo>
    function getBrowserInfo(): Promise<BrowserInfo>
    function connect(connectInfo: ConnectInfo): Port
    function reload(): void

    type MessageListener = <I, O>(msg: I) => Promise<O>
    type ConnectListener = (port: Port) => void

    const onMessage: EventTarget<MessageListener>
    const onConnect: EventTarget<ConnectListener>
  }

  /**
   * Windows
   *
   * Interact with browser windows. You can use this API to get information
   * about open windows and to open, modify, and close windows.
   * You can also listen for window open, close, and activate events.
   */
  namespace windows {
    type WindowType = 'normal' | 'popup' | 'panel' | 'devtools'

    type WindowState = 'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'docked'

    type CreateType = 'normal' | 'popup' | 'panel' | 'detached_panel'

    interface Window {
      alwaysOnTop: boolean
      focused: boolean
      height?: number
      id?: ID
      incognito: boolean
      left?: number
      sessionId?: string
      state?: WindowState
      tabs?: tabs.Tab[]
      title?: string
      top?: number
      type?: WindowType
      width?: number
    }

    const WINDOW_ID_NONE: number
    const WINDOW_ID_CURRENT: number

    interface GetInfo {
      populate?: boolean
      windowTypes?: WindowType[]
    }

    interface CreateData {
      allowScriptsToClose?: boolean
      cookieStoreId?: boolean
      focused?: boolean
      height?: number
      width?: number
      left?: number
      top?: number
      incognito?: boolean
      state?: WindowState
      tabId?: ID
      titlePreface?: string
      type?: CreateType
      url?: string | string[]
    }

    interface UpdateInfo {
      drawAttention?: boolean
      focused?: boolean
      height?: number
      width?: number
      left?: number
      top?: number
      state?: WindowState
      titlePreface?: string
    }

    function get(windowId: ID, getInfo: GetInfo): Promise<Window>
    function getCurrent(getInfo?: GetInfo): Promise<Window>
    function getLastFocused(getInfo: GetInfo): Promise<Window>
    function getAll(getInfo?: GetInfo): Promise<Window[]>
    function create(createData: CreateData): Promise<Window>
    function update(windowId: ID, updateInfo: UpdateInfo): Promise<Window>
    function remove(windowId: ID): Promise<void>

    type createdListener = (window: Window) => void
    type removedListener = (windowId: ID) => void
    type focusChangeListener = (windowId: ID) => void

    const onCreated: EventTarget<createdListener>
    const onRemoved: EventTarget<removedListener>
    const onFocusChanged: EventTarget<focusChangeListener>
  }

  /**
   * Tabs
   *
   * Interact with the browser's tab system.
   */
  namespace tabs {
    const TAB_ID_NONE = -1

    interface Tab {
      active: boolean
      attention?: boolean
      audible?: boolean
      autoDiscardable?: boolean
      cookieStoreId: string
      discarded?: boolean
      favIconUrl?: string
      hidden: boolean
      highlighted: boolean
      id: ID
      index: number
      incognito: boolean
      isArticle: boolean
      isInReaderMode: boolean
      lastAccessed: number
      mutedInfo?: MutedInfo
      openerTabId?: ID
      pinned: boolean
      sessionId?: string
      status?: string
      successorTabId?: ID
      title: string
      url: string
      windowId: ID
    }

    interface TabsQueryOptions {
      active?: boolean
      windowId?: ID
      currentWindow?: boolean
      url?: string
      highlighted?: boolean
    }

    interface CreateProperties {
      active?: boolean
      cookieStoreId?: string
      discarded?: boolean
      index?: number
      openerTabId?: ID
      openInReaderMode?: boolean
      pinned?: boolean
      title?: string
      url?: string
      windowId?: ID
    }

    interface UpdateProperties {
      active?: boolean
      autoDiscardable?: boolean
      highlighted?: boolean
      loadReplace?: boolean
      muted?: boolean
      openerTabId?: ID
      pinned?: boolean
      successorTabId?: ID
      url?: string
    }

    interface MoveProps {
      index: number
      windowId?: ID
    }

    interface ReloadProps {
      bypassCache?: boolean
    }

    interface HighlightInfo {
      windowId?: ID
      populate?: boolean
      tabs: number[]
    }

    type SavePDFResult = 'saved' | 'replaced' | 'canceled' | 'not_saved' | 'not_replaced'

    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/PageSettings
    interface PageSettings {
      edgeBottom?: number
      edgeLeft?: number
      edgeRight?: number
      edgeTop?: number
      footerCenter?: string
      footerLeft?: string
      footerRight?: string
      headerCenter?: string
      headerLeft?: string
      headerRight?: string
      marginBottom?: number
      marginLeft?: number
      marginRight?: number
      marginTop?: number
      orientation?: number
      paperHeight?: number
      paperSizeUnit?: number
      paperWidth?: number
      scaling?: number
      showBackgroundColors?: boolean
      showBackgroundImages?: boolean
      shrinkToFit?: boolean
      toFileName?: string
    }

    interface DuplOpts {
      index?: number
      active?: boolean
    }

    interface ExecuteOpts {
      allFrames?: boolean
      code?: string
      file?: string
      frameId?: number
      matchAboutBlank?: boolean
      runAt?: 'document_start' | 'document_end' | 'document_idle'
    }

    function create(createProperties: CreateProperties): Promise<Tab>
    function query(options: TabsQueryOptions): Promise<Tab[]>
    function remove(tabIds: ID | ID[]): Promise<void>
    function update(tabId: ID, props: UpdateProperties): Promise<Tab>
    function update(props: UpdateProperties): Promise<Tab>
    function captureTab(tabId: ID, imageDetails: ImageDetails): Promise<string>
    function moveInSuccession(tabIds: ID[], tabId?: ID): Promise<void>
    type Moved<T> = T extends ID[] ? Tab[] : T extends ID ? Tab : never
    function move<T extends ID[] | ID>(tabIds: T, moveProps: MoveProps): Promise<Moved<T>>
    function sendMessage(tabId: ID, msg: any): Promise<any>
    function get(tabId: ID): Promise<Tab>
    function reload(tabId: ID, reloadProps?: ReloadProps): Promise<void>
    function discard(tabIds: ID | ID[]): Promise<void>
    function show(tabIds: ID | ID[]): Promise<void>
    function hide(tabIds: ID | ID[]): Promise<void>
    function highlight(highlightInfo: HighlightInfo): Promise<windows.Window>
    function getCurrent(): Promise<Tab>
    function saveAsPDF(pageSettings: PageSettings): Promise<SavePDFResult>
    function duplicate(tabId: ID, opts?: DuplOpts): Promise<Tab>
    function executeScript(tabId: ID, opts: ExecuteOpts): Promise<any[]>

    interface RemoveInfo {
      windowId: ID
      isWindowClosing: boolean
    }

    interface MutedInfo {
      muted: boolean
      extensionId?: string
      reason?: 'capture' | 'extension' | 'user'
    }

    interface ChangeInfo {
      attention?: boolean
      audible?: boolean
      discarded?: boolean
      favIconUrl?: string
      hidden?: boolean
      isArticle?: boolean
      mutedInfo?: MutedInfo
      pinned?: boolean
      status?: string
      title?: string
      url?: string
    }

    type UpdateProp =
      | 'attention'
      | 'audible'
      | 'discarded'
      | 'favIconUrl'
      | 'hidden'
      | 'isArticle'
      | 'mutedInfo'
      | 'pinned'
      | 'sharingState'
      | 'status'
      | 'title'
      | 'url'

    interface ExtraParameters {
      urls?: string[]
      properties?: UpdateProp[]
      tabId?: number
      windowId?: number
    }

    interface UpdateEventTarget<T> {
      addListener: (listener: T, extraParameters?: ExtraParameters) => void
      removeListener: (listener: T) => void
      hasListener: (listener: T) => boolean
    }

    interface ActiveInfo {
      previousTabId: ID
      tabId: ID
      windowId: ID
    }

    interface MoveInfo {
      windowId: ID
      fromIndex: number
      toIndex: number
    }

    interface AttachInfo {
      newWindowId: ID
      newPosition: number
    }

    interface DetachInfo {
      oldWindowId: ID
      oldPosition: number
    }

    type CreatedListener = (tab: Tab) => void
    type RemovedListener = (tabId: ID, removeInfo: RemoveInfo) => void
    type UpdatedListener = (tabId: ID, change: ChangeInfo, tab: Tab) => void
    type ActivatedListener = (info: ActiveInfo) => void
    type MovedListener = (tabId: ID, info: MoveInfo) => void
    type AttachedListener = (tabId: ID, info: AttachInfo) => void
    type DetachListener = (tabId: ID, info: DetachInfo) => void

    const onCreated: EventTarget<CreatedListener>
    const onRemoved: EventTarget<RemovedListener>
    const onUpdated: UpdateEventTarget<UpdatedListener>
    const onActivated: EventTarget<ActivatedListener>
    const onMoved: EventTarget<MovedListener>
    const onAttached: EventTarget<AttachedListener>
    const onDetached: EventTarget<DetachListener>
  }

  /**
   * Sessions
   *
   * Use the sessions API to list, and restore, tabs and windows that have been
   * closed while the browser has been running.
   */
  namespace sessions {
    interface Session {
      lastModified: number
      tab?: tabs.Tab
      window?: windows.Window
    }

    interface Filter {
      maxResults?: number
    }

    function getRecentlyClosed(filter?: Filter): Promise<Session[]>
    function restore(sessionId: string): Promise<Session>
    function setWindowValue<T>(windowId: ID, key: string, value: T): Promise<void>
    function getWindowValue<T>(id: ID, key: string): Promise<T>
    function setTabValue<T>(tabId: ID, key: string, value: T): Promise<void>
    function getTabValue<T>(tabId: ID, key: string): Promise<T>
  }

  /**
   * Storage
   *
   * Enables extensions to store and retrieve data, and listen for changes to
   * stored items.
   */
  namespace storage {
    interface StorageArea {
      get<S>(props?: keyof S | (keyof S)[] | S | string): Promise<S>
      set<S>(props: { [key in keyof S]: S[key] }): Promise<void>
      remove<S>(props: keyof S | (keyof S)[]): Promise<void>
      clear(): Promise<void>
    }

    const local: StorageArea
    const sync: StorageArea

    interface StorageChange<T> {
      newValue: T
      oldValue: T
    }

    type AreaName = 'local' | 'sync'

    type ChangeListener = <T>(changes: T, areaName: AreaName) => void

    const onChanged: EventTarget<ChangeListener>
  }

  /**
   * Browser action button
   */
  namespace browserAction {
    type BrowserActionButton = 0 | 1

    interface PopupDetails {
      popup: string | null
      tabId?: ID
      windowId?: ID
    }

    function setPopup(details: PopupDetails): void
    function openPopup(): void

    interface OnClickData {
      modifiers: KbModifiers[]
      button: BrowserActionButton
    }
    type ClickListener = (tab: tabs.Tab, info: OnClickData) => void

    const onClicked: EventTarget<ClickListener>
  }

  /**
   * Sidebar
   */
  namespace sidebarAction {
    interface SetTitleDetails {
      title: string | null
      tabId?: ID
      windowId?: ID
    }

    function open(): void
    function close(): void
    function setTitle(details: SetTitleDetails): void
  }

  /**
   * Permissions
   */
  namespace permissions {
    interface Permissions {
      origins?: string[]
      permissions?: string[]
    }

    function contains(permissions: Permissions): Promise<boolean>
    function request(permissions: Permissions): Promise<boolean>
    function remove(permissions: Permissions): Promise<boolean>

    type PermissionsChangeListener = (permissions: Permissions) => void

    const onAdded: EventTarget<PermissionsChangeListener>
    const onRemoved: EventTarget<PermissionsChangeListener>
  }

  /**
   * Menus
   */
  namespace menus {
    // prettier-ignore
    type ContextType = 'all' | 'audio' | 'bookmark' | 'browser_action'
    | 'editable' | 'frame' | 'image' | 'link' | 'page' | 'page_action'
    | 'password' | 'selection' | 'tab' | 'tools_menu' | 'video'

    interface Images {
      '16'?: string
      '32'?: string
    }

    type ItemType = 'normal' | 'checkbox' | 'radio' | 'separator'

    type ViewType = 'tab' | 'popup' | 'sidebar'

    interface CreateProperties {
      checked?: boolean
      command?: string
      contexts?: ContextType[]
      documentUrlPatterns?: string[]
      enabled?: boolean
      icons?: Images
      id?: string
      onclick?: () => void
      parentId?: number | string
      targetUrlPatterns?: string[]
      title?: string
      type?: ItemType
      viewTypes?: ViewType[]
      visible?: boolean
    }

    type HiddenListener = () => void

    interface ContextOptions {
      showDefaults?: boolean
      context?: 'tab' | 'bookmark'
      bookmarkId?: ID
      tabId?: ID
    }

    function removeAll(): void
    function create(createProperties: CreateProperties): string
    function overrideContext(contextOptions: ContextOptions): void

    const onHidden: EventTarget<HiddenListener>
  }

  /**
   * Containers
   */
  namespace contextualIdentities {
    interface Container {
      cookieStoreId: string
      name: string
      icon: string
      color: ColorName
      colorCode: string
    }

    interface QueryDetails {
      name?: string
    }

    interface CreateDetails {
      name: string
      color: string
      icon: string
    }

    interface UpdateDetails {
      name?: string
      color?: string
      icon?: string
    }

    function query(details: QueryDetails): Promise<Container[]>
    function get(id: string): Promise<Container>
    function create(details: CreateDetails): Promise<Container>
    function update(id: string, details: UpdateDetails): Promise<Container>
    function remove(id: string): Promise<Container>

    interface ChangeInfo {
      contextualIdentity: Container
    }

    type ChangeListener = (changeInfo: ChangeInfo) => void

    const onCreated: EventTarget<ChangeListener>
    const onRemoved: EventTarget<ChangeListener>
    const onUpdated: EventTarget<ChangeListener>
  }

  /**
   * WebRequest
   */
  namespace webRequest {
    interface AuthCredentials {
      username: string
      password: string
    }

    interface BlockingResponse {
      authCredentials?: AuthCredentials
      cancel?: boolean
      redirectUrl?: string
      requestHeaders?: HttpHeader[]
      responseHeaders?: HttpHeader[]
      upgradeToSecure?: boolean
    }

    interface HttpHeader {
      name: string
      value?: string
      binaryValue?: number[]
    }

    interface RequestFilter {
      urls: string[]
      types?: ResourceType[]
      tabId?: ID
      windowId?: ID
      incognito?: boolean
    }

    type ResourceType =
      | 'beacon'
      | 'csp_report'
      | 'font'
      | 'image'
      | 'imageset'
      | 'main_frame'
      | 'media'
      | 'object'
      | 'object_subrequest'
      | 'ping'
      | 'script'
      | 'speculative'
      | 'stylesheet'
      | 'sub_frame'
      | 'web_manifest'
      | 'websocket'
      | 'xbl'
      | 'xml_dtd'
      | 'xmlhttprequest'
      | 'xslt'
      | 'other'

    type ExtraInfoSpec = 'blocking' | 'requestHeaders' | 'responseHeaders'

    interface EventTarget<T, E> {
      addListener: (listener: T, filter: webRequest.RequestFilter, extraInfoSpec?: E) => void
      removeListener: (listener: T) => void
      hasListener: (listener: T) => boolean
    }

    interface ReqDetails {
      cookieStoreId: string
      documentUrl: string
      /**
       * `integer` Zero if the request happens in the main frame;
       * a positive value is the ID of a subframe in which the request
       * happens. If the document of a (sub-)frame is loaded
       * (type is main_frame or sub_frame), frameId indicates the ID of
       * this frame, not the ID of the outer frame.
       * Frame IDs are unique within a tab.
       */
      frameId: number
      incognito: boolean
      method: string
      /**
       * `string` URL of the resource which triggered the request.
       * For example, if "https://example.com" contains a link, and
       * the user clicks link, then the originUrl for the resulting
       * request is "https://example.com".
       *
       * The originUrl is often but not always the same as the documentUrl.
       * For example, if a page contains an iframe, and the iframe contains
       * a link that loads a new document into the iframe, then the
       * documentUrl for the resulting request will be the iframe's parent
       * document, but the originUrl will be the URL of the document in
       * the iframe that contained the link.
       */
      originUrl: string
      /**
       * `integer`\
       * ID of the frame that contains the frame which sent the request. Set to -1 if no parent frame exists.
       */
      parentFrameId: number
      proxyInfo: proxy.ProxyInfo
      requestHeaders?: HttpHeader[]
      responseHeaders?: HttpHeader[]
      requestId: string
      tabId: ID
      thirdParty: boolean
      timeStamp: number
      type: ResourceType
      url: string
    }

    type Listener = (details: ReqDetails) => BlockingResponse | void

    const onBeforeSendHeaders: EventTarget<Listener, ExtraInfoSpec[]>
    const onHeadersReceived: EventTarget<Listener, ExtraInfoSpec[]>
  }

  /**
   * Proxy
   */
  namespace proxy {
    type ProxyType = 'direct' | 'http' | 'https' | 'socks4' | 'socks'

    interface ProxyInfo {
      type: ProxyType
      host?: string
      port?: string
      username?: string
      password?: string
      proxyDNS?: boolean
      failoverTimeout?: number
      proxyAuthorizationHeader?: string
      connectionIsolationKey?: string
    }

    interface RequestDetails {
      cookieStoreId: ID
      documentUrl: string
      frameId: number
      fromCache: boolean
      incognito: boolean
      method: string
      originUrl: string
      parentFrameId: number
      requestId: string
      requestHeaders?: webRequest.HttpHeader[]
      tabId: ID
      thirdParty: boolean
      timeStamp: number
      type: webRequest.ResourceType
      url: string
    }

    type ExtraInfoSpec = 'requestHeaders'
    type ProxyInfoResult = void | ProxyInfo | ProxyInfo[] | Promise<ProxyInfo | ProxyInfo[] | void>
    type Listener = (details: RequestDetails) => ProxyInfoResult

    const onRequest: webRequest.EventTarget<Listener, ExtraInfoSpec[]>
  }

  /**
   * i18n
   */
  namespace i18n {
    function getUILanguage(): string
    function getMessage(msgId: string): string
  }

  /**
   * Page action
   */
  namespace pageAction {
    interface SetTitleDetails {
      tabId: ID
      title: string | null
    }

    function setTitle(details: SetTitleDetails): void
    function show(tabId: ID): Promise<void>
    function hide(tabId: ID): Promise<void>
  }

  /**
   * Bookmarks
   */
  namespace bookmarks {
    type TreeNodeType = 'bookmark' | 'folder' | 'separator'
    interface TreeNode {
      id: ID
      index?: number
      children?: TreeNode[]
      dateAdded?: number
      dateGroupModified?: number
      parentId?: ID
      title: string
      type: TreeNodeType
      url?: string
    }

    interface CreateDetails {
      index?: number
      parentId?: ID
      title?: string
      type?: TreeNodeType
      url?: string
    }

    interface MoveDestination {
      parentId?: ID
      index?: number
    }

    interface UpdateChanges {
      title?: string
      url?: string
    }

    function create(details: CreateDetails): Promise<TreeNode>
    function get(ids: ID | ID[]): Promise<TreeNode[]>
    function getTree(): Promise<TreeNode[]>
    function move(id: ID, destination: MoveDestination): Promise<TreeNode>
    function remove(id: ID): Promise<void>
    function removeTree(folderId: ID): Promise<void>
    function update(id: ID, changes: UpdateChanges): Promise<void>

    interface MoveInfo {
      parentId: ID
      index: number
      oldParentId: ID
      oldIndex: number
    }

    interface RemoveInfo {
      parentId: ID
      index: number
      node: TreeNode
    }

    type CreateListener = (id: ID, bookmark: TreeNode) => void
    type ChangeListener = (id: ID, info: UpdateChanges) => void
    type MoveListener = (id: ID, info: MoveInfo) => void
    type RemoveListener = (id: ID, info: RemoveInfo) => void

    const onCreated: EventTarget<CreateListener>
    const onChanged: EventTarget<ChangeListener>
    const onMoved: EventTarget<MoveListener>
    const onRemoved: EventTarget<RemoveListener>
  }

  /**
   * Extension
   */
  namespace extension {
    const inIncognitoContext: boolean
  }

  /**
   * Commands
   */
  namespace commands {
    interface Command {
      name?: string
      description?: string
      shortcut?: string
    }

    interface UpdateDetails {
      name: string
      description?: string
      shortcut?: string
    }

    function getAll(): Promise<Command[]>
    function update(details: UpdateDetails): Promise<void>
    function reset(name: string): Promise<void>

    type CommandListener = (name: string) => void

    const onCommand: EventTarget<CommandListener>
  }

  /**
   * Cookies
   */
  namespace cookies {
    interface Cookie {
      domain: string
      expirationDate?: number
      firstPartyDomain: string
      hostOnly: boolean
      httpOnly: boolean
      name: string
      path: string
      secure: boolean
      session: boolean
      sameSite: SameSiteStatus
      storeId: string
      value: string
    }

    type SameSiteStatus = 'no_restriction' | 'lax' | 'strict'

    interface CookieStore {
      id: string
      incognito: boolean
      tabIds: ID[]
    }

    interface GetAllDetails {
      domain?: string
      firstPartyDomain?: string
      name?: string
      path?: string
      secure?: boolean
      session?: boolean
      storeId?: string
      url?: string
    }

    interface RemoveDetails {
      name: string
      url: string
      firstPartyDomain?: string
      storeId?: string
    }

    function getAll(details: GetAllDetails): Promise<Cookie[]>
    function remove(details: RemoveDetails): Promise<Cookie>
  }

  /**
   * Search
   */
  namespace search {
    interface SearchProps {
      query: string
      engine?: string
      tabId?: ID
    }

    function search(searchProps: SearchProps): void
  }

  /**
   * History
   */
  namespace history {
    interface HistoryItem {
      id: string
      url?: string
      title?: string
      lastVisitTime?: number
      visitCount?: number
      typedCount?: number
    }

    interface VisitItem {
      id: string
      visitId: string
      visitTime?: number
      referringVisitId: string
      transition: TransitionType
    }

    // prettier-ignore
    type TransitionType = 'link' | 'typed' | 'auto_bookmark' | 'auto_subframe' | 'manual_subframe'
      | 'generated' | 'auto_toplevel' | 'form_submit' | 'reload' | 'keyword' | 'keyword_generated'

    interface SearchQuery {
      text: string
      startTime?: number | string | Date
      endTime?: number | string | Date
      maxResults?: number
    }

    function search(query: SearchQuery): Promise<HistoryItem[]>
    function getVisits(details: { url: string }): Promise<VisitItem[]>

    interface RemoveDetails {
      allHistory: boolean
      urls: string[]
    }

    interface TitleChangeDetails {
      url: string
      title: string
    }

    type VisitedListener = (item: HistoryItem) => void
    type VisitRemovedListener = (info: RemoveDetails) => void
    type TitleChangedListener = (delta: TitleChangeDetails) => void

    const onVisited: EventTarget<VisitedListener>
    const onVisitRemoved: EventTarget<VisitRemovedListener>
    const onTitleChanged: EventTarget<TitleChangedListener>
  }

  /**
   * Downloads
   */
  namespace downloads {
    interface DownloadItem {
      id: number
      url: string
      filename: string
      fileSize: number
      state: State
      mime: string | null
      exists: boolean
      incognito: boolean
      paused: boolean
      referrer: string | null
      totalBytes: number
      bytesReceived: number
      startTime: string
      endTime: string | null
      estimatedEndTime?: string
      byExtensionId?: string
      byExtensionName?: string
      canResume: boolean
      danger: DangerType
      error?: InterruptReason
    }

    type DangerType =
      | 'file'
      | 'url'
      | 'content'
      | 'uncommon'
      | 'host'
      | 'unwanted'
      | 'safe'
      | 'accepted'

    type InterruptReason =
      // File-related errors:
      | 'FILE_FAILED'
      | 'FILE_ACCESS_DENIED'
      | 'FILE_NO_SPACE'
      | 'FILE_NAME_TOO_LONG'
      | 'FILE_TOO_LARGE'
      | 'FILE_VIRUS_INFECTED'
      | 'FILE_TRANSIENT_ERROR'
      | 'FILE_BLOCKED'
      | 'FILE_SECURITY_CHECK_FAILED'
      | 'FILE_TOO_SHORT'
      // Network-related errors:
      | 'NETWORK_FAILED'
      | 'NETWORK_TIMEOUT'
      | 'NETWORK_DISCONNECTED'
      | 'NETWORK_SERVER_DOWN'
      | 'NETWORK_INVALID_REQUEST'
      // Server-related errors:
      | 'SERVER_FAILED'
      | 'SERVER_NO_RANGE'
      | 'SERVER_BAD_CONTENT'
      | 'SERVER_UNAUTHORIZED'
      | 'SERVER_CERT_PROBLEM'
      | 'SERVER_FORBIDDEN'
      // User-related errors:
      | 'USER_CANCELED'
      | 'USER_SHUTDOWN'
      // Miscellaneous:
      | 'CRASH'
      | null

    type State = 'in_progress' | 'interrupted' | 'complete'

    interface DownloadQuery {
      query?: string[]
      startedBefore?: number | string | Date
      startedAfter?: number | string | Date
      endedBefore?: number | string | Date
      endedAfter?: number | string | Date
      totalBytesGreater?: number
      totalBytesLess?: number
      filenameRegex?: string
      urlRegex?: string
      limit?: number
      orderBy?: string[]
      id?: number
      url?: string
      filename?: string
      danger?: DangerType
      mime?: string
      startTime?: string
      endTime?: string
      state?: State
      paused?: boolean
      error?: InterruptReason
      bytesReceived?: number
      totalBytes?: number
      fileSize?: number
      exists?: boolean
    }

    type FilenameConflictAction = 'uniquify' | 'overwrite' | 'prompt'

    interface DownloadOptions {
      allowHttpErrors?: boolean
      body?: string
      conflictAction?: FilenameConflictAction
      filename?: string
      headers?: { name: string; value: string }[]
      incognito?: boolean
      method?: 'POST' | 'GET'
      saveAs?: boolean
      url?: string
    }

    function search(query: DownloadQuery): Promise<DownloadItem[]>
    function pause(id: number): Promise<void>
    function resume(id: number): Promise<void>
    function cancel(id: number): Promise<void>
    function getFileIcon(id: number, options?: { size: number }): Promise<string>
    function open(id: number): Promise<void>
    function show(id: number): Promise<boolean>
    function erase(query: DownloadQuery): Promise<number[]>
    function removeFile(id: number): Promise<void>
    function showDefaultFolder(): void
    function download(options: DownloadOptions): Promise<number>

    type CreatedListener = (item: DownloadItem) => void
    type ErasedListener = (id: number) => void
    type ChangedListener = (delta: DownloadItemDelta) => void

    interface Delta<T> {
      current: T
      previous: T
    }
    interface DownloadItemDelta {
      id: number
      url?: Delta<string>
      filename?: Delta<string>
      danger?: Delta<DangerType>
      mime?: Delta<string>
      startTime?: Delta<string>
      endTime?: Delta<string>
      state?: Delta<State>
      canResume?: Delta<boolean>
      paused?: Delta<boolean>
      error?: Delta<InterruptReason>
      totalBytes?: Delta<number>
      fileSize?: Delta<number>
      exists?: Delta<boolean>
    }

    const onCreated: EventTarget<CreatedListener>
    const onErased: EventTarget<ErasedListener>
    const onChanged: EventTarget<ChangedListener>
  }

  /**
   * Omnibox
   */
  namespace omnibox {
    type OnInputEnteredDisposition = 'currentTab' | 'newForegroundTab' | 'newBackgroundTab'
    interface SuggestResult {
      content: string
      description: string
    }

    function setDefaultSuggestion(suggestion: { description: string }): void

    type InputStartedListener = () => void
    type InputChangedListener = (text: string, suggest: (s: SuggestResult[]) => void) => void
    type InputEnteredListener = (text: string, d: OnInputEnteredDisposition) => void
    type InputCancelledListener = () => void

    const onInputStarted: EventTarget<InputStartedListener>
    const onInputChanged: EventTarget<InputChangedListener>
    const onInputEntered: EventTarget<InputEnteredListener>
    const onInputCancelled: EventTarget<InputCancelledListener>
  }

  namespace idle {
    type IdleState = 'active' | 'idle' | 'locked'

    function queryState(detectionIntervalInSeconds: number): Promise<IdleState>
    function setDetectionInterval(intervalInSeconds: number): void

    type onStateChangedListener = (newState: IdleState) => void

    const onStateChanged: EventTarget<onStateChangedListener>
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/theme
   */
  namespace theme {
    interface Theme {
      images?: ThemeImages | null
      properties?: ThemeProperties
      colors?: ThemeColors
    }

    interface ThemeImages {
      theme_frame?: string
      additional_backgrounds?: string[]
    }

    interface ThemeProperties {
      additional_backgrounds_alignment?: string[]
      additional_backgrounds_tiling?: string[]
    }

    /**
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme#colors
     */
    interface ThemeColors {
      /** @DEPRECATED use frame */ accentcolor?: string
      bookmark_text?: string | null
      /** @CUSTOM */ border?: string | null
      /** @CUSTOM */ border_width?: string | null
      button_background_active?: string | null
      button_background_hover?: string | null
      icons?: string | null
      icons_attention?: string | null
      frame?: string | null
      frame_inactive?: string | null
      ntp_background?: string | null
      ntp_text?: string | null
      /** @UNDUCUMENTED */ panel_item_active?: string | null
      /** @UNDUCUMENTED */ panel_item_hover?: string | null
      /** @UNDUCUMENTED */ panel_separator?: string | null
      popup?: string | null
      popup_border?: string | null
      popup_highlight?: string | null
      popup_highlight_text?: string | null
      popup_text?: string | null
      sidebar?: string | null
      sidebar_border?: string | null
      sidebar_highlight?: string | null
      sidebar_highlight_text?: string | null
      sidebar_text?: string | null
      /** @CUSTOM */ sidebar_border_width?: string | null
      /** @DEPRECATED */ tab_background_separator?: string | null
      tab_background_text?: string | null
      tab_line?: string | null
      tab_loading?: string | null
      tab_selected?: string | null
      tab_text?: string | null
      /** @DEPRECATED use tab_background_text */ textcolor?: string | null
      toolbar?: string | null
      /** @CUSTOM */ toolbar_transparent?: string | null
      toolbar_bottom_separator?: string | null
      toolbar_field?: string | null
      toolbar_field_border?: string | null
      toolbar_field_border_focus?: string | null
      toolbar_field_focus?: string | null
      toolbar_field_highlight?: string | null
      toolbar_field_highlight_text?: string | null
      /** @DEPRECATED */ toolbar_field_separator?: string | null
      toolbar_field_text?: string | null
      toolbar_field_text_focus?: string | null
      toolbar_text?: string | null
      toolbar_top_separator?: string | null
      toolbar_vertical_separator?: string | null
    }
    // Undocumented colors
    // address_bar_box
    // address_bar_box_active
    // address_bar_box_focus
    // address_bar_box_hover
    // address_bar_box_text
    // address_bar_url_color
    // appmenu_info_icon_color
    // appmenu_update_icon_color
    // panel_item_active
    // panel_item_hover
    // panel_separator
    // tab_attention_dot
    // tab_loading_inactive
    // toolbar_field_icons_attention

    interface Update {
      theme: Theme
      windowId?: ID
    }

    function getCurrent(windowId?: ID): Promise<Theme>
    function update(windowId: ID, theme: Theme): void
    function update(theme: Theme): void
    function reset(windowId?: ID): void

    type ThemeUpdatedListener = (upd: Update) => void

    const onUpdated: EventTarget<ThemeUpdatedListener>
  }
}
