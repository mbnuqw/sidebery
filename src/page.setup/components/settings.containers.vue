<template lang="pug">
section(ref="el")
  h2 {{translate('settings.containers_title')}}
  span.header-shadow
  ToggleField(
    label="settings.containers_sort_by_name"
    v-model:value="Settings.state.containersSortByName"
    dbg="containersSortByName"
    :default="DEFAULT_SETTINGS.containersSortByName"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    .card(
      v-for="(container, id) in Containers.sortContainers(Object.values(Containers.reactive.byId))"
      :key="container.id"
      :data-color="container.color")
      .card-body(@click="SetupPage.reactive.selectedContainer = container")
        .card-icon: svg: use(:href="'#' + container.icon")
        .card-name {{container.name}}
      .card-badges
        .card-badge(
          v-if="container.reopenRules?.length"
          :title="translate('container.manage_reopen_rules_label')"
          :data-inactive="!container.reopenRulesActive"
          @click="Popups.openTabReopenRulesPopup(container.id)")
          svg: use(href="#icon_reload")
          .len {{container.reopenRules.length}}
      .card-ctrls
        .card-ctrl.-rm(
          @click="removeContainer(container)")
          svg: use(href="#icon_remove")
    .card-placeholder(v-if="!Object.keys(Containers.reactive.byId).length")
  .ctrls: .btn(@click="createContainer") {{translate('settings.containers_create_btn')}}
  Transition(name="popup")
    .popup-layer(
      v-if="SetupPage.reactive.selectedContainer"
      @click="SetupPage.reactive.selectedContainer = null")
      .popup-box(@click.stop)
        ContainerConfig(:conf="SetupPage.reactive.selectedContainer")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import type { Container } from 'src/types'
import { DEFAULT_CONTAINER, DEFAULT_SETTINGS } from 'src/defaults'
import { translate } from 'src/dict'
import * as Utils from 'src/utils'
import * as Containers from 'src/services/containers'
import * as SetupPage from 'src/services/setup-page.fg'
import * as Logs from 'src/services/logs'
import * as Popups from 'src/services/popups.fg'
import * as Settings from 'src/services/settings.fg'
import * as SidebarConf from 'src/services/sidebar-config.fg'
import ContainerConfig from './popup.container-config.vue'
import ToggleField from '../../components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_containers', el.value))

/**
 * Create container
 */
async function createContainer(): Promise<void> {
  let containersCount = Object.keys(Containers.reactive.byId).length
  const newFFContainer = await browser.contextualIdentities.create({
    name: `New Container ${containersCount + 1}`,
    color: 'blue',
    icon: 'fingerprint',
  })
  const container = Utils.cloneObject(DEFAULT_CONTAINER)
  container.cookieStoreId = newFFContainer.cookieStoreId
  container.id = newFFContainer.cookieStoreId
  container.name = newFFContainer.name
  container.icon = newFFContainer.icon
  container.color = newFFContainer.color
  Containers.reactive.byId[newFFContainer.cookieStoreId] = container

  SetupPage.reactive.selectedContainer = container
}

/**
 * Remove container
 */
async function removeContainer(container: Container): Promise<void> {
  if (window.confirm(translate('settings.container_remove_confirm', container.name))) {
    let navSaveNeeded = false
    try {
      await browser.contextualIdentities.remove(container.id)
    } catch (err) {
      return Logs.err('Cannot remove container', err)
    }

    delete Containers.reactive.byId[container.id]

    for (let panelConf of Object.values(SidebarConf.reactive.panels)) {
      if (!Utils.isTabsPanel(panelConf)) continue
      if (panelConf.newTabCtx === container.id) {
        panelConf.newTabCtx = 'none'
        navSaveNeeded = true
      }

      if (panelConf.moveRules.length) {
        panelConf.moveRules = panelConf.moveRules.filter(rule => {
          if (rule.containerId && rule.containerId === container.id) {
            navSaveNeeded = true
            delete rule.containerId
            if (!rule.url) return false
          }
          return true
        })
      }
    }

    if (navSaveNeeded) SidebarConf.saveSidebarConfig()
  }
}
</script>
