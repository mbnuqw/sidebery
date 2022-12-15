<template lang="pug">
.new-tab-btns(
  tabindex="-1"
  :data-new-tab-bar-position="Settings.state.newTabBarPosition"
  :data-sel="panel.selNewTab")
  .new-tab-bg
  .new-tab-btn(
    :title="defaultBtn.tooltip"
    :data-color="defaultBtn.containerId && Containers.reactive.byId[defaultBtn.containerId]?.color"
    @mousedown="onNewTabMouseDown($event, defaultBtn)"
    @mouseup="onNewTabMouseUp($event, defaultBtn)"
    @dragstart="onDragStart($event, defaultBtn)"
    @contextmenu="onNewTabCtxMenu")
    .dnd-layer(draggable="true")
    svg(:class="{ '-icon': !!defaultBtn.containerId }")
      use(:xlink:href="defaultBtn.icon")
    svg.-badge(v-if="defaultBtn.containerId")
      use(xlink:href="#icon_plus_badge")
  .new-tab-btn.-custom(
    v-for="btn of btns"
    :title="btn.tooltip"
    :data-br="!btn.title"
    :data-color="btn.containerId && Containers.reactive.byId[btn.containerId]?.color"
    @mousedown="onNewTabMouseDown($event, btn)"
    @mouseup="onNewTabMouseUp($event, btn)"
    @dragstart="onDragStart($event, btn)"
    @contextmenu="onNewTabCtxMenu")
    .dnd-layer(draggable="true")
    svg.-icon(v-if="!btn.domain && btn.containerId")
      use(:xlink:href="btn.icon")
    svg.-icon(v-else-if="btn.icon && btn.icon[0] === '#'")
      use(:xlink:href="btn.icon")
    img.-icon(v-else-if="btn.icon" :src="btn.icon")
    svg.-badge: use(xlink:href="#icon_plus_badge")
</template>

<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { Container, DstPlaceInfo, ItemInfo, MenuType, Tab, TabsPanel } from 'src/types'
import { DragType, DragInfo, DropType } from 'src/types'
import { Settings } from 'src/services/settings'
import { Selection } from 'src/services/selection'
import { Menu } from 'src/services/menu'
import { Tabs } from 'src/services/tabs.fg'
import { Mouse } from 'src/services/mouse'
import { Containers } from 'src/services/containers'
import { Favicons } from 'src/services/favicons'
import { CONTAINER_ID, DOMAIN_RE, NEWID } from 'src/defaults'
import * as Utils from 'src/utils'
import * as Logs from 'src/services/logs'
import { Windows } from 'src/services/windows'
import { translate } from 'src/dict'
import { DnD } from 'src/services/drag-and-drop'
import { Sidebar } from 'src/services/sidebar'

interface NewTabBtn {
  id: string
  title?: string
  icon?: string
  containerId?: string
  containrtName?: string
  url?: string
  domain?: string
  children?: NewTabBtn[]
  tooltip?: string
}

const props = defineProps({
  panel: { type: Object as PropType<TabsPanel>, required: true },
})

const defaultBtn = computed<NewTabBtn>(() => {
  const btn: NewTabBtn = { id: 'default' }

  const contianer = Containers.reactive.byId[props.panel.newTabCtx]
  if (contianer) {
    btn.containerId = contianer.id
    btn.containrtName = contianer.name
    btn.icon = '#' + contianer.icon
  } else {
    btn.icon = '#icon_plus'
  }

  btn.tooltip = createTooltip(btn)

  return btn
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
        if (container && !Windows.incognito) {
          btn.containerId = container.id
          btn.containrtName = container.name
          if (!btn.title) btn.title = container.name
          continue
        }
      }
    }

    if (btn.domain) btn.icon = Favicons.reactive.list[Favicons.reactive.domains[btn.domain]]
    if (!btn.icon && btn.url) btn.icon = Favicons.getFavPlaceholder(btn.url)
    if (!btn.icon && container) btn.icon = '#' + container.icon

    btn.tooltip = createTooltip(btn)

    if (btn.title) btns.push(btn)
  }

  return btns
})

function createTooltip(btn: NewTabBtn): string {
  let tooltip = translate('newTabBar.new_tab')
  if (btn.containrtName) {
    tooltip +=
      translate('newTabBar.in_container_prefix') +
      btn.containrtName +
      translate('newTabBar.in_container_postfix')
  }
  if (btn.url) tooltip += ': ' + btn.url

  if (Settings.state.newTabMiddleClickAction === 'new_child') {
    tooltip += '\n' + translate('newTabBar.mid_child')
  } else {
    tooltip += '\n' + translate('newTabBar.mid_reopen')
    if (btn.containrtName) {
      tooltip +=
        translate('newTabBar.in_container_prefix') +
        btn.containrtName +
        translate('newTabBar.in_container_postfix')
    } else if (!btn.url) {
      tooltip += translate('newTabBar.in_default_container')
    }
    if (btn.url) tooltip += ': ' + btn.url
  }

  return tooltip
}

