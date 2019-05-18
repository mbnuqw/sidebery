<template lang="pug">
.StylesEditor
  h1 Styles
  section
    h2 {{t('styles.common_title')}}
    color-style-field(
      label="styles.bg_color"
      v-model="$store.state.customStyles.bg"
      @change="updateStyle('bg')"
      @toggle="toggleStyle('bg')")
    .separator
    color-style-field(
      label="styles.title_color"
      v-model="$store.state.customStyles.title_fg"
      @change="updateStyle('title_fg')"
      @toggle="toggleStyle('title_fg')")
    .separator
    color-style-field(
      label="styles.sub_title_color"
      v-model="$store.state.customStyles.sub_title_fg"
      @change="updateStyle('sub_title_fg')"
      @toggle="toggleStyle('sub_title_fg')")
    .separator
    color-style-field(
      label="styles.label_color"
      v-model="$store.state.customStyles.label_fg"
      @change="updateStyle('label_fg')"
      @toggle="toggleStyle('label_fg')")
    .separator
    color-style-field(
      label="styles.label_color_hover"
      v-model="$store.state.customStyles.label_fg_hover"
      @change="updateStyle('label_fg_hover')"
      @toggle="toggleStyle('label_fg_hover')")
    .separator
    color-style-field(
      label="styles.label_color_active"
      v-model="$store.state.customStyles.label_fg_active"
      @change="updateStyle('label_fg_active')"
      @toggle="toggleStyle('label_fg_active')")
    .separator
    color-style-field(
      label="styles.info_color"
      v-model="$store.state.customStyles.info_fg"
      @change="updateStyle('info_fg')"
      @toggle="toggleStyle('info_fg')")
    .separator
    color-style-field(
      label="styles.true_color"
      v-model="$store.state.customStyles.true_fg"
      @change="updateStyle('true_fg')"
      @toggle="toggleStyle('true_fg')")
    .separator
    color-style-field(
      label="styles.false_color"
      v-model="$store.state.customStyles.false_fg"
      @change="updateStyle('false_fg')"
      @toggle="toggleStyle('false_fg')")
    .separator
    color-style-field(
      label="styles.active_color"
      v-model="$store.state.customStyles.active_fg"
      @change="updateStyle('active_fg')"
      @toggle="toggleStyle('active_fg')")
    .separator
    color-style-field(
      label="styles.inactive_color"
      v-model="$store.state.customStyles.inactive_fg"
      @change="updateStyle('inactive_fg')"
      @toggle="toggleStyle('inactive_fg')")
    .separator
    color-style-field(
      label="styles.favi_placeholder_color"
      v-model="$store.state.customStyles.favicons_placehoder_bg"
      @change="updateStyle('favicons_placehoder_bg')"
      @toggle="toggleStyle('favicons_placehoder_bg')")

  section
    h2 {{t('styles.buttons_title')}}
    color-style-field(
      label="styles.btn_bg_color"
      v-model="$store.state.customStyles.btn_bg"
      @change="updateStyle('btn_bg')"
      @toggle="toggleStyle('btn_bg')")
    .separator
    color-style-field(
      label="styles.btn_bg_color_hover"
      v-model="$store.state.customStyles.btn_bg_hover"
      @change="updateStyle('btn_bg_hover')"
      @toggle="toggleStyle('btn_bg_hover')")
    .separator
    color-style-field(
      label="styles.btn_bg_color_active"
      v-model="$store.state.customStyles.btn_bg_active"
      @change="updateStyle('btn_bg_active')"
      @toggle="toggleStyle('btn_bg_active')")
    .separator
    color-style-field(
      label="styles.btn_fg_color"
      v-model="$store.state.customStyles.btn_fg"
      @change="updateStyle('btn_fg')"
      @toggle="toggleStyle('btn_fg')")
    .separator
    color-style-field(
      label="styles.btn_fg_color_hover"
      v-model="$store.state.customStyles.btn_fg_hover"
      @change="updateStyle('btn_fg_hover')"
      @toggle="toggleStyle('btn_fg_hover')")
    .separator
    color-style-field(
      label="styles.btn_fg_color_active"
      v-model="$store.state.customStyles.btn_fg_active"
      @change="updateStyle('btn_fg_active')"
      @toggle="toggleStyle('btn_fg_active')")

  section
    h2 {{t('styles.scroll_box_title')}}
    style-field(
      label="styles.scroll_progress_height"
      v-model="$store.state.customStyles.scroll_progress_h"
      or="---"
      @change="updateStyle('scroll_progress_h')"
      @toggle="toggleStyle('scroll_progress_h')")
    .separator
    color-style-field(
      label="styles.scroll_progress_color"
      v-model="$store.state.customStyles.scroll_progress_bg"
      @change="updateStyle('scroll_progress_bg')"
      @toggle="toggleStyle('scroll_progress_bg')")

  section
    h2 {{t('styles.menu_title')}}
    style-field(
      label="styles.menu_font"
      v-model="$store.state.customStyles.ctx_menu_font"
      or="---"
      @change="updateStyle('ctx_menu_font')"
      @toggle="toggleStyle('ctx_menu_font')")
    .separator
    color-style-field(
      label="styles.menu_bg_color"
      v-model="$store.state.customStyles.ctx_menu_bg"
      @change="updateStyle('ctx_menu_bg')"
      @toggle="toggleStyle('ctx_menu_bg')")
    .separator
    color-style-field(
      label="styles.menu_opt_fg_color"
      v-model="$store.state.customStyles.ctx_menu_fg"
      @change="updateStyle('ctx_menu_fg')"
      @toggle="toggleStyle('ctx_menu_fg')")
    .separator
    color-style-field(
      label="styles.menu_opt_fg_color_hover"
      v-model="$store.state.customStyles.ctx_menu_bg_hover"
      @change="updateStyle('ctx_menu_bg_hover')"
      @toggle="toggleStyle('ctx_menu_bg_hover')")

  section
    h2 {{t('styles.nav_title')}}
    color-style-field(
      label="styles.nav_fg_color"
      v-model="$store.state.customStyles.nav_btn_fg"
      @change="updateStyle('nav_btn_fg')"
      @toggle="toggleStyle('nav_btn_fg')")

  section
    h2 {{t('styles.pinned_dock_title')}}
    style-field(
      label="styles.pinned_dock_overlay_bg"
      v-model="$store.state.customStyles.pinned_dock_overlay_bg"
      or="---"
      @change="updateStyle('pinned_dock_overlay_bg')"
      @toggle="toggleStyle('pinned_dock_overlay_bg')")
    .separator
    style-field(
      label="styles.pinned_dock_overlay_shadow"
      v-model="$store.state.customStyles.pinned_dock_overlay_shadow"
      or="---"
      @change="updateStyle('pinned_dock_overlay_shadow')"
      @toggle="toggleStyle('pinned_dock_overlay_shadow')")

  section
    h2 {{t('styles.tabs_title')}}
    style-field(
      label="styles.tabs_height"
      v-model="$store.state.customStyles.tabs_height"
      or="---"
      @change="updateStyle('tabs_height')"
      @toggle="toggleStyle('tabs_height')")
    .separator
    style-field(
      label="styles.tabs_indent"
      v-model="$store.state.customStyles.tabs_indent"
      or="---"
      @change="updateStyle('tabs_indent')"
      @toggle="toggleStyle('tabs_indent')")
    .separator
    style-field(
      label="styles.tabs_font"
      v-model="$store.state.customStyles.tabs_font"
      or="---"
      @change="updateStyle('tabs_font')"
      @toggle="toggleStyle('tabs_font')")
    .separator
    style-field(
      label="styles.tabs_count_font"
      v-model="$store.state.customStyles.tabs_count_font"
      or="---"
      @change="updateStyle('tabs_count_font')"
      @toggle="toggleStyle('tabs_count_font')")
    .separator
    color-style-field(
      label="styles.tabs_fg_color"
      v-model="$store.state.customStyles.tabs_fg"
      @change="updateStyle('tabs_fg')"
      @toggle="toggleStyle('tabs_fg')")
    .separator
    color-style-field(
      label="styles.tabs_fg_color_hover"
      v-model="$store.state.customStyles.tabs_fg_hover"
      @change="updateStyle('tabs_fg_hover')"
      @toggle="toggleStyle('tabs_fg_hover')")
    .separator
    color-style-field(
      label="styles.tabs_fg_color_active"
      v-model="$store.state.customStyles.tabs_fg_active"
      @change="updateStyle('tabs_fg_active')"
      @toggle="toggleStyle('tabs_fg_active')")
    .separator
    color-style-field(
      label="styles.tabs_bg_color_hover"
      v-model="$store.state.customStyles.tabs_bg_hover"
      @change="updateStyle('tabs_bg_hover')"
      @toggle="toggleStyle('tabs_bg_hover')")
    .separator
    color-style-field(
      label="styles.tabs_bg_color_active"
      v-model="$store.state.customStyles.tabs_bg_active"
      @change="updateStyle('tabs_bg_active')"
      @toggle="toggleStyle('tabs_bg_active')")
    .separator
    color-style-field(
      label="styles.tabs_active_bg_color"
      v-model="$store.state.customStyles.tabs_activated_bg"
      @change="updateStyle('tabs_activated_bg')"
      @toggle="toggleStyle('tabs_activated_bg')")
    .separator
    color-style-field(
      label="styles.tabs_active_fg_color"
      v-model="$store.state.customStyles.tabs_activated_fg"
      @change="updateStyle('tabs_activated_fg')"
      @toggle="toggleStyle('tabs_activated_fg')")
    .separator
    color-style-field(
      label="styles.tabs_selected_bg_color"
      v-model="$store.state.customStyles.tabs_selected_bg"
      @change="updateStyle('tabs_selected_bg')"
      @toggle="toggleStyle('tabs_selected_bg')")
    .separator
    color-style-field(
      label="styles.tabs_selected_fg_color"
      v-model="$store.state.customStyles.tabs_selected_fg"
      @change="updateStyle('tabs_selected_fg')"
      @toggle="toggleStyle('tabs_selected_fg')")
    .separator
    style-field(
      label="styles.tabs_border"
      v-model="$store.state.customStyles.tabs_border"
      or="---"
      @change="updateStyle('tabs_border')"
      @toggle="toggleStyle('tabs_border')")
    .separator
    style-field(
      label="styles.tabs_activated_border"
      v-model="$store.state.customStyles.tabs_activated_border"
      or="---"
      @change="updateStyle('tabs_activated_border')"
      @toggle="toggleStyle('tabs_activated_border')")
    .separator
    style-field(
      label="styles.tabs_selected_border"
      v-model="$store.state.customStyles.tabs_selected_border"
      or="---"
      @change="updateStyle('tabs_selected_border')"
      @toggle="toggleStyle('tabs_selected_border')")
    .separator
    style-field(
      label="styles.tabs_shadow"
      v-model="$store.state.customStyles.tabs_shadow"
      or="---"
      @change="updateStyle('tabs_shadow')"
      @toggle="toggleStyle('tabs_shadow')")
    .separator
    style-field(
      label="styles.tabs_activated_shadow"
      v-model="$store.state.customStyles.tabs_activated_shadow"
      or="---"
      @change="updateStyle('tabs_activated_shadow')"
      @toggle="toggleStyle('tabs_activated_shadow')")
    .separator
    style-field(
      label="styles.tabs_selected_shadow"
      v-model="$store.state.customStyles.tabs_selected_shadow"
      or="---"
      @change="updateStyle('tabs_selected_shadow')"
      @toggle="toggleStyle('tabs_selected_shadow')")

  section
    h2 {{t('styles.bookmarks_title')}}
    style-field(
      label="styles.bookmarks_bookmark_height"
      v-model="$store.state.customStyles.bookmarks_bookmark_height"
      or="---"
      @change="updateStyle('bookmarks_bookmark_height')"
      @toggle="toggleStyle('bookmarks_bookmark_height')")
    .separator
    style-field(
      label="styles.bookmarks_folder_height"
      v-model="$store.state.customStyles.bookmarks_folder_height"
      or="---"
      @change="updateStyle('bookmarks_folder_height')"
      @toggle="toggleStyle('bookmarks_folder_height')")
    .separator
    style-field(
      label="styles.bookmarks_separator_height"
      v-model="$store.state.customStyles.bookmarks_separator_height"
      or="---"
      @change="updateStyle('bookmarks_separator_height')"
      @toggle="toggleStyle('bookmarks_separator_height')")
    .separator
    style-field(
      label="styles.bookmarks_bookmark_font"
      v-model="$store.state.customStyles.bookmarks_bookmark_font"
      or="---"
      @change="updateStyle('bookmarks_bookmark_font')"
      @toggle="toggleStyle('bookmarks_bookmark_font')")
    .separator
    style-field(
      label="styles.bookmarks_folder_font"
      v-model="$store.state.customStyles.bookmarks_folder_font"
      or="---"
      @change="updateStyle('bookmarks_folder_font')"
      @toggle="toggleStyle('bookmarks_folder_font')")
    .separator
    color-style-field(
      label="styles.bookmarks_fg_color"
      v-model="$store.state.customStyles.bookmarks_node_title_fg"
      @change="updateStyle('bookmarks_node_title_fg')"
      @toggle="toggleStyle('bookmarks_node_title_fg')")
    .separator
    color-style-field(
      label="styles.bookmarks_fg_color_hover"
      v-model="$store.state.customStyles.bookmarks_node_title_fg_hover"
      @change="updateStyle('bookmarks_node_title_fg_hover')"
      @toggle="toggleStyle('bookmarks_node_title_fg_hover')")
    .separator
    color-style-field(
      label="styles.bookmarks_fg_color_active"
      v-model="$store.state.customStyles.bookmarks_node_title_fg_active"
      @change="updateStyle('bookmarks_node_title_fg_active')"
      @toggle="toggleStyle('bookmarks_node_title_fg_active')")
    .separator
    color-style-field(
      label="styles.bookmarks_bg_color_hover"
      v-model="$store.state.customStyles.bookmarks_node_bg_hover"
      @change="updateStyle('bookmarks_node_bg_hover')"
      @toggle="toggleStyle('bookmarks_node_bg_hover')")
    .separator
    color-style-field(
      label="styles.bookmarks_bg_color_active"
      v-model="$store.state.customStyles.bookmarks_node_bg_active"
      @change="updateStyle('bookmarks_node_bg_active')"
      @toggle="toggleStyle('bookmarks_node_bg_active')")
    .separator
    color-style-field(
      label="styles.bookmarks_closed_dir_fg_color"
      v-model="$store.state.customStyles.bookmarks_folder_closed_fg"
      @change="updateStyle('bookmarks_folder_closed_fg')"
      @toggle="toggleStyle('bookmarks_folder_closed_fg')")
    .separator
    color-style-field(
      label="styles.bookmarks_closed_dir_fg_color_hover"
      v-model="$store.state.customStyles.bookmarks_folder_closed_fg_hover"
      @change="updateStyle('bookmarks_folder_closed_fg_hover')"
      @toggle="toggleStyle('bookmarks_folder_closed_fg_hover')")
    .separator
    color-style-field(
      label="styles.bookmarks_closed_dir_fg_color_active"
      v-model="$store.state.customStyles.bookmarks_folder_closed_fg_active"
      @change="updateStyle('bookmarks_folder_closed_fg_active')"
      @toggle="toggleStyle('bookmarks_folder_closed_fg_active')")
    .separator
    color-style-field(
      label="styles.bookmarks_opened_dir_fg_color"
      v-model="$store.state.customStyles.bookmarks_folder_open_fg"
      @change="updateStyle('bookmarks_folder_open_fg')"
      @toggle="toggleStyle('bookmarks_folder_open_fg')")
    .separator
    color-style-field(
      label="styles.bookmarks_opened_dir_fg_color_hover"
      v-model="$store.state.customStyles.bookmarks_folder_open_fg_hover"
      @change="updateStyle('bookmarks_folder_open_fg_hover')"
      @toggle="toggleStyle('bookmarks_folder_open_fg_hover')")
    .separator
    color-style-field(
      label="styles.bookmarks_opened_dir_fg_color_active"
      v-model="$store.state.customStyles.bookmarks_folder_open_fg_active"
      @change="updateStyle('bookmarks_folder_open_fg_active')"
      @toggle="toggleStyle('bookmarks_folder_open_fg_active')")
    .separator
    color-style-field(
      label="styles.bookmarks_empty_dir_fg_color"
      v-model="$store.state.customStyles.bookmarks_folder_empty_fg"
      @change="updateStyle('bookmarks_folder_empty_fg')"
      @toggle="toggleStyle('bookmarks_folder_empty_fg')")
    .separator
    color-style-field(
      label="styles.bookmarks_opened_fg_color"
      v-model="$store.state.customStyles.bookmarks_opened_fg"
      @change="updateStyle('bookmarks_opened_fg')"
      @toggle="toggleStyle('bookmarks_opened_fg')")

  .ctrls: .btn(@click="resetStyles") {{t('styles.reset_styles')}}
