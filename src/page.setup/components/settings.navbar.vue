<template lang="pug">
section(
  ref="el"
  :data-dnd="!!dndItemId"
  @dragenter.prevent.stop="onDragEnter"
  @dragover.prevent.stop=""
  @drop.stop="onDrop"
  @dragend="onDragEnd")
  h2 {{translate('settings.nav_title')}}
  SelectField(
    label="settings.nav_bar_layout"
    optLabel="settings.nav_bar_layout_"
    v-model:value="Settings.reactive.navBarLayout"
    :opts="Settings.getOpts('navBarLayout')")
  .sub-fields
    ToggleField(
      label="settings.nav_bar_inline"
      v-model:value="Settings.reactive.navBarInline"
      :inactive="Settings.reactive.navBarLayout !== 'horizontal'")
    SelectField(
      label="settings.nav_bar_side"
      optLabel="settings.nav_bar_side_"
      v-model:value="Settings.reactive.navBarSide"
      :opts="Settings.getOpts('navBarSide')"
      :inactive="Settings.reactive.navBarLayout !== 'vertical'")
  ToggleField(label="settings.nav_btn_count" v-model:value="Settings.reactive.navBtnCount")
  ToggleField(label="settings.hide_empty_panels" v-model:value="Settings.reactive.hideEmptyPanels")
  NumField.-inline(
    label="settings.nav_switch_panels_delay"
    v-model:value="Settings.reactive.navSwitchPanelsDelay"
    :or="128")

  InfoField(label="settings.nav_bar_enabled" :inactive="!availableBtns.length").-sub-title
  .sub-fields
    .card.-placeholder(
      v-if="!enabledBtns.length"
      data-inactive="true"
      data-first="true"
      :data-dnd-target="dndItemId && dndDstGroup === 'enabled' && dndDstIndex === -1")
      .card-body
        .card-dnd-layer(data-dnd-group="enabled" data-dnd-index="-1")
        .card-name {{translate('settings.nav_bar.no_elements')}}
    TransitionGroup(name="card" tag="div")
      .card(
        v-for="(btn, i) in enabledBtns"
        :key="btn.id"
        :data-id="btn.id"
        :data-inactive="btn.inactive"
        :data-first="i === 0"
        :data-last="i === enabledBtns.length - 1"
        :data-dnd-target="dndItemId && dndDstGroup === 'enabled' && dndDstIndex === i"
        :data-dnd="dndItemId && dndSrcGroup === 'enabled' && dndSrcIndex === i")
        .card-dnd-layer.-last(
          v-if="i === enabledBtns.length - 1"
          data-dnd-group="enabled"
          :data-dnd-index="i + 1"
          :data-dnd-target="dndItemId && dndDstGroup === 'enabled' && dndDstIndex === enabledBtns.length")
        .card-body(@click="openConfig(btn)")
          .card-dnd-layer(
            draggable="true"
            data-dnd-group="enabled"
            :data-dnd-index="i"
            @dragstart.stop="onDragStart($event, 'enabled', i, btn.id)")
          .card-icon(:data-color="btn.color")
            svg.bookmarks-badge-icon(v-if="isBookmarksBadgeNeeded(btn)")
              use(xlink:href="#icon_bookmark_badge")
            svg(v-if="!btn.iconIMG")
              use(:xlink:href="'#' + btn.iconSVG")
            img(v-else :src="btn.iconIMG")
          .card-name {{btn.name}}
        .card-ctrls
          .card-ctrl.-down(@click="moveBtn(i, 1)")
            svg: use(xlink:href="#icon_expand")
          .card-ctrl.-up(:data-inactive="i === 0" @click="moveBtn(i, -1)")
            svg: use(xlink:href="#icon_expand")
          .card-ctrl.-rm(@click="disableBtn(i)")
            svg: use(xlink:href="#icon_remove")

  InfoField(label="settings.nav_bar.available_elements" :inactive="!availableBtns.length").-sub-title
  .sub-fields.-disabled(v-if="availableBtns.length")
    .card.-disabled(
      v-for="(btn, i) in availableBtns"
      :key="btn.id"
      :data-first="i === 0"
      :data-last="i === availableBtns.length - 1"
      @click="enableElement(btn.id)")
      .card-body
        .card-dnd-layer(draggable="true" @dragstart.stop="onDragStart($event, null, null, btn.id)")
        .card-icon
          svg(v-if="!btn.iconIMG")
            use(:xlink:href="'#' + btn.iconSVG")
          img(v-else :src="btn.iconIMG")
        .card-name {{btn.name}}

  Transition(name="popup")
    .popup-layer(
      v-if="SetupPage.reactive.selectedPanel"
      @click="SetupPage.reactive.selectedPanel = null")
      .popup-box(@click.stop)
        PanelConfig(:conf="SetupPage.reactive.selectedPanel")
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import Utils from 'src/utils'
import { translate } from 'src/dict'
import { BookmarksPanel, Panel } from 'src/types'
import { BTN_ICONS } from 'src/defaults'
import { Settings } from 'src/services/settings'
import { Sidebar } from 'src/services/sidebar'
import { Permissions } from 'src/services/permissions'
import { SetupPage } from 'src/services/setup-page'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'
import InfoField from '../../components/info-field.vue'
import NumField from '../../components/num-field.vue'
import PanelConfig from './popup.panel-config.vue'

