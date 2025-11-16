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
            svg.icon: use(:href="shortcut.containerIcon")
          .container {{shortcut.container}}
          .controls-box(@click.stop)
            .btn-up(@click="shortcutUp(index)"): svg: use(href="#icon_expand")
            .btn-down(@click="shortcutDown(index)"): svg: use(href="#icon_expand")
            .btn-rm(@click="removeShortcut(index)"): svg: use(href="#icon_remove")
        .url-box(v-if="shortcut.url" :data-with-container="!!shortcut.container")
          .icon-box
            svg.icon(v-if="shortcut.urlIcon?.startsWith('#')"): use(:href="shortcut.urlIcon")
            img.icon(v-else :src="shortcut.urlIcon")
          .url {{shortcut.url}}
          .controls-box(v-if="!shortcut.container" @click.stop)
            .btn-up(@click="shortcutUp(index)"): svg: use(href="#icon_expand")
            .btn-down(@click="shortcutDown(index)"): svg: use(href="#icon_expand")
            .btn-rm(@click="removeShortcut(index)"): svg: use(href="#icon_remove")
        .separator(v-if="!shortcut.url && !shortcut.container" @click.stop)
          .controls-box
            .btn-up(@click="shortcutUp(index)"): svg: use(href="#icon_expand")
            .btn-down(@click="shortcutDown(index)"): svg: use(href="#icon_expand")
            .btn-rm(@click="removeShortcut(index)"): svg: use(href="#icon_remove")
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
import { DEFAULT_CONTAINER_ID, DOMAIN_RE } from 'src/defaults'
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

  const defaultTitle = translate('popup.new_tab_shortcuts.new_shortcut_default_container')
  const rawShortcuts = Popups.reactive.newTabShortcutsPopup.rawShortcuts
  const shortcuts: NewTabShortcut[] = []
  const ids: Record<string, string> = {}
  let container: Container | undefined

  for (const conf of rawShortcuts) {
    // Handle empty config
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
      const domain = DOMAIN_RE.exec(part)?.[1]
      if (domain) {
        shortcut.url = part
        const favicon = Favicons.reactive.byDomains[domain]
        if (favicon) shortcut.urlIcon = favicon
        else shortcut.urlIcon = '#icon_ff'
        continue
      }

      // Container?
      if (!container) {
        if (part === DEFAULT_CONTAINER_ID) {
          shortcut.container = defaultTitle
          shortcut.containerId = DEFAULT_CONTAINER_ID
          shortcut.containerIcon = '#icon_ff'
        } else {
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
    }

    // Ignore shortcuts with no correct data
    if (!shortcut.url && !shortcut.container) continue

    shortcuts.push(shortcut)
  }

  return shortcuts
})

const availableContainersOpts = computed<ContainerOption[]>(() => {
  if (!Popups.reactive.newTabShortcutsPopup) return []
  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return []

  const notSetTitle = translate('popup.new_tab_shortcuts.new_shortcut_not_set_container')
  const defaultTitle = translate('popup.new_tab_shortcuts.new_shortcut_default_container')
  const result: ContainerOption[] = [
    {
      value: 'none',
      color: 'inactive',
      icon: '#icon_none',
      title: notSetTitle,
      tooltip: notSetTitle,
    },
    {
      value: 'default',
      color: 'inactive',
      icon: '#icon_ff',
      title: defaultTitle,
      tooltip: defaultTitle,
    },
  ]

  for (let c of Object.values(Containers.reactive.byId)) {
    const icon = '#' + c.icon
    result.push({ value: c.id, color: c.color, icon, title: c.name, tooltip: c.name })
  }

  return result
})

function toRawShortcuts(shortcuts: NewTabShortcut[]): string[] {
  const result: string[] = []

  for (const s of shortcuts) {
    const sConfig = []
    if (s.containerId === DEFAULT_CONTAINER_ID) sConfig.push(DEFAULT_CONTAINER_ID)
    else if (s.container) sConfig.push(s.container)
    if (s.url) sConfig.push(s.url)

    const rawShortcut = sConfig.join(', ')
    result.push(rawShortcut)
  }

  return result
}

