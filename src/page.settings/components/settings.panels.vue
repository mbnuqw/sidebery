<template lang="pug">
section
  h2 {{t('settings.panels_title')}}
  ToggleField(
    label="settings.skip_empty_panels"
    :value="$store.state.skipEmptyPanels"
    @input="setOpt('skipEmptyPanels', $event)")
  TransitionGroup(name="panel" tag="div"): .panel-card.-separate(
    v-for="(panel, i) in $store.state.panels"
    :key="panel.id"
    :data-color="panel.color"
    :data-first="i === 0"
    :data-last="i === $store.state.panels.length - 1")
    .panel-card-body(@click="$store.state.selectedPanel = panel")
      .panel-card-icon
        img(v-if="panel.customIcon" :src="panel.customIcon")
        svg(v-else): use(:xlink:href="'#' + panel.icon")
      .panel-card-name {{panel.name}}
    .panel-card-ctrls
      .panel-card-ctrl.-down(
        :data-inactive="i === $store.state.panels.length - 1"
        @click="movePanel(panel, 1)")
        svg: use(xlink:href="#icon_expand")
      .panel-card-ctrl.-up(
        :data-inactive="i === 0"
        @click="movePanel(panel, -1)")
        svg: use(xlink:href="#icon_expand")
      .panel-card-ctrl.-rm(
        :data-inactive="panel.type === 'bookmarks' || panel.type === 'default'"
        @click="removePanel(panel)")
        svg: use(xlink:href="#icon_remove")
  .ctrls: .btn(@click="createPanel") {{t('settings.panels_create_btn')}}
  Transition(name="panel-config")
    .panel-config-layer(
      v-if="$store.state.selectedPanel"
      @click="$store.state.selectedPanel = null")
      .panel-config-box(@click.stop="")
        PanelConfig.dashboard(:conf="$store.state.selectedPanel")
</template>

<script>
import { translate } from '../../../addon/locales/dict'
import { TABS_PANEL } from '../../../addon/defaults'
import State from '../store/state'
import Actions from '../actions'
import ToggleField from '../../components/toggle-field'
import PanelConfig from './panel-config'

export default {
  components: { PanelConfig, ToggleField },

  methods: {
    /**
     * Create panel-container
     */
    async createPanel() {
      let panel = Utils.cloneObject(TABS_PANEL)
      panel.id = Utils.uid()
      panel.name = 'New Panel ' + (State.panels.length + 1)
      State.panels.push(panel)
      State.panelsMap[panel.id] = panel
      Actions.savePanels()
    },

    /**
     * Move panel
     */
    movePanel(panel, dir) {
      Actions.movePanel(panel.id, dir)
    },

    /**
     * Remove panel
     */
    async removePanel(panel) {
      if (!panel || !panel.name) return
      if (panel.type === 'bookmarks') return
      if (panel.type === 'default') return

      let preMsg = translate('settings.panel_remove_confirm_1')
      let postMsg = translate('settings.panel_remove_confirm_2')
      if (window.confirm(preMsg + panel.name + postMsg)) {
        let index = State.panels.findIndex(p => p.id === panel.id)
        if (index > -1) State.panels.splice(index, 1)
        delete State.panelsMap[panel.id]
        Actions.savePanels()
      }
    },
  },
}
</script>
