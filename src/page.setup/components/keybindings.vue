<template lang="pug">
.Settings
  section(ref="el")
    h2 {{translate('settings.kb_general')}}
    span.header-shadow
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName._execute_sidebar_action")
    KeybindingField(:keybinding="Keybindings.reactive.byName.search")
    KeybindingField(:keybinding="Keybindings.reactive.byName.hide_act_panel")
    KeybindingField(:keybinding="Keybindings.reactive.byName.create_snapshot")
    KeybindingField(:keybinding="Keybindings.reactive.byName.open_snap_viewer")
    KeybindingField(:keybinding="Keybindings.reactive.byName.menu")

  section
    h2 {{translate('settings.kb_switching_panel')}}
    span.header-shadowd
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.next_panel")
    KeybindingField(:keybinding="Keybindings.reactive.byName.prev_panel")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_panel_0")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_panel_1")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_panel_2")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_panel_3")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_panel_4")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_panel_5")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_panel_6")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_panel_7")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_panel_8")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_panel_9")

  section
    h2 {{translate('settings.kb_scroll_active_panel')}}
    span.header-shadowd
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.scroll_to_active_panel_top")
    KeybindingField(:keybinding="Keybindings.reactive.byName.scroll_to_active_panel_bottom")

  section
    h2 {{translate('settings.kb_tabs')}}
    span.header-shadow
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.duplicate_tabs")
    KeybindingField(:keybinding="Keybindings.reactive.byName.pin_tabs")

  section
    h2 {{translate('settings.kb_tabs_open')}}
    span.header-shadow
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.new_tab_on_panel")
    KeybindingField(:keybinding="Keybindings.reactive.byName.new_tab_in_group")
    KeybindingField(:keybinding="Keybindings.reactive.byName.new_tab_as_first_child")
    KeybindingField(:keybinding="Keybindings.reactive.byName.new_tab_as_last_child")

  section
    h2 {{translate('settings.kb_rm')}}
    span.header-shadow
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.rm_tab_on_panel")
    KeybindingField(:keybinding="Keybindings.reactive.byName.rm_tabs_above_in_panel")
    KeybindingField(:keybinding="Keybindings.reactive.byName.rm_tabs_below_in_panel")
    KeybindingField(:keybinding="Keybindings.reactive.byName.rm_tabs_other_in_panel")

  section
    h2 {{translate('settings.kb_selections')}}
    span.header-shadow
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.sel_next_panel")
    KeybindingField(:keybinding="Keybindings.reactive.byName.sel_prev_panel")
    InfoField(label="settings.kb_sel_tabs_bookmarks")
    .sub-fields
      KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.select_all")
      InfoField(label="settings.kb_selecting_up_down")
      .sub-fields
        KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.up")
        KeybindingField(:keybinding="Keybindings.reactive.byName.down")
        ToggleField(
          label="settings.select_active_tab_first"
          v-model:value="Settings.state.selectActiveTabFirst"
          @update:value="Settings.saveDebounced(150)")
      KeybindingField(:keybinding="Keybindings.reactive.byName.up_shift")
      KeybindingField(:keybinding="Keybindings.reactive.byName.down_shift")
    KeybindingField(:keybinding="Keybindings.reactive.byName.reset_selection")
    KeybindingField(:keybinding="Keybindings.reactive.byName.activate")
    .info {{translate('settings.kb_select_act_note')}}

  section
    h2 {{translate('settings.kb_unloading_tabs')}}
    span.header-shadow
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.unload_tabs")
    KeybindingField(:keybinding="Keybindings.reactive.byName.unload_all_tabs_in_panel")
    KeybindingField(:keybinding="Keybindings.reactive.byName.unload_other_tabs_in_panel")
    KeybindingField(:keybinding="Keybindings.reactive.byName.unload_folded_tabs_in_panel")
    KeybindingField(:keybinding="Keybindings.reactive.byName.unload_all_tabs_in_inact_panels")

  section
    h2 {{translate('settings.kb_branches')}}
    span.header-shadow
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.fold_branch")
    KeybindingField(:keybinding="Keybindings.reactive.byName.expand_branch")
    KeybindingField(:keybinding="Keybindings.reactive.byName.fold_inact_branches")

  section
    h2 {{translate('settings.kb_active_tabs_history')}}
    span.header-shadowd
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.activate_prev_active_tab_c")
    KeybindingField(:keybinding="Keybindings.reactive.byName.activate_prev_active_tab")
    KeybindingField(:keybinding="Keybindings.reactive.byName.activate_next_active_tab")
    KeybindingField(:keybinding="Keybindings.reactive.byName.activate_panel_prev_active_tab")
    KeybindingField(:keybinding="Keybindings.reactive.byName.activate_panel_next_active_tab")

  section
    h2 {{translate('settings.kb_switching_tab')}}
    span.header-shadowd
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.switch_to_next_tab")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_prev_tab")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_parent_tab")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_unpinned_tab_0")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_unpinned_tab_1")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_unpinned_tab_2")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_unpinned_tab_3")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_unpinned_tab_4")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_unpinned_tab_5")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_unpinned_tab_6")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_unpinned_tab_7")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_unpinned_tab_8")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_unpinned_tab_9")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_tab_0")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_tab_1")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_tab_2")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_tab_3")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_tab_4")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_tab_5")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_tab_6")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_tab_7")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_tab_8")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_tab_9")
    KeybindingField(:keybinding="Keybindings.reactive.byName.switch_to_last_tab")

  section
    h2 {{translate('settings.kb_move_tabs')}}
    span.header-shadowd
    KeybindingField.-no-separator(:keybinding="Keybindings.reactive.byName.move_tab_to_active")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_up")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_down")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_start")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_end")
    KeybindingField(:keybinding="Keybindings.reactive.byName.tabs_indent")
    KeybindingField(:keybinding="Keybindings.reactive.byName.tabs_outdent")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_0")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_1")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_2")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_3")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_4")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_5")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_6")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_7")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_8")
    KeybindingField(:keybinding="Keybindings.reactive.byName.move_tabs_to_panel_9")

  section
    .ctrls
      .btn(@click="Keybindings.resetKeybindings") {{translate('settings.reset_kb')}}
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Keybindings } from 'src/services/keybindings'
import { SetupPage } from 'src/services/setup-page'
import { Settings } from 'src/services/settings'
import KeybindingField from 'src/page.setup/components/keybindings.keybinding.vue'
import ToggleField from 'src/components/toggle-field.vue'
import InfoField from 'src/components/info-field.vue'

const el = ref<HTMLElement | null>(null)

onMounted(() => SetupPage.registerEl('settings_keybindings', el.value))
</script>
