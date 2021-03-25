<template lang="pug">
#root.root(
  :data-style="$store.state.style"
  :data-animations="$store.state.animations ? 'fast' : 'none'")
  .nav
    div
      .option(
        :data-active="$store.state.activeView === 'Settings'"
        @click="navigateTo('')") {{t('settings.nav_settings')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_general'"
        @click="navigateTo('settings_general')") {{t('settings.nav_settings_general')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_menu'"
        @click="navigateTo('settings_menu')") {{t('settings.nav_settings_menu')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_nav'"
        @click="navigateTo('settings_nav')") {{t('settings.nav_settings_nav')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_group'"
        @click="navigateTo('settings_group')") {{t('settings.nav_settings_group')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_containers'"
        @click="navigateTo('settings_containers')") {{t('settings.nav_settings_containers')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_panels'"
        @click="navigateTo('settings_panels')") {{t('settings.nav_settings_panels')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_dnd'"
        @click="navigateTo('settings_dnd')") {{t('settings.nav_settings_dnd')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_tabs'"
        @click="navigateTo('settings_tabs')") {{t('settings.nav_settings_tabs')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_new_tab_position'"
        @click="navigateTo('settings_new_tab_position')") {{t('settings.nav_settings_new_tab_position')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_pinned_tabs'"
        @click="navigateTo('settings_pinned_tabs')") {{t('settings.nav_settings_pinned_tabs')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_tabs_tree'"
        @click="navigateTo('settings_tabs_tree')") {{t('settings.nav_settings_tabs_tree')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_bookmarks'"
        @click="navigateTo('settings_bookmarks')") {{t('settings.nav_settings_bookmarks')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_appearance'"
        @click="navigateTo('settings_appearance')") {{t('settings.nav_settings_appearance')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_mouse'"
        @click="navigateTo('settings_mouse')") {{t('settings.nav_settings_mouse')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_keybindings'"
        @click="navigateTo('settings_keybindings')") {{t('settings.nav_settings_keybindings')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_permissions'"
        @click="navigateTo('settings_permissions')") {{t('settings.nav_settings_permissions')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_snapshots'"
        @click="navigateTo('settings_snapshots')") {{t('settings.nav_settings_snapshots')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_storage'"
        @click="navigateTo('settings_storage')") {{t('settings.nav_settings_storage')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_sync'"
        @click="navigateTo('settings_sync')") {{t('settings.nav_settings_sync')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'settings_help'"
        @click="navigateTo('settings_help')") {{t('settings.nav_settings_help')}}

      .option(
        :data-active="$store.state.activeView === 'MenuEditor'"
        @click="navigateTo('menu_editor')") {{t('settings.nav_menu')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'menu_editor_tabs'"
        @click="navigateTo('menu_editor_tabs')") {{t('settings.nav_menu_tabs')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'menu_editor_tabs_panel'"
        @click="navigateTo('menu_editor_tabs_panel')") {{t('settings.nav_menu_tabs_panel')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'menu_editor_bookmarks'"
        @click="navigateTo('menu_editor_bookmarks')") {{t('settings.nav_menu_bookmarks')}}
      .sub-option(
        :data-active="$store.state.activeSection === 'menu_editor_bookmarks_panel'"
        @click="navigateTo('menu_editor_bookmarks_panel')") {{t('settings.nav_menu_bookmarks_panel')}}

      .option(
        :data-active="$store.state.activeView === 'StylesEditor'"
        @click="navigateTo('styles_editor')") {{t('settings.nav_styles')}}

      .option(
        :data-active="$store.state.activeView === 'Snapshots'"
        @click="navigateTo('snapshots')") {{t('settings.nav_snapshots')}}

  transition(name="settings" mode="out-in")
    keep-alive
      component(:is="$store.state.activeView")
</template>

<script>
import Settings from './settings.vue'
import MenuEditor from './components/menu-editor.vue'
import StylesEditor from './components/styles-editor.vue'
import Snapshots from './components/snapshots.vue'

export default {
  components: {
    Settings,
    MenuEditor,
    StylesEditor,
    Snapshots,
  },

  methods: {
    /**
     * Update url hash
     */
    navigateTo(urlHash) {
      location.hash = urlHash
    },
  },
}
</script>
