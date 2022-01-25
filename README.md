# 🚧 Bugsbery v5 <sup><sup><sub>beta</sub></sup></sup> 🚧

This is a branch of the next major version of Sidebery.

## Some notable changes/additions

- Lots of bugs (even more than in v4)
- Search
- History panel (experimental)
- Downloads panel (experimental)
- Statistics panel (experimental)
- Trash-bin panel (experimental)
- Reworked navigation bar
- Configurable "new tab" buttons bar
- Ability to use multiple bookmark panels with different root folders
- Converting tabs panel to bookmarks panel and vice versa
- Saving and restoring tabs panel to/from bookmarks folder
- Proton theme (+ two more)
- Support of the Firefox theme colors
- ...and more other <sub><sup><strike>bugs</strike></sup></sub> features

---

## Install

Only for Developer Edition or Nightly Firefox.  
Download prebuilt file (unsigned zip archive) from releases page or build it yourself. In `about:addons` click on the "gears" icon, then "Install Add-on From File...".

## Build

Install dependencies: `npm install`  
Build all parts of addon: `npm run build`  
Create addon archive in ./dist: `npm run build.ext`

## Development

Install dependencies: `npm install`  
Build and watch for changes: `npm run dev`  
Run browser with addon: `npm run dev.run -- <firefox-executable>`  

---

## Licence

MIT