function onAddBr() {
  if (!Popups.reactive.newTabShortcutsPopup) return

  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const rawShortcuts = toRawShortcuts(shortcuts.value)
  const shortcut = ''
  rawShortcuts.push(shortcut)
  panel.newTabBtns = Utils.clone(rawShortcuts)

  newShortcutURL.value = ''
  newShortcutContainerId.value = 'none'
  Popups.reactive.newTabShortcutsPopup.rawShortcuts = rawShortcuts

  if (Info.isSidebar) panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function onAdd() {
  if (!Popups.reactive.newTabShortcutsPopup) return
  if (!addBtnActive.value) return
  if (!newShortcutURL.value && newShortcutContainerId.value === 'none') return

  const btnConfig = []
  if (newShortcutContainerId.value === 'default') {
    btnConfig.push(DEFAULT_CONTAINER_ID)
  } else {
    const container = Containers.reactive.byId[newShortcutContainerId.value]
    if (container?.name) btnConfig.push(container.name)
  }
  if (newShortcutURL.value) btnConfig.push(newShortcutURL.value)
  if (!btnConfig.length) return

  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const rawShortcuts = toRawShortcuts(shortcuts.value)
  const shortcut = btnConfig.join(', ')

  // Stop if it's a dupe TODO: tell user about this
  if (rawShortcuts.includes(shortcut)) return

  rawShortcuts.push(shortcut)
  Popups.reactive.newTabShortcutsPopup.rawShortcuts = rawShortcuts

  panel.newTabBtns = Utils.clone(rawShortcuts)

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

  const rawShortcuts = toRawShortcuts(shortcuts.value)
  const shortcut = rawShortcuts[index]
  rawShortcuts.splice(index, 1)
  rawShortcuts.splice(index - 1, 0, shortcut)
  Popups.reactive.newTabShortcutsPopup.rawShortcuts = rawShortcuts

  panel.newTabBtns = Utils.clone(rawShortcuts)

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

  const rawShortcuts = toRawShortcuts(shortcuts.value)
  const shortcut = rawShortcuts[index]
  rawShortcuts.splice(index, 1)
  rawShortcuts.splice(index + 1, 0, shortcut)
  Popups.reactive.newTabShortcutsPopup.rawShortcuts = rawShortcuts

  panel.newTabBtns = Utils.clone(rawShortcuts)

  if (Info.isSidebar) panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function removeShortcut(index: number): void {
  if (!Popups.reactive.newTabShortcutsPopup) return
  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const rawShortcuts = toRawShortcuts(shortcuts.value)
  rawShortcuts.splice(index, 1)
  Popups.reactive.newTabShortcutsPopup.rawShortcuts = rawShortcuts

  panel.newTabBtns = Utils.clone(rawShortcuts)

  if (Info.isSidebar) panel.reactive.newTabBtns = Utils.cloneArray(panel.newTabBtns)
  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function editShortcut(shortcut: NewTabShortcut) {
  if (editing.value === shortcut.id) {
    return onCancelEdit()
  }

  editing.value = shortcut.id

  if (shortcut.containerId) {
    if (shortcut.containerId === DEFAULT_CONTAINER_ID) {
      newShortcutContainerId.value = 'default'
    } else {
      newShortcutContainerId.value = shortcut.containerId
    }
  } else {
    newShortcutContainerId.value = 'none'
  }

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

  const sConfig = []
  if (newShortcutContainerId.value === 'default') {
    sConfig.push(DEFAULT_CONTAINER_ID)
  } else {
    const container = Containers.reactive.byId[newShortcutContainerId.value]
    if (container?.name) sConfig.push(container.name)
  }
  if (newShortcutURL.value) sConfig.push(newShortcutURL.value)
  if (!sConfig.length) return

  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const rawShortcut = sConfig.join(', ')
  const rawShortcuts = toRawShortcuts(shortcuts.value)

  // Stop if it's a duplicate TODO: tell user about this
  if (rawShortcuts.includes(rawShortcut)) return

  rawShortcuts.splice(sIndex, 1, rawShortcut)
  Popups.reactive.newTabShortcutsPopup.rawShortcuts = rawShortcuts
  panel.newTabBtns = Utils.clone(rawShortcuts)

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
