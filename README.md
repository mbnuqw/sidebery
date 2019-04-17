# Sidebery

[![https://addons.mozilla.org/en-US/firefox/addon/sidebery/](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_2.png)](https://addons.mozilla.org/en-US/firefox/addon/sidebery/)

## About

Sidebery combines vertical layout of tabs with Firefox's containers to provide more convenient way of working with big amount of opened pages. It aims to be fast and beautiful and gives a lot of options for customizing. Some of key features:

### Vertical tabs layout (flat or tree)

You can use simple flat list of tabs or tree structure. Tree layout allows you to fold sub-tries, creates groups with custom name to organize opened pages.

### Bookmarks panel for easy access

Simple catalogs of your bookmarks. You can drag and drop links or tabs to create bookmarks and vice-versa.

### Advanced containers management

Isolate your internet activity with Firefox's containers. Sidebery separates containers by panels and allow you to switch between them with mouse or keyboard shortcuts. With this addon you also can set proxy for different containers, use "include" and "exclude" rules to control what page should be opened in which container.

### Multi-selection with right mouse button or keyboard shortcuts

Select multiple tabs or bookmarks to apply actions to them or drag and drop them.

### Customizable styles

Sidebery provides the way to customize some of style properties like colors, sizes, fonts of different elements.

### Snapshots

You can create snapshots of currently opened tabs and their tree structure and restore them later.

---

## Usage

__Open sidebery__  
Shortcut `ctrl+E` (default) or click on Sidebery button.

__Create new tab__  
`ctrl+T` - In default container.  
`ctrl+space` - In currently active container.  
`ctrl+shift+space` - after currently active tab.  
Middle click on panel - in currently active container.  
Left click on panel's icon - in currently active container.  
...other methods may be found in settings  

__Switch between containers__  
`alt+Comma(<)` - to previous panel  
`alt+Period(>)` - to next panel  
Scroll on navigation strip  
Horizontal scroll (configurable)  

__Switch between tabs__  
`ctrl+PgUp/PgDown` - firefox's defaults  
`alt+Up/Down` + `alt+space` - select tab and activate it  
Scroll (configurable)  

__Open dashboard of panel__  
Right-click on panel's icon

---

## Tips and Tricks
__To expand/fold tabs or bookmarks while dragging elements__ - move mouse cursor to pointer's triangle.  
__To expand/fold tab__ - left click on favicon.  
__To select all descendants of tab__ - right click on favicon.  
__To close tab all it's descendants__ - right click on close button.  
__To switch to some panel while dragging elements__ - move mouse cursor to panel's icon.  

### Hide/customize native panels

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

---

## Build

> Framework: Vue  
> Bundler: Parcel  
> Tests: Jest

Install dependencies: `npm install`  
Start dev: `npm run dev`  
Build to ./dist: `npm run build`

---

## Donate

If you like this project, you can support it with the following methods:

<a title="Buy Me A Coffee" href="https://www.buymeacoffee.com/diQuHDMa6" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>
<a title="PayPal" href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=G8VTVV2PPX2SL&source=url"><img src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" alt="PayPal"></a>

---

## Licence

MIT
