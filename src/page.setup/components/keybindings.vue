<template lang="pug">
.Settings
  section(ref="el")
    h2 {{translate('settings.kb_title')}}
    span.header-shadow
    .wrapper(v-for="subSection in layout")
      template(
        v-for="cmdName in subSection"
        :key="cmdName")
        KeybindingField(
          v-if="Keybindings.reactive.byName[cmdName]"
          :keybinding="Keybindings.reactive.byName[cmdName]")
        .sub-title(v-else): .text {{translate('settings.kb_' + cmdName)}}
    .ctrls
      .btn(@click="Keybindings.resetKeybindings") {{translate('settings.reset_kb')}}
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Keybindings } from 'src/services/keybindings'
import { SetupPage } from 'src/services/setup-page'
import KeybindingField from 'src/page.setup/components/keybindings.keybinding.vue'

const layout = [
  ['general', '_execute_sidebar_action', 'search', 'create_snapshot'],

  // Creating / Removing tab
  [
    'create_remove_tabs',
    'new_tab_on_panel',
    'new_tab_in_group',
    'new_tab_as_first_child',
    'new_tab_as_last_child',
    'rm_tab_on_panel',
  ],

  // Selection
  [
    'selections',
    'select_all',
    'up',
    'down',
    'up_shift',
    'down_shift',
    'reset_selection',
    'activate',
    'menu',
  ],

  // Branch
  ['branches', 'fold_branch', 'expand_branch', 'fold_inact_branches'],

  // Active tabs history
  [
    'active_tabs_history',
    'activate_prev_active_tab',
    'activate_next_active_tab',
    'activate_panel_prev_active_tab',
    'activate_panel_next_active_tab',
  ],

  // Switching panels
  [
    'switching_panel',
    'next_panel',
    'prev_panel',
    'switch_to_panel_0',
    'switch_to_panel_1',
    'switch_to_panel_2',
    'switch_to_panel_3',
    'switch_to_panel_4',
    'switch_to_panel_5',
    'switch_to_panel_6',
    'switch_to_panel_7',
    'switch_to_panel_8',
    'switch_to_panel_9',
  ],

  // Switching tabs
  [
    'switching_tab',
    'switch_to_parent_tab',
    'switch_to_tab_0',
    'switch_to_tab_1',
    'switch_to_tab_2',
    'switch_to_tab_3',
    'switch_to_tab_4',
    'switch_to_tab_5',
    'switch_to_tab_6',
    'switch_to_tab_7',
    'switch_to_tab_8',
    'switch_to_tab_9',
    'switch_to_last_tab',
  ],

  // Move tabs
  [
    'move_tabs',
    'move_tab_to_active',
    'move_tabs_up',
    'move_tabs_down',
    'tabs_indent',
    'tabs_outdent',
    'move_tabs_to_panel_0',
    'move_tabs_to_panel_1',
    'move_tabs_to_panel_2',
    'move_tabs_to_panel_3',
    'move_tabs_to_panel_4',
    'move_tabs_to_panel_5',
    'move_tabs_to_panel_6',
    'move_tabs_to_panel_7',
    'move_tabs_to_panel_8',
    'move_tabs_to_panel_9',
  ],
]

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_keybindings', el.value))
</script>
