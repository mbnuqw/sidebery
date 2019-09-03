# Sidebery

[![https://addons.mozilla.org/en-US/firefox/addon/sidebery/](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_2.png)](https://addons.mozilla.org/en-US/firefox/addon/sidebery/)


## About

Sidebery combines vertical layout of tabs with Firefox's containers to provide the more convenient way of working with a big amount of open pages. It aims to be fast and beautiful and gives a lot of options for customizing. Some of the key features:

### Vertical tabs layout (flat or tree)

You can use a simple flat list of tabs or tree structure. Tree layout allows you to fold sub-tries, creates groups with a custom name to organize open pages.

### Bookmarks panel

Simple catalogs of your bookmarks. You can drag and drop links or tabs to create bookmarks and vice-versa. Basic operations: open in new window / create / edit / delete.

Other bookmarks features: 
- Automatically delete an open bookmark from "Other Bookmarks" folder.
- Highlight open bookmarks and activate its tab instead of opening new on clicking.

### Advanced containers management

Isolate your internet activity with Firefox's containers. Sidebery separates containered tabs by panels and allows you to switch between them with the mouse or keyboard shortcuts.

### Containers proxy, include and exclude rules

With this addon, you also can set proxy for different containers, use "include" and "exclude" rules to control what page should be open in which container.

### Customizable context menu

Sidebery allows you to change the context menu for tabs and bookmarks. You can enable/disable/move different options, create sub-menus/separators.

### Multi-selection with right mouse button or keyboard shortcuts

You can select multiple tabs or bookmarks only with the mouse - push right mouse button and then move the cursor to adjust selection range.  
`note: This feature is not working with the native context menu.`

Also, you can use ctrl+click/shift+click method or use keyboard shortcuts.

### Customizable styles

Sidebery provides full control of styles for sidebar and group page via variables and custom CSS.  
`note: css selectors can be changed in the next version`

### Snapshots

You can setup auto snapshots that will keep info about open windows and tabs.


---

## Usage

__Open sidebery__  
Shortcut `ctrl+E` (default) or click on Sidebery button.

__Create new tab__  
`ctrl+T` - In default container.  
`ctrl+space` - In active panel.  
`ctrl+shift+space` - after active tab.  
Also "Middle click on panel", "Left click on panel's icon" and other configurable methods...  

__Switch between containers__  
`alt+Comma(<)` - to previous panel  
`alt+Period(>)` - to next panel  
Scroll on navigation strip - (optional)  
Horizontal scroll - (optional)  

__Switch between tabs__  
`ctrl+PgUp/PgDown` - firefox's defaults  
`alt+Up/Down` + `alt+space` - select tab and activate it  
Scroll - (optional)  

__Open dashboard of panel__  
Right-click on panel's icon  

__Expand/Fold parent tab__  
Click on favicon of target tab.  

__Expand/Fold tabs or bookmarks while dragging elements__  
Move mouse cursor to pointer's triangle.  

__Select all descendants of tab__  
Right click on favicon.  

__Close whole tabs branch__  
Right click on close button.  

__Switch panel while dragging elements__  
Move mouse cursor to panel's icon.  

---

## Tips and Tricks

### userChrome.css

In 'Profile Directory' `(Menu > Help > Troubleshooting Information > Profile Directory)`
create folder `chrome` with file `userChrome.css`:

```css
@namespace url("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");

/* ...your css here... */
```

To find and inspect browser's selectors open [Browser Toolbox](https://developer.mozilla.org/en-US/docs/Tools/Browser_Toolbox).

__Completely hide tabs strip__  
```css
#TabsToolbar {
  display: none;
}
```

__Hide tabs strip only in fullscreen__  
```css
#TabsToolbar[inFullscreen="true"] {
  display: none;
}
```

__Hide sidebar top-menu__  
```css
#sidebar-header {
  display: none;
}
```

---

## Build

> Framework: Vue  
> Bundler: Parcel  
> Tests: Jest

Install dependencies: `npm install`  
Build all parts of addon: `npm run build`  
Create addon archive in ./dist: `npm run build.ext`

---

## Licence

MIT
