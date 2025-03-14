# Changelog

## Unreleased

### Fixed

- Recently closed tabs (sub-panel): close it right after dnd start
- Tab preview: vertical positioning (in-page popup)  
- Tabs: parentId is not specified when auto-reopening tab on request (resolves [#2009](https://github.com/mbnuqw/sidebery/issues/2009))  
- SetupPage/navbar: rm non-panel element with "x" button (resolves [#2018](https://github.com/mbnuqw/sidebery/issues/2018))  
- Panel config: custom icon: file (resolves [#2015](https://github.com/mbnuqw/sidebery/issues/2015))  

### Localization

- Grammar in cookie clearing message (by [@Sushisource](https://github.com/Sushisource): [#2006](https://github.com/mbnuqw/sidebery/issues/2006))
- Corrections in Polish (by [@MStankiewiczOfficial](https://github.com/MStankiewiczOfficial): [#2017](https://github.com/mbnuqw/sidebery/issues/2017))  


## 5.3.2 - 2025.02.03

### Fixed

- Notifications: hide notifications while dragging items
- Skip favicon resize if it is a SVG containing a CSS media query (by [@capi1O](https://github.com/capi1O): [#1987](https://github.com/mbnuqw/sidebery/issues/1987)) (resolves [#1937](https://github.com/mbnuqw/sidebery/issues/1937))  
- Tabs: check if tabs are locked by sidebery before retrieving them (on init)
- Sidebar/bottom-bar: increase height of dnd-layer to window edge
- Drag and drop: prevent dropping items on themselves  
- Windows: lock tabs init on early steps of createWithTabs ([#1910](https://github.com/mbnuqw/sidebery/issues/1910))  
  This should prevent some cases of losing tabs structure on opening
  window by sidebery e.g. opening snapshot window or moving tabs to new window
- Search: minimum search query length in CJK should be 1. (by [@llc0930](https://github.com/llc0930): [#1985](https://github.com/mbnuqw/sidebery/issues/1985))  
  When the query string length is 1, check whether it is a CJK character.
- Keybindings: open all selected bookmarks (resolves [#1980](https://github.com/mbnuqw/sidebery/issues/1980))  
- Keybindings: expand selection range in bookmark sub-panel too
- Bookmarks: preserve customColor on opening bookmarks
- Drag and drop: insert new tab panel after the last tab/bkm panel
- Drag and drop: dropping tabs on unloaded bookmarks [sub-]panel
- Drag and drop: increase delay before resetting dropEventConsumed flag  
  This should decrease count of false-positive moving tabs to the
  new window, (when browser is too busy and time between drop and dragend
  events is more than 1500ms).
- Tabs: do not allow moving all tabs of window to the new one
- Drag and drop: increase min drag and drop duration before opening new window ([#1947](https://github.com/mbnuqw/sidebery/issues/1947))  
  this should fix/reduce cases of false positive opening of a new window
  when sidebery doesn't get the ondrop event despite the cursor was over
  sidebar
- Drag and drop: increase deadline for requesting drop statuses from other sidebars

### Localization

- de: typos, fixes, new features (by [@ChilledMoth](https://github.com/ChilledMoth): [#1981](https://github.com/mbnuqw/sidebery/issues/1981))


## 5.3.1 - 2025.01.22

### Fixed

- Drag and Drop: correctly handle dragging bookmarks in bookmarks sub-panel
- OnTabRemoved: incorrect recalc of visibility of the child tabs
- Internal pages initialization (resolves [#1975](https://github.com/mbnuqw/sidebery/issues/1975))  
- Handling connections between different parts of addon
- Increase deadlines for reconnection and resending msgs ([#1973](https://github.com/mbnuqw/sidebery/issues/1973))  
- Setup-page styles: use system-ui font-family  
- Snapshots viewer styles: decrease tabs height

### Localization

- zh: updated translation (by [@llc0930](https://github.com/llc0930): [#1972](https://github.com/mbnuqw/sidebery/issues/1972))


## 5.3.0 - 2025.01.20

### Added

- Keybindings: select up/down: "Cyclically" sub-option
- Show visual feedback after middle clicking on elements (bookmarks, history, recently closed tabs)
- Keybinding to open sync popup
- Keybinding to open bookmarks sub-panel (if available)
- Keybindings: select bookmarks in sub-panel too
- Keybinding to edit title of selected/active tab (resolves [#966](https://github.com/mbnuqw/sidebery/issues/966)) (resolves [#1848](https://github.com/mbnuqw/sidebery/issues/1848)) (resolves [#1845](https://github.com/mbnuqw/sidebery/issues/1845))  
- Keybindings: switch to previously active panel
- Keybindings to copy url/title of selected tab/bookmarks/active tab
- Keybinding to open config popup of selected/active panel
- Panel config in popup-window with basic keyboard navigation
- History: load more in search mode
- Tab preview: options to set max count of title/url lines (resolves [#1597](https://github.com/mbnuqw/sidebery/issues/1597))  
- Options for middle click on pinned tab; default: unload (by [@emvaized](https://github.com/emvaized): [#1911](https://github.com/mbnuqw/sidebery/issues/1911))  
- Option to skip unloaded tabs on tab flip
- Sync via Google Drive (experimental)  
  - Sync tabs (basic impl/experimental) [1372](https://github.com/mbnuqw/sidebery/issues/1372)
- Unload or close action for tabMiddleClick (by [@JarKz](https://github.com/JarKz): [#1697](https://github.com/mbnuqw/sidebery/issues/1697))
- Tabs: make discarded tab opacity editable (by [@valadaptive](https://github.com/valadaptive): [#1553](https://github.com/mbnuqw/sidebery/issues/1553))
- Sidebar: close site config popup with ESC ([#491](https://github.com/mbnuqw/sidebery/issues/491))  
- SetupPage: sub-sections of tabs and mouse settings in navigation
- Keybindings: a note for menu shortcut ([#1159](https://github.com/mbnuqw/sidebery/issues/1159))  
- Settings: a note for highlighting native tabs ([#1177](https://github.com/mbnuqw/sidebery/issues/1177))  

### Fixed

- Snapshots: normalize urls; utils.normalizeUrl: handle 'blob:' url ([#1942](https://github.com/mbnuqw/sidebery/issues/1942))  
- Windows.createWithTabs: handle errors of browser.tabs.create() ([#1942](https://github.com/mbnuqw/sidebery/issues/1942))  
- Tabs loading: increase count/freq of retry, ignore the tabs lock on the last retry
- Tabs/move: preserve panel if dst.panelId is not set
- Favicons: getting placeholder for internal pages of a dif profile
- Setup-page: incomplete removing of nav element
- Setup page/nav and contianers settings: more compact layout of cards
- Tab preview: show preview popup for active and unloaded tabs too
- Default tab context menu: first sort the tree itself (by [@llc0930](https://github.com/llc0930): [#1961](https://github.com/mbnuqw/sidebery/issues/1961))
- Search: should also search for custom titles for tabs (by [@llc0930](https://github.com/llc0930): [#1960](https://github.com/mbnuqw/sidebery/issues/1960))
- Setup-page: rm title/sub-title shadows
- Notifications: set max width
- Dnd: place new panel after the last one on dropping tabs to the Add Tab Panel btn
- Export/import: more granular backup: separated "settings" field to "settings", "panels and nav" and "menu"
- Importing data  
  - race condition on importing containers and settings
  - show error messages
  - preserve old tabs panels
- Menu editor: reload menu config on opening
- Importing keybindings: handle defaults and conflicts
- Keybindings: selecting panel in inlined nav-bar: show drop-down popup with not visible panels
- Url-placeholder-page: make copy button focusable
- Keybindings: activate selected bookmark: check if creation of a new tab is needed
- Snapshots: preserve folded tabs state
- Prevent wrong tab activation after fast closing with ctrl+w
- Dnd: preserve folded state on dragging tabs outside the window
- Dnd: preserve customTitle/Color on dragging tabs outside the window
- Can't reopen containered tab in a new private window
- Preserve custom color/title on auto-reopening tab in dif container
- Trying to detect the manual session restore [#1368](https://github.com/mbnuqw/sidebery/issues/1368)
- Ipc: handling different connection states; reconnection logic
- No default context menu
- Dnd tab with ctrl: container is not preserved
- Docs: wiki: dynamic native tabs snippet (resolves [#1889](https://github.com/mbnuqw/sidebery/issues/1889))  
- History: search: flickering UI, wrong selection, loadMore with kb
- History: onBottomScroll sometimes doesn't trigger loadMore
- Correctly update media state of panel after closing multiple tabs
- Correctly update paused state of tab after url change
- History item: block click if selection is set in search mode
- Tab preview: reset internal state on turn on/off the setting
- Use url from title as fallback on reopening tab with NewTabButton
- Recalc "update" badge of panels after tabs moving
- Added a check for markWindow setting before updating window title when sidebar disconnects (by [@jackordman](https://github.com/jackordman): [#1835](https://github.com/mbnuqw/sidebery/issues/1835))
- Webext.run for zen-browser (by [@shanto](https://github.com/shanto): [#1813](https://github.com/mbnuqw/sidebery/issues/1813))  
- Use workaround for 1660564 only in sidebar instance  
  See https://bugzilla.mozilla.org/show_bug.cgi?id=1660564
- Auto-switching tab panel on drag start
- Bookmarks: wrong dst panel on opening bookmarks in container
- Keybindings: wrong first selected tab in the panel without active tab
- Previews: no fallback colors for 'in page' preview (fixes [#1708](https://github.com/mbnuqw/sidebery/issues/1708))  
- Switching tabs with mousewheel with threshold is broken in scrollable panel  
- Setup-page: keybindings: button alignment (by [@ChilledMoth](https://github.com/ChilledMoth): [#1772](https://github.com/mbnuqw/sidebery/issues/1772))
- Tabs: restoring tree state from session data in some failure cases  
  This and 05aedbb1, d21f8160, 5979d7a5, a2c6a59e, c83df0bd, 0d585f06 should
  fix or at least decrease probability of problems related with broken tabs
  structure on init (like [#1507](https://github.com/mbnuqw/sidebery/issues/1507), [#262](https://github.com/mbnuqw/sidebery/issues/262), [#267](https://github.com/mbnuqw/sidebery/issues/267), and so on...)
- Save tab data after auto-moving parent tab to different panel
- Save tab data after auto-reopening parent tab in different container
- Save tab data after moving it to different window
- Try to preserve tree structure of detached tabs
- Correctly update tree structure and save it after detaching tabs
- Save tabs data after their parent was reopened
- Cache tabs data after pin/unpin
- Tab context menu: make "clear cookies" option opt-in (resolves [#1336](https://github.com/mbnuqw/sidebery/issues/1336))  
- Setup-page: wording (resolves [#1343](https://github.com/mbnuqw/sidebery/issues/1343))  
  - use generalized term "scroll" over "mouse wheel"
  - use more specific term "vertical scroll" over "scroll wheel" for tabs switching
- Wrong range selection of bookmarks with the same start/end node
- Broken tab state after range selection
- Kb: start range selection from active tab if possible (resolves [#1421](https://github.com/mbnuqw/sidebery/issues/1421))  
- Recently Closed Tabs: show full tooltip
- History: copying title/url of filtered items
- Dnd: incorrect checking of consumed drop event in other sidebars ([#1554](https://github.com/mbnuqw/sidebery/issues/1554))  
- Tab: audio badge: correctly handle click target ([#1283](https://github.com/mbnuqw/sidebery/issues/1283))  
- Bottom-bar: increase click area to the bottom edge
- onTabUpdated: reset `updated` flag on discard
- onTabUpdated: don't set `updated` flag for discarded tab
- Site config popup: switch the panel after moving tab if configured
- Site config popup: changes are not saved correctly
- Auto move rule: set default value of 'top lvl only' to false
- Broken tree state after drag and drop to another window in some cases
- Discarded tabs reload on moving the last tabs to another window
- The last tab activation on moving tabs to the new window
- Tabs: incorrect state checking in event handlers ([#1230](https://github.com/mbnuqw/sidebery/issues/1230))  
- Horizontal scroll-bar appeared in sub-menu in the plain theme
- Discard page even if it's trying to prevent closing (only with WebData permissions)
- Context menu: too small margin-left of the label without icon
- Default settings: nativeHighlight: true ([#748](https://github.com/mbnuqw/sidebery/issues/748))  
- Broken active group page on restoring window from history menu
- Context menu positioned under the cursor in some cases ([#522](https://github.com/mbnuqw/sidebery/issues/522))  
- Tabs: reset unread mark after disabling the setting
- Default settings: tabsSecondClickActPrev: false ([#1521](https://github.com/mbnuqw/sidebery/issues/1521))  
- Recalc native tabs visibility when a globally pinned tab is active ([#700](https://github.com/mbnuqw/sidebery/issues/700))

### Localization

- ja, zh: updated translation (by [@llc0930](https://github.com/llc0930): [#1969](https://github.com/mbnuqw/sidebery/issues/1969))
- zh: updated translation, hu: ru: corrected (by [@llc0930](https://github.com/llc0930): [#1966](https://github.com/mbnuqw/sidebery/issues/1966))
- zh: updated translation (by [@llc0930](https://github.com/llc0930): [#1959](https://github.com/mbnuqw/sidebery/issues/1959))
- ja, zh (by [@llc0930](https://github.com/llc0930): [#1940](https://github.com/mbnuqw/sidebery/issues/1940))  
- en, ru: tab panel menu: rm the word "all" to avoid confusion between panel tabs and all tabs in general
- Updated translation (by [@llc0930](https://github.com/llc0930): [#1913](https://github.com/mbnuqw/sidebery/issues/1913))  
- Setup-page: help: repo link URL (by [@llc0930](https://github.com/llc0930): [#1580](https://github.com/mbnuqw/sidebery/issues/1580))
- Fix translation duplications and errors (by [@llc0930](https://github.com/llc0930): [#1766](https://github.com/mbnuqw/sidebery/issues/1766))
- Setup-page: translation wording adjustment (by [@llc0930](https://github.com/llc0930): [#1595](https://github.com/mbnuqw/sidebery/issues/1595))
- Translation fixes (by [@llc0930](https://github.com/llc0930): [#1578](https://github.com/mbnuqw/sidebery/issues/1578))  
- L10n zh_TW correction (by [@llc0930](https://github.com/llc0930): [#1537](https://github.com/mbnuqw/sidebery/issues/1537))
- Updated German translation (by [@ChilledMoth](https://github.com/ChilledMoth): [#1767](https://github.com/mbnuqw/sidebery/issues/1767))  
- Updated German translation (by [@ChilledMoth](https://github.com/ChilledMoth): [#1679](https://github.com/mbnuqw/sidebery/issues/1679))  
- Polish translation (by [@docentYT](https://github.com/docentYT): [#1661](https://github.com/mbnuqw/sidebery/issues/1661))  
- Japanese translation (by [@mikan-megane](https://github.com/mikan-megane): [#1642](https://github.com/mbnuqw/sidebery/issues/1642))  
- Hungarian translation (by [@cr04ch](https://github.com/cr04ch): [#1531](https://github.com/mbnuqw/sidebery/issues/1531))  


## 5.2.0 - 2024.03.07

### Added

- Opacity CSS vars for color layer of tab ([#314](https://github.com/mbnuqw/sidebery/issues/314))
- Optional menu entry to config panel in sidebar (resolves [#174](https://github.com/mbnuqw/sidebery/issues/174))  
- Sort tabs by title, url, access time ([#170](https://github.com/mbnuqw/sidebery/issues/170), [#643](https://github.com/mbnuqw/sidebery/issues/643))  
  - tab context menu options
  - tab panel context menu options
  - keybindings
- Option to skip config popup on group creation
- Allow using active panel name in window preface (resolves [#445](https://github.com/mbnuqw/sidebery/issues/445))  
- Auto grouping after closing parent tab ([#779](https://github.com/mbnuqw/sidebery/issues/779))  
- Keybinding: Select child tabs
- Keybinding: Group/flatten selected/active tabs ([#1295](https://github.com/mbnuqw/sidebery/issues/1295))  
- Mouse action: Duplicate tab as a child ([#1480](https://github.com/mbnuqw/sidebery/issues/1480))  
- Tab preview on hover ([#301](https://github.com/mbnuqw/sidebery/issues/301))
- Note about snapshots limit: not applicable to exported snapshots

### Fixed

- Preserve tree state (folded/unfolded branches) and tab colors when converting/saving TabsPanel to BookmarksPanel and vice versa
- Require manual intervention or browser restart after auto update  
  (workaround for [1881820](https://bugzilla.mozilla.org/show_bug.cgi?id=1881820))  
  ([#1477](https://github.com/mbnuqw/sidebery/issues/1477), [#1470](https://github.com/mbnuqw/sidebery/issues/1470))
- Do not show 'unread' mark if tabs were reopened from notification
- Workaround for 1882822 sometimes causing drag-and-drop to new window to fail (by [@dsuedholt](https://github.com/dsuedholt): [#1493](https://github.com/mbnuqw/sidebery/issues/1493))
- Inherit custom color of parent on moving tabs
- L10n zh_TW correction (by [@llc0930](https://github.com/llc0930): [#1485](https://github.com/mbnuqw/sidebery/issues/1485))
- Blinking that appears immediately after the “Tab Loaded” animation
- Preserve container after dropping the tab from "recently-closed" sub-panel to tab panel
- Window-specific theme handling ([#1134](https://github.com/mbnuqw/sidebery/issues/1134))  
- Incorrect tabs range selection with shift+click in search result
- Scroll thresholds not applying to mouse debouncer (by [@ImTheSquid](https://github.com/ImTheSquid): [#1440](https://github.com/mbnuqw/sidebery/issues/1440))
- Preserve selection on mid-click when 'multipleMiddleClose' is on ([#1441](https://github.com/mbnuqw/sidebery/issues/1441))

## 5.1.1 - 2024-02-02

Empty release to fix incorrectly uploaded version on AMO.

## 5.1.0 - 2024-02-01

### Added

- Mouse setting: One panel switch per scroll setting (thanks [@ImTheSquid](https://github.com/ImTheSquid), [#1424](https://github.com/mbnuqw/sidebery/pull/1424))
- Confirm popup by pressing the enter key (thanks [@into-the-v0id](https://github.com/into-the-v0id), [#1326](https://github.com/mbnuqw/sidebery/pull/1326))
- A "Toggle branch" keyboard shortcut setter (thanks [@paul-ohl](https://github.com/paul-ohl), [#1276](https://github.com/mbnuqw/sidebery/pull/1276))

### Fixed

- Handle all selected tabs on middle click action (close/unload)
- Preserve scroll position of active panel after settings change
- New Tab Shortcuts: Allow to use any container
- Auto-scrolling after middle-click on the audio badge of tab
- No-animations mode: Show static icons for loading tabs and panels
- Incorrect rendering of note for "scroll through tabs" setting (thanks [@llc0930](https://github.com/llc0930), [#1344](https://github.com/mbnuqw/sidebery/pull/1344))
- Truncating labels for sub-options with zh lang (thanks [@llc0930](https://github.com/llc0930), [#1344](https://github.com/mbnuqw/sidebery/pull/1344))
- zh_TW improvements (thanks [@llc0930](https://github.com/llc0930), [#1298](https://github.com/mbnuqw/sidebery/pull/1298))
- Wrong initial state of History service, leading to high CPU usage ([#1388](https://github.com/mbnuqw/sidebery/issues/1388))
- Wrong initial background color (white flash) ([#969](https://github.com/mbnuqw/sidebery/issues/969))
- Don't count double-clicking the title editor as double-clicking the tab (thanks [@cpmsmith](https://github.com/cpmsmith), [#1385](https://github.com/mbnuqw/sidebery/pull/1385))
- Optimize moving tabs inside the same window (thanks [@Lej77](https://github.com/Lej77), [#1338](https://github.com/mbnuqw/sidebery/pull/1338))
- Audio badge of tabs panel: In some cases, a context menu opens
- Recently Closed Tabs sub-panel: Middle click results in auto-scrolling
- Disappearing of tab with "close confirmation dialog" ([#1246](https://github.com/mbnuqw/sidebery/issues/1246))
- Unloading pinned tabs at startup ([#1265](https://github.com/mbnuqw/sidebery/issues/1265))
- Bookmarks sub-panel: False-positive triggering of lvl-up on dnd

## 5.0.0 - 2023-09-19

### Added

- Proton theme and added support of Firefox colors (themes)
- Sub-menus in custom context menu
- History panel
- History view in bookmarks panel
- Customizable delay time for 'Long-Click' actions ([#57](https://github.com/mbnuqw/sidebery/issues/57))
- Drag a tab out of the panel to open it in a new window ([#64](https://github.com/mbnuqw/sidebery/issues/64))
- User/Password for Proxy setting per Container ([#66](https://github.com/mbnuqw/sidebery/issues/66), [#914](https://github.com/mbnuqw/sidebery/issues/914))
- Allow selecting multiple containers in panel configs for auto-moving new tabs ([#131](https://github.com/mbnuqw/sidebery/issues/131))
- Modal window in sidebar for configuring the panel ([#174](https://github.com/mbnuqw/sidebery/issues/174))
- Keybindings: Switch to N:th tab in panel ([#182](https://github.com/mbnuqw/sidebery/issues/182))
- Renaming tabs in sidebar ([#185](https://github.com/mbnuqw/sidebery/issues/185), [#853](https://github.com/mbnuqw/sidebery/issues/853))
- Option to show the close button on all tabs ([#217](https://github.com/mbnuqw/sidebery/issues/217))
- Rename bookmark folder when bookmarking tab tree or group ([#226](https://github.com/mbnuqw/sidebery/issues/226))
- "New Tab" button with custom shortcuts ([#286](https://github.com/mbnuqw/sidebery/issues/286), [#954](https://github.com/mbnuqw/sidebery/issues/954))
- Tabs colorization (auto - by domain/container or manual) ([#314](https://github.com/mbnuqw/sidebery/issues/314))
- Option to disable updated tabs badge ([#365](https://github.com/mbnuqw/sidebery/issues/365))
- Keybindings: Pinning/unpinning tab ([#370](https://github.com/mbnuqw/sidebery/issues/370))
- Context menu option "Close branch" ([#436](https://github.com/mbnuqw/sidebery/issues/436))
- Panel audio state ([#437](https://github.com/mbnuqw/sidebery/issues/437))
- Keybinding import/export ([#454](https://github.com/mbnuqw/sidebery/issues/454))
- Keybindings: Activate the last tab on the current panel ([#461](https://github.com/mbnuqw/sidebery/issues/461), [#631](https://github.com/mbnuqw/sidebery/issues/631))
- Search in sidebar ([#466](https://github.com/mbnuqw/sidebery/issues/466))
- Send all tabs from panel to bookmarks folder ([#532](https://github.com/mbnuqw/sidebery/issues/532), [#925](https://github.com/mbnuqw/sidebery/issues/925))
- Tab flip ([#541](https://github.com/mbnuqw/sidebery/issues/541))
- Respect prefersReducedMotion rule for default settings ([#588](https://github.com/mbnuqw/sidebery/issues/588))
- Visual feedback on long click activation ([#600](https://github.com/mbnuqw/sidebery/issues/600))
- Configurable scroll area on tabs panel ([#620](https://github.com/mbnuqw/sidebery/issues/620))
- Option to move the scrollbar to the left side of the sidebar ([#622](https://github.com/mbnuqw/sidebery/issues/622))
- Keybindings: Closing Tabs Inside Active Panel ([#671](https://github.com/mbnuqw/sidebery/issues/671))
- Keybindings: Unloading tabs ([#674](https://github.com/mbnuqw/sidebery/issues/674))
- Keybindings: Move Tab To Start/End ([#725](https://github.com/mbnuqw/sidebery/issues/725))
- Scroll to new inactive tab ([#770](https://github.com/mbnuqw/sidebery/issues/770))
- Panel config: Custom icon: Local file selection ([#785](https://github.com/mbnuqw/sidebery/issues/785))
- Support for multiple bookmark panels with configurable root folder ([#897](https://github.com/mbnuqw/sidebery/issues/897))
- Add a "Move to new panel.." context menu option ([#941](https://github.com/mbnuqw/sidebery/issues/941))
- Snapshot export/import (manualy or automatically) in JSON and Markdown ([#949](https://github.com/mbnuqw/sidebery/issues/949))
- Firefox themes support ([#952](https://github.com/mbnuqw/sidebery/issues/952))
- Keybindings: Duplicate selected/active tabs ([#1015](https://github.com/mbnuqw/sidebery/issues/1015))

### Fixed

- DnD to the tab should put items at the end of branch ([#739](https://github.com/mbnuqw/sidebery/issues/739))
- New tab in panel don't open in container (Opt-in workaround: "Detect externally opened tab and reopen it in the target container on the first web request (global setting)") ([#305](https://github.com/mbnuqw/sidebery/issues/305))
- Add proper support for non-QWERTY layouts in keybindings ([#476](https://github.com/mbnuqw/sidebery/issues/476))
- Keybindings: Show dialog to resolve duplicated keybinding ([#994](https://github.com/mbnuqw/sidebery/issues/994))
- Preserve tree structure on duplicating ([#728](https://github.com/mbnuqw/sidebery/issues/728))
- ...and lots of other bug fixes

### Special thanks

**To contributors**: @emvaized, @loveqianool, @52fisher, @fsaresh, @zelch, @siddhpant, @alan-palacios, @jayeheffernan, @koppor, @gotjoshua, @sarchar, @HT43-bqxFqB, @SLin0218, @mateon1, @xdenial, @Qjo1, @br4nnigan.

**Community activity, feedback and bug reports**: @albino1, @emvaized, @megamorphg, @ongots, @drkhn1234, @jathek and everyone who made bug reports and feature requests, participated in discussions and helped other users.

**Donations**: Many thanks to all donors. You keep this project alive.

<br>
