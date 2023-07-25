<template lang="pug">
.NewTabShortcutsPopup.popup-container(@mousedown.stop.self="onCancel" @mouseup.stop)
  .popup(v-if="Popups.reactive.newTabShortcutsPopup")
    h2(v-if="shortcuts.length") {{translate('popup.new_tab_shortcuts.title')}}
    .shortcuts(v-if="shortcuts.length")
      .shortcut(
        v-for="(shortcut, index) of shortcuts"
        :key="shortcut.id"
        :data-edit="shortcut.id === editing"
        @click="editShortcut(shortcut)")
        .container-box(v-if="shortcut.container" :data-color="shortcut.containerColor")
          .icon-box
            svg.icon: use(:xlink:href="shortcut.containerIcon")
          .container {{shortcut.container}}
          .controls-box(@click.stop)
            .btn-up(@click="shortcutUp(index)"): svg: use(xlink:href="#icon_expand")
            .btn-down(@click="shortcutDown(index)"): svg: use(xlink:href="#icon_expand")
            .btn-rm(@click="removeShortcut(index)"): svg: use(xlink:href="#icon_remove")
        .url-box(v-if="shortcut.url" :data-with-container="!!shortcut.container")
          .icon-box
            svg.icon(v-if="shortcut.urlIcon?.startsWith('#')"): use(:xlink:href="shortcut.urlIcon")
            img.icon(v-else :src="shortcut.urlIcon")
          .url {{shortcut.url}}
          .controls-box(v-if="!shortcut.container" @click.stop)
            .btn-up(@click="shortcutUp(index)"): svg: use(xlink:href="#icon_expand")
            .btn-down(@click="shortcutDown(index)"): svg: use(xlink:href="#icon_expand")
            .btn-rm(@click="removeShortcut(index)"): svg: use(xlink:href="#icon_remove")
        .separator(v-if="!shortcut.url && !shortcut.container" @click.stop)
          .controls-box
            .btn-up(@click="shortcutUp(index)"): svg: use(xlink:href="#icon_expand")
            .btn-down(@click="shortcutDown(index)"): svg: use(xlink:href="#icon_expand")
            .btn-rm(@click="removeShortcut(index)"): svg: use(xlink:href="#icon_remove")
    .space
    h2 {{translate('popup.new_tab_shortcuts.create_title')}}
    SelectField.-no-separator(
      label="popup.new_tab_shortcuts.new_shortcut_container_label"
      noneOpt="-"
      v-model:value="newShortcutContainerId"
      :opts="availableContainersOpts"
      :inline="false"
      :folded="true")
    TextField.-no-separator(
      label="popup.new_tab_shortcuts.new_shortcut_url_label"
      v-model:value="newShortcutURL"
      :or="translate('popup.new_tab_shortcuts.new_shortcut_url_placeholder')"
      :line="true")

    .ctrls(v-if="editing")
      .btn.-wide(@click="onSaveEdit").
        {{translate('btn.save')}}
      .btn.-wide(@click="onCancelEdit").
        {{translate('btn.cancel')}}
    .ctrls(v-else)
      .btn.-wide(:title="translate('popup.new_tab_shortcuts.add_br_btn')" @click="onAddBr").
        {{translate('popup.new_tab_shortcuts.add_br_btn')}}
      .btn.-wide(:class="{ '-inactive': !addBtnActive }" @click="onAdd").
        {{translate('popup.new_tab_shortcuts.add_shortcut_btn')}}
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { translate } from 'src/dict'
import { Container } from 'src/types'
import { DOMAIN_RE } from 'src/defaults'
import { Sidebar } from 'src/services/sidebar'
import { Windows } from 'src/services/windows'
import { Containers } from 'src/services/containers'
import { Info } from 'src/services/info'
import { SidebarConfigRState, saveSidebarConfig } from 'src/services/sidebar-config'
import * as Favicons from 'src/services/favicons.fg'
import * as Utils from 'src/utils'
import * as Popups from 'src/services/popups'
import TextField from './text-field.vue'
import SelectField from './select-field.vue'

interface NewTabShortcut {
  id: string
  url?: string
  urlIcon?: string
  container?: string
  containerId?: string
  containerIcon?: string
  containerColor?: string
}

interface ContainerOption {
  value: string
  icon?: string
  color?: string
  tooltip?: string
  title?: string
}

const newShortcutContainerId = ref('none')
const newShortcutURL = ref('')
const editing = ref<ID | null>(null)

const addBtnActive = computed<boolean>(() => {
  const urlIsValid = !!newShortcutURL.value && DOMAIN_RE.test(newShortcutURL.value)
  const containerIsValid = newShortcutContainerId.value !== 'none'
  return urlIsValid || containerIsValid
})

const shortcuts = computed<NewTabShortcut[]>(() => {
  if (!Popups.reactive.newTabShortcutsPopup) return []

  const rawShortcuts = Popups.reactive.newTabShortcutsPopup.rawShortcuts
  const shortcuts: NewTabShortcut[] = []
  const ids: Record<string, string> = {}
  let container: Container | undefined

  for (const conf of rawShortcuts) {
    // Ignore empty config
    if (conf === '') {
      shortcuts.push({ id: Math.random().toString(36) })
      continue
    }

    // Ignore duplicates
    if (ids[conf]) continue
    ids[conf] = conf
    container = undefined

    const shortcut: NewTabShortcut = { id: conf }
    const parts: string[] = conf.split(',')

    for (let part of parts) {
      part = part.trim()

      // Url?
      const domain = DOMAIN_RE.exec(part)?.[2]
      if (domain) {
        shortcut.url = part
        const favicon = Favicons.reactive.byDomains[domain]
        if (favicon) shortcut.urlIcon = favicon
        else shortcut.urlIcon = '#icon_ff'
        continue
      }

      // Container?
      if (!container) {
        container = Object.values(Containers.reactive.byId).find(c => c.name === part)
        if (container && !Windows.incognito) {
          shortcut.container = container.name
          shortcut.containerId = container.id
          shortcut.containerIcon = '#' + container.icon
          shortcut.containerColor = container.color
          continue
        }
      }
    }

    shortcuts.push(shortcut)
  }

  return shortcuts
})

