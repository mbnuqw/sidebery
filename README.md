# Sidebery

Firefox extension for managing tabs and bookmarks in sidebar.

## Install

**Stable** (4.10.2):
 [Release page](https://github.com/mbnuqw/sidebery/releases/tag/v4.10.2) |
 [Addon page](https://addons.mozilla.org/firefox/addon/sidebery/) |
 [Install](https://addons.mozilla.org/firefox/downloads/file/3994928/sidebery-4.10.2.xpi)  
**Beta** (5.0.0b28):
 [Release page](https://github.com/mbnuqw/sidebery/releases/tag/v5.0.0b29) |
 [Install](https://github.com/mbnuqw/sidebery/releases/download/v5.0.0b29/sidebery-5.0.0b29.xpi)

> Note: Before installing the beta version make sure to save backup of the addon data (Sidebery settings / Help / Export).

---

## About

Sidebery is a highly configurable sidebar with panels of different types. Some of the key features:

- Vertical tabs panels with tree or flat layout
- Bookmarks panels
- (v5) History panel
- (v5) Search in panels
- Customizable context menu
- Customizable styles
- Snapshots (saved windows/panels/tabs)
- ...and more

---

## Build

> Prerequisites: latest LTS Node.js version

Install dependencies: `npm install`  
Build all parts of addon: `npm run build`  
Create addon archive in ./dist: `npm run build.ext`

## Development

> Prerequisites: latest LTS Node.js version

Install dependencies: `npm install`  
Build and watch for changes: `npm run dev`  
Run browser with addon: `npm run dev.run -- <firefox-executable>`  

---

## Licence

MIT
