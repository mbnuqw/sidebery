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

**Stable** (v5.5.0):
[Release page](https://github.com/mbnuqw/sidebery/releases/tag/v5.5.0) |
[Addon page](https://addons.mozilla.org/firefox/addon/sidebery/) |
[Install](https://addons.mozilla.org/firefox/downloads/file/4688454/sidebery-5.5.0.xpi) (reviewed by Mozilla)  
**Nightly** (v5.5.0.1):
[Install](https://github.com/mbnuqw/sidebery/releases/download/v5.5.0/sidebery-5.5.0.1.xpi)
> [!NOTE]
> Nightly release is a signed build created via [github actions](https://github.com/mbnuqw/sidebery/actions/workflows/nightly-release.yml). It supports an auto-updates and is designed for testing new features. A few previous nightly releases can be found in the Assets section of the latest [release notes](https://github.com/mbnuqw/sidebery/releases).
>
> If you're manually updating an already installed Sidebery version you also need to open the Add-ons Manager (about:addon) and click on the 'Update Now' button in the Sidebery card or restart the browser.

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

## How to hide native tabs?

<details><summary><b> Option 1 (Activating native vertical tabs) </b></summary>

Enable native vertical tabs. This can be done in one of the following ways:
- Right-click on the free space of the toolbar or tab-bar and click on the "Turn on Vertical Tabs".
- Open `about:config` and enable these settings: `sidebar.revamp`, `sidebar.verticalTabs`.

Then resize the native sidebar (with the vertical tabs) to its minimum.

Optionally, you can round the corner of the web page area by enabling `sidebar.revamp.round-content-area` in `about:config`.

<img width="940" alt="gui" src="https://github.com/user-attachments/assets/b7d04c1c-1d23-48d6-a802-92d228f44f06" />

This will save vertical space, but the native tabs will still be showed and Firefox's sidebar header will take some space from Sidebery.

You can also try to hide vertical native tabs and sidebar: Right-click on the free space of the native sidebar, then in the "Sidebar settings" section enable "Vertical tabs" and "Hide tabs and sidebar" settings, then open Sidebery. But due to [a Firefox bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1962904) this setting might be ignored on the next browser start or on the opening a new window.

</details>

<details><summary><b> Option 2 (Using userChrome.css) </b></summary>

- Learn how to [comment/uncomment](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Syntax/Comments) parts of your CSS.
- Enable `toolkit.legacyUserProfileCustomizations.stylesheets` in `about:config`.
- In 'Profile Directory' `(Firefox Menu > Help > Troubleshooting Information > Profile Directory)`
create folder `chrome` with file `userChrome.css`.
- Paste, edit (to your needs) and save this code in `userChrome.css` file:

  ```css
  /**
  * Hide sidebar-panel-header (sidebar.revamp: true)
  */
  #sidebar-panel-header {
    display: none;
  }

  /**
  * Dynamic styles
  *
  * Choose when styles below will be activated (comment/uncomment line)
  * - When Sidebery set title preface "."
  * - When Sidebery sidebar is active
  */
  #main-window[titlepreface="."] {
  /* #main-window:has(#sidebar-box[sidebarcommand="_3c078156-979c-498b-8990-85f7987dd929_-sidebar-action"][checked="true"]) { */

    /* Hide horizontal native tabs toolbar */
    #TabsToolbar > * {
      display: none !important;
    }

    /* Hide top window border */
    #nav-bar {
      border-color: transparent !important;
    }

    /* Hide new Firefox sidebar, restyle addon's sidebar */
    #sidebar-main, #sidebar-launcher-splitter {
      display: none !important;
    }
    #sidebar-box {
      padding: 0 !important;
    }
    #sidebar-box #sidebar {
      box-shadow: none !important;
      border: none !important;
      outline: none !important;
      border-radius: 0 !important;
    }
    #sidebar-splitter {
      --splitter-width: 3px !important;
      min-width: var(--splitter-width) !important;
      width: var(--splitter-width) !important;
      padding: 0 !important;
      margin: 0 calc(-1*var(--splitter-width) + 1px) 0 0 !important;
      border: 0 !important;
      opacity: 0 !important;
    }

    /* Update background color of the #browser area (it's visible near the
    rounded corner of the web page) so it blends with sidebery color with 
    vertical nav-bar. */
    /* #browser {
      background-color: var(--lwt-accent-color) !important;
      background-image: none !important;
    } */

    /* Hide sidebar header (sidebar.revamp: false) */
    #sidebar-header {
      display: none !important;
    }

    /* Uncomment the block below to show window buttons in Firefox nav-bar 
    (maybe, I didn't test it on non-linux-tiled-wm env) */
    /* #nav-bar > .titlebar-buttonbox-container,
    #nav-bar > .titlebar-buttonbox-container > .titlebar-buttonbox {
      display: flex !important;
    } */

    /* Uncomment one of the lines below if you need space near window buttons */
    /* #nav-bar > .titlebar-spacer[type="pre-tabs"] { display: flex !important; } */
    /* #nav-bar > .titlebar-spacer[type="post-tabs"] { display: flex !important; } */
  }
  ```

- Restart the browser
- Optionally, try to turn on/off native vertical tabs to know how it changes the color of the browser toolbar.

Result:

<img width="947" alt="111" src="https://github.com/user-attachments/assets/2f1532dd-aac1-41bb-9dfa-7d025a085ac1" />

- Optionally, add some bells and whistles (add to Sidebery styles editor):

  <details><summary>Rounded corner for vertical nav bar</summary>

  ```css
  /* Do not apply the border from Firefox theme */
  .Notifications + .main-box .central-box {
    height: calc(100% - var(--general-margin));
    margin-top: var(--general-margin);
  }
  .NavigationBar {
    box-shadow: none;
  }
  .NavigationBar.-vert {
    padding: var(--nav-btn-margin) 0 0
  }
  #root[data-pinned-tabs-position="left"]:not([data-nav-layout="horizontal"]) .PinnedTabsBar,
  #root[data-pinned-tabs-position="right"]:not([data-nav-layout="horizontal"]) .PinnedTabsBar {
    padding: var(--general-margin) 0 calc(var(--tabs-margin) * 2);
  }
  #root[data-pinned-tabs-position="left"][data-nav-layout="left"][data-drag="true"] .PinnedTabsBar,
  #root[data-pinned-tabs-position="right"][data-nav-layout="right"][data-drag="true"] .PinnedTabsBar {
    padding: var(--general-margin) 0 16px
  }

  /* Rounded transition between Sidebery nav-bar and Firefox toolbar */
  .main-box {
    --rounding: calc(var(--general-border-radius) + var(--general-margin));
  }
  #root[data-nav-layout="left"] .main-box:before {
    content: '';
    position: absolute;
    top: 0;
    left: var(--nav-btn-width);
    width: var(--rounding);
    height: var(--rounding);
    z-index: 1000;
    pointer-events: none;
    background-image: radial-gradient(
      circle at 100% 100%,
      #00000000,
      #00000000 var(--rounding),
      var(--toolbar-bg) calc(var(--rounding) + 0.5px),
      var(--toolbar-bg)
    );
  }
  ```

  <img width="214" alt="222" src="https://github.com/user-attachments/assets/d605e088-d66b-450e-aab3-36a727e91feb" />

  </details>  

  <details><summary>Full width pinned tabs</summary>

  ```css
  #root.root {--tabs-pinned-height: 32px;}
  #root.root {--tabs-pinned-width: 36px;}

  #root.root .PinnedTabsBar .tab-wrapper {
    width: auto;
    flex-grow: 1;
  }
  #root.root .PinnedTabsBar .tab-wrapper .Tab {
    --tabs-activated-shadow: inset 0 0 0 1px #fff2;
    --tabs-activated-bg: #fff2;
    width: 100%;
    min-width: var(--tabs-pinned-width);
  }
  #root.root .PinnedTabsBar .tab-wrapper .Tab .body {
    --tabs-normal-bg: #ffffff0f;
  }
  #root.root .PinnedTabsBar .tab-wrapper .Tab[data-discarded="true"] .body {
    --tabs-normal-bg: #ffffff06;
  }
  ```

  <img width="403" height="364" alt="screenshot-2025-11-11 23-45-26" src="https://github.com/user-attachments/assets/001b87a0-ad0d-41f4-aa10-e698d725672c" />

  </details>  
  <br/>

  That's basically all custom styles I use myself. I'll try to keep this `userChrome` snippet updated (relative to the beta version of Firefox).

  For more features and other styling options/themes check out these resources:

  - https://github.com/search?q=sidebery+language%3ACSS&type=repositories&s=stars&o=desc
  - https://www.reddit.com/r/FirefoxCSS/search?q=sidebery&restrict_sr=on&sort=relevance&t=all
  - https://trickypr.github.io/FirefoxCSS-Store.github.io/index.html

</details>

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

You can donate to this project, which will motivate me to answer questions, fix reported bugs, implement requested features and generally will speed up development process.

You can also donate to resolving a specific issue (feature request or bug report). To do this, message me to [maxbadryzlov@gmail.com](mailto:maxbadryzlov@gmail.com), we discuss the issue and its possible resolution, and I'll spend my time on that issue after donation.

To purchase cryptocurrency you can use any exchange services, e.g.: [buy.coingate.com](https://buy.coingate.com/), [www.coinbase.com](https://www.coinbase.com/), [www.binance.com](https://www.binance.com/en/crypto/buy), [www.kraken.com](https://www.kraken.com/), etc...

Thank you.

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

<details><summary><b> Tron (TRX), USDT (TRC20), USDC (TRC20) </b></summary>

```
TJEdp1TnsN7Jfhfi9Db8yXKDK8NEUovCZb
```

![TJEdp1TnsN7Jfhfi9Db8yXKDK8NEUovCZb](https://github.com/mbnuqw/sidebery/assets/6276694/bbdefadc-3430-4537-94f1-447244d0e72f)

</details>

<details><summary><b> Litecoin (LTC) </b></summary>

```
ltc1qpv4c4kaahdzhcwzj8yyrwlvnfcw2hw5qpxqr62
```

![ltc1qpv4c4kaahdzhcwzj8yyrwlvnfcw2hw5qpxqr62](https://github.com/user-attachments/assets/4f1b550c-686e-4540-a5fe-04844cfb1326)

</details>

<details><summary><b> Solana (SOL) </b></summary>

```
GdWipUmnhdDa7kqkF3SJm5jTYqp3UsTdbcGCC1xLbVJf
```

![GdWipUmnhdDa7kqkF3SJm5jTYqp3UsTdbcGCC1xLbVJf](https://github.com/mbnuqw/sidebery/assets/6276694/09adb5aa-3c68-48a0-9f21-0201011638d8)

</details>

<details><summary><b> TON </b></summary>

```
UQAxwOfvZQz1YR4qieiE-J4wHiz3zrMXAyxDiRJQQXIDX8MH
```

![UQAxwOfvZQz1YR4qieiE-J4wHiz3zrMXAyxDiRJQQXIDX8MH](https://github.com/user-attachments/assets/d5fffa85-7546-4396-8ee1-4aa32299aa8b)

</details>

## License

[MIT](./LICENSE)
