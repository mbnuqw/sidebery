<template lang="pug">
.StylesEditor
  scroll-box(ref="scrollBox")
    .box
      section.section
        .title {{t('styles.common_title')}}
        color-style-field(
          label="styles.bg_color"
          v-model="$store.state.customStyles.bg"
          @change="updateStyle('bg')"
          @toggle="toggleStyle('bg')")
        color-style-field(
          label="styles.title_color"
          v-model="$store.state.customStyles.title_fg"
          @change="updateStyle('title_fg')"
          @toggle="toggleStyle('title_fg')")
        color-style-field(
          label="styles.sub_title_color"
          v-model="$store.state.customStyles.sub_title_fg"
          @change="updateStyle('sub_title_fg')"
          @toggle="toggleStyle('sub_title_fg')")
        color-style-field(
          label="styles.label_color"
          v-model="$store.state.customStyles.label_fg"
          @change="updateStyle('label_fg')"
          @toggle="toggleStyle('label_fg')")
        color-style-field(
          label="styles.label_color_hover"
          v-model="$store.state.customStyles.label_fg_hover"
          @change="updateStyle('label_fg_hover')"
          @toggle="toggleStyle('label_fg_hover')")
        color-style-field(
          label="styles.label_color_active"
          v-model="$store.state.customStyles.label_fg_active"
          @change="updateStyle('label_fg_active')"
          @toggle="toggleStyle('label_fg_active')")
        color-style-field(
          label="styles.info_color"
          v-model="$store.state.customStyles.info_fg"
          @change="updateStyle('info_fg')"
          @toggle="toggleStyle('info_fg')")
        color-style-field(
          label="styles.true_color"
          v-model="$store.state.customStyles.true_fg"
          @change="updateStyle('true_fg')"
          @toggle="toggleStyle('true_fg')")
        color-style-field(
          label="styles.false_color"
          v-model="$store.state.customStyles.false_fg"
          @change="updateStyle('false_fg')"
          @toggle="toggleStyle('false_fg')")
        color-style-field(
          label="styles.active_color"
          v-model="$store.state.customStyles.active_fg"
          @change="updateStyle('active_fg')"
          @toggle="toggleStyle('active_fg')")
        color-style-field(
          label="styles.inactive_color"
          v-model="$store.state.customStyles.inactive_fg"
          @change="updateStyle('inactive_fg')"
          @toggle="toggleStyle('inactive_fg')")
        color-style-field(
          label="styles.favi_placeholder_color"
          v-model="$store.state.customStyles.favicons_placehoder_bg"
          @change="updateStyle('favicons_placehoder_bg')"
          @toggle="toggleStyle('favicons_placehoder_bg')")

      section.section
        .title {{t('styles.buttons_title')}}
        color-style-field(
          label="styles.btn_bg_color"
          v-model="$store.state.customStyles.btn_bg"
          @change="updateStyle('btn_bg')"
          @toggle="toggleStyle('btn_bg')")
        color-style-field(
          label="styles.btn_bg_color_hover"
          v-model="$store.state.customStyles.btn_bg_hover"
          @change="updateStyle('btn_bg_hover')"
          @toggle="toggleStyle('btn_bg_hover')")
        color-style-field(
          label="styles.btn_bg_color_active"
          v-model="$store.state.customStyles.btn_bg_active"
          @change="updateStyle('btn_bg_active')"
          @toggle="toggleStyle('btn_bg_active')")
        color-style-field(
          label="styles.btn_fg_color"
          v-model="$store.state.customStyles.btn_fg"
          @change="updateStyle('btn_fg')"
          @toggle="toggleStyle('btn_fg')")
        color-style-field(
          label="styles.btn_fg_color_hover"
          v-model="$store.state.customStyles.btn_fg_hover"
          @change="updateStyle('btn_fg_hover')"
          @toggle="toggleStyle('btn_fg_hover')")
        color-style-field(
          label="styles.btn_fg_color_active"
          v-model="$store.state.customStyles.btn_fg_active"
          @change="updateStyle('btn_fg_active')"
          @toggle="toggleStyle('btn_fg_active')")

      section.section
        .title {{t('styles.scroll_box_title')}}
        style-field(
          label="styles.scroll_progress_height"
          v-model="$store.state.customStyles.scroll_progress_h"
          or="---"
          @change="updateStyle('scroll_progress_h')"
          @toggle="toggleStyle('scroll_progress_h')")
        color-style-field(
          label="styles.scroll_progress_color"
          v-model="$store.state.customStyles.scroll_progress_bg"
          @change="updateStyle('scroll_progress_bg')"
          @toggle="toggleStyle('scroll_progress_bg')")

      section.section
        .title {{t('styles.menu_title')}}
        style-field(
          label="styles.menu_font"
          v-model="$store.state.customStyles.ctx_menu_font"
          or="---"
          @change="updateStyle('ctx_menu_font')"
          @toggle="toggleStyle('ctx_menu_font')")
        color-style-field(
          label="styles.menu_bg_color"
          v-model="$store.state.customStyles.ctx_menu_bg"
          @change="updateStyle('ctx_menu_bg')"
          @toggle="toggleStyle('ctx_menu_bg')")
        color-style-field(
          label="styles.menu_opt_fg_color"
          v-model="$store.state.customStyles.ctx_menu_fg"
          @change="updateStyle('ctx_menu_fg')"
          @toggle="toggleStyle('ctx_menu_fg')")
        color-style-field(
          label="styles.menu_opt_fg_color_hover"
          v-model="$store.state.customStyles.ctx_menu_bg_hover"
          @change="updateStyle('ctx_menu_bg_hover')"
          @toggle="toggleStyle('ctx_menu_bg_hover')")

      section.section
        .title {{t('styles.nav_title')}}
        color-style-field(
          label="styles.nav_fg_color"
          v-model="$store.state.customStyles.nav_btn_fg"
          @change="updateStyle('nav_btn_fg')"
          @toggle="toggleStyle('nav_btn_fg')")

      section.section
        .title {{t('styles.pinned_dock_title')}}
        style-field(
          label="styles.pinned_dock_overlay_bg"
          v-model="$store.state.customStyles.pinned_dock_overlay_bg"
          or="---"
          @change="updateStyle('pinned_dock_overlay_bg')"
          @toggle="toggleStyle('pinned_dock_overlay_bg')")
        style-field(
          label="styles.pinned_dock_overlay_shadow"
          v-model="$store.state.customStyles.pinned_dock_overlay_shadow"
          or="---"
          @change="updateStyle('pinned_dock_overlay_shadow')"
          @toggle="toggleStyle('pinned_dock_overlay_shadow')")

      section.section
        .title {{t('styles.tabs_title')}}
        style-field(
          label="styles.tabs_height"
          v-model="$store.state.customStyles.tabs_height"
          or="---"
          @change="updateStyle('tabs_height')"
          @toggle="toggleStyle('tabs_height')")
        style-field(
          label="styles.tabs_indent"
          v-model="$store.state.customStyles.tabs_indent"
          or="---"
          @change="updateStyle('tabs_indent')"
          @toggle="toggleStyle('tabs_indent')")
        style-field(
          label="styles.tabs_font"
          v-model="$store.state.customStyles.tabs_font"
          or="---"
          @change="updateStyle('tabs_font')"
          @toggle="toggleStyle('tabs_font')")
        style-field(
          label="styles.tabs_count_font"
          v-model="$store.state.customStyles.tabs_count_font"
          or="---"
          @change="updateStyle('tabs_count_font')"
          @toggle="toggleStyle('tabs_count_font')")
        color-style-field(
          label="styles.tabs_fg_color"
          v-model="$store.state.customStyles.tabs_fg"
          @change="updateStyle('tabs_fg')"
          @toggle="toggleStyle('tabs_fg')")
        color-style-field(
          label="styles.tabs_fg_color_hover"
          v-model="$store.state.customStyles.tabs_fg_hover"
          @change="updateStyle('tabs_fg_hover')"
          @toggle="toggleStyle('tabs_fg_hover')")
        color-style-field(
          label="styles.tabs_fg_color_active"
          v-model="$store.state.customStyles.tabs_fg_active"
          @change="updateStyle('tabs_fg_active')"
          @toggle="toggleStyle('tabs_fg_active')")
        color-style-field(
          label="styles.tabs_bg_color_hover"
          v-model="$store.state.customStyles.tabs_bg_hover"
          @change="updateStyle('tabs_bg_hover')"
          @toggle="toggleStyle('tabs_bg_hover')")
        color-style-field(
          label="styles.tabs_bg_color_active"
          v-model="$store.state.customStyles.tabs_bg_active"
          @change="updateStyle('tabs_bg_active')"
          @toggle="toggleStyle('tabs_bg_active')")
        color-style-field(
          label="styles.tabs_active_bg_color"
          v-model="$store.state.customStyles.tabs_activated_bg"
          @change="updateStyle('tabs_activated_bg')"
          @toggle="toggleStyle('tabs_activated_bg')")
        color-style-field(
          label="styles.tabs_active_fg_color"
          v-model="$store.state.customStyles.tabs_activated_fg"
          @change="updateStyle('tabs_activated_fg')"
          @toggle="toggleStyle('tabs_activated_fg')")
        color-style-field(
          label="styles.tabs_selected_bg_color"
          v-model="$store.state.customStyles.tabs_selected_bg"
          @change="updateStyle('tabs_selected_bg')"
          @toggle="toggleStyle('tabs_selected_bg')")
        color-style-field(
          label="styles.tabs_selected_fg_color"
          v-model="$store.state.customStyles.tabs_selected_fg"
          @change="updateStyle('tabs_selected_fg')"
          @toggle="toggleStyle('tabs_selected_fg')")
        style-field(
          label="styles.tabs_border"
          v-model="$store.state.customStyles.tabs_border"
          or="---"
          @change="updateStyle('tabs_border')"
          @toggle="toggleStyle('tabs_border')")
        style-field(
          label="styles.tabs_activated_border"
          v-model="$store.state.customStyles.tabs_activated_border"
          or="---"
          @change="updateStyle('tabs_activated_border')"
          @toggle="toggleStyle('tabs_activated_border')")
        style-field(
          label="styles.tabs_selected_border"
          v-model="$store.state.customStyles.tabs_selected_border"
          or="---"
          @change="updateStyle('tabs_selected_border')"
          @toggle="toggleStyle('tabs_selected_border')")
        style-field(
          label="styles.tabs_shadow"
          v-model="$store.state.customStyles.tabs_shadow"
          or="---"
          @change="updateStyle('tabs_shadow')"
          @toggle="toggleStyle('tabs_shadow')")
        style-field(
          label="styles.tabs_activated_shadow"
          v-model="$store.state.customStyles.tabs_activated_shadow"
          or="---"
          @change="updateStyle('tabs_activated_shadow')"
          @toggle="toggleStyle('tabs_activated_shadow')")
        style-field(
          label="styles.tabs_selected_shadow"
          v-model="$store.state.customStyles.tabs_selected_shadow"
          or="---"
          @change="updateStyle('tabs_selected_shadow')"
          @toggle="toggleStyle('tabs_selected_shadow')")

      section.section
        .title {{t('styles.bookmarks_title')}}
        style-field(
          label="styles.bookmarks_bookmark_height"
          v-model="$store.state.customStyles.bookmarks_bookmark_height"
          or="---"
          @change="updateStyle('bookmarks_bookmark_height')"
          @toggle="toggleStyle('bookmarks_bookmark_height')")
        style-field(
          label="styles.bookmarks_folder_height"
          v-model="$store.state.customStyles.bookmarks_folder_height"
          or="---"
          @change="updateStyle('bookmarks_folder_height')"
          @toggle="toggleStyle('bookmarks_folder_height')")
        style-field(
          label="styles.bookmarks_separator_height"
          v-model="$store.state.customStyles.bookmarks_separator_height"
          or="---"
          @change="updateStyle('bookmarks_separator_height')"
          @toggle="toggleStyle('bookmarks_separator_height')")
        style-field(
          label="styles.bookmarks_bookmark_font"
          v-model="$store.state.customStyles.bookmarks_bookmark_font"
          or="---"
          @change="updateStyle('bookmarks_bookmark_font')"
          @toggle="toggleStyle('bookmarks_bookmark_font')")
        style-field(
          label="styles.bookmarks_folder_font"
          v-model="$store.state.customStyles.bookmarks_folder_font"
          or="---"
          @change="updateStyle('bookmarks_folder_font')"
          @toggle="toggleStyle('bookmarks_folder_font')")
        color-style-field(
          label="styles.bookmarks_fg_color"
          v-model="$store.state.customStyles.bookmarks_node_title_fg"
          @change="updateStyle('bookmarks_node_title_fg')"
          @toggle="toggleStyle('bookmarks_node_title_fg')")
        color-style-field(
          label="styles.bookmarks_fg_color_hover"
          v-model="$store.state.customStyles.bookmarks_node_title_fg_hover"
          @change="updateStyle('bookmarks_node_title_fg_hover')"
          @toggle="toggleStyle('bookmarks_node_title_fg_hover')")
        color-style-field(
          label="styles.bookmarks_fg_color_active"
          v-model="$store.state.customStyles.bookmarks_node_title_fg_active"
          @change="updateStyle('bookmarks_node_title_fg_active')"
          @toggle="toggleStyle('bookmarks_node_title_fg_active')")
        color-style-field(
          label="styles.bookmarks_bg_color_hover"
          v-model="$store.state.customStyles.bookmarks_node_bg_hover"
          @change="updateStyle('bookmarks_node_bg_hover')"
          @toggle="toggleStyle('bookmarks_node_bg_hover')")
        color-style-field(
          label="styles.bookmarks_bg_color_active"
          v-model="$store.state.customStyles.bookmarks_node_bg_active"
          @change="updateStyle('bookmarks_node_bg_active')"
          @toggle="toggleStyle('bookmarks_node_bg_active')")
        color-style-field(
          label="styles.bookmarks_closed_dir_fg_color"
          v-model="$store.state.customStyles.bookmarks_folder_closed_fg"
          @change="updateStyle('bookmarks_folder_closed_fg')"
          @toggle="toggleStyle('bookmarks_folder_closed_fg')")
        color-style-field(
          label="styles.bookmarks_closed_dir_fg_color_hover"
          v-model="$store.state.customStyles.bookmarks_folder_closed_fg_hover"
          @change="updateStyle('bookmarks_folder_closed_fg_hover')"
          @toggle="toggleStyle('bookmarks_folder_closed_fg_hover')")
        color-style-field(
          label="styles.bookmarks_closed_dir_fg_color_active"
          v-model="$store.state.customStyles.bookmarks_folder_closed_fg_active"
          @change="updateStyle('bookmarks_folder_closed_fg_active')"
          @toggle="toggleStyle('bookmarks_folder_closed_fg_active')")
        color-style-field(
          label="styles.bookmarks_opened_dir_fg_color"
          v-model="$store.state.customStyles.bookmarks_folder_open_fg"
          @change="updateStyle('bookmarks_folder_open_fg')"
          @toggle="toggleStyle('bookmarks_folder_open_fg')")
        color-style-field(
          label="styles.bookmarks_opened_dir_fg_color_hover"
          v-model="$store.state.customStyles.bookmarks_folder_open_fg_hover"
          @change="updateStyle('bookmarks_folder_open_fg_hover')"
          @toggle="toggleStyle('bookmarks_folder_open_fg_hover')")
        color-style-field(
          label="styles.bookmarks_opened_dir_fg_color_active"
          v-model="$store.state.customStyles.bookmarks_folder_open_fg_active"
          @change="updateStyle('bookmarks_folder_open_fg_active')"
          @toggle="toggleStyle('bookmarks_folder_open_fg_active')")
        color-style-field(
          label="styles.bookmarks_empty_dir_fg_color"
          v-model="$store.state.customStyles.bookmarks_folder_empty_fg"
          @change="updateStyle('bookmarks_folder_empty_fg')"
          @toggle="toggleStyle('bookmarks_folder_empty_fg')")

      .btn(@click="resetStyles") {{t('styles.reset_styles')}}
</template>


<script>
import EventBus from '../../event-bus'
import Utils from '../../../libs/utils'
import Store from '../../store'
import State from '../../store.state'
import ScrollBox from '../scroll-box'
import StyleField from '../fields/style'
import ColorStyleField from '../fields/style-color'
import { CUSTOM_STYLES } from '../../store.state'

export default {
  components: {
    ScrollBox,
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
@import '../../../styles/mixins'

.StylesEditor
  box(absolute, flex)
  pos(0, 0)
  size(100%, same)
  flex-direction: column

.StylesEditor > .title
  box(relative)
  text(s: rem(24))
  color: var(--title-fg)
  padding: 12px 16px

.StylesEditor .box
  box(relative, grid)
  grid-gap: 32px 0
  padding: 8px 0 16px

.StylesEditor .section
  box(relative, grid)
  grid-gap: 12px 0

.StylesEditor .section > .title
  box(relative)
  text(s: rem(24))
  color: var(--sub-title-fg)
  padding: 2px 16px

.StylesEditor .btn
  size(80%)
  margin-left: auto
  margin-right: auto
</style>
