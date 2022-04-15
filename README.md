# Sidebery

Firefox extension for managing tabs and bookmarks in sidebar.

## Install

| Release | Link |
|---------|------|
| Stable | [v4.10.0 (addons.mozilla.org)](https://addons.mozilla.org/firefox/addon/sidebery/) |
| Beta   | [v5.0.0b16 (Github release)](https://github.com/mbnuqw/sidebery/releases/tag/v5.0.0b16) |

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
