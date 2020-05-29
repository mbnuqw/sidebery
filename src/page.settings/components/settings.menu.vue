<template lang="pug">
section
  h2 {{t('settings.ctx_menu_title')}}

  ToggleField(
    label="settings.ctx_menu_native"
    :value="$store.state.ctxMenuNative"
    @input="setOpt('ctxMenuNative', $event)")

  SelectField(
    label="settings.autoHide_ctx_menu"
    optLabel="settings.autoHide_ctx_menu_"
    :inactive="$store.state.ctxMenuNative"
    :value="$store.state.autoHideCtxMenu"
    :opts="$store.state.autoHideCtxMenuOpts"
    @input="setOpt('autoHideCtxMenu', $event)")

  ToggleField(
    label="settings.ctx_menu_render_inact"
    :value="$store.state.ctxMenuRenderInact"
    @input="setOpt('ctxMenuRenderInact', $event)")

  TextField(
    label="settings.ctx_menu_ignore_ctr"
    :or="t('settings.ctx_menu_ignore_ctr_or')"
    :note="t('settings.ctx_menu_ignore_ctr_note')"
    :line="true"
    :valid="ignoreContainersRuleValid"
    input-width="50"
    v-model="$store.state.ctxMenuIgnoreContainers"
    v-debounce:input.321="setIgnoreContainersRule")

  .ctrls
    .btn(@click="switchView('menu_editor')") {{t('settings.ctx_menu_editor')}}
</template>

<script>
import Actions from '../actions'
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import TextField from '../../components/text-field'

export default {
  components: { ToggleField, SelectField, TextField },

  data() {
    return {
      ignoreContainersRuleValid: '',
    }
  },

  methods: {
    setIgnoreContainersRule(value) {
      this.validateIgnoreContainersRule(value)
      this.setOpt('ctxMenuIgnoreContainers', value)
    },

    validateIgnoreContainersRule(value) {
      if (!value) {
        this.ignoreContainersRuleValid = ''
        return
      }

      let rules = Actions.parseCtxMenuContainersRules(value)
      if (!rules) this.ignoreContainersRuleValid = 'invalid'
      else this.ignoreContainersRuleValid = 'valid'
    },
  },
}
</script>
