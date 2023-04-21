<template lang="pug">
.NewTabShortcutsPopup.popup-container(@mousedown.stop.self="onCancel" @mouseup.stop)
  .popup(v-if="Popups.reactive.newTabShortcutsPopup")
    h2(v-if="shortcuts.length") {{translate('popup.new_tab_shortcuts.title')}}
    .shortcuts(v-if="shortcuts.length")
      .shortcut(v-for="shortcut of shortcuts" :key="shortcut.id")
        .container-box(v-if="shortcut.container" :data-color="shortcut.containerColor")
          .icon-box
            svg.icon: use(:xlink:href="shortcut.containerIcon")
          .container {{shortcut.container}}
          .controls-box
            .btn-up(@click="shortcutUp(shortcut)"): svg: use(xlink:href="#icon_expand")
            .btn-down(@click="shortcutDown(shortcut)"): svg: use(xlink:href="#icon_expand")
            .btn-rm(@click="removeShortcut(shortcut)"): svg: use(xlink:href="#icon_remove")
        .url-box(v-if="shortcut.url" :data-with-container="!!shortcut.container")
          .icon-box
            svg.icon(v-if="shortcut.urlIcon?.startsWith('#')"): use(:xlink:href="shortcut.urlIcon")
            img.icon(v-else :src="shortcut.urlIcon")
          .url {{shortcut.url}}
          .controls-box(v-if="!shortcut.container")
            .btn-up(@click="shortcutUp(shortcut)"): svg: use(xlink:href="#icon_expand")
            .btn-down(@click="shortcutDown(shortcut)"): svg: use(xlink:href="#icon_expand")
            .btn-rm(@click="removeShortcut(shortcut)"): svg: use(xlink:href="#icon_remove")
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

    .ctrls
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
import { Favicons } from 'src/services/favicons'
import { Info } from 'src/services/info'
import { SidebarConfigRState, saveSidebarConfig } from 'src/services/sidebar-config'
import * as Utils from 'src/utils'
import * as Popups from 'src/services/popups'
import TextField from './text-field.vue'
import SelectField from './select-field.vue'

interface NewTabShortcut {
  id: string
  url?: string
  urlIcon?: string
  container?: string
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
        const favicon = Favicons.reactive.list[Favicons.reactive.domains[domain]]
        if (favicon) shortcut.urlIcon = favicon
        else shortcut.urlIcon = '#icon_ff'
        continue
      }

      // Container?
      if (!container) {
        container = Object.values(Containers.reactive.byId).find(c => c.name === part)
        if (container && !Windows.incognito) {
          shortcut.container = container.name
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

function onAdd(): void {
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

  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function onCancel(): void {
  if (!Popups.reactive.newTabShortcutsPopup) return

  Popups.closeNewTabShortcutsPopup()
}

function shortcutUp(shortcut: NewTabShortcut): void {
  if (!Popups.reactive.newTabShortcutsPopup) return
  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const index = panel.newTabBtns.indexOf(shortcut.id)
  if (index === -1) return

  if (index <= 0) return

  const rawShortcuts = Popups.reactive.newTabShortcutsPopup.rawShortcuts
  rawShortcuts.splice(index, 1)
  rawShortcuts.splice(index - 1, 0, shortcut.id)

  panel.newTabBtns.splice(index, 1)
  panel.newTabBtns.splice(index - 1, 0, shortcut.id)

  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function shortcutDown(shortcut: NewTabShortcut): void {
  if (!Popups.reactive.newTabShortcutsPopup) return
  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const index = panel.newTabBtns.indexOf(shortcut.id)
  if (index === -1) return

  if (index >= panel.newTabBtns.length - 1) return

  const rawShortcuts = Popups.reactive.newTabShortcutsPopup.rawShortcuts
  rawShortcuts.splice(index, 1)
  rawShortcuts.splice(index + 1, 0, shortcut.id)

  panel.newTabBtns.splice(index, 1)
  panel.newTabBtns.splice(index + 1, 0, shortcut.id)

  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}

function removeShortcut(shortcut: NewTabShortcut): void {
  if (!Popups.reactive.newTabShortcutsPopup) return
  const panelId = Popups.reactive.newTabShortcutsPopup.panelId
  const panel = Info.isSidebar ? Sidebar.panelsById[panelId] : SidebarConfigRState.panels[panelId]
  if (!Utils.isTabsPanel(panel)) return

  const index = panel.newTabBtns.indexOf(shortcut.id)
  if (index === -1) return

  const rawShortcuts = Popups.reactive.newTabShortcutsPopup.rawShortcuts
  rawShortcuts.splice(index, 1)

  panel.newTabBtns.splice(index, 1)

  if (Info.isSidebar) Sidebar.saveSidebar(1000)
  else saveSidebarConfig(1000)
}
</script>
