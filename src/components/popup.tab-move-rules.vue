<template lang="pug">
.TabMoveRulesPopup.popup-container(@mousedown.stop.self="onCancel" @mouseup.stop)
  .popup(v-if="Sidebar.reactive.tabMoveRulesPopup")
    h2(v-if="rules.length") {{translate('popup.tab_move_rules.title')}}
    .rules(v-if="rules.length")
      .rule(
        v-for="rule of rules"
        :key="rule.id"
        :data-edit="rule.id === editing"
        :data-active="rule.active"
        @click="editRule(rule)")
        .container-box(v-if="rule.containerId" :data-color="rule.containerColor")
          .icon-box
            svg.icon: use(:xlink:href="rule.containerIcon")
          .container {{rule.containerName}}
          .controls-box(v-if="!editing")
            .btn-up(@click.stop="shortcutUp(rule)"): svg: use(xlink:href="#icon_expand")
            .btn-down(@click.stop="shortcutDown(rule)"): svg: use(xlink:href="#icon_expand")
            .btn-rm(@click.stop="removeRule(rule)"): svg: use(xlink:href="#icon_remove")
        .url-box(v-if="rule.url" :data-with-container="!!rule.containerId")
          .url {{rule.url}}
          .controls-box(v-if="!rule.containerId && !editing")
            .btn-up(@click.stop="shortcutUp(rule)"): svg: use(xlink:href="#icon_expand")
            .btn-down(@click.stop="shortcutDown(rule)"): svg: use(xlink:href="#icon_expand")
            .btn-rm(@click.stop="removeRule(rule)"): svg: use(xlink:href="#icon_remove")
    .space
    h2 {{editing ? translate('popup.tab_move_rules.editor_title.edit') : translate('popup.tab_move_rules.editor_title.new')}}
    SelectField.-no-separator.-compact(
      label="popup.tab_move_rules.rule_container_label"
      noneOpt="-"
      v-model:value="newRuleContainerId"
      :opts="availableContainersOpts"
      :inline="false"
      :folded="true")
    TextField.-compact(
      label="popup.tab_move_rules.rule_url_label"
      v-model:value="newRuleURL"
      :or="'Any URL'"
      :line="true")
    ToggleField.-compact(
      label="popup.tab_move_rules.rule_top_lvl_label"
      v-model:value="newRuleTopLvl")

    .ctrls(v-if="editing")
      .btn(:class="{ '-inactive': !addBtnActive }" @click="onSave").
        {{translate('popup.tab_move_rules.edit_rule_btn.save')}}
      .btn(@click="onEditCancel").
        {{translate('popup.tab_move_rules.edit_rule_btn.cancel')}}
    .ctrls(v-else)
      .btn.-wide(:class="{ '-inactive': !addBtnActive }" @click="onAdd").
        {{translate('popup.tab_move_rules.add_rule_btn')}}
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { translate } from 'src/dict'
import { TabToPanelMoveRuleConfig } from 'src/types'
import { DEFAULT_CONTAINER_ID } from 'src/defaults'
import { Sidebar } from 'src/services/sidebar'
import { Containers } from 'src/services/containers'
import * as Utils from 'src/utils'
import TextField from './text-field.vue'
import SelectField from './select-field.vue'
import ToggleField from './toggle-field.vue'

interface MoveRulePreview {
  id: ID
  active: boolean
  url?: string
  urlIcon?: string
  containerId?: string
  containerName?: string
  containerIcon?: string
  containerColor?: string
  topLvlOnly?: boolean
}

interface ContainerOption {
  value: string
  icon?: string
  color?: string
  tooltip?: string
  title?: string
}

interface ContainerConf {
  id: string
  name: string
  icon: string
  color: string
}

const rules = ref<MoveRulePreview[]>([])
const newRuleContainerId = ref('none')
const newRuleURL = ref('')
const newRuleTopLvl = ref(true)
const editing = ref<ID | null>(null)

const addBtnActive = computed<boolean>(() => {
  const urlIsValid = !!newRuleURL.value
  const containerIsValid = newRuleContainerId.value !== 'none'
  return urlIsValid || containerIsValid
})

onMounted(() => {
  initPopupState()
})

function initPopupState() {
  if (!Sidebar.reactive.tabMoveRulesPopup) return []

  const output: MoveRulePreview[] = []
  const ruleConfigs = Sidebar.reactive.tabMoveRulesPopup.panel.moveRules

  for (const conf of ruleConfigs) {
    output.push(createRulePreview(conf))
  }

  rules.value = output
}

