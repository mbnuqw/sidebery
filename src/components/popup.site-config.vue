<template lang="pug">
.SiteConfigPopup.popup-container(@mousedown.stop.self="onCancel" @mouseup.stop)
  .popup(v-if="Sidebar.reactive.siteConfigPopup")
    h2 {{translate('popup.url_rules.title')}}
    .space
    .note {{translate('popup.url_rules.match_label')}}
    .match-options(v-if="matchOptions && matchOptions.length > 1")
      .match-option(
        v-for="opt in matchOptions"
        :key="opt.id"
        :title="opt.name"
        :data-active="opt.active"
        @click="switchMatchOption(opt)")
        .label {{opt.name}}
    TextField.matchString.-no-separator(
      v-if="matchTextField"
      v-model:value="matchString"
      label="popup.url_rules.custom_match_placeholder"
      or="---"
      :line="true")
    .space
    SelectField.-no-separator(
      label="popup.url_rules.reopen_label"
      noneOpt="-"
      v-model:value="reopenInContainerId"
      :opts="availableContainerOpts"
      :inline="false"
      :folded="true")
    .space
    SelectField.-no-separator(
      label="popup.url_rules.move_label"
      noneOpt="-"
      v-model:value="moveToPanelId"
      :opts="availablePanelOpts"
      :inline="false"
      :folded="true")
    .sub-field
      ToggleField.-no-separator(
        label="popup.url_rules.move_top_lvl_label"
        :inactive="moveToPanelId === 'none'"
        v-model:value="moveToPanelTopLvlOnly")
    .space
    .ctrls
      .btn(:class="{ '-inactive': !saveBtnActive }" @click="onSave") {{translate('btn.save')}}
      .btn(@click="onCancel") {{translate('btn.cancel')}}
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { translate } from 'src/dict'
import { Container, TabReopenRuleConfig, TabReopenRuleType, TabsPanel } from 'src/types'
import { TabToPanelMoveRuleConfig } from 'src/types'
import { Sidebar } from 'src/services/sidebar'
import { Containers } from 'src/services/containers'
import TextField from './text-field.vue'
import ToggleField from './toggle-field.vue'
import SelectField from './select-field.vue'
import * as Utils from 'src/utils'
import { Tabs } from 'src/services/tabs.fg'
import { Windows } from 'src/services/windows'

interface Option {
  value: string
  icon?: string
  color?: string
  tooltip?: string
  title?: string
}

interface MatchOption {
  id: ID
  name: string
  value: string
  active: boolean
}

interface URLInfo {
  scheme: string
  hostParts: string[]
  pathParts: string[]
}

const matchOptions = ref<MatchOption[] | null>(null)
const matchTextField = ref(false)
const matchString = ref('')
const reopenInContainerId = ref('none')
const moveToPanelId = ref<ID>('none')
const moveToPanelTopLvlOnly = ref(true)
const existedRules = ref(false)

const saveBtnActive = computed<boolean>(() => {
  if (!Sidebar.reactive.siteConfigPopup) return false
  if (!matchString.value.trim()) return false
  const reopen = reopenInContainerId.value !== 'none'
  const move = moveToPanelId.value !== 'none'
  return reopen || move || existedRules.value
})

const availableContainerOpts = computed<Option[]>(() => {
  if (!Sidebar.reactive.siteConfigPopup) return []

  const result: Option[] = [
    { value: 'none', color: 'inactive', icon: '#icon_none', title: 'Not set' },
  ]

  for (let c of Object.values(Containers.reactive.byId)) {
    result.push({ value: c.id, color: c.color, icon: '#' + c.icon, title: c.name, tooltip: c.name })
  }

  return result
})

const availablePanelOpts = computed<Option[]>(() => {
  if (!Sidebar.reactive.siteConfigPopup) return []

  const result: Option[] = [
    { value: 'none', color: 'inactive', icon: '#icon_none', title: 'Not set' },
  ]

  for (let p of Sidebar.reactive.panels) {
    if (!Utils.isTabsPanel(p)) continue
    const opt: Option = { value: p.id as string, color: p.color, title: p.name }
    if (p.iconIMG) opt.icon = p.iconIMG
    else opt.icon = '#' + p.iconSVG
    result.push(opt)
  }

  return result
})

