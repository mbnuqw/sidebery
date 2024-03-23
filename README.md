<div align="center">

<img src="docs/assets/readme-logo.svg" height="96" alt="Sidebery">

<br>
<br>

Firefox extension for managing tabs and bookmarks in sidebar.

</div>

<br>

<div align="center">

<img src="docs/assets/screenshot-003.png" width="20%" alt="screenshot-003" title="Firefox theme: Modern Light"><img src="docs/assets/screenshot-002.png" width="20%" alt="screenshot-002" title="Firefox theme: Arc Dark Theme"><img src="docs/assets/screenshot-005.png" width="20%" alt="screenshot-005" title="Firefox theme: Modern Light"><img src="docs/assets/screenshot-009.png" width="20%" alt="screenshot-009" title="Firefox theme: Vampyric Dark"><img src="docs/assets/screenshot-011.png" width="20%" alt="screenshot-011" title="Firefox theme: Modern Light">

</div>

<br>

<div align="center">

![Mozilla Add-on Users](https://img.shields.io/amo/users/%7B3c078156-979c-498b-8990-85f7987dd929%7D?label=Users)
![Mozilla Add-on Downloads](https://img.shields.io/amo/dw/%7B3c078156-979c-498b-8990-85f7987dd929%7D?label=Downloads&color=%2311aa55)
![Mozilla Add-on Stars](https://img.shields.io/amo/stars/%7B3c078156-979c-498b-8990-85f7987dd929%7D?label=Rating&color=%23aa5566)

</div>

## Install

**Stable** (v5.2.0):
[Release page](https://github.com/mbnuqw/sidebery/releases/tag/v5.2.0) |
[Addon page](https://addons.mozilla.org/firefox/addon/sidebery/) |
[Install](https://addons.mozilla.org/firefox/downloads/file/4246774/sidebery-5.2.0.xpi) (reviewed by Mozilla)  
**Nightly** (v5.2.0.3):
[Release page](https://github.com/mbnuqw/sidebery/releases/tag/v5.2.0) |
[Install](https://github.com/mbnuqw/sidebery/releases/download/v5.2.0/sidebery-5.2.0.3.xpi)

## About

Sidebery is a highly configurable sidebar with panels of different types. Some of the key features:

- Vertical tabs panels with tree or flat layout
- Bookmarks panels
- History panel
- Search in panels
- Customizable context menu
- Customizable styles
- Snapshots (saved windows/panels/tabs)
- ...and more

## Incompatibility with other addons

Sidebery may conflict with addons that handle position of new tabs (e.g. Tree Style Tabs) or addons that move/sort tabs, which may result in unexpected behavior or broken tabs state at initialization. To avoid potential issues, please, disable such addons in Add-ons Manager page (about:addons).

## How to hide native (horizontal) tabs?

Firefox doesn't allow addons to hide native tabs, so you have two options:

- You know CSS and can maintain it after Firefox updates: [Use userChrome.css hack](https://github.com/mbnuqw/sidebery/wiki/Firefox-Styles-Snippets-(via-userChrome.css)#completely-hide-native-tabs-strip)
- Otherwise: [Use Floorp](https://floorp.app/) ([github](https://github.com/Floorp-Projects/Floorp))
  - Install Sidebery
  - In Floorp settings set:
    - Design >> Tab Bar Style >> Horizontal Tab Bar
    - Design >> Tab Bar >> Hide tabs on Horizontal Tab Bar
    - [To hide the sidebar header] Design >> Tab Bar Style >> Collapse Tree Style Tab
    - [To auto-hide sidebar] Use "Lepton UI" and check its settings

## Build

> Prerequisites: latest LTS Node.js version

1. Install dependencies: `npm install`
2. Build all parts of Add-on: `npm run build`
3. Create Add-on archive in `./dist`: `npm run build.ext`

After creating the Add-on archive, you can then use the version in Firefox as follows:

1. Open Firefox
2. Go to `about:debugging`
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

## Donate

You can donate to this project, which will motivate me to answer questions, fix reported bugs, implement requested features and generally will speed up development process. Thank you.

<details><summary><b> Bitcoin (BTC) </b></summary>

```
bc1q2drx3x5pfl0c68urwztvjrwgksg9u3l7mn4g4m
```

![btc-bc1q2drx3x5pfl0c68urwztvjrwgksg9u3l7mn4g4m](https://user-images.githubusercontent.com/6276694/215584021-b1eee3ab-ca62-4a81-acb4-cd69c27c734a.png)

</details>

<details><summary><b> Ethereum (ETH), USDT (ERC20), USDC (ERC20) </b></summary>

```
0x11667D20AB328194AEEc68F9385CCcf713607929
```

![eth-0x11667D20AB328194AEEc68F9385CCcf713607929](https://user-images.githubusercontent.com/6276694/215587549-39505f92-0f80-43ec-bec1-42bf8cd570c4.png)

</details>

<details><summary><b> USDT (TRC20), USDC (TRC20) </b></summary>

```
TJEdp1TnsN7Jfhfi9Db8yXKDK8NEUovCZb
```

![TJEdp1TnsN7Jfhfi9Db8yXKDK8NEUovCZb](https://github.com/mbnuqw/sidebery/assets/6276694/bbdefadc-3430-4537-94f1-447244d0e72f)

</details>

<details><summary><b> Solana (SOL) </b></summary>

```
GdWipUmnhdDa7kqkF3SJm5jTYqp3UsTdbcGCC1xLbVJf
```

![GdWipUmnhdDa7kqkF3SJm5jTYqp3UsTdbcGCC1xLbVJf](https://github.com/mbnuqw/sidebery/assets/6276694/09adb5aa-3c68-48a0-9f21-0201011638d8)

</details>

## License

[MIT](./LICENSE)