function createRulePreview(ruleConfig: TabToPanelMoveRuleConfig): MoveRulePreview {
  const rule: MoveRulePreview = {
    id: ruleConfig.id,
    active: ruleConfig.active,
    url: ruleConfig.url,
  }

  let container
  if (ruleConfig.containerId) container = getContainerConf(ruleConfig.containerId)
  if (container) {
    rule.containerId = ruleConfig.containerId
    rule.containerName = container.name
    rule.containerIcon = '#' + container.icon
    rule.containerColor = container.color
  } else if (ruleConfig.containerId) {
    rule.active = false
  }

  if (ruleConfig.url) {
    rule.url = ruleConfig.url
    rule.urlIcon = '#icon_ff'
  }

  rule.topLvlOnly = !!ruleConfig.topLvlOnly

  return rule
}

function getContainerConf(containerId: string): ContainerConf | undefined {
  if (containerId === 'none') return
  if (containerId === DEFAULT_CONTAINER_ID) {
    const defaultTitle = translate('popup.new_tab_shortcuts.new_shortcut_default_container')
    return {
      id: DEFAULT_CONTAINER_ID,
      name: defaultTitle,
      icon: 'icon_ff',
      color: 'toolbar',
    }
  }
  const container = Containers.reactive.byId[containerId]
  if (container) {
    return {
      id: container.id,
      name: container.name,
      icon: container.icon,
      color: container.color,
    }
  }
}

const availableContainersOpts = computed<ContainerOption[]>(() => {
  if (!Sidebar.reactive.tabMoveRulesPopup) return []

  const defaultTitle = translate('popup.new_tab_shortcuts.new_shortcut_default_container')
  const result: ContainerOption[] = [
    {
      value: 'none',
      color: 'inactive',
      icon: 'icon_none',
      title: 'Not set',
      tooltip: 'Not set',
    },
    {
      value: DEFAULT_CONTAINER_ID,
      color: 'toolbar',
      icon: 'icon_ff',
      title: defaultTitle,
      tooltip: defaultTitle,
    },
  ]

  for (let c of Object.values(Containers.reactive.byId)) {
    result.push({ value: c.id, color: c.color, icon: c.icon, title: c.name, tooltip: c.name })
  }

  return result
})

function onAdd(): void {
  if (!Sidebar.reactive.tabMoveRulesPopup) return
  if (!addBtnActive.value) return
  if (!newRuleURL.value && newRuleContainerId.value === 'none') return

  // Remove duplicate
  const panel = Sidebar.reactive.tabMoveRulesPopup.panel
  const newCtrId = newRuleContainerId.value !== 'none' ? newRuleContainerId.value : undefined
  const newURL = newRuleURL.value ? newRuleURL.value : undefined
  Sidebar.reactive.panels.find(p => {
    if (!Utils.isTabsPanel(p)) return false
    const sameRuleIndex = p.moveRules.findIndex(r => {
      return newCtrId === r.containerId && newURL === r.url
    })
    if (sameRuleIndex !== -1) {
      p.moveRules.splice(sameRuleIndex, 1)
      if (p.id === panel.id) rules.value.splice(sameRuleIndex, 1)
    }
  })

  // Add new rule to panel config
  const ruleConfig: TabToPanelMoveRuleConfig = {
    id: Utils.uid(),
    active: true,
  }
  if (newRuleContainerId.value !== 'none') ruleConfig.containerId = newRuleContainerId.value
  if (newRuleURL.value) ruleConfig.url = newRuleURL.value

  panel.moveRules.push(ruleConfig)

  // Add new rule in local rules list
  rules.value.push(createRulePreview(ruleConfig))

  // Reset inputs
  newRuleURL.value = ''
  newRuleContainerId.value = 'none'

  Sidebar.saveSidebar(1000)
}

function onCancel(): void {
  if (!Sidebar.reactive.tabMoveRulesPopup) return

  Sidebar.closeTabMoveRulesPopup()
}

function shortcutUp(rule: MoveRulePreview): void {
  if (!Sidebar.reactive.tabMoveRulesPopup) return
  const panel = Sidebar.reactive.tabMoveRulesPopup.panel

  const index = panel.moveRules.findIndex(r => r.id === rule.id)
  if (index !== -1 && index > 0) {
    const ruleConfig = panel.moveRules.splice(index, 1)[0]
    if (ruleConfig) panel.moveRules.splice(index - 1, 0, ruleConfig)
  }

  const localIndex = rules.value.findIndex(r => r.id === rule.id)
  if (localIndex !== -1 && localIndex > 0) {
    rules.value.splice(localIndex, 1)
    rules.value.splice(localIndex - 1, 0, rule)
  }

  Sidebar.saveSidebar(1000)
}

