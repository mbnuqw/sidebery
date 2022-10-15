<template lang="pug">
section(ref="el")
  h2 {{translate('settings.ctx_menu_title')}}
  ToggleField(
    label="settings.ctx_menu_native"
    v-model:value="Settings.state.ctxMenuNative"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.ctx_menu_render_inact"
    v-model:value="Settings.state.ctxMenuRenderInact"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.ctx_menu_render_icons"
    v-model:value="Settings.state.ctxMenuRenderIcons"
    @update:value="Settings.saveDebounced(150)")
  TextField(
    label="settings.ctx_menu_ignore_ctr"
    :or="translate('settings.ctx_menu_ignore_ctr_or')"
    :note="translate('settings.ctx_menu_ignore_ctr_note')"
    :line="true"
    :valid="ignoreContainersRuleValid"
    input-width="50"
    v-model:value="Settings.state.ctxMenuIgnoreContainers"
    @update:value="onCtxMenuIgnoreContainersUpdate")
  .ctrls
    .btn(@click="SetupPage.switchView('menu_editor')") {{translate('settings.ctx_menu_editor')}}
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { Menu } from 'src/services/menu'
import { SetupPage } from 'src/services/setup-page'
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
