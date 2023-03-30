# Sidebery

Firefox extension for managing tabs and bookmarks in sidebar.

## Install

**Stable** (4.10.2):
 [Release page](https://github.com/mbnuqw/sidebery/releases/tag/v4.10.2) |
 [Addon page](https://addons.mozilla.org/firefox/addon/sidebery/) |
 [Install](https://addons.mozilla.org/firefox/downloads/file/3994928/sidebery-4.10.2.xpi)  
**Beta** (5.0.0b31):
 [Release page](https://github.com/mbnuqw/sidebery/releases/tag/v5.0.0b31) |
 [Install](https://github.com/mbnuqw/sidebery/releases/download/v5.0.0b31/sidebery-5.0.0b31.xpi)

> Note: Before installing the beta version make sure to save backup of the Add-on data (Sidebery settings / Help / Export).

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

## Build

> Prerequisites: latest LTS Node.js version

1. Install dependencies: `npm install`
2. Build all parts of Add-on: `npm run build`
3. Create Add-on archive in `./dist`: `npm run build.ext`

After creating the Add-on archive, you can then use the version in Firefox as follows:

1. Open Firefox
2. Go to `about:debbuging`
3. Go to "This Firefox"
4. At "Temporary Extensions" click on "Load Temporary Add-on..."
5. Select the `.zip` file in the `dist` directory.
6. Close the settings tab
7. Your Firefox now always runs with the development version
8. For updating: Repeat all steps.

## Development

> Prerequisites: latest LTS Node.js version

Install dependencies: `npm install`  
Build and watch for changes: `npm run dev`  
Run browser with Add-on: `npm run dev.run -- <firefox-executable>`

## License

[MIT](./LICENSE)

## Donate

You can donate to this project, which will motivate me to spend more time on Sidebery.

<details><summary><b> Bitcoin (BTC): </b></summary>

```
bc1q2drx3x5pfl0c68urwztvjrwgksg9u3l7mn4g4m
```
![btc-bc1q2drx3x5pfl0c68urwztvjrwgksg9u3l7mn4g4m](https://user-images.githubusercontent.com/6276694/215584021-b1eee3ab-ca62-4a81-acb4-cd69c27c734a.png)

</details>

<details><summary><b> Ethereum (ETH): </b></summary>

```
0x11667D20AB328194AEEc68F9385CCcf713607929
```
![eth-0x11667D20AB328194AEEc68F9385CCcf713607929](https://user-images.githubusercontent.com/6276694/215587549-39505f92-0f80-43ec-bec1-42bf8cd570c4.png)

</details>
