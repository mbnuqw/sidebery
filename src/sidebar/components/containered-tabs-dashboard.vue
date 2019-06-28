<template lang="pug">
.ContainerDashboard(v-noise:300.g:12:af.a:0:42.s:0:9="")
  text-input.title(
    ref="name"
    v-debounce.250="updateName"
    :value="name"
    :or="t('container_dashboard.name_placeholder')"
    @input="onNameInput"
    @keydown.enter.prevent="onEnter")

  scroll-box.scroll-box(v-if="id" ref="scrollBox"): .scoll-wrapper
    icon-select-field.-no-top-margin(
      label="container_dashboard.icon_label"
      :value="icon"
      :opts="iconOpts"
      :optFill="color"
      @input="updateIcon")

    color-select-field(
      label="container_dashboard.color_label"
      :value="color"
      :opts="colorOpts"
      @input="updateColor")

    toggle-field(
      label="dashboard.lock_panel_label"
      :title="t('dashboard.lock_panel_tooltip')"
      :value="conf.lockedPanel"
      :inline="true"
      @input="togglePanelLock")

    toggle-field(
      label="dashboard.lock_tabs_label"
      :title="t('dashboard.lock_tabs_tooltip')"
      :value="conf.lockedTabs"
      :inline="true"
      @input="toggleTabsLock")

    toggle-field(
      label="dashboard.no_empty_label"
      :title="t('dashboard.no_empty_tooltip')"
      :value="conf.noEmpty"
      :inline="true"
      @input="togglePanelNoEmpty")

    toggle-field(
      label="container_dashboard.rules_include"
      :title="t('container_dashboard.rules_include_tooltip')"
      :value="conf.includeHostsActive"
      :inline="true"
      @input="toggleIncludeHosts")
    .box(v-if="conf.includeHostsActive")
      .field
        text-input.text(
          ref="includeHostsInput"
          or="---"
          v-debounce:input.500="onIncludeHostsChange"
          :value="conf.includeHosts"
          :valid="includeHostsValid"
          @input="onIncludeHostsInput")

    toggle-field(
      label="container_dashboard.rules_exclude"
      :title="t('container_dashboard.rules_exclude_tooltip')"
      :value="conf.excludeHostsActive"
      :inline="true"
      @input="toggleExcludeHosts")
    .box(v-if="id && conf.excludeHostsActive")
      .field
        text-input.text(
          ref="excludeHostsInput"
          or="---"
          v-debounce:input.500="onExcludeHostsChange"
          :value="conf.excludeHosts"
          :valid="excludeHostsValid"
          @input="onExcludeHostsInput")

    select-field(
      label="container_dashboard.proxy_label"
      optLabel="container_dashboard.proxy_"
      noneOpt="direct"
      :value="proxied"
      :opts="proxyOpts"
      @input="switchProxy")

    .box(v-if="proxied !== 'direct'")
      .field
        text-input.text(
          ref="proxyHost"
          :or="t('container_dashboard.proxy_host_placeholder')"
          :line="true"
          :value="proxyHost"
          :valid="proxyHostValid"
          @input="onProxyHostInput"
          @keydown="onFieldKeydown($event, 'proxyPort', 'name')")

      .field
        text-input.text(
          ref="proxyPort"
          :or="t('container_dashboard.proxy_port_placeholder')"
          :line="true"
          :value="proxyPort"
          :valid="proxyPortValid"
          @input="onProxyPortInput"
          @keydown="onFieldKeydown($event, 'proxyUsername', 'proxyHost')")

      .field(v-if="proxied === 'socks'")
        text-input.text(
          ref="proxyUsername"
          valid="fine"
          :or="t('container_dashboard.proxy_username_placeholder')"
          :line="true"
          :value="proxyUsername"
          @input="onProxyUsernameInput"
          @keydown="onFieldKeydown($event, 'proxyPassword', 'proxyPort')")

      .field(v-if="proxied === 'socks' && proxyUsername")
        text-input.text(
          ref="proxyPassword"
          valid="fine"
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

  .delimiter(v-if="id")

  .options(v-if="id")
    .opt(v-if="tabsCount" @click="dedupTabs") {{t('tabs_dashboard.dedup_tabs')}}
    .opt(v-if="tabsCount" @click="reloadAllTabs") {{t('tabs_dashboard.reload_all_tabs')}}
    .opt(v-if="tabsCount" @click="closeAllTabs") {{t('tabs_dashboard.close_all_tabs')}}
    .opt.-warn(@click="remove") {{t('tabs_dashboard.delete_container')}}
</template>


<script>
import TextInput from '../../components/text-input'
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import IconSelectField from '../../components/icon-select-field'
import ColorSelectField from '../../components/color-select-field'
import State from '../store/state'
import Actions from '../actions'
import ScrollBox from './scroll-box'

const HOSTS_RULE_RE = /^.+$/m
const PROXY_HOST_RE = /^.{3,65536}$/
const PROXY_PORT_RE = /^\d{2,5}$/

export default {
  name: 'ContainerDashboard',

  components: {
    TextInput,
    ScrollBox,
    ToggleField,
    SelectField,
    IconSelectField,
    ColorSelectField,
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
        'fingerprint',
        'briefcase',
        'dollar',
        'cart',
        'circle',
        'gift',
        'vacation',
        'food',
        'fruit',
        'pet',
        'tree',
        'chill',
      ],
      colorOpts: [
        'blue',
        'turquoise',
        'green',
        'yellow',
        'orange',
        'red',
        'pink',
        'purple',
      ],
      proxyOpts: ['http', 'https', 'socks4', 'socks', 'direct'],
    }
  },

  computed: {
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

  watch: {
    index(index) {
      this.init()
      if (index === -1) this.$refs.name.focus()
    }
  },

  mounted() {
    this.init()
    this.$refs.name.focus()
  },

  methods: {
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

      // Create new container or update
      if (!this.id) this.createNew()
      else {
        Actions.createSnapLayer(this.id, 'name', this.name)
        this.updateContainer()
      }
    },

    async updateIcon(icon) {
      if (this.conf.icon !== icon) {
        Actions.createSnapLayer(this.id, 'icon', icon)
      }

      this.conf.icon = icon
      this.updateContainer()
    },

    async updateColor(color) {
      if (this.conf.color !== color) {
        Actions.createSnapLayer(this.id, 'color', color)
      }

      this.conf.color = color
      this.updateContainer()
    },

    async createNew() {
      const details = {
        name: this.name,
        color: this.color,
        icon: this.icon,
      }
      return await browser.contextualIdentities.create(details)
    },

    dedupTabs() {
      if (!this.conf.tabs || this.conf.tabs.length === 0) return
      const toClose = []
      this.conf.tabs.map((t, i) => {
        for (let j = i + 1; j < this.conf.tabs.length; j++) {
          if (this.conf.tabs[j].url === t.url) toClose.push(this.conf.tabs[j].id)
        }
      })
      browser.tabs.remove(toClose)
      this.$emit('close')
    },

    reloadAllTabs() {
      if (!this.conf.tabs || this.conf.tabs.length === 0) return
      this.conf.tabs.map(t => browser.tabs.reload(t.id))
      this.$emit('close')
    },

    closeAllTabs() {
      if (!this.conf.tabs || this.conf.tabs.length === 0) return
      browser.tabs.remove(this.conf.tabs.map(t => t.id))
      this.$emit('close')
    },

    async remove() {
      if (!this.id) return
      browser.contextualIdentities.remove(this.id)
      this.$emit('close')
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
        const panel = State.panelsMap[this.id]
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
          Actions.openSettings('all-urls')
          this.switchProxy('direct')
          return
        }
      }

      this.conf.includeHostsActive = !this.conf.includeHostsActive
      Actions.savePanels()
      Actions.updateReqHandler()
      await this.$nextTick()

      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
      if (this.$refs.includeHostsInput) this.$refs.includeHostsInput.focus()
    },

    onIncludeHostsInput(value) {
      this.conf.includeHosts = value
      Actions.updateReqHandlerDebounced()
    },

    onIncludeHostsChange() {
      Actions.savePanels()
    },

    async toggleExcludeHosts() {
      if (!this.conf.excludeHostsActive) {
        if (!State.permAllUrls) {
          Actions.openSettings('all-urls')
          this.switchProxy('direct')
          return
        }
      }

      this.conf.excludeHostsActive = !this.conf.excludeHostsActive
      Actions.savePanels()
      Actions.updateReqHandler()
      await this.$nextTick()
      
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
      if (this.$refs.excludeHostsInput) this.$refs.excludeHostsInput.focus()
    },

    onExcludeHostsInput(value) {
      this.conf.excludeHosts = value
      Actions.updateReqHandlerDebounced()
    },

    onExcludeHostsChange() {
      Actions.savePanels()
    },

    async switchProxy(type) {
      // Check permissions
      if (type !== 'direct') {
        if (!State.permAllUrls) {
          Actions.openSettings('all-urls')
          this.switchProxy('direct')
          return
        }
      }

      const panel = State.panelsMap[this.id]
      if (!panel || !panel.tabs) return

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
      Actions.updateReqHandler()

      await this.$nextTick()
      
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
    },

    onProxyHostInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.host = value
      this.conf.proxified = this.proxyHostValid && this.proxyPortValid

      Actions.savePanelsDebounced()
      if (this.proxyHostValid) Actions.updateReqHandlerDebounced()
    },

    onProxyPortInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.port = value
      this.conf.proxified = this.proxyHostValid && this.proxyPortValid

      Actions.savePanelsDebounced()
      if (this.proxyPortValid) Actions.updateReqHandlerDebounced()
    },

    onProxyUsernameInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.username = value

      Actions.savePanelsDebounced()
      Actions.updateReqHandlerDebounced()
      
    },

    onProxyPasswordInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.password = value

      Actions.savePanelsDebounced()
      Actions.updateReqHandlerDebounced()
    },

    toggleProxyDns() {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.proxyDNS = !this.conf.proxy.proxyDNS

      Actions.savePanels()
      Actions.updateReqHandler()
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