function init() {
  if (!Sidebar.reactive.siteConfigPopup) return

  const url = Sidebar.reactive.siteConfigPopup.url
  const urlInfo = parseURL(url)
  const isHTTP = urlInfo.scheme.startsWith('http')

  const options: MatchOption[] = []
  const isCustomOptActive = urlInfo.hostParts.length <= 1 || !isHTTP

  options.push({
    id: 'custom',
    name: 'custom',
    value: '',
    active: isCustomOptActive,
  })

  if (isCustomOptActive) {
    matchTextField.value = true
  } else {
    const rePrefix = '/^https?://([0-9A-Za-z-]{1,63}\\.)*'
    const len = urlInfo.hostParts.length - 1
    for (let i = len; i-- > 0; ) {
      const hostParts = urlInfo.hostParts.slice(i)
      const host = hostParts.join('.')
      const reHost = hostParts.join('\\.') + '/'
      const isActive = i === 0

      options.push({
        id: host,
        name: host,
        value: rePrefix + reHost,
        active: i === 0,
      })

      if (isActive) matchString.value = rePrefix + reHost
    }
  }

  matchOptions.value = options.reverse()

  findExistedRules()
}

let foundReopenRule: FindReopenRuleResult | undefined
let foundMoveRule: FindMoveToPanelRuleResult | undefined
function findExistedRules() {
  const activeOption = matchOptions.value?.find(opt => opt.active)
  let hostName = activeOption?.name

  if (hostName && activeOption?.id !== 'custom') {
    const urlExample = `https://${hostName}`

    foundReopenRule = findReopenRule(urlExample)
    foundMoveRule = findMoveToPanelRule(urlExample)
    existedRules.value = true
  } else {
    foundReopenRule = undefined
    foundMoveRule = undefined
    existedRules.value = false
  }

  if (foundReopenRule) reopenInContainerId.value = foundReopenRule.container.id
  else reopenInContainerId.value = 'none'
  if (foundMoveRule) {
    moveToPanelId.value = foundMoveRule.panel.id
    moveToPanelTopLvlOnly.value = !!foundMoveRule.rule.topLvlOnly
  } else {
    moveToPanelId.value = 'none'
    moveToPanelTopLvlOnly.value = true
  }
}

type FindReopenRuleResult = { rule: TabReopenRuleConfig; container: Container }
function findReopenRule(url: string): FindReopenRuleResult | undefined {
  for (const container of Object.values(Containers.reactive.byId)) {
    for (const rule of container.reopenRules) {
      if (!container.reopenRulesActive) continue
      if (rule.type === TabReopenRuleType.Exclude) continue
      const re = parseUrlRuleRE(rule.url)
      if (re && re.test(url)) return { rule, container }
      else if (url === rule.url) return { rule, container }
    }
  }
}

type FindMoveToPanelRuleResult = { rule: TabToPanelMoveRuleConfig; panel: TabsPanel }
function findMoveToPanelRule(url: string): FindMoveToPanelRuleResult | undefined {
  for (const panel of Sidebar.reactive.panels) {
    if (!Utils.isTabsPanel(panel)) continue
    for (const rule of panel.moveRules) {
      if (rule.containerId !== undefined) continue
      if (!rule.url) continue
      const re = parseUrlRuleRE(rule.url)
      if (re && re.test(url)) return { rule, panel }
      else if (url === rule.url) return { rule, panel }
    }
  }
}

function parseUrlRuleRE(url: string): RegExp | undefined {
  if (url.startsWith('/') && url.endsWith('/')) {
    try {
      return new RegExp(url.slice(1, -1))
    } catch {
      return
    }
  }
}

function parseURL(url: string): URLInfo {
  const sParts = url.split('://')
  const pParts = sParts[sParts.length - 1]?.split('/')
  const host = pParts.shift()
  const hostParts = host?.split('.') ?? []
  const scheme = sParts[0]

  return {
    scheme,
    hostParts,
    pathParts: pParts,
  }
}

