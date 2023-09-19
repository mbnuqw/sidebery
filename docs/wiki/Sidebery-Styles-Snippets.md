## General Info

Styles editor can be found in:  
`Sidebery settings` > `Styles editor` (in the navigation sidebar)  
or `Sidebery settings` > `Appearance` > `Edit styles`  


To get currently available css-selectors use debugger:
  - Enter "about:debugging" in the URL bar
  - In the left-hand menu, click This Firefox (or This Nightly)
  - Click Inspect next to Sidebery extension
  - Select frame to inspect
    - Click on the rectangular icon (with three sections) in top-right area of the debugger page
    - Select "/sidebar/index.html" for sidebar frame
    - Select "/group/group.html" for group page frame
  - Browse "Inspector" tab

<br>

## Tab Favicons on the Right

![Tabs favicons on the right](./assets/tabs-favs-right.png)

- Set custom css:

```css
.Tab .fav {
  order: 1;
}

.Tab .title {
  padding-left: 8px;
}

.Tab .close {
  right: 24px;
}
```

<br>

## Tabs multiline titles

![Tabs multiline titles](./assets/tabs-multiline-titles.png)

- Set custom css:

```css
#root {
  --tabs-height: 36px !important;
  --tabs-title-padding: 8px;
  --tabs-font-size: .8rem;
  --tabs-title-lines: 2;
}

.Tab .t-box {
  align-items: center;
  max-height: calc(var(--tabs-height) - var(--tabs-title-padding));
  overflow: hidden;
}

.Tab .title {
  font-size: var(--tabs-font-size);
  white-space: pre-wrap;
  line-height: calc((var(--tabs-height) - var(--tabs-title-padding)) / var(--tabs-title-lines));
}
```

<br>

## Vertical panel labels

![Vertical panel labels](./assets/vert-nav-labels.png)

- Set layout of navigation bar to "vertical"  
`Sidebery settings` > `Navigation bar` > `Layout`
- Set custom css:

```css
#root {
  --nav-btn-width: 24px;
  --nav-btn-height: 24px;
  --name-font-size: .8rem;
  --count-font-size: .65rem;
}

.NavigationBar .main-items .nav-item[data-class="panel"] {
  display: flex;
  flex-direction: column-reverse;
  padding: 6px 0;
  height: auto;
}

.NavigationBar .main-items .nav-item[data-class="panel"] .badge {
	top: 1px;
  left: auto;
  right: 1px;
}

.NavigationBar .main-items .nav-item[data-class="panel"] .icon,
.NavigationBar .main-items .nav-item[data-class="panel"] .bookmarks-badge-icon {
	display: none;
}

.NavigationBar .main-items .nav-item .bookmarks-badge-icon {
	top: auto;
	left: auto;
	bottom: 3px;
	right: 1px;
}

.NavigationBar .main-items .nav-item .len {
  position: relative;
  font-size: var(--count-font-size);
  writing-mode: sideways-lr;
  text-orientation: mixed;
  background-color: transparent;
  padding: 0;
  margin: 2px 2px 1px 0;
  top: 0;
  right: 0;
	color: var(--container-fg, var(--nav-btn-fg));
}
.NavigationBar .main-items .nav-item .len:before {
  content: ": ";
  font-size: var(--name-font-size);
}

.NavigationBar .main-items .nav-item[data-class="panel"] .name-box {
  position: relative;
  display: block;
  padding: 0;
  margin: 0 2px 0px 0;
  font-size: var(--name-font-size);
  color: var(--container-fg, var(--nav-btn-fg));
  writing-mode: sideways-lr;
  text-orientation: mixed;
}
```
