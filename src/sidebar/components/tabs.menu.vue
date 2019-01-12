<template lang="pug">
.Menu(v-noise:300.g:12:af.a:0:42.s:0:9="")
  text-input.title(
    ref="name"
    v-debounce.250="updateName"
    v-model="name"
    :or="t('tabs_menu.name_placeholder')"
    @input="onInput"
    @keydown.enter.prevent="onEnter")

  scroll-box.scroll-box(ref="scrollBox"): .scoll-wrapper
    icon-select-field.-no-top-margin(
      label="tabs_menu.icon_label"
      :value="icon"
      :opts="iconOpts"
      :optFill="colorCode"
      @input="updateIcon")

    color-select-field(
      label="tabs_menu.color_label"
      :value="color"
      :opts="colorOpts"
      @input="updateColor")

    toggle-field(
      v-if="id"
      label="tabs_menu.sync_label"
      :value="syncON"
      :inline="true"
      @input="toggleSync")

    toggle-field(
      v-if="id"
      label="tabs_menu.lock_panel_label"
      :title="t('tabs_menu.lock_panel_tooltip')"
      :value="lockedPanel"
      :inline="true"
      @input="togglePanelLock")

    toggle-field(
      v-if="id"
      label="tabs_menu.lock_label"
      :title="t('tabs_menu.lock_tooltip')"
      :value="lockedTabs"
      :inline="true"
      @input="toggleTabsLock")

    select-field(
      v-if="id"
      label="tabs_menu.proxy_label"
      optLabel="tabs_menu.proxy_"
      noneOpt="direct"
      :value="proxied"
      :opts="proxyOpts"
      @input="switchProxy")

    .box
      .field(v-if="id && proxied !== 'direct'")
        text-input.text(
          ref="proxyHost"
          :or="t('tabs_menu.proxy_host_placeholder')"
          :line="true"
          :value="proxyHost"
          :valid="proxyHostValid"
          @input="onProxyHostInput"
          @keydown="onFieldKeydown($event, 'proxyPort', 'name')")

      .field(v-if="id && proxied !== 'direct'")
        text-input.text(
          ref="proxyPort"
          :or="t('tabs_menu.proxy_port_placeholder')"
          :line="true"
          :value="proxyPort"
          :valid="proxyPortValid"
          @input="onProxyPortInput"
          @keydown="onFieldKeydown($event, 'proxyUsername', 'proxyHost')")

      .field(v-if="id && proxied === 'socks'")
        text-input.text(
          ref="proxyUsername"
          valid="fine"
          :or="t('tabs_menu.proxy_username_placeholder')"
          :line="true"
          :value="proxyUsername"
          @input="onProxyUsernameInput"
          @keydown="onFieldKeydown($event, 'proxyPassword', 'proxyPort')")

      .field(v-if="id && proxied === 'socks'")
        text-input.text(
          ref="proxyPassword"
          valid="fine"
          :or="t('tabs_menu.proxy_password_placeholder')"
          :line="true"
          :value="proxyPassword"
          :password="true"
          @input="onProxyPasswordInput"
          @keydown="onFieldKeydown($event, null, 'proxyUsername')")

      toggle-field(
        v-if="id && isSomeSocks"
        label="tabs_menu.proxy_dns_label"
        :value="proxyDNS"
        :inline="true"
        @input="toggleProxyDns")

    .options
      .opt(v-if="haveTabs", @click="dedupTabs") {{t('tabs_menu.dedup_tabs')}}
      .opt(v-if="haveTabs", @click="reloadAllTabs") {{t('tabs_menu.reload_all_tabs')}}
      .opt(v-if="haveTabs", @click="closeAllTabs") {{t('tabs_menu.close_all_tabs')}}
      .opt.-warn(v-if="id", @click="remove") {{t('tabs_menu.delete_container')}}
</template>


<script>
import { mapGetters } from 'vuex'
import Store from '../store'
import State from '../store.state'
import TextInput from './input.text'
import ScrollBox from './scroll-box'
import ToggleField from './field.toggle'
import SelectField from './field.select'
import IconSelectField from './field.select-icon'
import ColorSelectField from './field.select-color'

const PROXY_HOST_RE = /^.{3,65536}$/
const PROXY_PORT_RE = /^\d{2,5}$/

