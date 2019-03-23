<template lang="pug">
.ContainerMenu(v-noise:300.g:12:af.a:0:42.s:0:9="")
  text-input.title(
    ref="name"
    v-debounce.250="updateName"
    v-model="name"
    :or="t('container_dashboard.name_placeholder')"
    @input="onInput"
    @keydown.enter.prevent="onEnter")

  scroll-box.scroll-box(ref="scrollBox"): .scoll-wrapper
    icon-select-field.-no-top-margin(
      v-if="id"
      label="container_dashboard.icon_label"
      :value="icon"
      :opts="iconOpts"
      :optFill="colorCode"
      @input="updateIcon")

    color-select-field(
      v-if="id"
      label="container_dashboard.color_label"
      :value="color"
      :opts="colorOpts"
      @input="updateColor")

    toggle-field(
      v-if="id"
      label="dashboard.sync_label"
      :value="conf.sync"
      :inline="true"
      @input="toggleSync")

    toggle-field(
      v-if="id"
      label="dashboard.lock_panel_label"
      :title="t('dashboard.lock_panel_tooltip')"
      :value="conf.lockedPanel"
      :inline="true"
      @input="togglePanelLock")

    toggle-field(
      v-if="id"
      label="dashboard.lock_tabs_label"
      :title="t('dashboard.lock_tabs_tooltip')"
      :value="conf.lockedTabs"
      :inline="true"
      @input="toggleTabsLock")

    toggle-field(
      v-if="id"
      label="dashboard.no_empty_label"
      :title="t('dashboard.no_empty_tooltip')"
      :value="conf.noEmpty"
      :inline="true"
      @input="togglePanelNoEmpty")

    toggle-field(
      v-if="id"
      label="container_dashboard.rules_include"
      :value="conf.includeHostsActive"
      :inline="true"
      @input="toggleIncludeHosts")
    .box(v-if="id && conf.includeHostsActive")
      .field
        text-input.text(
          ref="includeHostsInput"
          or="---"
          v-debounce:input.500="onIncludeHostsChange"
          :value="conf.includeHosts"
          :valid="includeHostsValid"
          @input="onIncludeHostsInput")

    toggle-field(
      v-if="id"
      label="container_dashboard.rules_exclude"
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
      v-if="id"
      label="container_dashboard.proxy_label"
      optLabel="container_dashboard.proxy_"
      noneOpt="direct"
      :value="proxied"
      :opts="proxyOpts"
      @input="switchProxy")

    .box(v-if="id && proxied !== 'direct'")
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
        v-if="id && isSomeSocks"
        label="container_dashboard.proxy_dns_label"
        :value="proxyDNS"
        :inline="true"
        @input="toggleProxyDns")

  .delimiter(v-if="id")

  .options
    .opt(v-if="tabsCount", @click="dedupTabs") {{t('tabs_dashboard.dedup_tabs')}}
    .opt(v-if="tabsCount", @click="reloadAllTabs") {{t('tabs_dashboard.reload_all_tabs')}}
    .opt(v-if="tabsCount", @click="closeAllTabs") {{t('tabs_dashboard.close_all_tabs')}}
    .opt.-warn(v-if="id", @click="remove") {{t('tabs_dashboard.delete_container')}}
</template>


