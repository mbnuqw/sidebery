# Sidebery

[![https://addons.mozilla.org/firefox/addon/sidebery/](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_2.png)](https://addons.mozilla.org/firefox/addon/sidebery/)


## About

Sidebery provides the list of tabs structured in a tree and bookmarks within the customizable panels. It aims to be fast, beautiful* and configurable. Some of the key features:

### Vertical tabs layout (flat or tree)

You can use a simple flat list of tabs or tree structure. Tree layout allows you to fold sub-tries, creates groups with a custom name to organize open pages.

### Bookmarks panel

Simple catalogs of your bookmarks. You can drag and drop links or tabs to create bookmarks and vice-versa. Basic operations: open in new window / sort / create / edit / delete.

Other bookmarks features: 
- Automatically delete an open bookmark from "Other Bookmarks" folder.
- Highlight open bookmarks and activate its tab instead of opening new on clicking.

### Tabs panels

Configurable panels will help you sort your tabs.

### Containers management

You can set "Include" and "Exclude" url-rules, proxy config and UserAgent header for each container.

### Customizable context menu

Sidebery allows you to change the context menu for tabs and bookmarks. You can enable/disable/move different options, create sub-menus/separators.

### Multi-selection with right mouse button or keyboard shortcuts

You can select multiple tabs or bookmarks only with the mouse - push right mouse button and then move the cursor to adjust selection range.  
`note: This feature is not working with the native context menu.`

Also, you can use ctrl+click/shift+click method or use keyboard shortcuts.

### Customizable styles

Sidebery provides full control of styles for sidebar and group page via variables and custom CSS.

> NOTE: To get currently available css-selectors use debugger:
>   - Enter "about:debugging" in the URL bar
>   - In the left-hand menu, click This Firefox (or This Nightly)
>   - Click Inspect next to Sidebery extension
>   - Select frame to inspect
>     - Click on the rectangular icon (with three sections) in top-right area of the debugger page
>     - Select "/sidebar/index.html" for sidebar frame
>     - Select "/group/group.html" for group page frame
>   - Browse "Inspector" tab


### Snapshots

You can setup auto snapshots that will keep info about open windows and tabs.


---

## Usage

- [User guide](https://github.com/mbnuqw/sidebery/wiki/User-guide)
  - [Containers](https://github.com/mbnuqw/sidebery/wiki/User-guide#containers)
  - [Panels](https://github.com/mbnuqw/sidebery/wiki/User-guide#panels)
  - [Tabs](https://github.com/mbnuqw/sidebery/wiki/User-guide#tabs)
  - [Bookmarks](https://github.com/mbnuqw/sidebery/wiki/User-guide#bookmarks)
  - [Drag and Drop](https://github.com/mbnuqw/sidebery/wiki/User-guide#drag-and-drop)
- [Firefox Styles Snippets (via userChrome.css)](https://github.com/mbnuqw/sidebery/wiki/Firefox-Styles-Snippets-(via-userChrome.css))
  - [Completely hide tabs strip](https://github.com/mbnuqw/sidebery/wiki/Firefox-Styles-Snippets-(via-userChrome.css)#completely-hide-tabs-strip)
  - [Hide sidebar top-menu](https://github.com/mbnuqw/sidebery/wiki/Firefox-Styles-Snippets-(via-userChrome.css)#hide-sidebar-top-menu)
- [Sidebery Styles Snippets](https://github.com/mbnuqw/sidebery/wiki/Sidebery-Styles-Snippets)


---

## Build

Install dependencies: `npm install`  
Build all parts of addon in release mode: `npm run build`  
Run ./addon in browser: `npm run dev.ext[.beta|.nightly]`  
Create addon archive in ./dist: `npm run build.ext`  

---

## Licence

MIT
