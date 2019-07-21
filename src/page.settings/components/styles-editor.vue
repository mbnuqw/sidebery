<template lang="pug">
.StylesEditor
  .vars: .wrapper(v-noise:300.g:12:af.a:0:42.s:0:9="")
    h1 Variables
    section
      h2 {{t('styles.common_title')}}
      color-style-field(
        v-model="$store.state.cssVars.bg"
        :label="'styles.bg_color'"
        :name="'--bg'"
        @change="updateStyle('bg')"
        @toggle="toggleStyle('bg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.title_fg"
        :label="'styles.title_color'"
        :name="'--title-fg'"
        @change="updateStyle('title_fg')"
        @toggle="toggleStyle('title_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.sub_title_fg"
        :label="'styles.sub_title_color'"
        :name="'--sub-title-fg'"
        @change="updateStyle('sub_title_fg')"
        @toggle="toggleStyle('sub_title_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.label_fg"
        :label="'styles.label_color'"
        :name="'--label-fg'"
        @change="updateStyle('label_fg')"
        @toggle="toggleStyle('label_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.label_fg_hover"
        :label="'styles.label_color_hover'"
        :name="'--label-fg-hover'"
        @change="updateStyle('label_fg_hover')"
        @toggle="toggleStyle('label_fg_hover')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.label_fg_active"
        :label="'styles.label_color_active'"
        :name="'--label-fg-active'"
        @change="updateStyle('label_fg_active')"
        @toggle="toggleStyle('label_fg_active')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.info_fg"
        :label="'styles.info_color'"
        :name="'--info-fg'"
        @change="updateStyle('info_fg')"
        @toggle="toggleStyle('info_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.true_fg"
        :label="'styles.true_color'"
        :name="'--true-fg'"
        @change="updateStyle('true_fg')"
        @toggle="toggleStyle('true_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.false_fg"
        :label="'styles.false_color'"
        :name="'--false-fg'"
        @change="updateStyle('false_fg')"
        @toggle="toggleStyle('false_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.active_fg"
        :label="'styles.active_color'"
        :name="'--active-fg'"
        @change="updateStyle('active_fg')"
        @toggle="toggleStyle('active_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.inactive_fg"
        :label="'styles.inactive_color'"
        :name="'--inactive-fg'"
        @change="updateStyle('inactive_fg')"
        @toggle="toggleStyle('inactive_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.favicons_placehoder_bg"
        :label="'styles.favi_placeholder_color'"
        :name="'--favicons-placehoder-bg'"
        @change="updateStyle('favicons_placehoder_bg')"
        @toggle="toggleStyle('favicons_placehoder_bg')")

    section
      h2 {{t('styles.buttons_title')}}
      color-style-field(
        v-model="$store.state.cssVars.btn_bg"
        :label="'styles.btn_bg_color'"
        :name="'--btn-bg'"
        @change="updateStyle('btn_bg')"
        @toggle="toggleStyle('btn_bg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.btn_bg_hover"
        :label="'styles.btn_bg_color_hover'"
        :name="'--btn-bg-hover'"
        @change="updateStyle('btn_bg_hover')"
        @toggle="toggleStyle('btn_bg_hover')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.btn_bg_active"
        :label="'styles.btn_bg_color_active'"
        :name="'--btn-bg-active'"
        @change="updateStyle('btn_bg_active')"
        @toggle="toggleStyle('btn_bg_active')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.btn_fg"
        :label="'styles.btn_fg_color'"
        :name="'--btn-fg'"
        @change="updateStyle('btn_fg')"
        @toggle="toggleStyle('btn_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.btn_fg_hover"
        :label="'styles.btn_fg_color_hover'"
        :name="'--btn-fg-hover'"
        @change="updateStyle('btn_fg_hover')"
        @toggle="toggleStyle('btn_fg_hover')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.btn_fg_active"
        :label="'styles.btn_fg_color_active'"
        :name="'--btn-fg-active'"
        @change="updateStyle('btn_fg_active')"
        @toggle="toggleStyle('btn_fg_active')")

    section
      h2 {{t('styles.scroll_box_title')}}
      style-field(
        v-model="$store.state.cssVars.scroll_progress_h"
        :label="'styles.scroll_progress_height'"
        :name="'--scroll-progress-h'"
        :or="'---'"
        @change="updateStyle('scroll_progress_h')"
        @toggle="toggleStyle('scroll_progress_h')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.scroll_progress_bg"
        :label="'styles.scroll_progress_color'"
        :name="'--scroll-progress-bg'"
        @change="updateStyle('scroll_progress_bg')"
        @toggle="toggleStyle('scroll_progress_bg')")

    section
      h2 {{t('styles.menu_title')}}
      style-field(
        v-model="$store.state.cssVars.ctx_menu_font"
        :label="'styles.menu_font'"
        :name="'--ctx-menu-font'"
        or="---"
        @change="updateStyle('ctx_menu_font')"
        @toggle="toggleStyle('ctx_menu_font')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.ctx_menu_bg"
        :label="'styles.menu_bg_color'"
        :name="'--ctx-menu-bg'"
        @change="updateStyle('ctx_menu_bg')"
        @toggle="toggleStyle('ctx_menu_bg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.ctx_menu_fg"
        :label="'styles.menu_opt_fg_color'"
        :name="'--ctx-menu-fg'"
        @change="updateStyle('ctx_menu_fg')"
        @toggle="toggleStyle('ctx_menu_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.ctx_menu_bg_hover"
        :label="'styles.menu_opt_fg_color_hover'"
        :name="'--ctx-menu-bg-hover'"
        @change="updateStyle('ctx_menu_bg_hover')"
        @toggle="toggleStyle('ctx_menu_bg_hover')")

    section
      h2 {{t('styles.nav_title')}}
      color-style-field(
        v-model="$store.state.cssVars.nav_btn_fg"
        :label="'styles.nav_fg_color'"
        :name="'--nav-btn-fg'"
        @change="updateStyle('nav_btn_fg')"
        @toggle="toggleStyle('nav_btn_fg')")
      .separator
      style-field(
        v-model="$store.state.cssVars.nav_btn_width"
        :label="'styles.nav_btn_width'"
        :name="'--nav-btn-width'"
        or="---"
        @change="updateStyle('nav_btn_width')"
        @toggle="toggleStyle('nav_btn_width')")
      .separator
      style-field(
        v-model="$store.state.cssVars.nav_btn_height"
        :label="'styles.nav_btn_height'"
        :name="'--nav-btn-height'"
        or="---"
        @change="updateStyle('nav_btn_height')"
        @toggle="toggleStyle('nav_btn_height')")

    section
      h2 {{t('styles.pinned_dock_title')}}
      style-field(
        v-model="$store.state.cssVars.pinned_dock_overlay_bg"
        :label="'styles.pinned_dock_overlay_bg'"
        :name="'--pinned-dock-overlay-bg'"
        :or="'---'"
        @change="updateStyle('pinned_dock_overlay_bg')"
        @toggle="toggleStyle('pinned_dock_overlay_bg')")
      .separator
      style-field(
        v-model="$store.state.cssVars.pinned_dock_overlay_shadow"
        :label="'styles.pinned_dock_overlay_shadow'"
        :name="'--pinned-dock-overlay-shadow'"
        :or="'---'"
        @change="updateStyle('pinned_dock_overlay_shadow')"
        @toggle="toggleStyle('pinned_dock_overlay_shadow')")

    section
      h2 {{t('styles.tabs_title')}}
      style-field(
        v-model="$store.state.cssVars.tabs_height"
        :label="'styles.tabs_height'"
        :name="'--tabs-height'"
        :or="'---'"
        @change="updateStyle('tabs_height')"
        @toggle="toggleStyle('tabs_height')")
      .separator
      style-field(
        v-model="$store.state.cssVars.tabs_indent"
        :label="'styles.tabs_indent'"
        :name="'--tabs-indent'"
        :or="'---'"
        @change="updateStyle('tabs_indent')"
        @toggle="toggleStyle('tabs_indent')")
      .separator
      style-field(
        v-model="$store.state.cssVars.tabs_font"
        :label="'styles.tabs_font'"
        :name="'--tabs-font'"
        :or="'---'"
        @change="updateStyle('tabs_font')"
        @toggle="toggleStyle('tabs_font')")
      .separator
      style-field(
        v-model="$store.state.cssVars.tabs_count_font"
        :label="'styles.tabs_count_font'"
        :name="'--tabs-count-font'"
        :or="'---'"
        @change="updateStyle('tabs_count_font')"
        @toggle="toggleStyle('tabs_count_font')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.tabs_fg"
        :label="'styles.tabs_fg_color'"
        :name="'--tabs-fg'"
        @change="updateStyle('tabs_fg')"
        @toggle="toggleStyle('tabs_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.tabs_fg_hover"
        :label="'styles.tabs_fg_color_hover'"
        :name="'--tabs-fg-hover'"
        @change="updateStyle('tabs_fg_hover')"
        @toggle="toggleStyle('tabs_fg_hover')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.tabs_fg_active"
        :label="'styles.tabs_fg_color_active'"
        :name="'--tabs-fg-active'"
        @change="updateStyle('tabs_fg_active')"
        @toggle="toggleStyle('tabs_fg_active')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.tabs_bg_hover"
        :label="'styles.tabs_bg_color_hover'"
        :name="'--tabs-bg-hover'"
        @change="updateStyle('tabs_bg_hover')"
        @toggle="toggleStyle('tabs_bg_hover')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.tabs_bg_active"
        :label="'styles.tabs_bg_color_active'"
        :name="'--tabs-bg-active'"
        @change="updateStyle('tabs_bg_active')"
        @toggle="toggleStyle('tabs_bg_active')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.tabs_activated_bg"
        :label="'styles.tabs_active_bg_color'"
        :name="'--tabs-activated-bg'"
        @change="updateStyle('tabs_activated_bg')"
        @toggle="toggleStyle('tabs_activated_bg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.tabs_activated_fg"
        :label="'styles.tabs_active_fg_color'"
        :name="'--tabs-activated-fg'"
        @change="updateStyle('tabs_activated_fg')"
        @toggle="toggleStyle('tabs_activated_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.tabs_selected_bg"
        :label="'styles.tabs_selected_bg_color'"
        :name="'--tabs-selected-bg'"
        @change="updateStyle('tabs_selected_bg')"
        @toggle="toggleStyle('tabs_selected_bg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.tabs_selected_fg"
        :label="'styles.tabs_selected_fg_color'"
        :name="'--tabs-selected-fg'"
        @change="updateStyle('tabs_selected_fg')"
        @toggle="toggleStyle('tabs_selected_fg')")
      .separator
      style-field(
        v-model="$store.state.cssVars.tabs_border"
        :label="'styles.tabs_border'"
        :name="'--tabs-border'"
        :or="'---'"
        @change="updateStyle('tabs_border')"
        @toggle="toggleStyle('tabs_border')")
      .separator
      style-field(
        v-model="$store.state.cssVars.tabs_activated_border"
        :label="'styles.tabs_activated_border'"
        :name="'--tabs-activated-border'"
        :or="'---'"
        @change="updateStyle('tabs_activated_border')"
        @toggle="toggleStyle('tabs_activated_border')")
      .separator
      style-field(
        v-model="$store.state.cssVars.tabs_selected_border"
        :label="'styles.tabs_selected_border'"
        :name="'--tabs-selected-border'"
        :or="'---'"
        @change="updateStyle('tabs_selected_border')"
        @toggle="toggleStyle('tabs_selected_border')")
      .separator
      style-field(
        v-model="$store.state.cssVars.tabs_shadow"
        :label="'styles.tabs_shadow'"
        :name="'--tabs-shadow'"
        :or="'---'"
        @change="updateStyle('tabs_shadow')"
        @toggle="toggleStyle('tabs_shadow')")
      .separator
      style-field(
        v-model="$store.state.cssVars.tabs_activated_shadow"
        :label="'styles.tabs_activated_shadow'"
        :name="'--tabs-activated-shadow'"
        :or="'---'"
        @change="updateStyle('tabs_activated_shadow')"
        @toggle="toggleStyle('tabs_activated_shadow')")
      .separator
      style-field(
        v-model="$store.state.cssVars.tabs_selected_shadow"
        :label="'styles.tabs_selected_shadow'"
        :name="'--tabs-selected-shadow'"
        :or="'---'"
        @change="updateStyle('tabs_selected_shadow')"
        @toggle="toggleStyle('tabs_selected_shadow')")

    section
      h2 {{t('styles.bookmarks_title')}}
      style-field(
        v-model="$store.state.cssVars.bookmarks_bookmark_height"
        :label="'styles.bookmarks_bookmark_height'"
        :name="'--bookmarks-bookmark-height'"
        :or="'---'"
        @change="updateStyle('bookmarks_bookmark_height')"
        @toggle="toggleStyle('bookmarks_bookmark_height')")
      .separator
      style-field(
        v-model="$store.state.cssVars.bookmarks_folder_height"
        :label="'styles.bookmarks_folder_height'"
        :name="'--bookmarks-folder-height'"
        :or="'---'"
        @change="updateStyle('bookmarks_folder_height')"
        @toggle="toggleStyle('bookmarks_folder_height')")
      .separator
      style-field(
        v-model="$store.state.cssVars.bookmarks_separator_height"
        :label="'styles.bookmarks_separator_height'"
        :name="'--bookmarks-separator-height'"
        :or="'---'"
        @change="updateStyle('bookmarks_separator_height')"
        @toggle="toggleStyle('bookmarks_separator_height')")
      .separator
      style-field(
        v-model="$store.state.cssVars.bookmarks_bookmark_font"
        :label="'styles.bookmarks_bookmark_font'"
        :name="'--bookmarks-bookmark-font'"
        :or="'---'"
        @change="updateStyle('bookmarks_bookmark_font')"
        @toggle="toggleStyle('bookmarks_bookmark_font')")
      .separator
      style-field(
        v-model="$store.state.cssVars.bookmarks_folder_font"
        :label="'styles.bookmarks_folder_font'"
        :name="'--bookmarks-folder-font'"
        :or="'---'"
        @change="updateStyle('bookmarks_folder_font')"
        @toggle="toggleStyle('bookmarks_folder_font')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_node_title_fg"
        :label="'styles.bookmarks_fg_color'"
        :name="'--bookmarks-node-title-fg'"
        @change="updateStyle('bookmarks_node_title_fg')"
        @toggle="toggleStyle('bookmarks_node_title_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_node_title_fg_hover"
        :label="'styles.bookmarks_fg_color_hover'"
        :name="'--bookmarks-node-title-fg-hover'"
        @change="updateStyle('bookmarks_node_title_fg_hover')"
        @toggle="toggleStyle('bookmarks_node_title_fg_hover')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_node_title_fg_active"
        :label="'styles.bookmarks_fg_color_active'"
        :name="'--bookmarks-node-title-fg-active'"
        @change="updateStyle('bookmarks_node_title_fg_active')"
        @toggle="toggleStyle('bookmarks_node_title_fg_active')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_node_bg_hover"
        :label="'styles.bookmarks_bg_color_hover'"
        :name="'--bookmarks-node-bg-hover'"
        @change="updateStyle('bookmarks_node_bg_hover')"
        @toggle="toggleStyle('bookmarks_node_bg_hover')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_node_bg_active"
        :label="'styles.bookmarks_bg_color_active'"
        :name="'--bookmarks-node-bg-active'"
        @change="updateStyle('bookmarks_node_bg_active')"
        @toggle="toggleStyle('bookmarks_node_bg_active')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_folder_closed_fg"
        :label="'styles.bookmarks_closed_dir_fg_color'"
        :name="'--bookmarks-folder-closed-fg'"
        @change="updateStyle('bookmarks_folder_closed_fg')"
        @toggle="toggleStyle('bookmarks_folder_closed_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_folder_closed_fg_hover"
        :label="'styles.bookmarks_closed_dir_fg_color_hover'"
        :name="'--bookmarks-folder-closed-fg-hover'"
        @change="updateStyle('bookmarks_folder_closed_fg_hover')"
        @toggle="toggleStyle('bookmarks_folder_closed_fg_hover')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_folder_closed_fg_active"
        :label="'styles.bookmarks_closed_dir_fg_color_active'"
        :name="'--bookmarks-folder-closed-fg-active'"
        @change="updateStyle('bookmarks_folder_closed_fg_active')"
        @toggle="toggleStyle('bookmarks_folder_closed_fg_active')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_folder_open_fg"
        :label="'styles.bookmarks_open_dir_fg_color'"
        :name="'--bookmarks-folder-expanded-fg'"
        @change="updateStyle('bookmarks_folder_open_fg')"
        @toggle="toggleStyle('bookmarks_folder_open_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_folder_open_fg_hover"
        :label="'styles.bookmarks_open_dir_fg_color_hover'"
        :name="'--bookmarks-folder-expanded-fg-hover'"
        @change="updateStyle('bookmarks_folder_open_fg_hover')"
        @toggle="toggleStyle('bookmarks_folder_open_fg_hover')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_folder_open_fg_active"
        :label="'styles.bookmarks_open_dir_fg_color_active'"
        :name="'--bookmarks-folder-expanded-fg-active'"
        @change="updateStyle('bookmarks_folder_open_fg_active')"
        @toggle="toggleStyle('bookmarks_folder_open_fg_active')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_folder_empty_fg"
        :label="'styles.bookmarks_empty_dir_fg_color'"
        :name="'--bookmarks-folder-empty-fg'"
        @change="updateStyle('bookmarks_folder_empty_fg')"
        @toggle="toggleStyle('bookmarks_folder_empty_fg')")
      .separator
      color-style-field(
        v-model="$store.state.cssVars.bookmarks_open_bookmark_fg"
        :label="'styles.bookmarks_open_fg_color'"
        :name="'--bookmarks-open-bookmark-fg'"
        @change="updateStyle('bookmarks_open_bookmark_fg')"
        @toggle="toggleStyle('bookmarks_open_bookmark_fg')")

    .ctrls: .btn(@click="resetStyles") {{t('styles.reset_styles')}}
  
  .css: .wrapper(v-noise:300.g:12:af.a:0:42.s:0:9="")
    h1 CSS
    nav
      .nav-item(
        :data-active="cssTarget === 'sidebar'"
        @click="selectCssTarget('sidebar')") Sidebar
      .nav-item(
        :data-active="cssTarget === 'group'"
        @click="selectCssTarget('group')") Group page
      .nav-item(
        :data-active="cssTarget === 'settings'"
        @click="selectCssTarget('settings')") Settings page
    .awesome CSS&#10;IS&#10;AWESOME
    .editor-box
      textarea.editor(
        v-model="customCSS"
        @input="onInput"
        @keydown.tab.prevent=""
        @change="applyCssDebounced")
      .placeholder(:data-hidden="!!customCSS") ...