function shortcutDown(rule: MoveRulePreview): void {
  if (!Sidebar.reactive.tabMoveRulesPopup) return
  const panel = Sidebar.reactive.tabMoveRulesPopup.panel

  const index = panel.moveRules.findIndex(r => r.id === rule.id)
  if (index !== -1 && index < panel.moveRules.length - 1) {
    const ruleConfig = panel.moveRules.splice(index, 1)[0]
    if (ruleConfig) panel.moveRules.splice(index + 1, 0, ruleConfig)
  }

  const localIndex = rules.value.findIndex(r => r.id === rule.id)
  if (localIndex !== -1 && localIndex < panel.moveRules.length - 1) {
    rules.value.splice(localIndex, 1)
    rules.value.splice(localIndex + 1, 0, rule)
  }

  Sidebar.saveSidebar(1000)
}

function removeRule(rule: MoveRulePreview): void {
  if (!Sidebar.reactive.tabMoveRulesPopup) return
  const panel = Sidebar.reactive.tabMoveRulesPopup.panel

  // Remove rule from panel's config
  const index = panel.moveRules.findIndex(r => r.id === rule.id)
  if (index !== -1) panel.moveRules.splice(index, 1)

  // Remove rule from local list
  const localIndex = rules.value.findIndex(r => r.id === rule.id)
  if (localIndex !== -1) rules.value.splice(localIndex, 1)

  Sidebar.saveSidebar(1000)
}

function editRule(rule: MoveRulePreview) {
  if (editing.value === rule.id) {
    return onEditCancel()
  }

  editing.value = rule.id

  if (rule.url) newRuleURL.value = rule.url
  else newRuleURL.value = ''
  if (rule.containerId && getContainerConf(rule.containerId)) {
    newRuleContainerId.value = rule.containerId
  } else {
    newRuleContainerId.value = 'none'
  }
  newRuleTopLvl.value = !!rule.topLvlOnly
}

function onEditCancel() {
  editing.value = null

  // Reset inputs
  newRuleURL.value = ''
  newRuleContainerId.value = 'none'
  newRuleTopLvl.value = true
}

function onSave() {
  if (!editing.value) return

  if (!Sidebar.reactive.tabMoveRulesPopup) return
  const panel = Sidebar.reactive.tabMoveRulesPopup.panel

  const rule = rules.value.find(r => r.id === editing.value)
  if (!rule) return

  // Remove duplicate
  const newCtrId = newRuleContainerId.value !== 'none' ? newRuleContainerId.value : undefined
  const newURL = newRuleURL.value ? newRuleURL.value : undefined
  Sidebar.reactive.panels.find(p => {
    if (!Utils.isTabsPanel(p)) return false
    const sameRuleIndex = p.moveRules.findIndex(r => {
      if (rule.id === r.id) return false
      return newCtrId === r.containerId && newURL === r.url
    })
    if (sameRuleIndex !== -1) {
      p.moveRules.splice(sameRuleIndex, 1)
      if (p.id === panel.id) rules.value.splice(sameRuleIndex, 1)
    }
  })

  // Update rule in panel config
  const ruleConfig = panel.moveRules.find(r => r.id === rule.id)
  if (ruleConfig) {
    ruleConfig.active = true
    if (newRuleContainerId.value !== 'none') ruleConfig.containerId = newRuleContainerId.value
    else delete ruleConfig.containerId
    if (newRuleURL.value) ruleConfig.url = newRuleURL.value
    else delete ruleConfig.url
    ruleConfig.topLvlOnly = newRuleTopLvl.value
  }
  Sidebar.saveSidebar(1000)

  // Update rule in local list
  rule.active = true
  const container = getContainerConf(newRuleContainerId.value)
  if (container) {
    rule.containerId = container.id
    rule.containerName = container.name
    rule.containerIcon = '#' + container.icon
    rule.containerColor = container.color
  } else delete rule.containerId
  if (newRuleURL.value) rule.url = newRuleURL.value
  else delete rule.url
  rule.topLvlOnly = newRuleTopLvl.value

  // Reset inputs
  newRuleURL.value = ''
  newRuleContainerId.value = 'none'
  newRuleTopLvl.value = true
  editing.value = null
}
</script>
