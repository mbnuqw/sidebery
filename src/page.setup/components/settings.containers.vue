<template lang="pug">
section(ref="el")
  h2 {{translate('settings.containers_title')}}
  .card(
    v-for="(container, id) in Containers.reactive.byId"
    :key="container.id"
    :data-color="container.color")
    .card-body(@click="SetupPage.reactive.selectedContainer = container")
      .card-icon: svg: use(:xlink:href="'#' + container.icon")
      .card-name {{container.name}}
    .card-ctrls
      .card-ctrl.-rm(
        @click="removeContainer(container)")
        svg: use(xlink:href="#icon_remove")
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
import Utils from 'src/utils'
import { translate } from 'src/dict'
import { Container } from 'src/types'
import { Containers } from 'src/services/containers'
import { Sidebar } from 'src/services/sidebar'
import { SetupPage } from 'src/services/setup-page'
import ContainerConfig from './popup.container-config.vue'
import { Logs } from 'src/services/logs'
import { DEFAULT_CONTAINER } from 'src/defaults'

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
  let preMsg = translate('settings.contianer_remove_confirm_prefix')
  let postMsg = translate('settings.contianer_remove_confirm_postfix')
  if (window.confirm(preMsg + container.name + postMsg)) {
    let navSaveNeeded = false
    try {
      await browser.contextualIdentities.remove(container.id)
    } catch (err) {
      return Logs.err('Cannot remove container', err)
    }

    delete Containers.reactive.byId[container.id]

    for (let panel of Sidebar.reactive.panels) {
      if (!Utils.isTabsPanel(panel)) continue
      if (panel.newTabCtx === container.id) {
        panel.newTabCtx = 'none'
        navSaveNeeded = true
      }
      if (panel.moveTabCtx === container.id) {
        panel.moveTabCtx = 'none'
        navSaveNeeded = true
      }
    }

    if (navSaveNeeded) Sidebar.saveSidebar()
  }
}
</script>
