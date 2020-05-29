<template lang="pug">
.PanelConfig(@wheel="onWheel")
  h2(v-if="isBookmarks") {{t('bookmarks_dashboard.title')}}
  h2(v-if="isDefault") {{conf.name}}
  TextInput.title(
    v-if="isTabs"
    ref="name"
    :value="conf.name"
    :or="t('container_dashboard.name_placeholder')"
    @input="onNameInput")

  SelectField(
    v-if="isTabs && !conf.customIconSrc"
    label="container_dashboard.icon_label"
    optLabel="settings.panel_icon_"
    :value="icon"
    :opts="iconOpts"
    :color="color"
    @input="setIcon")

  SelectField(
    v-if="isTabs && !conf.customIconSrc"
    label="container_dashboard.color_label"
    :value="color"
    :opts="colorOpts"
    :icon="icon"
    @input="setColor")

  .TextField.custom-icon(v-if="isTabs")
    .body
      .label {{t('panel_config.custom_icon')}}
      TextInput(
        ref="input"
        v-debounce.500="updateCustomIcon"
        :value="conf.customIconSrc"
        :line="true"
        @input="onCustomIconInput")
      img(v-if="customIconUrl" :src="customIconUrl" @load="onCustomIconLoad")
      .btn(
        v-if="customIconType === 'url' && !customIconUrl"
        @click="loadCustomIcon") {{t('panel_config.custom_icon_load')}}
    .note {{t('container_dashboard.custom_icon_note')}}

  ToggleField(
    label="dashboard.lock_panel_label"
    :value="conf.lockedPanel"
    @input="togglePanelLock")

  ToggleField(
    v-if="isDefault || isCustom"
    label="dashboard.lock_tabs_label"
    :value="conf.lockedTabs"
    @input="toggleTabsLock")

  ToggleField(
    label="dashboard.skip_on_switching"
    :value="conf.skipOnSwitching"
    @input="toggleSkipOnSwitching")

  ToggleField(
    v-if="isDefault || isCustom"
    label="dashboard.no_empty_label"
    :value="conf.noEmpty"
    @input="togglePanelNoEmpty")

  SelectField(
    v-if="isDefault || isTabs"
    label="dashboard.new_tab_ctx"
    :value="newTabCtx"
    :opts="availableContainers"
    @input="togglePanelNewTabCtx")

  SelectField(
    v-if="isDefault || isTabs"
    label="dashboard.drop_tab_ctx"
    :value="dropTabCtx"
    :opts="availableContainers"
    @input="togglePanelDropTabCtx")

  SelectField(
    v-if="isDefault || isTabs"
    label="dashboard.move_tab_ctx"
    optLabel="dashboard.move_tab_ctx_"
    :value="moveTabCtx"
    :opts="availableContainers"
    @input="togglePanelMoveTabCtx")
  .sub-fields(v-if="isDefault || isTabs")
    ToggleField(
      label="dashboard.move_tab_ctx_nochild"
      :inactive="moveTabCtx === 'none'"
      :value="conf.moveTabCtxNoChild"
      @input="togglePanelMoveTabCtxNoChild")

  ToggleField(
    v-if="isTabs"
    label="dashboard.url_rules"
    :value="conf.urlRulesActive"
    @input="toggleUrlRules")
  .sub-fields.-nosep(v-if="conf.urlRulesActive")
    .field
      TextInput.text(
        ref="urlRulesInput"
        or="---"
        :value="conf.urlRules"
        :valid="urlRulesValid"
        @input="onUrlRulesInput")

</template>

<script>
import { DEFAULT_CTX } from '../../../addon/defaults'
import TextInput from '../../components/text-input'
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import TextField from '../../components/text-field'
import State from '../store/state'
import Actions from '../actions'

const URL_RE = /^https?:\/\/.+/