<script>
import { mapGetters } from 'vuex'
import Store from '../../store'
import TextInput from '../inputs/text'
import ScrollBox from '../scroll-box'
import ToggleField from '../fields/toggle'
import SelectField from '../fields/select'
import IconSelectField from '../fields/select-icon'
import ColorSelectField from '../fields/select-color'

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
      id: '',
      name: '',
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
      icon: 'fingerprint',
      colorOpts: [
        { color: 'blue', colorCode: '#37adff' },
        { color: 'turquoise', colorCode: '#00c79a' },
        { color: 'green', colorCode: '#51cd00' },
        { color: 'yellow', colorCode: '#ffcb00' },
        { color: 'orange', colorCode: '#ff9f00' },
        { color: 'red', colorCode: '#ff613d' },
        { color: 'pink', colorCode: '#ff4bda' },
        { color: 'purple', colorCode: '#af51f5' },
      ],
      color: 'blue',
      proxyOpts: ['http', 'https', 'socks4', 'socks', 'direct'],
    }
  },

  computed: {
    ...mapGetters(['panels']),

    colorCode() {
      const colorOption = this.colorOpts.find(c => c.color === this.color)
      if (colorOption) return colorOption.colorCode
      else return this.colorOpts[0].colorCode
    },

    tabsCount() {
      if (!this.id) return 0
      if (!this.panels[this.index] || !this.panels[this.index].tabs) return 0
      return this.panels[this.index].tabs.length
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

  created() {
    this.init()
  },

  methods: {
    onEnter() {
      this.$emit('close')
    },

    onInput() {
      this.$emit('height')
    },

    async open() {
      this.init()
      if (this.$refs.name) this.$refs.name.focus()
      this.$emit('height')
      if (this.$refs.includeHostsInput) {
        this.$refs.includeHostsInput.recalcTextHeight()
      }
      if (this.$refs.excludeHostsInput) {
        this.$refs.excludeHostsInput.recalcTextHeight()
      }
    },

    async update() {
      if (!this.name || !this.id) return
      await browser.contextualIdentities.update(this.id, {
        name: this.name,
        icon: this.icon,
        color: this.color,
      })
    },

    async updateName() {
      // Create new container
      if (this.name && !this.id) {
        let ctx = await this.createNew()
        this.id = ctx.cookieStoreId
        this.$emit('height')
        return
      }

      // Or update
      await this.update()

      // Check if we have some updates
      // for container with this name
      Store.dispatch('resyncPanels')
    },

    async updateIcon(icon) {
      this.icon = icon
      this.update()
    },

    async updateColor(color) {
      this.color = color
      this.update()
    },

    async createNew() {
      const details = {
        name: this.name,
        color: this.color,
        icon: this.icon,
      }
      return await Store.dispatch('createContext', details)
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
      // Edit existing tabs container
      if (this.conf.cookieStoreId) {
        this.id = this.conf.cookieStoreId
        this.name = this.conf.name
        this.color = this.conf.color
        this.icon = this.conf.icon
      }

      // Create new tabs container
      if (!this.conf.cookieStoreId && this.conf.new) {
        this.id = ''
        this.name = ''
        this.icon = 'fingerprint'
        this.color = 'blue'
      }

      await this.$nextTick()
      if (this.$refs.name) this.$refs.name.recalcTextHeight()
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
    },

    toggleSync() {
      this.conf.sync = !this.conf.sync
      Store.dispatch('resyncPanels')
      Store.dispatch('saveContainers')
    },

    togglePanelLock() {
      this.conf.lockedPanel = !this.conf.lockedPanel
      Store.dispatch('saveContainers')
    },

    toggleTabsLock() {
      this.conf.lockedTabs = !this.conf.lockedTabs
      Store.dispatch('saveContainers')
    },

    async togglePanelNoEmpty() {
      this.conf.noEmpty = !this.conf.noEmpty
      if (this.conf.noEmpty) {
        const panel = Store.getters.panels.find(p => p.cookieStoreId === this.id)
        if (panel && panel.tabs && !panel.tabs.length) {
          await browser.tabs.create({
            index: panel.startIndex,
            cookieStoreId: panel.cookieStoreId,
            active: true,
          })
        }
      }
      Store.dispatch('saveContainers')
    },

    async toggleIncludeHosts() {
      if (!this.conf.includeHostsActive) {
        const permitted = await browser.permissions.contains({ origins: ['<all_urls>'] })
        if (!permitted) {
          const permUrl = browser.runtime.getURL('permissions/all-urls.html')
          this.$emit('close')
          this.switchProxy('direct')
          browser.tabs.create({ url: permUrl })
          return
        }
      }

      this.conf.includeHostsActive = !this.conf.includeHostsActive
      Store.dispatch('saveContainers')
      Store.dispatch('updateReqHandler')
      await this.$nextTick()
      this.$emit('height')
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
      if (this.$refs.includeHostsInput) this.$refs.includeHostsInput.focus()
    },

    onIncludeHostsInput(value) {
      this.conf.includeHosts = value
      Store.dispatch('updateReqHandlerDebounced')
    },

    onIncludeHostsChange() {
      Store.dispatch('saveContainers')
    },

    async toggleExcludeHosts() {
      if (!this.conf.excludeHostsActive) {
        const permitted = await browser.permissions.contains({ origins: ['<all_urls>'] })
        if (!permitted) {
          const permUrl = browser.runtime.getURL('permissions/all-urls.html')
          this.$emit('close')
          this.switchProxy('direct')
          browser.tabs.create({ url: permUrl })
          return
        }
      }

      this.conf.excludeHostsActive = !this.conf.excludeHostsActive
      Store.dispatch('saveContainers')
      Store.dispatch('updateReqHandler')
      await this.$nextTick()
      this.$emit('height')
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
      if (this.$refs.excludeHostsInput) this.$refs.excludeHostsInput.focus()
    },

    onExcludeHostsInput(value) {
      this.conf.excludeHosts = value
      Store.dispatch('updateReqHandlerDebounced')
    },

    onExcludeHostsChange() {
      Store.dispatch('saveContainers')
    },

    async switchProxy(type) {
      // Check permissions
      if (type !== 'direct') {
        const permitted = await browser.permissions.contains({ origins: ['<all_urls>'] })
        if (!permitted) {
          this.$emit('close')
          this.switchProxy('direct')
          browser.tabs.create({
            url: browser.runtime.getURL('permissions/all-urls.html'),
          })
          return
        }
      }

      const panel = this.panels.find(p => p.id === this.id)
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

      Store.dispatch('saveContainers')
      Store.dispatch('updateReqHandler')

      await this.$nextTick()
      this.$emit('height')
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
    },

    onProxyHostInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.host = value
      this.conf.proxified = this.proxyHostValid && this.proxyPortValid

      Store.dispatch('saveContainersDebounced')
      if (this.proxyHostValid) Store.dispatch('updateReqHandlerDebounced')
    },

    onProxyPortInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.port = value
      this.conf.proxified = this.proxyHostValid && this.proxyPortValid

      Store.dispatch('saveContainersDebounced')
      if (this.proxyPortValid) Store.dispatch('updateReqHandlerDebounced')
    },

    onProxyUsernameInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.username = value

      Store.dispatch('saveContainersDebounced')
      Store.dispatch('updateReqHandlerDebounced')
      this.$emit('height')
    },

    onProxyPasswordInput(value) {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.password = value

      Store.dispatch('saveContainersDebounced')
      Store.dispatch('updateReqHandlerDebounced')
    },

    toggleProxyDns() {
      if (!this.id || !this.conf.proxy) return
      this.conf.proxy.proxyDNS = !this.conf.proxy.proxyDNS

      Store.dispatch('saveContainers')
      Store.dispatch('updateReqHandler')
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


<style lang="stylus">
@import '../../../styles/mixins'

.ContainerMenu
  box(flex)
  flex-direction: column

.ContainerMenu > .title
  text(s: rem(24), w: 400)
  color: var(--title-fg)
  margin: 16px 12px 12px

.ContainerMenu .scoll-wrapper
  box(relative, grid)
  grid-gap: 3px 0
  padding: 1px 0 0

.ContainerMenu .box
  box(relative)
  padding: 0 0 0 8px

.ContainerMenu .scroll-box
  size(max-h: calc(100vh - 200px))
  flex-grow: 1
  flex-shrink: 1

.ContainerMenu .field
  box(relative)
  margin: 0 16px

.ContainerMenu .field > .input
  box(relative, flex)
  flex-wrap: wrap

// Option icon
.ContainerMenu .input > .icon
  box(relative, flex)
  size(26px, same)
  justify-content: center
  align-items: center
  margin: 0
  opacity: .5
  border-radius: 3px
  filter: grayscale(0.5)
  &:hover
    opacity: .7
  &[data-on]
    opacity: 1
    filter: grayscale(0)
  
  > svg
    box(absolute)
    size(16px, same)
    transition: opacity var(--d-fast)

.ContainerMenu .field > .text
  text(s: rem(14))
  margin: 2px 0 0
  transition: color 1s
  > input
  > textarea
    padding: 0 0 2px
    color: var(--false-fg)
  &[valid] > input
  &[valid] > textarea
    color: var(--true-fg)
  &[valid="fine"] > input
  &[valid="fine"] > textarea
    color: var(--active-fg)
  > .placeholder
    padding: 0 0 2px
    color: var(--label-fg)
</style>