interface Btn {
  id: ID
  inactive?: boolean
  name?: string
  iconSVG: string
  iconIMG?: string
  color?: string
}
const el = ref<HTMLElement | null>(null)

function normalizeItemId(id: ID): ID {
  if ((id as string).startsWith('sp-')) return 'sp'
  if ((id as string).startsWith('sd-')) return 'sd'
  return id
}

const enabledBtns = computed<(Panel | Btn)[]>(() => {
  return Sidebar.reactive.nav.map(id => {
    const panel = Sidebar.reactive.panelsById[id]
    if (panel) {
      return panel
    } else {
      const normId = normalizeItemId(id)
      const isSpace = normId === 'sp' || normId === 'sd'
      const isHorizontal = Settings.reactive.navBarLayout === 'horizontal'
      const isInline = Settings.reactive.navBarInline
      const inactive = isHorizontal && isInline && isSpace
      const name = translate(`settings.nav_bar_btn_${normId}`)
      return { id, inactive, iconSVG: BTN_ICONS[normId], name }
    }
  })
})

const availableBtns = computed<(Panel | Btn)[]>(() => {
  const result: (Panel | Btn)[] = []
  // prettier-ignore
  const ids = [
    'tabs_panel', 'bookmarks_panel', 'sp', 'sd',
    'history', 'search', 'add_tp', 'create_snapshot',
    'collapse', 'remute_audio_tabs', 'settings',
  ]

  for (const id of ids) {
    if (Sidebar.reactive.nav.includes(id)) continue

    result.push({ id, iconSVG: BTN_ICONS[id], name: translate(`settings.nav_bar_btn_${id}`) })
  }

  return result
})

onMounted(() => {
  SetupPage.registerEl('settings_nav', el.value)
})

function isBookmarksBadgeNeeded(btn: Panel | Btn): boolean {
  if (Utils.isBookmarksPanel(btn as Panel)) {
    const panel = btn as BookmarksPanel
    return panel.iconSVG !== 'icon_bookmarks' && !panel.iconIMG
  } else {
    return false
  }
}

function moveBtn(index: number, dir: number): void {
  const btnId = Sidebar.reactive.nav[index]
  if (!btnId) return

  // Start
  if (index === 0 && dir < 0) return
  // End
  else if (index === Sidebar.reactive.nav.length - 1 && dir > 0) return
  // Inside
  else {
    Sidebar.reactive.nav.splice(index, 1)
    Sidebar.reactive.nav.splice(index + dir, 0, btnId)
  }

  Sidebar.saveSidebar()
}

function createNavElement(id?: ID): ID | undefined {
  if (!id) return
  if (id === 'tabs_panel') id = Sidebar.createTabsPanel().id
  else if (id === 'bookmarks_panel') {
    if (!Permissions.reactive.bookmarks) {
      location.hash = 'bookmarks'
      return
    }
    id = Sidebar.createBookmarksPanel().id
  } else if (id === 'history') {
    if (!Permissions.reactive.history) {
      location.hash = 'history'
      return
    }
    Sidebar.createHistoryPanel().id
  } else if (id === 'sp') id = 'sp-' + Utils.uid()
  else if (id === 'sd') id = 'sd-' + Utils.uid()

  return id
}

