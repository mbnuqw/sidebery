<template lang="pug">
section(ref="el")
  h2 {{translate('settings.ctx_menu_title')}}
  span.header-shadow
  ToggleField(
    label="settings.ctx_menu_native"
    v-model:value="Settings.state.ctxMenuNative"
    dbg="ctxMenuNative"
    :default="DEFAULT_SETTINGS.ctxMenuNative"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.ctx_menu_render_inact"
    v-model:value="Settings.state.ctxMenuRenderInact"
    dbg="ctxMenuRenderInact"
    :default="DEFAULT_SETTINGS.ctxMenuRenderInact"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.ctx_menu_render_icons"
    v-model:value="Settings.state.ctxMenuRenderIcons"
    dbg="ctxMenuRenderIcons"
    :default="DEFAULT_SETTINGS.ctxMenuRenderIcons"
    @update:value="Settings.saveDebounced(150)")
  TextField(
    label="settings.ctx_menu_ignore_ctr"
    :or="translate('settings.ctx_menu_ignore_ctr_or')"
    :note="translate('settings.ctx_menu_ignore_ctr_note')"
    :line="true"
    :valid="ignoreContainersRuleValid"
    input-width="50"
    v-model:value="Settings.state.ctxMenuIgnoreContainers"
    dbg="ctxMenuIgnoreContainers"
    :default="DEFAULT_SETTINGS.ctxMenuIgnoreContainers"
    @update:value="onCtxMenuIgnoreContainersUpdate")
  .ctrls
    .btn(@click="SetupPage.switchView('menu_editor')") {{translate('settings.ctx_menu_editor')}}
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { DEFAULT_SETTINGS } from 'src/defaults'
import * as Settings from 'src/services/settings.fg'
import * as Menu from 'src/services/menu.fg'
import * as SetupPage from 'src/services/setup-page.fg'
import TextField from '../../components/text-field.vue'
import ToggleField from '../../components/toggle-field.vue'

const el = ref<HTMLElement | null>(null)
const ignoreContainersRuleValid = ref('')
const validateIgnoreContainersRule = Utils.debounce((value: string): void => {
  if (!value) {
    ignoreContainersRuleValid.value = ''
  } else {
    let rules = Menu.getContainersRules(value)
    if (!rules) ignoreContainersRuleValid.value = 'invalid'
    else ignoreContainersRuleValid.value = 'valid'
  }
})
function onCtxMenuIgnoreContainersUpdate(value: string): void {
  validateIgnoreContainersRule(321, value)
  Settings.saveDebounced(500)
}

onMounted(() => SetupPage.registerEl('settings_menu', el.value))
</script>