export default {
  name: 'PanelConfig',

  components: {
    TextInput,
    TextField,
    ToggleField,
    SelectField,
  },

  props: {
    conf: {
      type: Object,
      default: () => ({}),
    },
    index: Number,
  },

  data() {
    return {
      iconOpts: [
        { value: 'icon_tabs', icon: 'icon_tabs' },
        { value: 'icon_books', icon: 'icon_books' },
        { value: 'icon_code', icon: 'icon_code' },
        { value: 'icon_circle', icon: 'icon_circle' },
        { value: 'icon_play', icon: 'icon_play' },
        { value: 'icon_mail', icon: 'icon_mail' },
        { value: 'icon_man', icon: 'icon_man' },
        { value: 'icon_archive', icon: 'icon_archive' },
        { value: 'icon_clipboard', icon: 'icon_clipboard' },
        { value: 'icon_book', icon: 'icon_book' },
        { value: 'icon_coffee', icon: 'icon_coffee' },
        { value: 'icon_search', icon: 'icon_search' },
        { value: 'icon_lock', icon: 'icon_lock' },
        { value: 'icon_edu', icon: 'icon_edu' },
        { value: 'fingerprint', icon: 'fingerprint' },
        { value: 'briefcase', icon: 'briefcase' },
        { value: 'dollar', icon: 'dollar' },
        { value: 'cart', icon: 'cart' },
        { value: 'circle', icon: 'circle' },
        { value: 'gift', icon: 'gift' },
        { value: 'vacation', icon: 'vacation' },
        { value: 'food', icon: 'food' },
        { value: 'fruit', icon: 'fruit' },
        { value: 'pet', icon: 'pet' },
        { value: 'tree', icon: 'tree' },
        { value: 'chill', icon: 'chill' },
        { value: 'fence', icon: 'fence' },
      ],
      colorOpts: [
        { value: 'blue', color: 'blue' },
        { value: 'turquoise', color: 'turquoise' },
        { value: 'green', color: 'green' },
        { value: 'yellow', color: 'yellow' },
        { value: 'orange', color: 'orange' },
        { value: 'red', color: 'red' },
        { value: 'pink', color: 'pink' },
        { value: 'purple', color: 'purple' },
        { value: 'toolbar', color: 'toolbar' },
      ],
      customIconUrl: '',
      customIconType: '',
    }
  },

  computed: {
    isBookmarks() {
      return this.conf.type === 'bookmarks'
    },

    isDefault() {
      return this.conf.type === 'default'
    },

    isCustom() {
      return this.conf.type !== 'bookmarks' && this.conf.type !== 'default'
    },

    isTabs() {
      return this.conf.type === 'tabs'
    },

    availableContainers() {
      let result = []

      if (!State.panels.find(p => p.id !== this.conf.id && p.moveTabCtx === DEFAULT_CTX)) {
        result.push({ value: DEFAULT_CTX, color: 'toolbar', icon: 'icon_tabs' })
      }

      for (let container of Object.values(State.containers)) {
        let boundPanel = State.panels.find(p => {
          return p.id !== this.conf.id && p.moveTabCtx === container.id
        })
        if (boundPanel) continue
        result.push({
          value: container.id,
          color: container.color,
          icon: container.icon,
          tooltip: container.name,
        })
      }

      result.push({ value: 'none', color: 'inactive', icon: 'icon_none' })

      return result
    },

    panelContainerNote() {
      if (this.conf.cookieStoreId) return 'settings.panel_container_note'
      return 'settings.panel_container_note_unset'
    },

    name() {
      return this.conf.name || ''
    },

    icon() {
      return this.conf.icon || 'icon_tabs'
    },

    color() {
      return this.conf.color || 'toolbar'
    },

    newTabCtx() {
      return this.conf.newTabCtx || 'none'
    },

    dropTabCtx() {
      return this.conf.dropTabCtx || 'none'
    },

    moveTabCtx() {
      return this.conf.moveTabCtx || 'none'
    },

    urlRulesValid() {
      if (this.conf.urlRules.length > 1) return 'valid'
      else return ''
    },
  },

  mounted() {
    this.init()
  },

  methods: {
    onWheel(e) {
      let scrollOffset = this.$el.scrollTop
      let maxScrollOffset = this.$el.scrollHeight - this.$el.offsetHeight
      if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
      if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
    },

    onNameInput(value) {
      this.conf.name = value
      if (value) Actions.savePanelsDebounced()
    },

    setIcon(value) {
      this.conf.icon = value
      Actions.savePanels()
    },

    setColor(value) {
      this.conf.color = value
      Actions.savePanels()
    },

    onCustomIconInput(value) {
      this.conf.customIconSrc = value
    },

    updateCustomIcon() {
      let normValue = this.conf.customIconSrc.trim()

      if (!normValue) {
        this.customIconType = ''
        this.customIconUrl = ''
        this.conf.customIcon = ''
        return Actions.savePanels()
      }

      if (normValue.startsWith('data:image')) {
        this.customIconType = 'base64'
        this.customIconUrl = normValue
        this.conf.customIcon = normValue
        return Actions.savePanels()
      }

      if (URL_RE.test(normValue)) {
        this.customIconType = 'url'
        this.customIconUrl = ''
        return
      }

      this.customIconType = 'char'
      this.customIconUrl = ''
      return this.drawTextIcon()
    },

    onCustomIconLoad(event) {
      if (!this.customIconUrl) return
      if (this.customIconUrl.startsWith('data:image')) return

      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      canvas.width = event.target.naturalWidth
      canvas.height = event.target.naturalHeight
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(event.target, 0, 0, event.target.naturalWidth, event.target.naturalHeight)
      let base64 = canvas.toDataURL('image/png')

      this.conf.customIcon = base64
      Actions.savePanels()
    },

    drawTextIcon() {
      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')

      let [txt, color, font] = this.conf.customIconSrc.split('::')
      if (!color) {
        if (State.style === 'light') color = '#000000'
        if (State.style === 'dark') color = '#ffffff'
      }
      if (!font) {
        font = '32px sans-serif'
      }

      canvas.width = 32
      canvas.height = 32
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = color
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.font = font
      ctx.fillText(txt, 16, 16, 32)

      let base64 = canvas.toDataURL('image/png')

      this.customIconUrl = base64
      this.conf.customIcon = base64
      Actions.savePanels()
    },

    loadCustomIcon() {
      this.customIconUrl = this.conf.customIconSrc.trim()
    },

    async init() {
      await this.$nextTick()
      if (this.conf.customIcon) this.customIconUrl = this.conf.customIcon
      if (this.$refs.name) this.$refs.name.recalcTextHeight()
      if (this.$refs.urlRulesInput) this.$refs.urlRulesInput.recalcTextHeight()
    },

    togglePanelLock() {
      this.conf.lockedPanel = !this.conf.lockedPanel
      Actions.savePanels()
    },

    toggleTabsLock() {
      this.conf.lockedTabs = !this.conf.lockedTabs
      Actions.savePanels()
    },

    toggleSkipOnSwitching() {
      this.conf.skipOnSwitching = !this.conf.skipOnSwitching
      Actions.savePanels()
    },

    async togglePanelNoEmpty() {
      this.conf.noEmpty = !this.conf.noEmpty
      Actions.savePanels()
    },

    togglePanelNewTabCtx(value) {
      this.conf.newTabCtx = value
      Actions.savePanels()
    },

    togglePanelDropTabCtx(value) {
      this.conf.dropTabCtx = value
      Actions.savePanels()
    },

    togglePanelMoveTabCtx(value) {
      this.conf.moveTabCtx = value
      Actions.savePanels()
    },

    togglePanelMoveTabCtxNoChild(value) {
      this.conf.moveTabCtxNoChild = value
      Actions.savePanels()
    },

    async toggleUrlRules() {
      if (!this.conf.urlRulesActive) {
        if (!State.permAllUrls) {
          window.location.hash = 'all-urls'
          State.selectedPanel = null
          return
        }
      }

      this.conf.urlRulesActive = !this.conf.urlRulesActive
      Actions.savePanels()

      await this.$nextTick()

      if (this.$refs.urlRulesInput) this.$refs.urlRulesInput.focus()
    },

    onUrlRulesInput(value) {
      this.conf.urlRules = value
      Actions.savePanelsDebounced()
    },
  },
}
</script>
