# Changelog

## Unreleased

### Added

- Tabs: A setting to control switching between globally-pinned and normal tabs with mouse wheel or keybinding  
- Restore scroll positions in bookmarks and history sub-panels  
  - after reopening sub-panel  
  - after exiting search mode  
- A setting to control explicit unloading of pinned tabs  
- Setup-page: Mark changed (non-default) settings  
  Also, ctrl+alt+click to copy dbg info (prop name)
- Setting field improvements (by [@FurkanKambay](https://github.com/FurkanKambay): [#2332](https://github.com/mbnuqw/sidebery/issues/2332)) ([#2275](https://github.com/mbnuqw/sidebery/issues/2275))  
- Search: Option to keep searching after triggering context menu option
- Add hidden 'searchInputTimeout' pref to configure delay between typing and search
- Option to keep search results after switching tabs (resolves [#1527](https://github.com/mbnuqw/sidebery/issues/1527))  
- Keybindings: Exit from search mode with 'reset' keybinding
- Omnibox / Address bar (`= ` preffixed commands in address bar):  
  - Reopening active tab in a different container (by [@ErichDonGubler](https://github.com/ErichDonGubler): [#1992](https://github.com/mbnuqw/sidebery/issues/1992))
  - Moving active tab to panel
  - Switching panel
  - Moving active tab to group (related: [#619](https://github.com/mbnuqw/sidebery/issues/619), [#1677](https://github.com/mbnuqw/sidebery/issues/1677))  

  To start, focus the address bar (Ctrl+L/Cmd+L), then input "=" followed by a space, then start typing target container/panel/group name (case-insensitive). Choose desired command from the list or just press Enter to use the first one.  
- Setting for configurable tab drop position (by [@Victor239](https://github.com/Victor239): [#2317](https://github.com/mbnuqw/sidebery/issues/2317))
- Allow to config position of the new tab created by:  
  - Keybinding: "Open a new tab in the active panel"
  - Left click on the active tab panel
  - Left click on the empty space of tab panel
  - Double click on the empty space of tab panel
  - Middle click on the empty space of tab panel  

  Default value: 'general rule' - will preserve current behavior.  
  Other values: 'rule of new tab button', 'panel start', 'panel end'.  
- Keybinding: Select tabs branch
- Selection: Show the number of selected tabs/bookmarks (resolves [#2108](https://github.com/mbnuqw/sidebery/issues/2108))  
  Can be turned off with the hidden setting: `selLen`
- Add the ability to cycle through panels (all or visible only) (by [@seppulcro](https://github.com/seppulcro): [#1829](https://github.com/mbnuqw/sidebery/issues/1829)) (resolves [#686](https://github.com/mbnuqw/sidebery/issues/686))  
- Bookmarks: Show custom color and container mark.
- Tabs/Bookmarks: Preserve custom titles on panel conversion
- Tabs: Hidden pref `forceUpdTooltip` to calc tooltip (title attr) right after title change. (resolves [#2292](https://github.com/mbnuqw/sidebery/issues/2292))  

### Fixed

- Context-menu: Hovered option with pin button changes the width of the popup
- Search/tabs: Switching tabs with the mouse wheel or keybindings ignores search result  
  Switch between filtered tabs.
- Bookmarks: Sidebery data is copied along with the titles.  
  Copy parsed titles if possible.
- Keep "Prevent pinned tabs from unloading" setting enabled when pinned tabs are global (by [@FurkanKambay](https://github.com/FurkanKambay): [#2344](https://github.com/mbnuqw/sidebery/issues/2344))  
- Wrong initial panel if Firefox started without session restore
- Tabs: Wrong indent for tab created with double/middle-click on the panel  
- Select-field: Double-switch when clicking on the input option
- Bookmarks: Unaligned separator
- Tabs not initializing on creating the first tab panel
- Broken focus/select behavior in panel config popup
- Impossible to remove the last tab-panel without closing its tabs
- Make the 'discard tab panel' middle click action respect the `pinnedNoUnload` setting (by [@FurkanKambay](https://github.com/FurkanKambay): [#2337](https://github.com/mbnuqw/sidebery/issues/2337))
- Bookmarks: Incorrect processing of empty title  
  - Handle change event with empty title
  - Allow to set empty title (to align with Firefox behavior)
  - Fix broken layout of bookmarks popup when location folder has empty title (show '---', later should be replaced with '(no title)')  
- Search/tabs: Broken multi-selection
- Search/tabs: Results is not updated after reopening folded tab
- Search: Unneeded delay on clicking 'x' button in the search-bar  
- Search/Drag and drop: Broken drag and drop with active search  
  - stop search on dnd start
  - continue search on dnd end
- Search/tabs: Unexpected positions of folded tabs  
- Search/tabs: Focus flickering on switching tabs
- Search/tabs: Search results doesn't update after move/pin/unpin
- Search: Search bar in sidebar doesn't hide after pressing ESC in popup with empty value  
- Search/tabs: Unexpected tabs closing in search mode  
  Ignore 'close folded/all child tabs' settings in search mode because in search mode tabs tree is destructured to a plain list and these settings are pointless.
- Search: Auto selecting the first result hinders more than helps, to select it press the Down arrow  
- Search popup: No focus sometimes (resolves [#2213](https://github.com/mbnuqw/sidebery/issues/2213))  
- Keybindings: Can't exit from search mode if search query it empty
- Search tabs: The last found tab isn't selected on Up key without initial selection  
- Duplicate as a child not working for long click (by [@liquiddandruff](https://github.com/liquiddandruff): [#2325](https://github.com/mbnuqw/sidebery/issues/2325)) (resolves [#1604](https://github.com/mbnuqw/sidebery/issues/1604))  
- Drag and drop: False-positive triggering of a new window creation on drop ([#2321](https://github.com/mbnuqw/sidebery/issues/2321))  
- Tabs.bg: Auto-reopening (in different container) with closed sidebar works with too big delay  
- OnKeySwitchToPrevPanel() should switch instead of only activate (by [@cnnrro](https://github.com/cnnrro): [#2264](https://github.com/mbnuqw/sidebery/issues/2264))
- Tabs/selection: Folded branch is not selected on the edge of selection range  
- Tabs: Wrong scaling of the in-page preview (resolves [#2139](https://github.com/mbnuqw/sidebery/issues/2139))  
  Wrong initialization process of the preview script:
  referenceDevicePixelRatio was used with default '1' value before the
  actual value was received.
- Window selection modal does not scroll (resolves [#2303](https://github.com/mbnuqw/sidebery/issues/2303))  
- Switching between hidden panels doesn't scroll the list of hidden panels  
- Tab panel: A tab created with double click on empty space has unexpected position  
  Use 'new tab bar' config for positioning it.
- Tabs/move: tabs are reordered after unpinning  
  Happens b/c each next tab is placed by Firefox before the prev.  
  Reverse the tab list for unpinning.
- Keybindings: Single active tab is selected on moving with keybinding  
  Don't select it (if it's just active tab)
- Snapshots viewer: Tabs of unknown panel are not displayed  
  Display tabs of unknown panel (panelId: -1) at the bottom of the list in the default panel section.  
  ([#2049](https://github.com/mbnuqw/sidebery/issues/2049))
- Bookmarks: No container info / custom color when bookmarking tab[s].  
  Properly preserve tabs custom colors and container info.
- Sidebar: Some technical data is not removed on restoring tab panel from bookmarks which might cause duplicating that data after next save/restore cycle.  
- Bookmarks.open: Wrong handling of bookmarks folder with long name.
- Nav-bar style: last panel in hidden-panels-popup doesn't have rounding corners at the bottom
- Nav-bar style: redundant padding before side-positioned pinned tabs

### Localization

- Allow translating a header and fix a French translation (by [@ariasuni](https://github.com/ariasuni): [#2315](https://github.com/mbnuqw/sidebery/issues/2315))  
- Fr: "nouvelle" instead of "existante" (resolves [#2299](https://github.com/mbnuqw/sidebery/issues/2299))  
- Fr: fix the translation for 'Unload' (by [@cluxter](https://github.com/cluxter): [#2291](https://github.com/mbnuqw/sidebery/issues/2291))  

### Performance Improvements

- Bookmarks: Minor overall speedup for drag and drop, selection and search


## v5.4.0 - 2025.11.05

### Added

- Drag and drop: handle native bookmark folders and link lists
- Tabs: an option to trigger the close button action on mouse-up (resolves [#1788](https://github.com/mbnuqw/sidebery/issues/1788), [#1437](https://github.com/mbnuqw/sidebery/issues/1437), [#1682](https://github.com/mbnuqw/sidebery/issues/1682), [#299](https://github.com/mbnuqw/sidebery/issues/299))
- New tab position for tabs opened with the sidebery new tab button (resolves [#2008](https://github.com/mbnuqw/sidebery/issues/2008), [#1096](https://github.com/mbnuqw/sidebery/issues/1096))
- BrowserAction context menu option for reopening cached windows
- Snapshots: display the tabs custom colors
- Mouse: tabs preselect: make it possible to skip unloaded tabs
- Option to config automatic tab-panel scrolling (by [@deviant](https://github.com/deviant): [#2180](https://github.com/mbnuqw/sidebery/issues/2180))
- Add support for configuration through central policies (by [@spl3g](https://github.com/spl3g): [#2016](https://github.com/mbnuqw/sidebery/issues/2016))
- Tab preview: hide preview box of unloaded tabs (by [@the-nelsonator](https://github.com/the-nelsonator): [#2081](https://github.com/mbnuqw/sidebery/issues/2081)) (resolves [#2078](https://github.com/mbnuqw/sidebery/issues/2078))
- Snapshots: mark private windows
- Support opening Snapshots in private windows (by [@zachswasey](https://github.com/zachswasey): [#2116](https://github.com/mbnuqw/sidebery/issues/2116))
- Tabs: support deduplicate a selection (by [@mgcsysinfcat](https://github.com/mgcsysinfcat): [#2141](https://github.com/mbnuqw/sidebery/issues/2141))  
- Add option to disable auto-scroll to new tab (by [@ingjieye](https://github.com/ingjieye): [#2150](https://github.com/mbnuqw/sidebery/issues/2150)) (resolves [#1270](https://github.com/mbnuqw/sidebery/issues/1270))  
- Option to hide unloaded native tabs (resolves [#2011](https://github.com/mbnuqw/sidebery/issues/2011))
- Snapshots: select/deselect folded child tabs with their parent tab
- Support using shift after clicking the first tab to open in a new window for snapshots (by [@zachswasey](https://github.com/zachswasey): [#2114](https://github.com/mbnuqw/sidebery/issues/2114))
- Option to include container name in tab tooltip ([#2067](https://github.com/mbnuqw/sidebery/issues/2067)) (by [@GodKratos](https://github.com/GodKratos): [#2075](https://github.com/mbnuqw/sidebery/issues/2075))
- Paste from clipboard (resolves [#2091](https://github.com/mbnuqw/sidebery/issues/2091))  
  - Optional permission "clipboardRead"
  - Context menu options for tabs, bookmarks and panels
  - Parsing text from clipboard for urls, Markdown and HTML links preserving tree structure (via indents)
  - Handling Ctrl/Command+V shortcuts in focused sidebar
- Keybindings: lock/unlock selection (for marking individual tabs/bookmarks) (resolves [#2097](https://github.com/mbnuqw/sidebery/issues/2097))
- Copy by templates (tabs/bookmarks) (resolves [#1132](https://github.com/mbnuqw/sidebery/issues/1132))  
  - two basic default templates: HTML and Markdown links
  - context menu options
  - keybindings for the first five templates
- Option to set a list mark when copying multiple items
- Option to add an indent when copying tabs/bookmarks tree (resolves [#2090](https://github.com/mbnuqw/sidebery/issues/2090))
- A setting to include active tab on initial ctrl+click (by [@the-nelsonator](https://github.com/the-nelsonator): [#2083](https://github.com/mbnuqw/sidebery/issues/2083)) (resolves [#2078](https://github.com/mbnuqw/sidebery/issues/2078))
- Add unload to long-click tab actions (by [@the-nelsonator](https://github.com/the-nelsonator): [#2068](https://github.com/mbnuqw/sidebery/issues/2068))  
  * Add unload a.k.a. discard to double/long click actions
  * Remove unload on double click option
- Option to set default font-family for sidebar ([#2031](https://github.com/mbnuqw/sidebery/issues/2031))  
- Snapshots: fold/unfold windows/panels/tabs (resolves [#1071](https://github.com/mbnuqw/sidebery/issues/1071))  

### Fixed

- Tabs: incorrect url update of the group page linked to pinned tab (related [#2255](https://github.com/mbnuqw/sidebery/issues/2255))  
- Tabs: incorrectly calculated (shallow) invisibility of the new tab
- Tabs: wrong custom color/title, folded state, position after undo close (from notification)  
  - Restore custom color/title and folded state (use Tabs.open(...))
  - Try to restore original position (parent/index)
- Drag and drop: native bkm folder is not included, only its children
- Keybindings: "Select all" keybinding doesn't select folded tabs (resolves [#2128](https://github.com/mbnuqw/sidebery/issues/2128))  
- Drag and drop/bookmarks: wrong parentId on dropping to root lvl of bkm panel (resolves [#2140](https://github.com/mbnuqw/sidebery/issues/2140))  
- Cannot open bookmarks or history visits if there is no tab panels (resolves [#2147](https://github.com/mbnuqw/sidebery/issues/2147))  
- Snapshots: overflowed delete button (resolves [#2194](https://github.com/mbnuqw/sidebery/issues/2194))  
- Site config popup: incorrect url parsing (resolves [#2195](https://github.com/mbnuqw/sidebery/issues/2195))  
- Containers: update tab colorization after containers update if colorization is based on containers
- Tabs/containers: created tab has unknown container (resolves [#2237](https://github.com/mbnuqw/sidebery/issues/2237))  
  Handle new container events in the sidebar to guarantee that container of a new containered tab is known.
- Tabs: incorrect handling of unloaded tabs opened from another addon (resolves [#2249](https://github.com/mbnuqw/sidebery/issues/2249))  
- Tabs: possible tree breakage and changing configured behavior with 'do not move it' setting (resolves [#2280](https://github.com/mbnuqw/sidebery/issues/2280))  
  - Added sub-setting for controlling branch creation logic. It works only for the 'do not move it' option. For the other options it's inactive and visualizes the behavior ('on' for the 'first/last child', 'off' otherwise).
  - Added the upgrade logic to preserve previous behavior with 'do not move it' option.
  - Fixed incorrectly found target panel with 'do not move it' option and the `browser.tabs.insertRelatedAfterCurrent` set to false
- A rare broken initialization with empty storage caused by race condition:  
  Both sidebar and bg generate default sidebar configs with different panel ids.
  changed:
  - In sidebar, wait until bg set default sidebar config (or 5sec).  
  - In sidebar, setup sidebar listeners after sidebar is loaded.  
- Tabs: broken tree after cancellation of auto-closing child tabs in some cases (maybe related: [#2267](https://github.com/mbnuqw/sidebery/issues/2267))  
  This only applies to cases when the parent tab in the middle of a tree was closed by Firefox (e.g. Ctrl+W) or by another addon. And with these settings:  
  'Warn on trying to close multiple tabs' = 'any'  
  'Close child tabs along with parent' = all  
  Changed:
  - Update parentId of child tabs that should've been removed (but it was canceled)  
  - Try to restore the removed parent tab  
  - Cancel the confirm popup of the previous close event in onTabRemoved  
- Tabs: hidden native tabs keeps being highlighted  
  Firefox ignores `browser.tabs.highlight(...)` call for hidden tabs
- Tab: prevent auto-scrolling with middle-click on the close btn
- Tabs: session restore detection and handling  
  - Check pinned tabs too
  - Stop handling new tabs and other events if there is a possibility of session restore (perf)
  - Reinit tabs on false-positive detection (when batched new tabs have no Sidebery's data in session storage)
  - Correctly deal with deferred moving of newtab (cancel it)
- Tabs: incorrect index for a new pinned tab
- Tabs: reduce the time of the close button lock  
  From 1s to 100ms. It's still helping with misbehaved mouse buttons but also will allow faster triggering of combined actions (e.g. mid-click: unload or close tab).
- Tabs: skip unloaded on tab flip by default
- Snapshots: exclude private windows by default
- Tabs: don't cache private windows
- Drag and Drop: broken drag and drop to the private window and between different profiles  
  - Firefox no longer passes the 'application/x-sidebery-dnd' item via dataTransfer to windows in different incognito mode (an empty string instead), so pass this info the other way (IPC). The 'application/x-sidebery-dnd' is still needed to pass the info to sidebars of the other profiles.
  - Clear containers of dropped items from the other profile since their containerId refers to a different container.
- Mouse wheel tab switching with preselect: incorrect selection of the first/last tabs
- Tabs: incorrect tabs positioning when Firefox creates multiple tabs  
- Setup-page: Broken favicons cache after import  
  Set the saveAll flag true on loadFavicons to forcefully save the whole
  cache on the first favicon after import.
- Settings: Try to restore tabs tree after re-enabling 'Tabs tree structure'
- Tabs: Position of the new tab for options 'do not move it' and 'use general rule'  
  - For 'use general rule', original openerTabId was used instead of using the general rule.  
  - For 'do not move it', original openerTabId was used which moved the new tab horizontally (indenting it), creating the branch. Now, the flat list of tabs will be produced, which will emulate Firefox positioning for child tabs.
- New-tab-shortcuts editor: incorrect handling of duplicates
- New tab buttons shortcuts: 'Default container' option behaves as 'Not set' when opening new child tabs with middle click. Container is inherited from the parent tab instead of using the default one.  
  Rename 'Default container' option into 'Not set';  
  Add 'Default container' option which will open a new child tab in the default container.
- Tabs: remove redundant setting 'Create sub-tree on opening...' (resolves [#1725](https://github.com/mbnuqw/sidebery/issues/1725))  
  This ancient setting (groupOnOpen) is conflicting with 'New tab
  position' configs, which are controlling when a new branch should be
  created.
- Tabs: wait until tabs service ready before auto-reopening tab in different container
- Fragile initialization of group/url-placeholder pages
- Tabs: Don't save tabs cache if there is only one session restore tab
- Tabs: incorrect handling of session restore (ref [#1709](https://github.com/mbnuqw/sidebery/issues/1709))  
  Instead of patching only unpinned tabs state, this will start a complete
  tabs reinitialization from session data.
- Tabs: incorrect index of reopened pinned tab
- Tabs: handle pin/unpin only if this state was actually changed
- New-tab-bar: wrong container for default button in private windows
- Windows: set the correct initial incognito flag
- Tabs: can't create tab in a private window with incorrectly set default container in tab panel  
  Force use of PRIVATE_CONTAINER_ID in private windows in `createTabInPanel`.
- Tabs init: move tabs to their panels on init (if needed) (ref [#1709](https://github.com/mbnuqw/sidebery/issues/1709))  
  - Refactored restoring tabs from cache and from session data.
  - Added detection of incorrect order of tabs and sorting to the right panels.
  - Moving unknown (new) tabs to the last active panel if possible.
- Tabs init: strictier cache invalidation rules (ref [#1709](https://github.com/mbnuqw/sidebery/issues/1709))  
  Use cache if it's fully matched with native tabs (except unknown (new)
  tabs and blindspots).
- Snapshots: check if sidebar is open before throwing tabs to it
- Snapshots: set openerTabId to preserve tree if no sidebar open
- Snapshots: adapt container on opening selected/clicked tabs  
  Find existing container or create a new one.
- Web-req: hide proxy badge only if needed
- Update web request handlers right after container update  
  This is needed for the correct opening of tab in this container right
  after applying a new container config.
- Snapshots: open tabs even if current panel is not for tabs  
  Use `panelId: NOID`, the sidebar will find appropriate fallback
- Tabs: open: use lastTabsPanelId as fallback
- Snapshots: preserve customColor on opening individual/selected tabs
- Sidebar: no top padding in BottomBar if there's no .new-tab-btns
- Tab preview(in-page): decode url
- Setup-page: update storage info after modifying snapshots  
- Setup-page: recalculate storage info after importing favicons cache
- Setup-page: Just imported favicons resets after visiting some site  
  Reload favicons after import
- Sidebar: Center popups
- Bookmarks: incorrect recalculation of folder lengths on bookmark rm/move  
  Calculate only 'bookmark' type
- Bookmarks: unexpected place for created bookmark node from context menu  
  Create bookmark node inside the target folder only if it's open.
  Otherwise, create bookmark node after the target.
- Bookmark: empty title of folder is not rendered
- Bookmarks panel: incorrect saving of scroll position (at the top)
- Snapshots viewer: active snapshot exported(JSON) with the viewer guts
- Tab preview(in-page): preview is not closed on tab activation
- Navbar: remove bottom border-radius of the last item in vertical navbar  
  This will increase click area and allow interact with the button when
  the mouse cursor at the bottom-(left/right) edge of the screen.
- Drag and Drop: onDragEnter: incomplete handling of dragEnter from the outside
- Drag and Drop: unexpected dstPanelId and dstParentId default values on reset
- Tabs: move: check target index and normalize it if needed
- Dnd/bookmarks sub-panel: wrong dst info for the bottom nav elements
- Dnd: bookmarks sub-panel closing right after drop
- Bookmarks: move/createFrom: set dst index to the end if < 0
- Mouse: tabs preselect: a separate config for 'active tab first'  
  separated from the keybindings sub-setting
- Mouse: tabs preselect: don't pause preselection by default  
  added `scrollThroughTabsPreselDelay` hidden pref for this
- Tabs: restore custom title/color on tabs reopening
- Tabs: inherit custom color from parent only if it's not set
- Tabs: onTabUpdated: false reset of favicon  
  Use cached favicon instead of complete reset, this will make the
  favicon show faster for visited sites.
- Don't use an active new tab in loading state when opening settings
- Favicons: don't resize small enough SVGs  
- Favicons: incorrect resizing of svgs
- Group page: incorrect rendering of favicon
- Dnd: simplify dragEnd event handling (resolves [#2168](https://github.com/mbnuqw/sidebery/issues/2168))  
- Tabs: inactivate dedupe menu option if one or less tabs selected
- Tabs dedupe: misleading labels
- Selection: don't use Iterator.prototype.some() until 140ESR
- Selection: correctly recalculate all selected elements after lock/unlock
- Selection: allow selection of only pinned or only normal tabs
- Snapshots: start range selection from the tab selected with long-click
- Listen keydown events instead of keyup for in-sidebar shortcuts to align with other apps
- History: search: do not select the first found item  
  To avoid ignoring the first click.
  First item will be selected on 'down' keypress.
- Setup-page: no margin between text-input and label
- Navbar: hidden-panels-popup not showing
- Handle incompatible options tabLongLeftClick and activateOnMouseUp
- Snapshots viewer: switch snapshots on mouse wheel only over title
- Snapshots: normalize url with title (for url-placeholder page)
- Tabs.updateBgTabsTreeData: check if sidebar tree exists before using
- Snapshots: isParent flag calculation
- Navbar: scoll overflowed vertical navbar
- Snapshots: respect custom title in snapshot viewer display, export to md, open tab (by [@the-nelsonator](https://github.com/the-nelsonator): [#2061](https://github.com/mbnuqw/sidebery/issues/2061))  
  Closes https://github.com/mbnuqw/sidebery/issues/2060
- Tabs: undo close incorrectly restores descendants tree structure (resolves [#2055](https://github.com/mbnuqw/sidebery/issues/2055))  
- Inpage tab preview: hide on closing sidebar
- Inpage tab previews: cancel pending injection promise  
  this will prevent infinite Opening state, which blocks new previews
  from showing and tabs dnd
- Tab: reset preview on dnd start  
- Inpage tab preview: wrong preview scale in zoomed page
- Inpage tab preview: wrong position in zoomed page
- Inpage tab preview: faster transitions between previews
- Nav-bar: hidden-panels-popup styles  
  - don't darken the background
  - use var(--ctx-menu-shadow) shadow
- Snapshot viewer: opening a group tab with click
- Containers: handle regex flags for include/exclude rules (resolves [#1821](https://github.com/mbnuqw/sidebery/issues/1821))  
- Dnd: update drop status request timeout to 10000ms (by [@the-nelsonator](https://github.com/the-nelsonator): [#2039](https://github.com/mbnuqw/sidebery/issues/2039))  
  Fixes https://github.com/mbnuqw/sidebery/issues/2038
- Use system-ui instead of sans-serif (resolves [#2031](https://github.com/mbnuqw/sidebery/issues/2031))

### Localization

- Zh: updated translation (by [@llc0930](https://github.com/llc0930): [#2284](https://github.com/mbnuqw/sidebery/issues/2284))
- Keybindings: update Tab flip label: remove the part about click  
  b/c this text was copied from the mouse settings
- Zh: updated translation (by [@llc0930](https://github.com/llc0930): [#2282](https://github.com/mbnuqw/sidebery/issues/2282))
- Sync sub-panel, copy by templates (resolves [#2161](https://github.com/mbnuqw/sidebery/issues/2161))  
- Updated translation (by [@llc0930](https://github.com/llc0930): [#2274](https://github.com/mbnuqw/sidebery/issues/2274))
- Remove outdated mentioning of horizontal tabs as the native tabs
- Update zh_CN translation for closing duplicate tabs (by [@ASC8384](https://github.com/ASC8384): [#2261](https://github.com/mbnuqw/sidebery/issues/2261))
- Updated translation (by [@llc0930](https://github.com/llc0930): [#2260](https://github.com/mbnuqw/sidebery/issues/2260))
- Updated translation (by [@llc0930](https://github.com/llc0930): [#2256](https://github.com/mbnuqw/sidebery/issues/2256))
- Don’t concatenate translation strings, use more source strings (by [@ariasuni](https://github.com/ariasuni): [#2250](https://github.com/mbnuqw/sidebery/issues/2250))
- Updated translation (by [@llc0930](https://github.com/llc0930): [#2245](https://github.com/mbnuqw/sidebery/issues/2245))  
- Remove unused dict keys
- Various translations fixes (by [@ariasuni](https://github.com/ariasuni): [#2223](https://github.com/mbnuqw/sidebery/issues/2223))  
- Add ability to translate some strings with missing translation (by [@hannaeko](https://github.com/hannaeko): [#2172](https://github.com/mbnuqw/sidebery/issues/2172))  
- Updated translation (by [@llc0930](https://github.com/llc0930): [#2171](https://github.com/mbnuqw/sidebery/issues/2171))  
- Translation fr (by [@ariasuni](https://github.com/ariasuni): [#2160](https://github.com/mbnuqw/sidebery/issues/2160))  
- Add possibility to translate all headers in Styles editor (by [@ariasuni](https://github.com/ariasuni): [#2167](https://github.com/mbnuqw/sidebery/issues/2167))
- Zh, jp: updated translation (by [@llc0930](https://github.com/llc0930): [#2156](https://github.com/mbnuqw/sidebery/issues/2156))
- zh: correction terminology (by [@llc0930](https://github.com/llc0930): [#2066](https://github.com/mbnuqw/sidebery/issues/2066))

### Performance Improvements

- Rendering tabs and stuff (resolves [#2100](https://github.com/mbnuqw/sidebery/issues/2100))  
  - using 'contain' CSS property to decrease recalculating/reflowing layout on changing DOM
  - bufferizing/debouncing tab changes (default: 150ms, hidden pref: `tabUpdDelay`)
  - manualy updating tab's title and favicon
- Handling of tab's title change; updating tab's tooltip ([#2100](https://github.com/mbnuqw/sidebery/issues/2100))  
  - do not set 'update' flag if it's already set
  - do not calc tab's tooltip on title/url change, do it on mouse hover
  (delay is configurable under `updTooltipDelay` setting prop)


## 5.3.3 - 2025.02.22

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