function enableElement(id?: ID): void {
  id = createNavElement(id)
  if (!id) return

  Sidebar.reactive.nav.push(id)
  Sidebar.recalcPanels()
  Sidebar.saveSidebar()
}

function disableBtn(index: number): void {
  const panel = Sidebar.reactive.panelsById[Sidebar.reactive.nav[index]]
  if (panel) {
    const msg = getRmConfirmMsg(panel)
    if (msg && !window.confirm(msg)) return
  }

  Sidebar.reactive.nav.splice(index, 1)
  Sidebar.recalcPanels()
  Sidebar.saveSidebar()
}

function getRmConfirmMsg(panel: Panel): string | undefined {
  if (!panel.name) return
  if (Utils.isTabsPanel(panel)) {
    let preMsg = translate('settings.nav_rm_tabs_panel_confirm_pre')
    let postMsg = translate('settings.nav_rm_tabs_panel_confirm_post')
    return preMsg + panel.name + postMsg
  } else if (Utils.isBookmarksPanel(panel)) {
    let preMsg = translate('settings.nav_rm_bookmarks_panel_confirm_pre')
    let postMsg = translate('settings.nav_rm_bookmarks_panel_confirm_post')
    return preMsg + panel.name + postMsg
  }
}

const dndItemId = ref<ID | null>(null)
const dndSrcGroup = ref<string | null>(null)
const dndSrcIndex = ref<number | null>(null)
const dndDstGroup = ref<string | null>(null)
const dndDstIndex = ref<number | null>(null)

function onDragStart(e: DragEvent, group: string | null, index: number | null, id: ID): void {
  if (!e.dataTransfer) return

  const currentTarget = e.currentTarget as HTMLElement

  dndItemId.value = id
  dndSrcGroup.value = group
  dndSrcIndex.value = index
  dndDstGroup.value = group
  dndDstIndex.value = index

  e.dataTransfer.setData('application/x-sidebery-dnd', '{}')
  if (currentTarget.parentElement) {
    e.dataTransfer.setDragImage(currentTarget.parentElement, 32, 32)
  }
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.dropEffect = 'move'
}

function onDragEnter(e: DragEvent): void {
  const target = e.target as HTMLElement

  if (!target.getAttribute) return
  if (!dndItemId.value) return

  const group = target.getAttribute('data-dnd-group')
  const index = parseInt(target.getAttribute('data-dnd-index') ?? '')

  if (!group) {
    dndDstGroup.value = null
    dndDstIndex.value = null
    return
  }

  dndDstGroup.value = group
  if (!isNaN(index)) dndDstIndex.value = index
  else dndDstIndex.value = null
}

function onDrop(e: DragEvent): void {
  const target = e.target as HTMLElement

  if (!target.getAttribute) return
  if (!dndItemId.value) return

  const id = createNavElement(dndItemId.value)
  if (!id) return resetDnd()

  let dstIndex = parseInt(target.getAttribute('data-dnd-index') ?? '')
  if (isNaN(dstIndex)) dstIndex = 0

  if (
    Sidebar.reactive.nav &&
    dndSrcIndex.value !== null &&
    Sidebar.reactive.nav[dndSrcIndex.value]
  ) {
    if (!Sidebar.reactive.nav) {
      const panel = Sidebar.reactive.panelsById[Sidebar.reactive.nav[dndSrcIndex.value]]
      if (panel) {
        const msg = getRmConfirmMsg(panel)
        if (msg && !window.confirm(msg)) return resetDnd()
      }
    }

    Sidebar.reactive.nav.splice(dndSrcIndex.value, 1)
    if (Sidebar.reactive.nav === Sidebar.reactive.nav && dndSrcIndex.value < dstIndex) dstIndex--
  }

  if (Sidebar.reactive.nav) Sidebar.reactive.nav.splice(dstIndex, 0, id)

  resetDnd()
  Sidebar.recalcPanels()
  Sidebar.saveSidebar(500)
}

function onDragEnd(): void {
  if (dndItemId.value) resetDnd()
}

function resetDnd(): void {
  dndItemId.value = null
  dndSrcGroup.value = null
  dndSrcIndex.value = null
}

function openConfig(item: Panel | Btn): void {
  const panel = Sidebar.reactive.panelsById[item.id]
  if (!panel) return
  SetupPage.reactive.selectedPanel = panel
}
</script>