const availableContainersOpts = computed<ContainerOption[]>(() => {
  if (!Popups.reactive.newTabShortcutsPopup) return []
  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return []

  const defaultTitle = translate('popup.new_tab_shortcuts.new_shortcut_default_container')
  const result: ContainerOption[] = [
    {
      value: 'none',
      color: 'inactive',
      icon: '#icon_none',
      title: defaultTitle,
      tooltip: defaultTitle,
    },
  ]

  for (let c of Object.values(Containers.reactive.byId)) {
    if (panel.newTabCtx === c.id) continue
    const icon = '#' + c.icon
    result.push({ value: c.id, color: c.color, icon, title: c.name, tooltip: c.name })
  }

  return result
})

function onAddBr() {
  if (!Popups.reactive.newTabShortcutsPopup) return

  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const rawShortcuts = Popups.reactive.newTabShortcutsPopup.rawShortcuts
  const shortcut = ''
  rawShortcuts.push(shortcut)
  panel.newTabBtns.push(shortcut)

  newShortcutURL.value = ''
  newShortcutContainerId.value = 'none'

  if (Info.isSidebar) panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function onAdd() {
  if (!Popups.reactive.newTabShortcutsPopup) return
  if (!addBtnActive.value) return
  if (!newShortcutURL.value && newShortcutContainerId.value === 'none') return

  const container = Containers.reactive.byId[newShortcutContainerId.value]
  const btnConfig = []
  if (container?.name) btnConfig.push(container.name)
  if (newShortcutURL.value) btnConfig.push(newShortcutURL.value)
  if (!btnConfig.length) return

  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const rawShortcuts = Popups.reactive.newTabShortcutsPopup.rawShortcuts
  const shortcut = btnConfig.join(', ')
  rawShortcuts.push(shortcut)
  panel.newTabBtns.push(shortcut)

  newShortcutURL.value = ''
  newShortcutContainerId.value = 'none'

  if (Info.isSidebar) panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function onCancel() {
  if (!Popups.reactive.newTabShortcutsPopup) return

  Popups.closeNewTabShortcutsPopup()
}

function shortcutUp(index: number) {
  if (!Popups.reactive.newTabShortcutsPopup) return
  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  if (index <= 0) return

  const rawShortcuts = Popups.reactive.newTabShortcutsPopup.rawShortcuts
  const shortcut = rawShortcuts[index]
  rawShortcuts.splice(index, 1)
  rawShortcuts.splice(index - 1, 0, shortcut)

  panel.newTabBtns.splice(index, 1)
  panel.newTabBtns.splice(index - 1, 0, shortcut)

  if (Info.isSidebar) panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function shortcutDown(index: number): void {
  if (!Popups.reactive.newTabShortcutsPopup) return
  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  if (index >= panel.newTabBtns.length - 1) return

  const rawShortcuts = Popups.reactive.newTabShortcutsPopup.rawShortcuts
  const shortcut = rawShortcuts[index]
  rawShortcuts.splice(index, 1)
  rawShortcuts.splice(index + 1, 0, shortcut)

  panel.newTabBtns.splice(index, 1)
  panel.newTabBtns.splice(index + 1, 0, shortcut)

  if (Info.isSidebar) panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function removeShortcut(index: number): void {
  if (!Popups.reactive.newTabShortcutsPopup) return
  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const rawShortcuts = Popups.reactive.newTabShortcutsPopup.rawShortcuts
  rawShortcuts.splice(index, 1)

  panel.newTabBtns.splice(index, 1)

  if (Info.isSidebar) panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function editShortcut(shortcut: NewTabShortcut) {
  if (editing.value === shortcut.id) {
    return onCancel()
  }

  editing.value = shortcut.id

  if (shortcut.containerId) newShortcutContainerId.value = shortcut.containerId
  else newShortcutContainerId.value = 'none'

  if (shortcut.url) newShortcutURL.value = shortcut.url
  else newShortcutURL.value = ''
}

function onSaveEdit() {
  if (!Popups.reactive.newTabShortcutsPopup) return
  if (!newShortcutURL.value && newShortcutContainerId.value === 'none') return

  const id = editing.value
  if (!id) return

  editing.value = null

  const sIndex = shortcuts.value.findIndex(s => s.id === id)
  if (sIndex === -1) return

  const container = Containers.reactive.byId[newShortcutContainerId.value]
  const sConfig = []
  if (container?.name) sConfig.push(container.name)
  if (newShortcutURL.value) sConfig.push(newShortcutURL.value)
  if (!sConfig.length) return

  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const rawShortcut = sConfig.join(', ')
  const rawShortcuts = Popups.reactive.newTabShortcutsPopup.rawShortcuts
  rawShortcuts.splice(sIndex, 1, rawShortcut)
  panel.newTabBtns.splice(sIndex, 1, rawShortcut)

  newShortcutURL.value = ''
  newShortcutContainerId.value = 'none'

  if (Info.isSidebar) panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function onCancelEdit() {
  editing.value = null

  // Reset inputs
  newShortcutContainerId.value = 'none'
  newShortcutURL.value = ''
}
</script>