</template>


<script>
import EventBus from '../sidebar/event-bus'
import Utils from '../libs/utils'
import Store from '../sidebar/store'
import State from '../sidebar/store.state'
import StyleField from '../sidebar/components/fields/style'
import ColorStyleField from '../sidebar/components/fields/style-color'
import { CUSTOM_STYLES } from '../sidebar/store.state'

export default {
  components: {
    ColorStyleField,
    StyleField,
  },

  data() {
    return {
      active: false,
    }
  },

  created() {
    EventBus.$on('open-theme-editor', () => this.open())
  },

  methods: {
    /**
     * Get current state of theme parameter
     */
    isStyleOn(key) {
      return !!this.$store.state.customStyles[key]
    },

    /**
     * Toggle style
     */
    toggleStyle(key) {
      if (State.customStyles[key]) {
        Store.dispatch('removeStyle', key)
        Store.dispatch('saveStyles')
      } else {
        const compStyle = getComputedStyle(this.$el)
        const value = compStyle.getPropertyValue(Utils.CSSVar(key)).trim()
        Store.dispatch('setStyle', { key, val: value })
        Store.dispatch('saveStyles')
      }
    },

    /**
     * Update style
     */
    updateStyle(key) {
      if (!State.customStyles[key]) return
      Store.dispatch('setStyle', { key, val: State.customStyles[key] })
      Store.dispatch('saveStyles')
    },

    /**
     * Reset custom styles
     */
    resetStyles() {
      this.$store.state.customStyles = CUSTOM_STYLES
      for (let key of Object.keys(CUSTOM_STYLES)) {
        Store.dispatch('removeStyle', key)
      }
      Store.dispatch('saveStyles')
    },
  },
}
</script>


