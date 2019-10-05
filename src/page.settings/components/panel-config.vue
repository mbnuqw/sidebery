<template lang="pug">
.PanelConfig(v-noise:300.g:12:af.a:0:42.s:0:9="" @wheel="onWheel")
  h2(v-if="isBookmarks") {{t('bookmarks_dashboard.title')}}
  h2(v-if="isDefault") {{conf.name}}
  text-input.title(
    v-if="isContainer"
    ref="name"
    v-debounce.250="updateName"
    :value="name"
    :or="t('container_dashboard.name_placeholder')"
    @input="onNameInput"
    @keydown.enter.prevent="onEnter")

  select-field.-no-separator(
    v-if="isContainer"
    label="container_dashboard.icon_label"
    :value="icon"
    :opts="iconOpts"
    :color="color"
    @input="updateIcon")

  select-field(
    v-if="isContainer"
    label="container_dashboard.color_label"
    :value="color"
    :opts="colorOpts"
    :icon="icon"
    @input="updateColor")

  toggle-field(
    v-if="isBookmarks || isDefault || isContainer"
    label="dashboard.lock_panel_label"
    :title="t('dashboard.lock_panel_tooltip')"
    :value="conf.lockedPanel"
    :inline="true"
    @input="togglePanelLock")

  toggle-field(
    v-if="isDefault || isContainer"
    label="dashboard.lock_tabs_label"
    :title="t('dashboard.lock_tabs_tooltip')"
    :value="conf.lockedTabs"
    :inline="true"
    @input="toggleTabsLock")

  toggle-field(
    v-if="isDefault || isContainer"
    label="dashboard.no_empty_label"
    :title="t('dashboard.no_empty_tooltip')"
    :value="conf.noEmpty"
    :inline="true"
    @input="togglePanelNoEmpty")

  toggle-field(
    v-if="isContainer"
    label="container_dashboard.rules_include"
    :title="t('container_dashboard.rules_include_tooltip')"
    :value="conf.includeHostsActive"
    :inline="true"
    @input="toggleIncludeHosts")
  .sub-fields(v-if="isContainer && conf.includeHostsActive")
    .field
      text-input.text(
        ref="includeHostsInput"
        or="---"
        v-debounce:input.500="onIncludeHostsChange"
        :value="conf.includeHosts"
        :valid="includeHostsValid"
        @input="onIncludeHostsInput")

  toggle-field(
    v-if="isContainer"
    label="container_dashboard.rules_exclude"
    :title="t('container_dashboard.rules_exclude_tooltip')"
    :value="conf.excludeHostsActive"
    :inline="true"
    @input="toggleExcludeHosts")
  .sub-fields(v-if="isContainer && conf.excludeHostsActive")
    .field
      text-input.text(
        ref="excludeHostsInput"
        or="---"
        v-debounce:input.500="onExcludeHostsChange"
        :value="conf.excludeHosts"
        :valid="excludeHostsValid"
        @input="onExcludeHostsInput")

  select-field(
    v-if="isContainer"
    label="container_dashboard.proxy_label"
    optLabel="container_dashboard.proxy_"
    noneOpt="direct"
    :value="proxied"
    :opts="proxyOpts"
    @input="switchProxy")
  .sub-fields(v-if="isContainer && proxied !== 'direct'")
    text-field(
      ref="proxyHost"
      label="Host"
      :or="t('container_dashboard.proxy_host_placeholder')"
      :line="true"
      :value="proxyHost"
      :valid="proxyHostValid"
      @input="onProxyHostInput"
      @keydown="onFieldKeydown($event, 'proxyPort', 'name')")
    text-field(
      ref="proxyPort"
      label="Port"
      :or="t('container_dashboard.proxy_port_placeholder')"
      :line="true"
      :value="proxyPort"
      :valid="proxyPortValid"
      @input="onProxyPortInput"
      @keydown="onFieldKeydown($event, 'proxyUsername', 'proxyHost')")
    text-field(
      ref="proxyUsername"
      label="Username"
      :or="t('container_dashboard.proxy_username_placeholder')"
      :line="true"
      :value="proxyUsername"
      @input="onProxyUsernameInput"
      @keydown="onFieldKeydown($event, 'proxyPassword', 'proxyPort')")
    text-field(
      ref="proxyPassword"
      label="Password"
      :or="t('container_dashboard.proxy_password_placeholder')"
      :line="true"
      :value="proxyPassword"
      :password="true"
      @input="onProxyPasswordInput"
      @keydown="onFieldKeydown($event, null, 'proxyUsername')")
    toggle-field(
      v-if="isSomeSocks"
      label="container_dashboard.proxy_dns_label"
      :value="proxyDNS"
      :inline="true"
      @input="toggleProxyDns")