function onNewTabMouseDown(e: MouseEvent, btn?: NewTabBtn): void {
  e.stopPropagation()
  Mouse.setTarget('tab.new', 'tab.new')
  Menu.close()

  // Middle
  if (e.button === 1) {
    e.preventDefault()
    Mouse.blockWheel()
  }

  // Right
  else if (e.button === 2) {
    if (!Settings.state.ctxMenuNative && !props.panel.selNewTab) Selection.resetSelection()
  }
}

function onNewTabMouseUp(e: MouseEvent, btn?: NewTabBtn): void {
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

  // Left
  if (e.button === 0) {
    if (e.ctrlKey) {
      Mouse.blockWheel()
      const actTab = Tabs.byId[Tabs.activeId]
      if (actTab && !actTab.pinned && actTab.panelId === props.panel.id) {
        Tabs.createChildTab(actTab.id, btn?.url, btn?.containerId)
      } else {
        Tabs.createTabInPanel(props.panel, { url: btn?.url, cookieStoreId: btn?.containerId })
      }
      return
    }

    if (e.altKey) {
      applyBtnRules(btn)
      return
    }

    if (Selection.isSet() && !props.panel.selNewTab) Selection.resetSelection()

    Tabs.createTabInPanel(props.panel, { url: btn?.url, cookieStoreId: btn?.containerId })
  }

  // Middle
  else if (e.button === 1) {
    if (Settings.state.newTabMiddleClickAction === 'new_child') {
      const actTab = Tabs.byId[Tabs.activeId]
      if (actTab && !actTab.pinned && actTab.panelId === props.panel.id) {
        Tabs.createChildTab(actTab.id, btn?.url, btn?.containerId)
      } else {
        Tabs.createTabInPanel(props.panel, { url: btn?.url, cookieStoreId: btn?.containerId })
      }
    } else if (Settings.state.newTabMiddleClickAction === 'reopen') {
      applyBtnRules(btn)
    }
  }

  // Right
  else if (e.button === 2) {
    if (e.ctrlKey || e.shiftKey || Windows.incognito) return

    if (Menu.isBlocked()) return
    if (!Selection.isSet() && !Settings.state.ctxMenuNative) {
      Selection.selectNewTabBtn(props.panel.id)
    }
    if (!Settings.state.ctxMenuNative) Menu.open(MenuType.NewTab, e.clientX, e.clientY)
  }
}

function onNewTabCtxMenu(e: MouseEvent): void {
  // Show menu for selected tabs
  if (Selection.isSet() && Mouse.isTarget('tab')) return

  // Do not show menu if browser window is private
  if (Windows.incognito) {
    e.preventDefault()
    e.stopPropagation()
    return
  }

  e.stopPropagation()

  if (Mouse.isLocked() || !Settings.state.ctxMenuNative || e.ctrlKey || e.shiftKey) {
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

async function applyBtnRules(btn?: NewTabBtn): Promise<void> {
  let targetTabs: Tab[] = []
  if (Selection.isTabs()) {
    const ids = Selection.get()
    for (const tab of Tabs.list) {
      if (ids.includes(tab.id)) targetTabs.push(tab)
    }
  } else {
    const activeTab = Tabs.byId[Tabs.activeId]
    if (activeTab) targetTabs.push(activeTab)
  }

  if (Selection.isSet()) Selection.resetSelection()

  if (!targetTabs.length) return
  if (targetTabs.some(t => t.panelId !== props.panel.id)) return

  const targetContainerId = btn?.containerId ?? CONTAINER_ID
  const toReopen: ItemInfo[] = []
  for (const tab of targetTabs) {
    // Updating url of exited tab
    if (tab.cookieStoreId === targetContainerId && btn?.url) {
      await browser.tabs.update(tab.id, { url: btn.url })
    }
    // Reopening tab
    else if (tab.cookieStoreId !== targetContainerId) {
      const info: ItemInfo = Utils.cloneObject(tab)
      if (btn?.url) info.url = btn.url
      if (info.url === 'about:blank') info.url = 'about:newtab'
      toReopen.push(info)
    }
  }

  if (toReopen.length > 0) {
    const dst: DstPlaceInfo = {
      containerId: targetContainerId,
      panelId: props.panel.id,
    }
    try {
      await Tabs.reopen(toReopen, dst)
    } catch (err) {
      Logs.err('NewTabBar: Cannot reopen tabs', err)
    }
  }
}

function onDragStart(e: DragEvent, btn: NewTabBtn): void {
  Menu.close()
  Selection.resetSelection()
  Sidebar.updateBounds()

  const dragInfo: DragInfo = {
    type: DragType.NewTab,
    items: [{ id: NEWID, container: btn.containerId, title: 'New tab', url: btn.url }],
    windowId: Windows.id,
    incognito: Windows.incognito,
    pinnedTabs: false,
    x: e.clientX,
    y: e.clientY,
  }

  DnD.start(dragInfo, DropType.Tabs)

  // Set native drag info
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/x-sidebery-dnd', JSON.stringify(dragInfo))
    const dragImgEl = document.getElementById('drag_image')
    if (dragImgEl) e.dataTransfer.setDragImage(dragImgEl, -3, -3)
    e.dataTransfer.effectAllowed = 'move'
  }
}
</script>
