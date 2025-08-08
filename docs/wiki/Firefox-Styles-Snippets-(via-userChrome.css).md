# Firefox Styles Snippets (via userChrome.css)

> ## Warning
> At least basic knowledge of CSS is required. The following snippets may stop working with some next Firefox update and are provided just as examples of customization.
>
> 

<br>

> Note: Starting with Firefox 69 you have to enable toolkit.legacyUserProfileCustomizations.stylesheets in about:config.

In 'Profile Directory' `(Menu > Help > Troubleshooting Information > Profile Directory)`
create folder `chrome` with file `userChrome.css`.

To find and inspect browser's selectors open [Browser Toolbox](https://developer.mozilla.org/en-US/docs/Tools/Browser_Toolbox).

---

<br>

### Completely hide native tabs strip

Use https://github.com/MrOtherGuy/firefox-csshacks (https://mrotherguy.github.io/firefox-csshacks/):

- [hide_tabs_toolbar](https://mrotherguy.github.io/firefox-csshacks/?file=hide_tabs_toolbar.css)
- [hide_tabs_toolbar_osx](https://mrotherguy.github.io/firefox-csshacks/?file=hide_tabs_toolbar_osx.css)
- [window_control_placeholder_support](https://mrotherguy.github.io/firefox-csshacks/?file=window_control_placeholder_support.css)

<br>

### Decrease size of the sidebar header

```css
/**
 * Decrease size of the sidebar header
 */
#sidebar-header {
  font-size: 1.2em !important;
  padding: 2px 6px 2px 3px !important;
}
#sidebar-header #sidebar-close {
  padding: 3px !important;
}
#sidebar-header #sidebar-close .toolbarbutton-icon {
  width: 14px !important;
  height: 14px !important;
  opacity: 0.6 !important;
}
```

<br>

### Dynamic native tabs (for hiding native horizontal tabs)

https://github.com/user-attachments/assets/a8c588df-9346-4af9-9b22-78f8f3fec692

Tested on Firefox v134

- Set window preface value:  
`Sidebery settings` > `Help` > `Preface value`  
note: in this example: XXX  
note: value can be an ["empty" unicode sign](https://unicode-explorer.com/c/200B)  
- userChrome css (with animations):
```css
/**
 * Dynamic Horizontal Tabs Toolbar (with animations)
 * sidebar.verticalTabs: false (with native horizontal tabs)
 */
#main-window #TabsToolbar > .toolbar-items {
  overflow: hidden;
  transition: height 0.3s 0.3s !important;
}
/* Default state: Set initial height to enable animation */
#main-window #TabsToolbar > .toolbar-items { height: 3em !important; }
#main-window[uidensity="touch"] #TabsToolbar > .toolbar-items { height: 3.35em !important; }
#main-window[uidensity="compact"] #TabsToolbar > .toolbar-items { height: 2.7em !important; }
/* Hidden state: Hide native tabs strip */
#main-window[titlepreface*="XXX"] #TabsToolbar > .toolbar-items { height: 0 !important; }
/* Hidden state: Fix z-index of active pinned tabs */
#main-window[titlepreface*="XXX"] #tabbrowser-tabs { z-index: 0 !important; }
/* Hidden state: Hide window buttons in tabs-toolbar */
#main-window[titlepreface*="XXX"] #TabsToolbar .titlebar-spacer,
#main-window[titlepreface*="XXX"] #TabsToolbar .titlebar-buttonbox-container {
  display: none !important;
}
/* [Optional] Uncomment block below to show window buttons in nav-bar (maybe, I didn't test it on non-linux-i3wm env) */
/* #main-window[titlepreface*="XXX"] #nav-bar > .titlebar-buttonbox-container,
#main-window[titlepreface*="XXX"] #nav-bar > .titlebar-buttonbox-container > .titlebar-buttonbox {
  display: flex !important;
} */
/* [Optional] Uncomment one of the line below if you need space near window buttons */
/* #main-window[titlepreface*="XXX"] #nav-bar > .titlebar-spacer[type="pre-tabs"] { display: flex !important; } */
/* #main-window[titlepreface*="XXX"] #nav-bar > .titlebar-spacer[type="post-tabs"] { display: flex !important; } */
```
- userChrome css (without animations):
```css
/**
 * Dynamic Horizontal Tabs Toolbar (without animations)
 * sidebar.verticalTabs: false (with native horizontal tabs)
 */
#main-window #TabsToolbar > .toolbar-items { overflow: hidden; }
 /* Hidden state: Hide native tabs strip */
#main-window[titlepreface*="XXX"] #TabsToolbar > .toolbar-items { height: 0 !important; }
/* Hidden state: Fix z-index of active pinned tabs */
#main-window[titlepreface*="XXX"] #tabbrowser-tabs { z-index: 0 !important; }
/* Hidden state: Hide window buttons in tabs-toolbar */
#main-window[titlepreface*="XXX"] #TabsToolbar .titlebar-spacer,
#main-window[titlepreface*="XXX"] #TabsToolbar .titlebar-buttonbox-container {
  display: none !important;
}
/* [Optional] Uncomment block below to show window buttons in nav-bar (maybe, I didn't test it on non-linux-i3wm env) */
/* #main-window[titlepreface*="XXX"] #nav-bar > .titlebar-buttonbox-container,
#main-window[titlepreface*="XXX"] #nav-bar > .titlebar-buttonbox-container > .titlebar-buttonbox {
  display: flex !important;
} */
/* [Optional] Uncomment one of the line below if you need space near window buttons */
/* #main-window[titlepreface*="XXX"] #nav-bar > .titlebar-spacer[type="pre-tabs"] { display: flex !important; } */
/* #main-window[titlepreface*="XXX"] #nav-bar > .titlebar-spacer[type="post-tabs"] { display: flex !important; } */
```

<br>

### Native gnome look (by [@Fletcher-Alderton](https://github.com/Fletcher-Alderton))

![GNOME Theme Image](./assets/GNOME-Theme.png)  

It's a modified version of the Firefox GNOME theme from https://github.com/rafaelmardojai/firefox-gnome-theme

1. Clone the repo to a subdirectory (in the `chrome`  folder):

```shell
git clone https://github.com/rafaelmardojai/firefox-gnome-theme.git
```
  
2. Create single-line user CSS files if non-existent or empty (at least one line is needed for `sed`):

```shell
[[ -s userChrome.css ]] || echo >> userChrome.css
[[ -s userContent.css ]] || echo >> userContent.css
```
  
3. Import this theme at the beginning of the CSS files (all `@import`s must come before any existing `@namespace` declarations):

```shell
sed -i '1s/^/@import "firefox-gnome-theme\/userChrome.css";\n/' userChrome.css
sed -i '1s/^/@import "firefox-gnome-theme\/userContent.css";\n/' userContent.css
```
  
4. Symlink preferences file:    

```shell
cd .. # Go back to the profile directory
ln -fs chrome/firefox-gnome-theme/configuration/user.js user.js
```

1. Remove Tabs strip (add this to `userChrome.css`)

```css
#TabsToolbar {
  display: none;
}
```

6. Hide sidebar top-menu

```css
#sidebar-header {
  display: none;
}
```

7. If desired, hide sidebar revamp (the part with Firefox tools)

Set `sidebar.revamp` to `false` in about:config.

8. Restart Firefox.