</template>


<script>
import TextInput from '../../components/text-input'
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import TextField from '../../components/text-field'
import State from '../store/state'
import Actions from '../actions'

const HOSTS_RULE_RE = /^.+$/m
const PROXY_HOST_RE = /^.{3,65536}$/
const PROXY_PORT_RE = /^\d{2,5}$/

export default {
  name: 'ContainerDashboard',

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
      proxyOpts: ['http', 'https', 'socks4', 'socks', 'direct'],
    }
  },

  computed: {
    isBookmarks() {
      return this.conf.type === 'bookmarks'
    },

    isDefault() {
      return this.conf.type === 'default'
    },

    isContainer() {
      return this.conf.type === 'ctx'
    },

    id() {
      return this.conf.cookieStoreId || ''
    },

    name() {
      return this.conf.name || ''
    },

    icon() {
      return this.conf.icon || 'fingerprint'
    },

    color() {
      return this.conf.color || 'blue'
    },

    tabsCount() {
      if (!this.id) return 0
      if (!State.panels[this.index] || !State.panels[this.index].tabs) return 0
      return State.panels[this.index].tabs.length
    },

    proxied() {
      if (!this.conf.proxy) return 'direct'
      return this.conf.proxy.type
    },

    isSomeSocks() {
      return this.proxied === 'socks' || this.proxied === 'socks4'
    },

    includeHostsValid() {
      return HOSTS_RULE_RE.test(this.conf.includeHosts)
    },

    excludeHostsValid() {
      return HOSTS_RULE_RE.test(this.conf.excludeHosts)
    },

    proxyHost() {
      if (!this.id || !this.conf.proxy) return ''
      return this.conf.proxy.host
    },

    proxyPort() {
      if (!this.id || !this.conf.proxy) return ''
      return this.conf.proxy.port
    },

    proxyHostValid() {
      return PROXY_HOST_RE.test(this.proxyHost)
    },

    proxyPortValid() {
      return PROXY_PORT_RE.test(this.proxyPort)
    },

    proxyUsername() {
      if (!this.id || !this.conf.proxy) return ''
      return this.conf.proxy.username
    },

    proxyPassword() {
      if (!this.id || !this.conf.proxy) return ''
      return this.conf.proxy.password
    },

    proxyDNS() {
      if (!this.id || !this.conf.proxy) return false
      return this.conf.proxy.proxyDNS
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

    onEnter() {
      this.$emit('close')
    },

    onNameInput(value) {
      this.conf.name = value
    },

    open() {
      this.init()
      if (this.$refs.name) this.$refs.name.focus()
      
      if (this.$refs.includeHostsInput) {
        this.$refs.includeHostsInput.recalcTextHeight()
      }
      if (this.$refs.excludeHostsInput) {
        this.$refs.excludeHostsInput.recalcTextHeight()
      }
    },

    async updateContainer() {
      if (!this.name || !this.id) return
      await browser.contextualIdentities.update(this.id, {
        name: this.name,
        icon: this.icon,
        color: this.color,
      })
    },

    updateName() {
      if (!this.name) return
      this.updateContainer()
    },

    async updateIcon(icon) {
      this.conf.icon = icon
      this.updateContainer()
    },

    async updateColor(color) {
      this.conf.color = color
      this.updateContainer()
    },

    async init() {
      await this.$nextTick()
      if (this.$refs.name) this.$refs.name.recalcTextHeight()
      if (this.$refs.includeHostsInput) {
        this.$refs.includeHostsInput.recalcTextHeight()
      }
      if (this.$refs.excludeHostsInput) {
        this.$refs.excludeHostsInput.recalcTextHeight()
      }
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
    },

    togglePanelLock() {
      this.conf.lockedPanel = !this.conf.lockedPanel
      Actions.savePanels()
    },

    toggleTabsLock() {
      this.conf.lockedTabs = !this.conf.lockedTabs
      Actions.savePanels()
    },

    async togglePanelNoEmpty() {
      this.conf.noEmpty = !this.conf.noEmpty
      if (this.conf.noEmpty) {
        let panel = State.panels.find(p => p.cookieStoreId === this.id)
        if (panel && panel.tabs && !panel.tabs.length) {
          await browser.tabs.create({
            windowId: State.windowId,
            index: panel.startIndex,
            cookieStoreId: panel.cookieStoreId,
            active: true,
          })
        }
      }
      Actions.savePanels()
    },

    async toggleIncludeHosts() {
      if (!this.conf.includeHostsActive) {
        if (!State.permAllUrls) {
          window.location.hash = 'all-urls'
          State.selectedPanel = null
          this.switchProxy('direct')
          return
        }
      }

      this.conf.includeHostsActive = !this.conf.includeHostsActive
      Actions.savePanels()
      await this.$nextTick()

      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
      if (this.$refs.includeHostsInput) this.$refs.includeHostsInput.focus()
    },

    onIncludeHostsInput(value) {
      this.conf.includeHosts = value
    },

    onIncludeHostsChange() {
      Actions.savePanels()
    },

    async toggleExcludeHosts() {
      if (!this.conf.excludeHostsActive) {
        if (!State.permAllUrls) {
          window.location.hash = 'all-urls'
          State.selectedPanel = null
          this.switchProxy('direct')
          return
        }
      }

      this.conf.excludeHostsActive = !this.conf.excludeHostsActive
      Actions.savePanels()
      await this.$nextTick()
      
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
      if (this.$refs.excludeHostsInput) this.$refs.excludeHostsInput.focus()
    },

    onExcludeHostsInput(value) {
      this.conf.excludeHosts = value
    },

    onExcludeHostsChange() {
      Actions.savePanels()
    },

    async switchProxy(type) {
      // Check permissions
      if (type !== 'direct') {
        if (!State.permAllUrls) {
          window.location.hash = 'all-urls'
          State.selectedPanel = null
          this.switchProxy('direct')
          return
        }
      }

      const panel = State.panels.find(p => p.cookieStoreId === this.id)
      if (!panel) return

      this.conf.proxy = {
        type,
        host: this.proxyHost,
        port: this.proxyPort,
        username: this.proxyUsername,
        password: this.proxyPassword,
        proxyDNS: this.proxyDNS,
      }

      if (type === 'direct') this.conf.proxified = false
      else this.conf.proxified = this.proxyHostValid && this.proxyPortValid

      Actions.savePanels()

      await this.$nextTick()
      
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
    },

    onProxyHostInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.host = value
      this.conf.proxified = this.proxyHostValid && this.proxyPortValid

      Actions.savePanelsDebounced()
    },

    onProxyPortInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.port = value
      this.conf.proxified = this.proxyHostValid && this.proxyPortValid

      Actions.savePanelsDebounced()
    },

    onProxyUsernameInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.username = value

      Actions.savePanelsDebounced()
    },

    onProxyPasswordInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.password = value

      Actions.savePanelsDebounced()
    },

    toggleProxyDns() {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.proxyDNS = !this.conf.proxy.proxyDNS

      Actions.savePanels()
    },

    onFieldKeydown(e, nextFieldName, prevFieldName) {
      if (e.code === 'Enter' || e.code === 'Tab') {
        if (e.shiftKey) {
          if (this.$refs[prevFieldName]) this.$refs[prevFieldName].focus()
        } else {
          if (this.$refs[nextFieldName]) this.$refs[nextFieldName].focus()
        }
        e.preventDefault()
      }
    },
  },
}
</script>
