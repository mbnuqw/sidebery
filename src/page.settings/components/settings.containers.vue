<template lang="pug">
section
  h2 {{t('settings.containers_title')}}
  transition-group(name="panel" tag="div"): .panel-card(
    v-for="(container, id) in $store.state.containers"
    :key="container.id"
    :data-color="container.color")
    .panel-card-body(@click="$store.state.selectedContainer = container")
      .panel-card-icon: svg: use(:xlink:href="'#' + container.icon")
      .panel-card-name {{container.name}}
    .panel-card-ctrls
      .panel-card-ctrl.-rm(
        @click="removeContainer(container)")
        svg: use(xlink:href="#icon_remove")
  .panel-placeholder(v-if="!Object.keys($store.state.containers).length")
  .ctrls: .btn(@click="createContainer") {{t('settings.containers_create_btn')}}
  transition(name="panel-config")
    .panel-config-layer(
      v-if="$store.state.selectedContainer"
      @click="$store.state.selectedContainer = null")
      .panel-config-box(@click.stop="")
        container-config.dashboard(:conf="$store.state.selectedContainer")
</template>

<script>
import { translate } from '../../../addon/locales/dict'
import State from '../store/state'
import Actions from '../actions'
import ContainerConfig from './container-config'

export default {
  components: { ContainerConfig },

  methods: {
    /**
     * Create container
     */
    async createContainer() {
      let containersCount = Object.keys(State.containers).length
      await browser.contextualIdentities.create({
        name: 'New Container ' + (containersCount + 1),
        color: 'blue',
        icon: 'fingerprint',
      })
      Actions.loadContainers()
    },

    /**
     * Remove container
     */
    async removeContainer(container) {
      let preMsg = translate('settings.contianer_remove_confirm_prefix')
      let postMsg = translate('settings.contianer_remove_confirm_postfix')
      if (window.confirm(preMsg + container.name + postMsg)) {
        await browser.contextualIdentities.remove(container.id)
        for (let panel of State.panels) {
          if (panel.newTabCtx === container.id) panel.newTabCtx = 'none'
          if (panel.moveTabCtx === container.id) panel.moveTabCtx = 'none'
        }
        Actions.loadContainers()
        Actions.savePanels()
      }
    },
  },
}
</script>