</template>


<script>
import Utils from '../../utils'
import StyleField from '../../components/style-field'
import ColorStyleField from '../../components/style-color-field'
import { CUSTOM_CSS_VARS } from '../../defaults'
import State from '../store/state'
import Actions from '../actions'

let applyTimeout

export default {
  components: {
    ColorStyleField,
    StyleField,
  },

  data() {
    return {
      active: false,
      customCSS: '',
      cssTarget: 'sidebar',
    }
  },

  async created() {
    this.customCSS = await Actions.getCustomCSS(this.cssTarget)
  },

  methods: {
    /**
     * Toggle style
     */
    toggleStyle(key) {
      if (State.cssVars[key]) {
        Actions.removeCSSVar(key)
        Actions.saveCSSVars()
      } else {
        const compStyle = getComputedStyle(this.$el)
        const value = compStyle.getPropertyValue(Utils.toCSSVarName(key)).trim()
        Actions.setCSSVar(key, value)
        Actions.saveCSSVars()
      }
    },

    /**
     * Update style
     */
    updateStyle(key) {
      if (!State.cssVars[key]) return
      Actions.setCSSVar(key, State.cssVars[key])
      Actions.saveCSSVars()
    },

    /**
     * Reset custom styles
     */
    resetStyles() {
      this.$store.state.cssVars = CUSTOM_CSS_VARS
      for (let key of Object.keys(CUSTOM_CSS_VARS)) {
        Actions.removeCSSVar(key)
      }
      Actions.saveCSSVars()
    },

    /**
     * Select target of custom css
     */
    async selectCssTarget(target) {
      this.cssTarget = target
      this.customCSS = await Actions.getCustomCSS(target)
    },

    /**
     * Handle input
     */
    onInput(e) {
      e.target.style.height = '0px'
      e.target.style.height = e.target.scrollHeight + 'px'

      this.applyCssDebounced()
    },

    /**
     * Apply custom css
     */
    applyCssDebounced() {
      if (applyTimeout) clearTimeout(applyTimeout)
      applyTimeout = setTimeout(() => {
        Actions.setCustomCSS(this.cssTarget, this.customCSS)
        applyTimeout = null
      }, 1000)
    },
  },
}
</script>
