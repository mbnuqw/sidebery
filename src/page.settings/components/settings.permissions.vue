<template lang="pug">
section
  h2 {{t('settings.permissions_title')}}
  .permission(
    ref="all_urls"
    :data-highlight="$store.state.highlightedField === 'all_urls'"
    @click="onHighlighClick('all_urls')")
    toggle-field(
      label="settings.all_urls_label"
      :value="$store.state.permAllUrls"
      :note="t('settings.all_urls_info')"
      @input="togglePermAllUrls")
  .permission(
    ref="tab_hide"
    :data-highlight="$store.state.highlightedField === 'tab_hide'"
    @click="onHighlighClick('tab_hide')")
    toggle-field(
      label="settings.tab_hide_label"
      :value="$store.state.permTabHide"
      :note="t('settings.tab_hide_info')"
      @input="togglePermTabHide")
  .permission(
    ref="clipboard_write"
    :data-highlight="$store.state.highlightedField === 'clipboard_write'"
    @click="onHighlighClick('clipboard_write')")
    toggle-field(
      label="settings.clipboard_write_label"
      :value="$store.state.permClipboardWrite"
      :note="t('settings.clipboard_write_info')"
      @input="togglePermClipboardWrite")
  .permission(
    ref="web_request_blocking"
    :data-highlight="$store.state.highlightedField === 'web_request_blocking'"
    @click="onHighlighClick('web_request_blocking')")
    toggle-field(
      label="settings.web_request_blocking_label"
      :value="$store.state.permWebRequestBlocking"
      :note="t('settings.web_request_blocking_info')"
      @input="togglePermWebRequestBlocking")
</template>

<script>
import ToggleField from '../../components/toggle-field'
import State from '../store/state'
import Actions from '../actions'

export default {
  components: { ToggleField },

  mounted() {
    State.permissionsRefs = this.$refs
  },

  methods: {
    /**
     * Handle click on highlighed area
     */
    onHighlighClick(name) {
      if (State.highlightedField === name) {
        history.replaceState({}, '', location.origin + location.pathname)
      }
      State.highlightedField = ''
    },

    /**
     * Toggle allUrls permission
     */
    async togglePermAllUrls() {
      if (State.permAllUrls) {
        await browser.permissions.remove({ origins: ['<all_urls>'] })
        browser.runtime.sendMessage({ action: 'loadPermissions' })
        Actions.loadPermissions()
      } else {
        const request = { origins: ['<all_urls>'], permissions: [] }
        browser.permissions.request(request).then(allowed => {
          browser.runtime.sendMessage({ action: 'loadPermissions' })
          State.permAllUrls = allowed
        })
      }
    },

    /**
     * Toggle tabHide permission
     */
    async togglePermTabHide() {
      if (State.permTabHide) {
        await browser.runtime.sendMessage({ action: 'showAllTabs' })
        await browser.permissions.remove({ permissions: ['tabHide'] })
        browser.runtime.sendMessage({ action: 'loadPermissions' })
        Actions.loadPermissions()
      } else {
        const request = { origins: [], permissions: ['tabHide'] }
        browser.permissions.request(request).then(allowed => {
          browser.runtime.sendMessage({ action: 'loadPermissions' })
          State.permTabHide = allowed
        })
      }
    },

    async togglePermClipboardWrite() {
      if (State.permClipboardWrite) {
        await browser.permissions.remove({ permissions: ['clipboardWrite'] })
        browser.runtime.sendMessage({ action: 'loadPermissions' })
        Actions.loadPermissions()
      } else {
        const request = { origins: [], permissions: ['clipboardWrite'] }
        browser.permissions.request(request).then(allowed => {
          browser.runtime.sendMessage({ action: 'loadPermissions' })
          State.permClipboardWrite = allowed
        })
      }
    },

    async togglePermWebRequestBlocking() {
      if (State.permWebRequestBlocking) {
        await browser.permissions.remove({ permissions: ['webRequest', 'webRequestBlocking'] })
        browser.runtime.sendMessage({ action: 'loadPermissions' })
        Actions.loadPermissions()
      } else {
        const request = {
          origins: ['<all_urls>'],
          permissions: ['webRequest', 'webRequestBlocking'],
        }
        browser.permissions.request(request).then(allowed => {
          browser.runtime.sendMessage({ action: 'loadPermissions' })
          State.permWebRequestBlocking = allowed
          State.permAllUrls = allowed
        })
      }
    },
  },
}
</script>
