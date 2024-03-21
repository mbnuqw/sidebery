# Changelog

## Unreleased

### Added

- Hungarian translation (by [@cr04ch](https://github.com/cr04ch): [#1531](https://github.com/mbnuqw/sidebery/issues/1531))  
- Sidebar: close site config popup with ESC ([#491](https://github.com/mbnuqw/sidebery/issues/491))  
- SetupPage: sub-sections of tabs and mouse settings in navigation
- Keybindings: a note for menu shortcut ([#1159](https://github.com/mbnuqw/sidebery/issues/1159))  
- Settings: a note for highlighting native tabs ([#1177](https://github.com/mbnuqw/sidebery/issues/1177))  

### Fixed

- Broken active group page on restoring window from history menu
- Context menu positioned under the cursor in some cases ([#522](https://github.com/mbnuqw/sidebery/issues/522))  
- Tabs: reset unread mark after disabling the setting
- Default settings: tabsSecondClickActPrev: false ([#1521](https://github.com/mbnuqw/sidebery/issues/1521))  
- Recalc native tabs visibility when a globally pinned tab is active ([#700](https://github.com/mbnuqw/sidebery/issues/700))

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
