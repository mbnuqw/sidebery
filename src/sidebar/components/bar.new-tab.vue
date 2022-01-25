<template lang="pug">
.new-tab-btns(
  :data-new-tab-bar-position="Settings.reactive.newTabBarPosition"
  :data-sel="panel.selNewTab")
  .new-tab-bg
  .new-tab-btn(
    @mousedown="onNewTabMouseDown($event)"
    @mouseup="onNewTabMouseUp"
    @contextmenu="onNewTabCtxMenu")
    svg: use(xlink:href="#icon_plus")
  .new-tab-btn.-custom(
    v-for="btn of btns"
    :title="btn.title"
    :data-br="!btn.title"
    :data-color="btn.containerId && Containers.reactive.byId[btn.containerId]?.color"
    @mousedown="onNewTabMouseDown($event, btn)"
    @mouseup="onNewTabMouseUp"
    @contextmenu="onNewTabCtxMenu")
    svg.-icon(v-if="!btn.domain && btn.containerId")
      use(:xlink:href="btn.icon")
    svg.-icon(v-else-if="btn.icon && btn.icon[0] === '#'")
      use(:xlink:href="btn.icon")
    img.-icon(v-else-if="btn.icon" :src="btn.icon")
    svg.-badge: use(xlink:href="#icon_plus_badge")
</template>

<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { Container, MenuType, TabsPanel } from 'src/types'
import { Settings } from 'src/services/settings'
import { Selection } from 'src/services/selection'
import { Menu } from 'src/services/menu'
import { Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'
import { Containers } from 'src/services/containers'
import { Favicons } from 'src/services/favicons'
import { DOMAIN_RE } from 'src/defaults'

interface NewTabBtn {
  id: string
  title?: string
  icon?: string
  containerId?: string
  url?: string
  domain?: string
  children?: NewTabBtn[]
}

const props = defineProps({
  panel: { type: Object as PropType<TabsPanel>, required: true },
})

const btns = computed<NewTabBtn[]>(() => {
  const btns: NewTabBtn[] = []
  const ids: Record<string, string> = {}
  const rawBtns = props.panel.newTabBtns
  let container: Container | undefined

  for (const conf of rawBtns) {
    if (conf === '') {
      btns.push({ id: '' })
      continue
    }

    if (ids[conf]) continue
    ids[conf] = conf
    container = undefined

    const btn: NewTabBtn = { id: conf }
    const parts: string[] = conf.split(',')

    for (let part of parts) {
      part = part.trim()

      // Url?
      const domain = DOMAIN_RE.exec(part)?.[2]
      if (domain) {
        btn.url = part
        btn.domain = domain
        btn.title = btn.url
        continue
      }

      // Container?
      if (!container) {
        container = Object.values(Containers.reactive.byId).find(c => c.name === part)
        if (container) {
          btn.containerId = container.id
          if (!btn.title) btn.title = container.name
          continue
        }
      }
    }

    if (btn.domain) btn.icon = Favicons.reactive.list[Favicons.reactive.domains[btn.domain]]
    if (!btn.icon && btn.url) btn.icon = Favicons.getFavPlaceholder(btn.url)
    if (!btn.icon && container) btn.icon = '#' + container.icon

    if (btn.title) btns.push(btn)
  }

  return btns
})

function onNewTabMouseDown(e: MouseEvent, btn?: NewTabBtn): void {
  e.stopPropagation()
  Mouse.setTarget('tab.new', 'tab.new')
  Menu.close()

  // Left
  if (e.button === 0) {
    if (e.ctrlKey) {
      if (!props.panel.selNewTab) Selection.selectNewTabBtn(props.panel.id)
      else Selection.deselectNewTabBtn(props.panel.id)
      return
    }

    if (Selection.isSet() && !props.panel.selNewTab) Selection.resetSelection()

    Tabs.createTabInPanel(props.panel, { url: btn?.url, cookieStoreId: btn?.containerId })
  }

  // Middle
  else if (e.button === 1) {
    e.preventDefault()
    Mouse.blockWheel()
    Selection.resetSelection()
    const actTab = Tabs.byId[Tabs.activeId]
    if (actTab && !actTab.pinned && actTab.panelId === props.panel.id) {
      Tabs.createChildTab(actTab.id, btn?.url, btn?.containerId)
    }
  }

  // Right
  else if (e.button === 2) {
    if (!Settings.reactive.ctxMenuNative && !props.panel.selNewTab) Selection.resetSelection()
  }
}

function onNewTabMouseUp(e: MouseEvent): void {
  // Show menu for selected tabs
  if (Selection.isSet() && Mouse.isTarget('tab')) return

  e.stopPropagation()

  const sameTarget = Mouse.isTarget('tab.new', 'tab.new')
  Mouse.resetTarget()
  Mouse.stopLongClick()

  if (!sameTarget) {
    Mouse.stopMultiSelection()
    Selection.resetSelection()
    return
  }

  if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey) return

    if (Menu.isBlocked()) return
    if (!Selection.isSet() && !Settings.reactive.ctxMenuNative) {
      Selection.selectNewTabBtn(props.panel.id)
    }
    if (!Settings.reactive.ctxMenuNative) Menu.open(MenuType.NewTab, e.clientX, e.clientY)
  }
}

function onNewTabCtxMenu(e: MouseEvent): void {
  // Show menu for selected tabs
  if (Selection.isSet() && Mouse.isTarget('tab')) return

  e.stopPropagation()

  if (Mouse.isLocked() || !Settings.reactive.ctxMenuNative || e.ctrlKey || e.shiftKey) {
    Mouse.resetClickLock()
    e.stopPropagation()
    e.preventDefault()
    return
  }

  if (!e.ctrlKey && !e.shiftKey && !props.panel.selNewTab) {
    Selection.resetSelection()
  }

  if (Menu.isBlocked()) {
    e.stopPropagation()
    e.preventDefault()
    return
  }

  let nativeCtx = { showDefaults: false }
  browser.menus.overrideContext(nativeCtx)

  if (!Selection.isSet()) Selection.selectNewTabBtn(props.panel.id)

  Menu.open(MenuType.NewTab)
}
</script>
