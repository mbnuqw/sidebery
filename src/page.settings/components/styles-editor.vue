<template lang="pug">
.StylesEditor
  .vars(v-noise:300.g:12:af.a:0:42.s:0:9="")
    section
      h2 {{t('styles.common_title')}}
      color-style-field(
        v-model="cssVars.bg"
        :label="'styles.bg_color'"
        :name="'--bg'"
        @change="updateCSSVar('bg')"
        @toggle="toggleCSSVar('bg')")

      color-style-field(
        v-model="cssVars.title_fg"
        :label="'styles.title_color'"
        :name="'--title-fg'"
        @change="updateCSSVar('title_fg')"
        @toggle="toggleCSSVar('title_fg')")

      color-style-field(
        v-model="cssVars.sub_title_fg"
        :label="'styles.sub_title_color'"
        :name="'--sub-title-fg'"
        @change="updateCSSVar('sub_title_fg')"
        @toggle="toggleCSSVar('sub_title_fg')")

      color-style-field(
        v-model="cssVars.label_fg"
        :label="'styles.label_color'"
        :name="'--label-fg'"
        @change="updateCSSVar('label_fg')"
        @toggle="toggleCSSVar('label_fg')")

      color-style-field(
        v-model="cssVars.label_fg_hover"
        :label="'styles.label_color_hover'"
        :name="'--label-fg-hover'"
        @change="updateCSSVar('label_fg_hover')"
        @toggle="toggleCSSVar('label_fg_hover')")

      color-style-field(
        v-model="cssVars.label_fg_active"
        :label="'styles.label_color_active'"
        :name="'--label-fg-active'"
        @change="updateCSSVar('label_fg_active')"
        @toggle="toggleCSSVar('label_fg_active')")

      color-style-field(
        v-model="cssVars.info_fg"
        :label="'styles.info_color'"
        :name="'--info-fg'"
        @change="updateCSSVar('info_fg')"
        @toggle="toggleCSSVar('info_fg')")

      color-style-field(
        v-model="cssVars.true_fg"
        :label="'styles.true_color'"
        :name="'--true-fg'"
        @change="updateCSSVar('true_fg')"
        @toggle="toggleCSSVar('true_fg')")

      color-style-field(
        v-model="cssVars.false_fg"
        :label="'styles.false_color'"
        :name="'--false-fg'"
        @change="updateCSSVar('false_fg')"
        @toggle="toggleCSSVar('false_fg')")

      color-style-field(
        v-model="cssVars.active_fg"
        :label="'styles.active_color'"
        :name="'--active-fg'"
        @change="updateCSSVar('active_fg')"
        @toggle="toggleCSSVar('active_fg')")

      color-style-field(
        v-model="cssVars.inactive_fg"
        :label="'styles.inactive_color'"
        :name="'--inactive-fg'"
        @change="updateCSSVar('inactive_fg')"
        @toggle="toggleCSSVar('inactive_fg')")

      color-style-field(
        v-model="cssVars.favicons_placehoder_bg"
        :label="'styles.favi_placeholder_color'"
        :name="'--favicons-placehoder-bg'"
        @change="updateCSSVar('favicons_placehoder_bg')"
        @toggle="toggleCSSVar('favicons_placehoder_bg')")

    section
      h2 {{t('styles.buttons_title')}}
      color-style-field(
        v-model="cssVars.btn_bg"
        :label="'styles.btn_bg_color'"
        :name="'--btn-bg'"
        @change="updateCSSVar('btn_bg')"
        @toggle="toggleCSSVar('btn_bg')")

      color-style-field(
        v-model="cssVars.btn_bg_hover"
        :label="'styles.btn_bg_color_hover'"
        :name="'--btn-bg-hover'"
        @change="updateCSSVar('btn_bg_hover')"
        @toggle="toggleCSSVar('btn_bg_hover')")

      color-style-field(
        v-model="cssVars.btn_bg_active"
        :label="'styles.btn_bg_color_active'"
        :name="'--btn-bg-active'"
        @change="updateCSSVar('btn_bg_active')"
        @toggle="toggleCSSVar('btn_bg_active')")

      color-style-field(
        v-model="cssVars.btn_fg"
        :label="'styles.btn_fg_color'"
        :name="'--btn-fg'"
        @change="updateCSSVar('btn_fg')"
        @toggle="toggleCSSVar('btn_fg')")

      color-style-field(
        v-model="cssVars.btn_fg_hover"
        :label="'styles.btn_fg_color_hover'"
        :name="'--btn-fg-hover'"
        @change="updateCSSVar('btn_fg_hover')"
        @toggle="toggleCSSVar('btn_fg_hover')")

      color-style-field(
        v-model="cssVars.btn_fg_active"
        :label="'styles.btn_fg_color_active'"
        :name="'--btn-fg-active'"
        @change="updateCSSVar('btn_fg_active')"
        @toggle="toggleCSSVar('btn_fg_active')")

    section
      h2 {{t('styles.scroll_box_title')}}
      style-field(
        v-model="cssVars.scroll_progress_h"
        :label="'styles.scroll_progress_height'"
        :name="'--scroll-progress-h'"
        :or="'---'"
        @change="updateCSSVar('scroll_progress_h')"
        @toggle="toggleCSSVar('scroll_progress_h')")

      color-style-field(
        v-model="cssVars.scroll_progress_bg"
        :label="'styles.scroll_progress_color'"
        :name="'--scroll-progress-bg'"
        @change="updateCSSVar('scroll_progress_bg')"
        @toggle="toggleCSSVar('scroll_progress_bg')")

    section
      h2 {{t('styles.menu_title')}}
      style-field(
        v-model="cssVars.ctx_menu_font"
        :label="'styles.menu_font'"
        :name="'--ctx-menu-font'"
        or="---"
        @change="updateCSSVar('ctx_menu_font')"
        @toggle="toggleCSSVar('ctx_menu_font')")

      color-style-field(
        v-model="cssVars.ctx_menu_bg"
        :label="'styles.menu_bg_color'"
        :name="'--ctx-menu-bg'"
        @change="updateCSSVar('ctx_menu_bg')"
        @toggle="toggleCSSVar('ctx_menu_bg')")

      color-style-field(
        v-model="cssVars.ctx_menu_fg"
        :label="'styles.menu_opt_fg_color'"
        :name="'--ctx-menu-fg'"
        @change="updateCSSVar('ctx_menu_fg')"
        @toggle="toggleCSSVar('ctx_menu_fg')")

      color-style-field(
        v-model="cssVars.ctx_menu_bg_hover"
        :label="'styles.menu_opt_fg_color_hover'"
        :name="'--ctx-menu-bg-hover'"
        @change="updateCSSVar('ctx_menu_bg_hover')"
        @toggle="toggleCSSVar('ctx_menu_bg_hover')")

    section
      h2 {{t('styles.nav_title')}}
      color-style-field(
        v-model="cssVars.nav_btn_fg"
        :label="'styles.nav_fg_color'"
        :name="'--nav-btn-fg'"
        @change="updateCSSVar('nav_btn_fg')"
        @toggle="toggleCSSVar('nav_btn_fg')")

      style-field(
        v-model="cssVars.nav_btn_width"
        :label="'styles.nav_btn_width'"
        :name="'--nav-btn-width'"
        or="---"
        @change="updateCSSVar('nav_btn_width')"
        @toggle="toggleCSSVar('nav_btn_width')")

      style-field(
        v-model="cssVars.nav_btn_height"
        :label="'styles.nav_btn_height'"
        :name="'--nav-btn-height'"
        or="---"
        @change="updateCSSVar('nav_btn_height')"
        @toggle="toggleCSSVar('nav_btn_height')")

    section
      h2 {{t('styles.pinned_dock_title')}}
      style-field(
        v-model="cssVars.pinned_dock_overlay_bg"
        :label="'styles.pinned_dock_overlay_bg'"
        :name="'--pinned-dock-overlay-bg'"
        :or="'---'"
        @change="updateCSSVar('pinned_dock_overlay_bg')"
        @toggle="toggleCSSVar('pinned_dock_overlay_bg')")

      style-field(
        v-model="cssVars.pinned_dock_overlay_shadow"
        :label="'styles.pinned_dock_overlay_shadow'"
        :name="'--pinned-dock-overlay-shadow'"
        :or="'---'"
        @change="updateCSSVar('pinned_dock_overlay_shadow')"
        @toggle="toggleCSSVar('pinned_dock_overlay_shadow')")

    section
      h2 {{t('styles.tabs_title')}}
      style-field(
        v-model="cssVars.tabs_height"
        :label="'styles.tabs_height'"
        :name="'--tabs-height'"
        :or="'---'"
        @change="updateCSSVar('tabs_height')"
        @toggle="toggleCSSVar('tabs_height')")

      style-field(
        v-model="cssVars.tabs_indent"
        :label="'styles.tabs_indent'"
        :name="'--tabs-indent'"
        :or="'---'"
        @change="updateCSSVar('tabs_indent')"
        @toggle="toggleCSSVar('tabs_indent')")

      style-field(
        v-model="cssVars.tabs_font"
        :label="'styles.tabs_font'"
        :name="'--tabs-font'"
        :or="'---'"
        @change="updateCSSVar('tabs_font')"
        @toggle="toggleCSSVar('tabs_font')")

      style-field(
        v-model="cssVars.tabs_count_font"
        :label="'styles.tabs_count_font'"
        :name="'--tabs-count-font'"
        :or="'---'"
        @change="updateCSSVar('tabs_count_font')"
        @toggle="toggleCSSVar('tabs_count_font')")

      color-style-field(
        v-model="cssVars.tabs_fg"
        :label="'styles.tabs_fg_color'"
        :name="'--tabs-fg'"
        @change="updateCSSVar('tabs_fg')"
        @toggle="toggleCSSVar('tabs_fg')")

      color-style-field(
        v-model="cssVars.tabs_fg_hover"
        :label="'styles.tabs_fg_color_hover'"
        :name="'--tabs-fg-hover'"
        @change="updateCSSVar('tabs_fg_hover')"
        @toggle="toggleCSSVar('tabs_fg_hover')")

      color-style-field(
        v-model="cssVars.tabs_fg_active"
        :label="'styles.tabs_fg_color_active'"
        :name="'--tabs-fg-active'"
        @change="updateCSSVar('tabs_fg_active')"
        @toggle="toggleCSSVar('tabs_fg_active')")

      color-style-field(
        v-model="cssVars.tabs_bg_hover"
        :label="'styles.tabs_bg_color_hover'"
        :name="'--tabs-bg-hover'"
        @change="updateCSSVar('tabs_bg_hover')"
        @toggle="toggleCSSVar('tabs_bg_hover')")

      color-style-field(
        v-model="cssVars.tabs_bg_active"
        :label="'styles.tabs_bg_color_active'"
        :name="'--tabs-bg-active'"
        @change="updateCSSVar('tabs_bg_active')"
        @toggle="toggleCSSVar('tabs_bg_active')")

      color-style-field(
        v-model="cssVars.tabs_activated_bg"
        :label="'styles.tabs_active_bg_color'"
        :name="'--tabs-activated-bg'"
        @change="updateCSSVar('tabs_activated_bg')"
        @toggle="toggleCSSVar('tabs_activated_bg')")

      color-style-field(
        v-model="cssVars.tabs_activated_fg"
        :label="'styles.tabs_active_fg_color'"
        :name="'--tabs-activated-fg'"
        @change="updateCSSVar('tabs_activated_fg')"
        @toggle="toggleCSSVar('tabs_activated_fg')")

      color-style-field(
        v-model="cssVars.tabs_selected_bg"
        :label="'styles.tabs_selected_bg_color'"
        :name="'--tabs-selected-bg'"
        @change="updateCSSVar('tabs_selected_bg')"
        @toggle="toggleCSSVar('tabs_selected_bg')")

      color-style-field(
        v-model="cssVars.tabs_selected_fg"
        :label="'styles.tabs_selected_fg_color'"
        :name="'--tabs-selected-fg'"
        @change="updateCSSVar('tabs_selected_fg')"
        @toggle="toggleCSSVar('tabs_selected_fg')")

      style-field(
        v-model="cssVars.tabs_border"
        :label="'styles.tabs_border'"
        :name="'--tabs-border'"
        :or="'---'"
        @change="updateCSSVar('tabs_border')"
        @toggle="toggleCSSVar('tabs_border')")

      style-field(
        v-model="cssVars.tabs_activated_border"
        :label="'styles.tabs_activated_border'"
        :name="'--tabs-activated-border'"
        :or="'---'"
        @change="updateCSSVar('tabs_activated_border')"
        @toggle="toggleCSSVar('tabs_activated_border')")

      style-field(
        v-model="cssVars.tabs_selected_border"
        :label="'styles.tabs_selected_border'"
        :name="'--tabs-selected-border'"
        :or="'---'"
        @change="updateCSSVar('tabs_selected_border')"
        @toggle="toggleCSSVar('tabs_selected_border')")

      style-field(
        v-model="cssVars.tabs_shadow"
        :label="'styles.tabs_shadow'"
        :name="'--tabs-shadow'"
        :or="'---'"
        @change="updateCSSVar('tabs_shadow')"
        @toggle="toggleCSSVar('tabs_shadow')")

      style-field(
        v-model="cssVars.tabs_activated_shadow"
        :label="'styles.tabs_activated_shadow'"
        :name="'--tabs-activated-shadow'"
        :or="'---'"
        @change="updateCSSVar('tabs_activated_shadow')"
        @toggle="toggleCSSVar('tabs_activated_shadow')")

      style-field(
        v-model="cssVars.tabs_selected_shadow"
        :label="'styles.tabs_selected_shadow'"
        :name="'--tabs-selected-shadow'"
        :or="'---'"
        @change="updateCSSVar('tabs_selected_shadow')"
        @toggle="toggleCSSVar('tabs_selected_shadow')")
        
      color-style-field(
        v-model="cssVars.tabs_lvl_indicator_bg"
        :label="'styles.tabs_lvl_indicator_bg'"
        :name="'--tabs-lvl-indicator-bg'"
        :or="'---'"
        @change="updateCSSVar('tabs_lvl_indicator_bg')"
        @toggle="toggleCSSVar('tabs_lvl_indicator_bg')")
        
    section
      h2 {{t('styles.bookmarks_title')}}
      style-field(
        v-model="cssVars.bookmarks_bookmark_height"
        :label="'styles.bookmarks_bookmark_height'"
        :name="'--bookmarks-bookmark-height'"
        :or="'---'"
        @change="updateCSSVar('bookmarks_bookmark_height')"
        @toggle="toggleCSSVar('bookmarks_bookmark_height')")

      style-field(
        v-model="cssVars.bookmarks_folder_height"
        :label="'styles.bookmarks_folder_height'"
        :name="'--bookmarks-folder-height'"
        :or="'---'"
        @change="updateCSSVar('bookmarks_folder_height')"
        @toggle="toggleCSSVar('bookmarks_folder_height')")

      style-field(
        v-model="cssVars.bookmarks_separator_height"
        :label="'styles.bookmarks_separator_height'"
        :name="'--bookmarks-separator-height'"
        :or="'---'"
        @change="updateCSSVar('bookmarks_separator_height')"
        @toggle="toggleCSSVar('bookmarks_separator_height')")

      style-field(
        v-model="cssVars.bookmarks_bookmark_font"
        :label="'styles.bookmarks_bookmark_font'"
        :name="'--bookmarks-bookmark-font'"
        :or="'---'"
        @change="updateCSSVar('bookmarks_bookmark_font')"
        @toggle="toggleCSSVar('bookmarks_bookmark_font')")

      style-field(
        v-model="cssVars.bookmarks_folder_font"
        :label="'styles.bookmarks_folder_font'"
        :name="'--bookmarks-folder-font'"
        :or="'---'"
        @change="updateCSSVar('bookmarks_folder_font')"
        @toggle="toggleCSSVar('bookmarks_folder_font')")

      color-style-field(
        v-model="cssVars.bookmarks_node_title_fg"
        :label="'styles.bookmarks_fg_color'"
        :name="'--bookmarks-node-title-fg'"
        @change="updateCSSVar('bookmarks_node_title_fg')"
        @toggle="toggleCSSVar('bookmarks_node_title_fg')")

      color-style-field(
        v-model="cssVars.bookmarks_node_title_fg_hover"
        :label="'styles.bookmarks_fg_color_hover'"
        :name="'--bookmarks-node-title-fg-hover'"
        @change="updateCSSVar('bookmarks_node_title_fg_hover')"
        @toggle="toggleCSSVar('bookmarks_node_title_fg_hover')")

      color-style-field(
        v-model="cssVars.bookmarks_node_title_fg_active"
        :label="'styles.bookmarks_fg_color_active'"
        :name="'--bookmarks-node-title-fg-active'"
        @change="updateCSSVar('bookmarks_node_title_fg_active')"
        @toggle="toggleCSSVar('bookmarks_node_title_fg_active')")

      color-style-field(
        v-model="cssVars.bookmarks_node_bg_hover"
        :label="'styles.bookmarks_bg_color_hover'"
        :name="'--bookmarks-node-bg-hover'"
        @change="updateCSSVar('bookmarks_node_bg_hover')"
        @toggle="toggleCSSVar('bookmarks_node_bg_hover')")

      color-style-field(
        v-model="cssVars.bookmarks_node_bg_active"
        :label="'styles.bookmarks_bg_color_active'"
        :name="'--bookmarks-node-bg-active'"
        @change="updateCSSVar('bookmarks_node_bg_active')"
        @toggle="toggleCSSVar('bookmarks_node_bg_active')")

      color-style-field(
        v-model="cssVars.bookmarks_folder_closed_fg"
        :label="'styles.bookmarks_closed_dir_fg_color'"
        :name="'--bookmarks-folder-closed-fg'"
        @change="updateCSSVar('bookmarks_folder_closed_fg')"
        @toggle="toggleCSSVar('bookmarks_folder_closed_fg')")

      color-style-field(
        v-model="cssVars.bookmarks_folder_closed_fg_hover"
        :label="'styles.bookmarks_closed_dir_fg_color_hover'"
        :name="'--bookmarks-folder-closed-fg-hover'"
        @change="updateCSSVar('bookmarks_folder_closed_fg_hover')"
        @toggle="toggleCSSVar('bookmarks_folder_closed_fg_hover')")

      color-style-field(
        v-model="cssVars.bookmarks_folder_closed_fg_active"
        :label="'styles.bookmarks_closed_dir_fg_color_active'"
        :name="'--bookmarks-folder-closed-fg-active'"
        @change="updateCSSVar('bookmarks_folder_closed_fg_active')"
        @toggle="toggleCSSVar('bookmarks_folder_closed_fg_active')")

      color-style-field(
        v-model="cssVars.bookmarks_folder_open_fg"
        :label="'styles.bookmarks_open_dir_fg_color'"
        :name="'--bookmarks-folder-expanded-fg'"
        @change="updateCSSVar('bookmarks_folder_open_fg')"
        @toggle="toggleCSSVar('bookmarks_folder_open_fg')")

      color-style-field(
        v-model="cssVars.bookmarks_folder_open_fg_hover"
        :label="'styles.bookmarks_open_dir_fg_color_hover'"
        :name="'--bookmarks-folder-expanded-fg-hover'"
        @change="updateCSSVar('bookmarks_folder_open_fg_hover')"
        @toggle="toggleCSSVar('bookmarks_folder_open_fg_hover')")

      color-style-field(
        v-model="cssVars.bookmarks_folder_open_fg_active"
        :label="'styles.bookmarks_open_dir_fg_color_active'"
        :name="'--bookmarks-folder-expanded-fg-active'"
        @change="updateCSSVar('bookmarks_folder_open_fg_active')"
        @toggle="toggleCSSVar('bookmarks_folder_open_fg_active')")

      color-style-field(
        v-model="cssVars.bookmarks_folder_empty_fg"
        :label="'styles.bookmarks_empty_dir_fg_color'"
        :name="'--bookmarks-folder-empty-fg'"
        @change="updateCSSVar('bookmarks_folder_empty_fg')"
        @toggle="toggleCSSVar('bookmarks_folder_empty_fg')")

      color-style-field(
        v-model="cssVars.bookmarks_open_bookmark_fg"
        :label="'styles.bookmarks_open_fg_color'"
        :name="'--bookmarks-open-bookmark-fg'"
        @change="updateCSSVar('bookmarks_open_bookmark_fg')"
        @toggle="toggleCSSVar('bookmarks_open_bookmark_fg')")

    .ctrls: .btn(@click="resetCSSVars") {{t('styles.reset_styles')}}
  
  .css: .wrapper(v-noise:300.g:12:af.a:0:42.s:0:9="")
    nav
      .nav-item(
        :data-active="cssTarget === 'sidebar'"
        @click="selectCssTarget('sidebar')") {{t('styles.css_sidebar')}}
      .nav-item(
        :data-active="cssTarget === 'group'"
        @click="selectCssTarget('group')") {{t('styles.css_group')}}
    .awesome CSS&#10;IS&#10;AWESOME
    .editor-box
      textarea.editor(
        ref="cssEditor"
        v-model="customCSS"
        @input="onInput"
        @keydown.tab.prevent=""
        @change="applyCssDebounced")
      .placeholder(:data-hidden="!!customCSS") CSS...
