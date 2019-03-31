# Sidebery

[![https://addons.mozilla.org/en-US/firefox/addon/sidebery/](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_2.png)](https://addons.mozilla.org/en-US/firefox/addon/sidebery/)

Firefox addon for managing tabs, containers (contextual identities) and bookmarks in sidebar. Supports both flat and tree tabs layouts, per-container include/exclude rules, proxy configs for each container and much more.

## Features

- Vertical tabs layout (flat and tree)
- Bookmarks operations
- Contextual Identities management
- Proxy configs for each container
- Include/Exclude rules for each container
- Creating tabs snapshots for easy recovering
- Light and dark themes
- Customizable styles
- Drag-and-drop
- Configurable navigation with mouse and keyboard
- Multiple tabs/bookmarks selection with right mouse button


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