<style lang="stylus">
@import '../styles/mixins'

.StylesEditor
  box(relative)
  size(100%, max-w: 400px)
  flex-wrap: wrap
  justify-content: flex-start
  align-items: flex-start

.StylesEditor h1
  box(relative)
  size(100%)
  text(s: 2.5rem, w: 700)
  padding: 30px 0
  color: var(--label-fg)
  text-align: center

.StylesEditor .separator
  box(relative)
  size(100%, 1px)
  background-color: #00000032
  box-shadow: 0 1px 0 0 #78787816
  margin: 8px 0

.StylesEditor > .title
  box(relative)
  text(s: rem(24))
  color: var(--title-fg)
  padding: 12px 16px

.StylesEditor .box
  box(relative, grid)
  grid-gap: 50px 0
  padding: 8px 0 16px

.StylesEditor section
  box(relative, grid)
  grid-gap: 8px 0
  padding: 2px 0 32px

.StylesEditor  section > h2
  box(relative)
  size(100%)
  text(s: rem(28), w: 400)
  color: var(--title-fg)
  text-align: center
  margin: 28px 0 24px

.StylesEditor  .label
  text(s: rem(16))

.StylesEditor  input
  text(s: rem(15))

.StylesEditor .ctrls
  box(relative, flex)
  grid-gap: 8px 8px
  justify-content: center
  flex-wrap: wrap
  margin: 5px 16px 24px

.StylesEditor .btn
  size(auto)
  padding: 5px 16px
</style>
