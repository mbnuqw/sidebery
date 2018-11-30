# Sidebery

Manage your tabs and bookmarks in sidebar.


## Features

- Vertical layout
- Bookmarks operations
- Contextual Identities management
- Synchronizing containers
- Different proxy settings for each containers
- Creating tabs snapshots for easy recovering
- Light and dark themes
- Configurable navigation
- Multiple tabs selection with right mouse button


## Usage

- Open - `Ctrl+E` (windows: `F1`) or click on extension button
- Switch to next panel - `Alt+Period` or scroll to right (if configured)
- Switch to previous panel - `Alt+Comma` or scroll to left (if configured)
- Create new tab in current panel - `Ctrl+Space` or middle click on panel
- Remove tab - `Ctrl+Delete` (macos: `Ctrl+W`)
- Select tabs and open context menu - push right mouse button and move cursor
- Select all - `Alt+G`
- Select next/prev element - `Alt+Down/Up`
- Open panel menu - right click on panel icon


## Hide/customize native panels

In 'Profile Directory' `(Menu > Help > Troubleshooting Information > Profile Directory)` 
create folder `chrome` with file `userChrome.css`:

```css
@-moz-document url("chrome://browser/content/browser.xul") {
  /* --- Completely hide tabs strip  --- */
  #TabsToolbar {
    visibility: collapse !important;
  }
  /* --- OR Hide tabs strip only in fullscreen --- */
  /* #TabsToolbar[inFullscreen="true"] {
    visibility: collapse !important;
  } */

  /* --- Preserve top panel height (macos) --- */
  /* #TabsToolbar {
    height: 30px !important;
  } */

  /* --- Hide content of top bar --- */
  /* #TabsToolbar > * {
    visibility: collapse;
  } */

  /* --- Hide sidebar top-menu --- */
  #sidebar-header {
    visibility: collapse;
  }

  /* --- Customize border between sidebar and page --- */
  /* #sidebar-splitter {
    width: 2px !important;
    border: none !important;
    background-color: #242424 !important;
  } */
}
```


## Build

> Framework: Vue  
> Bundler: Parcel  
> Tests: Jest  

Install dependencies: `npm install`  
Start dev: `npm run dev`  
Build to ./dist: `npm run build`  


## Licence

MIT