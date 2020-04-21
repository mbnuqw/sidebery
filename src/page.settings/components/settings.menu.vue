<template lang="pug">
section
  h2 {{t('settings.ctx_menu_title')}}
  toggle-field(
    label="settings.ctx_menu_native"
    :value="$store.state.ctxMenuNative"
    @input="setOpt('ctxMenuNative', $event)")
  select-field(
    label="settings.autoHide_ctx_menu"
    optLabel="settings.autoHide_ctx_menu_"
    :inactive="$store.state.ctxMenuNative"
    :value="$store.state.autoHideCtxMenu"
    :opts="$store.state.autoHideCtxMenuOpts"
    @input="setOpt('autoHideCtxMenu', $event)")
  toggle-field(
    label="settings.ctx_menu_render_inact"
    :value="$store.state.ctxMenuRenderInact"
    @input="setOpt('ctxMenuRenderInact', $event)")
  .ctrls
    .btn(@click="switchView('menu_editor')") {{t('settings.ctx_menu_editor')}}
</template>

<script>
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'

export default {
  components: { ToggleField, SelectField },
}
</script>
