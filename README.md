# Sidebery

Manage your tabs and bookmarks in sidebar.


## Features

- Vertical tabs
- Bookmarks operations
- Contextual Identities management
- Synchronizing tabs per containers
- Light and dark themes
- Configurable navigation


## Usage

- Open: `Ctrl+E` (windows: `F1`)
- Switch to next panel: `Ctrl+Period`
- Switch to previous panel: `Ctrl+Comma`
- Create new tab in current panel: `Ctrl+Space` or middle click on panel
- Remove tab: `Ctrl+Delete` (macos: `Ctrl+W`)
- ... and all default firefox keybindings


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
> Locales: en, ru  

Install dependencies: `npm install`  
Start dev (locale en): `npm run dev`  
Start dev (locale xx): `npm run dev.xx`  
Build to ./dist: `npm run build`  
Bump version: `npm run up` (or `up.min` / `up.maj` for minor / major)  


## Licence

MIT