export default {
  name: 'TabsMenu',

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

    haveTabs() {
      if (!this.conf.tabs || !this.id) return false
      return this.conf.tabs.length > 0
    },

    syncON() {
      return State.syncedPanels[this.index]
    },

    lockedPanel() {
      return State.lockedPanels[this.index]
    },

    lockedTabs() {
      return State.lockedTabs[this.index]
    },

    proxied() {
      const p = State.proxiedPanels.find(p => p.id === this.id)
      if (p) return p.type
      else return 'direct'
    },

    isSomeSocks() {
      return this.proxied === 'socks' || this.proxied === 'socks4'
    },

    proxyHost() {
      if (!this.id) return ''
      const proxy = State.proxiedPanels.find(p => p.id === this.id)
      if (!proxy || !proxy.host) return ''
      return proxy.host
    },

    proxyPort() {
      if (!this.id) return ''
      const proxy = State.proxiedPanels.find(p => p.id === this.id)
      if (!proxy || !proxy.port) return ''
      return proxy.port
    },

    proxyHostValid() {
      return PROXY_HOST_RE.test(this.proxyHost)
    },

    proxyPortValid() {
      return PROXY_PORT_RE.test(this.proxyPort)
    },

    proxyUsername() {
      if (!this.id) return ''
      const proxy = State.proxiedPanels.find(p => p.id === this.id)
      if (!proxy) return ''
      return proxy.username
    },

    proxyPassword() {
      if (!this.id) return ''
      const proxy = State.proxiedPanels.find(p => p.id === this.id)
      if (!proxy) return ''
      return proxy.password
    },

    proxyDNS() {
      if (!this.id) return false
      const proxy = State.proxiedPanels.find(p => p.id === this.id)
      if (!proxy) return false
      return proxy.proxyDNS
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
      this.$emit('height')
      if (this.$refs.name) this.$refs.name.focus()
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
      if (this.$refs.scrollBox) this.$refs.scrollBox.recalcScroll()
    },

    toggleSync() {
      this.$set(State.syncedPanels, this.index, !State.syncedPanels[this.index])
      Store.dispatch('resyncPanels')
      Store.dispatch('saveState')
    },

    togglePanelLock() {
      this.$set(State.lockedPanels, this.index, !State.lockedPanels[this.index])
      Store.dispatch('saveState')
    },

    toggleTabsLock() {
      this.$set(State.lockedTabs, this.index, !State.lockedTabs[this.index])
      Store.dispatch('saveState')
    },

    async switchProxy(type) {
      // Check permissions
      try {
        const permitted = await browser.permissions.contains({ origins: ['<all_urls>'] })
        if (!permitted) {
          browser.tabs.create({
            url: browser.runtime.getURL('permissions/all-urls.html'),
          })
          return
        }
      } catch (err) {
        return
      }

      const panel = this.panels.find(p => p.cookieStoreId === this.id)
      if (!panel || !panel.tabs) return

      const proxySettings = {
        id: this.id,
        tabs: panel.tabs.map(t => t.id),
        type,
        host: this.proxyHost,
        port: this.proxyPort,
        username: this.proxyUsername,
        password: this.proxyPassword,
        proxyDNS: this.proxyDNS,
      }

      let pi = State.proxiedPanels.findIndex(p => p.id === this.id)
      if (pi !== -1) {
        if (type === 'direct') State.proxiedPanels.splice(pi, 1)
        else State.proxiedPanels.splice(pi, 1, proxySettings)
      } else {
        if (type !== 'direct') State.proxiedPanels.push(proxySettings)
      }

      Store.dispatch('saveState')
      Store.dispatch('updateProxiedTabs')
      this.$emit('height')
    },

    onProxyHostInput(value) {
      if (!this.id) return
      const pi = State.proxiedPanels.findIndex(p => p.id === this.id)
      const proxy = { ...State.proxiedPanels[pi] }
      if (pi === -1) return
      proxy.host = value
      State.proxiedPanels.splice(pi, 1, proxy)
      if (!this.proxyHostValid) return
      Store.dispatch('saveState')
      Store.dispatch('updateProxiedTabs')
    },

    onProxyPortInput(value) {
      if (!this.id) return
      const pi = State.proxiedPanels.findIndex(p => p.id === this.id)
      const proxy = { ...State.proxiedPanels[pi] }
      if (pi === -1) return
      proxy.port = value
      State.proxiedPanels.splice(pi, 1, proxy)
      if (!this.proxyPortValid) return
      Store.dispatch('saveState')
      Store.dispatch('updateProxiedTabs')
    },

    onProxyUsernameInput(value) {
      if (!this.id) return
      const pi = State.proxiedPanels.findIndex(p => p.id === this.id)
      const proxy = { ...State.proxiedPanels[pi] }
      if (pi === -1) return
      proxy.username = value
      State.proxiedPanels.splice(pi, 1, proxy)
      Store.dispatch('saveState')
      Store.dispatch('updateProxiedTabs')
    },

    onProxyPasswordInput(value) {
      if (!this.id) return
      const pi = State.proxiedPanels.findIndex(p => p.id === this.id)
      const proxy = { ...State.proxiedPanels[pi] }
      if (pi === -1) return
      proxy.password = value
      State.proxiedPanels.splice(pi, 1, proxy)
      Store.dispatch('saveState')
      Store.dispatch('updateProxiedTabs')
    },

    toggleProxyDns() {
      if (!this.id) return
      const pi = State.proxiedPanels.findIndex(p => p.id === this.id)
      const proxy = { ...State.proxiedPanels[pi] }
      proxy.proxyDNS = !proxy.proxyDNS
      if (pi === -1) return
      State.proxiedPanels.splice(pi, 1, proxy)
      Store.dispatch('saveState')
      Store.dispatch('updateProxiedTabs')
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
@import '../../styles/mixins'

.Menu
  box(flex)
  flex-direction: column

.Menu > .title
  text(s: rem(18))
  color: var(--panel-menu-title-fg)
  margin: 16px 12px 12px

.Menu .scoll-wrapper
  box(relative)
  padding: 1px 0 0

.Menu .box
  box(relative)
  padding: 0 0 0 8px

.Menu .scroll-box
  size(max-h: calc(100vh - 200px))
  flex-grow: 1
  flex-shrink: 1

.Menu .field > .input
  box(relative, flex)
  flex-wrap: wrap

// Option icon
.Menu .input > .icon
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

.Menu .field > .text
  text(s: rem(14))
  margin: 2px 0 0
  transition: color 1s
  > input
  > textarea
    padding: 0 0 2px
    color: var(--settings-opt-false-fg)
  &[valid] > input
  &[valid] > textarea
    color: var(--settings-opt-true-fg)
  &[valid="fine"] > input
  &[valid="fine"] > textarea
    color: var(--settings-opt-active-fg)
  > .placeholder
    padding: 0 0 2px
    color: var(--panel-menu-label-fg)
</style>
