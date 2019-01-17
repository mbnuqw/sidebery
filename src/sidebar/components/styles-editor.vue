<template lang="pug">
.StylesEditor
  scroll-box(ref="scrollBox")
    .box
      section.section
        .title Common
        color-style-field(
          label="Background color"
          v-model="$store.state.customStyles.bg"
          @change="updateStyle('bg')"
          @toggle="toggleStyle('bg')")
        color-style-field(
          label="Title color"
          v-model="$store.state.customStyles.title_fg"
          @change="updateStyle('title_fg')"
          @toggle="toggleStyle('title_fg')")
        color-style-field(
          label="Sub-title color"
          v-model="$store.state.customStyles.sub_title_fg"
          @change="updateStyle('sub_title_fg')"
          @toggle="toggleStyle('sub_title_fg')")
        color-style-field(
          label="Label color"
          v-model="$store.state.customStyles.label_fg"
          @change="updateStyle('label_fg')"
          @toggle="toggleStyle('label_fg')")
        color-style-field(
          label="Label color on hover"
          v-model="$store.state.customStyles.label_fg_hover"
          @change="updateStyle('label_fg_hover')"
          @toggle="toggleStyle('label_fg_hover')")
        color-style-field(
          label="Label color on active"
          v-model="$store.state.customStyles.label_fg_active"
          @change="updateStyle('label_fg_active')"
          @toggle="toggleStyle('label_fg_active')")
        color-style-field(
          label="Info color"
          v-model="$store.state.customStyles.info_fg"
          @change="updateStyle('info_fg')"
          @toggle="toggleStyle('info_fg')")
        color-style-field(
          label="Color of positive option"
          v-model="$store.state.customStyles.true_fg"
          @change="updateStyle('true_fg')"
          @toggle="toggleStyle('true_fg')")
        color-style-field(
          label="Color of negative option"
          v-model="$store.state.customStyles.false_fg"
          @change="updateStyle('false_fg')"
          @toggle="toggleStyle('false_fg')")
        color-style-field(
          label="Color of active option"
          v-model="$store.state.customStyles.active_fg"
          @change="updateStyle('active_fg')"
          @toggle="toggleStyle('active_fg')")
        color-style-field(
          label="Color of inactive option"
          v-model="$store.state.customStyles.inactive_fg"
          @change="updateStyle('inactive_fg')"
          @toggle="toggleStyle('inactive_fg')")
        color-style-field(
          label="Favicons placeholder color"
          v-model="$store.state.customStyles.favicons_placehoder_bg"
          @change="updateStyle('favicons_placehoder_bg')"
          @toggle="toggleStyle('favicons_placehoder_bg')")

      section.section
        .title Button
        color-style-field(
          label="Background color"
          v-model="$store.state.customStyles.btn_bg"
          @change="updateStyle('btn_bg')"
          @toggle="toggleStyle('btn_bg')")
        color-style-field(
          label="Hover background color"
          v-model="$store.state.customStyles.btn_bg_hover"
          @change="updateStyle('btn_bg_hover')"
          @toggle="toggleStyle('btn_bg_hover')")
        color-style-field(
          label="Active background color"
          v-model="$store.state.customStyles.btn_bg_active"
          @change="updateStyle('btn_bg_active')"
          @toggle="toggleStyle('btn_bg_active')")
        color-style-field(
          label="Foreground color"
          v-model="$store.state.customStyles.btn_fg"
          @change="updateStyle('btn_fg')"
          @toggle="toggleStyle('btn_fg')")
        color-style-field(
          label="Hover foreground color"
          v-model="$store.state.customStyles.btn_fg_hover"
          @change="updateStyle('btn_fg_hover')"
          @toggle="toggleStyle('btn_fg_hover')")
        color-style-field(
          label="Active foreground color"
          v-model="$store.state.customStyles.btn_fg_active"
          @change="updateStyle('btn_fg_active')"
          @toggle="toggleStyle('btn_fg_active')")

      section.section
        .title Scroll Box
        style-field(
          label="Progress height"
          v-model="$store.state.customStyles.scroll_progress_h"
          or="..."
          @change="updateStyle('scroll_progress_h')"
          @toggle="toggleStyle('scroll_progress_h')")
        color-style-field(
          label="Progress color"
          v-model="$store.state.customStyles.scroll_progress_bg"
          @change="updateStyle('scroll_progress_bg')"
          @toggle="toggleStyle('scroll_progress_bg')")

      section.section
        .title Context Menu
        color-style-field(
          label="Background color"
          v-model="$store.state.customStyles.ctx_menu_bg"
          @change="updateStyle('ctx_menu_bg')"
          @toggle="toggleStyle('ctx_menu_bg')")
        color-style-field(
          label="Option's foreground color"
          v-model="$store.state.customStyles.ctx_menu_fg"
          @change="updateStyle('ctx_menu_fg')"
          @toggle="toggleStyle('ctx_menu_fg')")
        color-style-field(
          label="Option's background color on hover"
          v-model="$store.state.customStyles.ctx_menu_bg_hover"
          @change="updateStyle('ctx_menu_bg_hover')"
          @toggle="toggleStyle('ctx_menu_bg_hover')")
      
      section.section
        .title Navigation Strip
        color-style-field(
          label="Foreground color"
          v-model="$store.state.customStyles.nav_btn_fg"
          @change="updateStyle('nav_btn_fg')"
          @toggle="toggleStyle('nav_btn_fg')")
      
      section.section
        .title Tabs
        color-style-field(
          label="Foreground color"
          v-model="$store.state.customStyles.tabs_fg"
          @change="updateStyle('tabs_fg')"
          @toggle="toggleStyle('tabs_fg')")
        color-style-field(
          label="Foreground color on hover"
          v-model="$store.state.customStyles.tabs_fg_hover"
          @change="updateStyle('tabs_fg_hover')"
          @toggle="toggleStyle('tabs_fg_hover')")
        color-style-field(
          label="Foreground color on active"
          v-model="$store.state.customStyles.tabs_fg_active"
          @change="updateStyle('tabs_fg_active')"
          @toggle="toggleStyle('tabs_fg_active')")
        color-style-field(
          label="Active tab background color"
          v-model="$store.state.customStyles.tabs_activated_bg"
          @change="updateStyle('tabs_activated_bg')"
          @toggle="toggleStyle('tabs_activated_bg')")
        color-style-field(
          label="Active tab foreground color"
          v-model="$store.state.customStyles.tabs_activated_fg"
          @change="updateStyle('tabs_activated_fg')"
          @toggle="toggleStyle('tabs_activated_fg')")
        color-style-field(
          label="Selected tab background color"
          v-model="$store.state.customStyles.tabs_selected_bg"
          @change="updateStyle('tabs_selected_bg')"
          @toggle="toggleStyle('tabs_selected_bg')")
        color-style-field(
          label="Selected tab foreground color"
          v-model="$store.state.customStyles.tabs_selected_fg"
          @change="updateStyle('tabs_selected_fg')"
          @toggle="toggleStyle('tabs_selected_fg')")
      
      section.section
        .title Bookmarks
        color-style-field(
          label="Bookmark color"
          v-model="$store.state.customStyles.bookmarks_node_title_fg"
          @change="updateStyle('bookmarks_node_title_fg')"
          @toggle="toggleStyle('bookmarks_node_title_fg')")
        color-style-field(
          label="Bookmark color on hover"
          v-model="$store.state.customStyles.bookmarks_node_title_fg_hover"
          @change="updateStyle('bookmarks_node_title_fg_hover')"
          @toggle="toggleStyle('bookmarks_node_title_fg_hover')")
        color-style-field(
          label="Bookmark color on active"
          v-model="$store.state.customStyles.bookmarks_node_title_fg_active"
          @change="updateStyle('bookmarks_node_title_fg_active')"
          @toggle="toggleStyle('bookmarks_node_title_fg_active')")
        color-style-field(
          label="Closed folder color"
          v-model="$store.state.customStyles.bookmarks_folder_closed_fg"
          @change="updateStyle('bookmarks_folder_closed_fg')"
          @toggle="toggleStyle('bookmarks_folder_closed_fg')")
        color-style-field(
          label="Closed folder color on hover"
          v-model="$store.state.customStyles.bookmarks_folder_closed_fg_hover"
          @change="updateStyle('bookmarks_folder_closed_fg_hover')"
          @toggle="toggleStyle('bookmarks_folder_closed_fg_hover')")
        color-style-field(
          label="Closed folder color on active"
          v-model="$store.state.customStyles.bookmarks_folder_closed_fg_active"
          @change="updateStyle('bookmarks_folder_closed_fg_active')"
          @toggle="toggleStyle('bookmarks_folder_closed_fg_active')")
        color-style-field(
          label="Opened folder color"
          v-model="$store.state.customStyles.bookmarks_folder_open_fg"
          @change="updateStyle('bookmarks_folder_open_fg')"
          @toggle="toggleStyle('bookmarks_folder_open_fg')")
        color-style-field(
          label="Opened folder color on hover"
          v-model="$store.state.customStyles.bookmarks_folder_open_fg_hover"
          @change="updateStyle('bookmarks_folder_open_fg_hover')"
          @toggle="toggleStyle('bookmarks_folder_open_fg_hover')")
        color-style-field(
          label="Opened folder color on active"
          v-model="$store.state.customStyles.bookmarks_folder_open_fg_active"
          @change="updateStyle('bookmarks_folder_open_fg_active')"
          @toggle="toggleStyle('bookmarks_folder_open_fg_active')")
        color-style-field(
          label="Empty folder color"
          v-model="$store.state.customStyles.bookmarks_folder_empty_fg"
          @change="updateStyle('bookmarks_folder_empty_fg')"
          @toggle="toggleStyle('bookmarks_folder_empty_fg')")
</template>


<script>
import EventBus from '../event-bus'
import Utils from '../../libs/utils'
import Store from '../store'
import State from '../store.state'
import ScrollBox from './scroll-box'
import StyleField from './field.style'
import ColorStyleField from './field.style-color'

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
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

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
</style>