function switchMatchOption(opt: MatchOption) {
  matchOptions.value?.forEach(o => (o.active = o.id === opt.id))
  matchTextField.value = opt.id === 'custom'
  if (opt.value) matchString.value = opt.value
  findExistedRules()
}

function validateMatchString(value: string): boolean {
  value = value.trim()

  if (value.startsWith('/') && value.endsWith('/')) {
    try {
      new RegExp(value.slice(1, -1))
    } catch {
      return false
    }
  } else if (!value) {
    return false
  }

  return true
}

function onSave(): void {
  if (!Sidebar.reactive.siteConfigPopup) return

  const tab = Tabs.byId[Sidebar.reactive.siteConfigPopup.tabId]
  const match = matchString.value.trim()
  const matchIsOk = validateMatchString(match)
  const matchOption = matchOptions.value?.find(opt => opt.id !== 'custom' && opt.active)
  const rContainer = Containers.reactive.byId[reopenInContainerId.value]
  const mPanel = Sidebar.reactive.panelsById[moveToPanelId.value]
  const mPanelTopLvlOnly = moveToPanelTopLvlOnly.value
  let saveContainers = false
  let savePanels = false
  let reopenTab = false
  let moveTab = false

  if (!matchIsOk) return

  // Remove reopening rule
  if (foundReopenRule && foundReopenRule.container.id !== rContainer?.id) {
    const container = foundReopenRule.container
    const rule = foundReopenRule.rule
    const index = container.reopenRules.findIndex(r => r.id === rule.id)
    if (index !== -1) container.reopenRules.splice(index, 1)
    if (!container.reopenRules.length) container.reopenRulesActive = false
    saveContainers = true
  }

  // Remove moving rule
  if (foundMoveRule && foundMoveRule.panel.id !== mPanel?.id) {
    const panel = foundMoveRule.panel
    const rule = foundMoveRule.rule
    const index = panel.moveRules.findIndex(r => r.id === rule.id)
    if (index !== -1) panel.moveRules.splice(index, 1)
    savePanels = true
  }

  // Create new reopening rule
  if (rContainer) {
    const ruleConfig: TabReopenRuleConfig = {
      id: Utils.uid(),
      active: true,
      type: TabReopenRuleType.Include,
      url: match,
    }
    if (!rContainer.reopenRules.length) rContainer.reopenRulesActive = true
    else if (!rContainer.reopenRulesActive) {
      rContainer.reopenRules.forEach(rule => (rule.active = false))
      rContainer.reopenRulesActive = true
    }
    rContainer.reopenRules.push(ruleConfig)
    if (matchOption?.name) ruleConfig.name = matchOption.name
    saveContainers = true

    if (tab && tab.cookieStoreId !== rContainer.id) reopenTab = true
  }

  // Create moving rule
  if (Utils.isTabsPanel(mPanel)) {
    const ruleConfig: TabToPanelMoveRuleConfig = { id: Utils.uid(), active: true }
    ruleConfig.url = match
    ruleConfig.topLvlOnly = mPanelTopLvlOnly
    if (matchOption?.name) ruleConfig.name = matchOption.name
    mPanel.moveRules.push(ruleConfig)
    savePanels = true

    if (tab && tab.panelId !== mPanel.id && !reopenTab) moveTab = true
  }

  if (saveContainers) Containers.saveContainers(120)
  if (savePanels) {
    Tabs.recalcMoveRules()
    Sidebar.saveSidebar(120)
  }

  if (tab && rContainer && reopenTab) {
    Tabs.reopenInContainer([tab.id], rContainer.id)
  }
  if (tab && Utils.isTabsPanel(mPanel) && moveTab) {
    const items = Tabs.getTabsInfo([tab.id])
    const src = { windowId: Windows.id, panelId: tab.panelId, pinned: tab.pinned }
    Tabs.move(items, src, { panelId: mPanel.id, index: mPanel.nextTabIndex })
  }

  Sidebar.closeSiteConfigPopup()
}

function onCancel(): void {
  if (!Sidebar.reactive.siteConfigPopup) return

  Sidebar.closeSiteConfigPopup()
}

init()
</script>