</template>


<script>
import StyleField from '../../components/style-field'
import ColorStyleField from '../../components/style-color-field'
import { CUSTOM_CSS_VARS } from '../../../addon/defaults'
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
      cssVars: {},
      customCSS: '',
      cssTarget: 'sidebar',
    }
  },

  async created() {
    this.cssVars = await Actions.getCSSVars()
    this.customCSS = await Actions.getCustomCSS(this.cssTarget)
    this.$nextTick(() => {
      if (this.$refs.cssEditor) {
        this.$refs.cssEditor.style.height = '0px'
        this.$refs.cssEditor.style.height = this.$refs.cssEditor.scrollHeight + 'px'
      }
    })
  },

  methods: {
    /**
     * Toggle custom css var
     */
    toggleCSSVar(key) {
      if (this.cssVars[key]) {
        this.removeCSSVar(key)
        Actions.saveCSSVars(this.cssVars)
      } else {
        const compStyle = getComputedStyle(this.$el)
        const value = compStyle.getPropertyValue(Utils.toCSSVarName(key)).trim()
        this.setCSSVar(key, value)
        Actions.saveCSSVars(this.cssVars)
      }
    },

    /**
     * Update style
     */
    updateCSSVar(key) {
      if (!this.cssVars[key]) return
      this.setCSSVar(key, this.cssVars[key])
      Actions.saveCSSVars(this.cssVars)
    },

    /**
     * Set custom style
     */
    setCSSVar(key, val) {
      this.$set(this.cssVars, key, val)
      this.$root.$el.style.setProperty(Utils.toCSSVarName(key), val)
    },

    /**
     * Remove custom style
     */
    removeCSSVar(key) {
      this.$set(this.cssVars, key, null)
      this.$root.$el.style.removeProperty(Utils.toCSSVarName(key))
    },

    /**
     * Reset custom styles
     */
    resetCSSVars() {
      this.cssVars = CUSTOM_CSS_VARS
      for (let key of Object.keys(CUSTOM_CSS_VARS)) {
        this.removeCSSVar(key)
      }
      Actions.saveCSSVars(this.cssVars)
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
