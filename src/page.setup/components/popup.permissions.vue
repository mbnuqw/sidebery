<template lang="pug">
.ConfigPopup(ref="rootEl" @wheel="onWheel")
  h2 {{translate('settings.permissions_title')}}
  .permission(
    ref="all_urls"
    :data-highlight="SetupPage.reactive.permissions === 'all_urls'"
    @click="onHighlighClick('all_urls')")
    ToggleField(
      label="settings.all_urls_label"
      :value="Permissions.reactive.webData"
      :note="translate('settings.all_urls_info')"
      @update:value="togglePermAllUrls")
  .permission(
    ref="bookmarksEl"
    :data-highlight="SetupPage.reactive.permissions === 'bookmarks'"
    @click="onHighlighClick('bookmarks')")
    ToggleField(
      label="settings.perm.bookmarks_label"
      :value="Permissions.reactive.bookmarks"
      :note="translate('settings.perm.bookmarks_info')"
      @update:value="togglePermBookmarks")
  .permission(
    ref="tab_hide"
    :data-highlight="SetupPage.reactive.permissions === 'tab_hide'"
    @click="onHighlighClick('tab_hide')")
    ToggleField(
      label="settings.tab_hide_label"
      :value="Permissions.reactive.tabHide"
      :note="translate('settings.tab_hide_info')"
      @update:value="togglePermTabHide")
  .permission(
    ref="clipboard_write"
    :data-highlight="SetupPage.reactive.permissions === 'clipboard_write'"
    @click="onHighlighClick('clipboard_write')")
    ToggleField(
      label="settings.clipboard_write_label"
      :value="Permissions.reactive.clipboardWrite"
      :note="translate('settings.clipboard_write_info')"
      @update:value="togglePermClipboardWrite")
  .permission(
    ref="historyEl"
    :data-highlight="SetupPage.reactive.permissions === 'history'"
    @click="onHighlighClick('history')")
    ToggleField(
      label="settings.history_label"
      :value="Permissions.reactive.history"
      :note="translate('settings.history_info')"
      @update:value="togglePermHistory")
  .permission(
    ref="downloadsEl"
    :data-highlight="SetupPage.reactive.permissions === 'downloads'"
    @click="onHighlighClick('downloads')")
    ToggleField(
      label="settings.perm.downloads_label"
      :value="Permissions.reactive.downloads"
      :note="translate('settings.perm.downloads_info')"
      @update:value="togglePermDownloads")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Permissions } from 'src/services/permissions'
import { SetupPage } from 'src/services/setup-page'
import ToggleField from '../../components/toggle-field.vue'

const rootEl = ref<HTMLElement | null>(null)
const all_urls = ref<HTMLElement | null>(null)
const tab_hide = ref<HTMLElement | null>(null)
const clipboard_write = ref<HTMLElement | null>(null)
const historyEl = ref<HTMLElement | null>(null)
const downloadsEl = ref<HTMLElement | null>(null)
const bookmarksEl = ref<HTMLElement | null>(null)

onMounted(() => {
  SetupPage.registerEl('all_urls', all_urls.value)
  SetupPage.registerEl('tab_hide', tab_hide.value)
  SetupPage.registerEl('clipboard_write', clipboard_write.value)
  SetupPage.registerEl('history', historyEl.value)
  SetupPage.registerEl('downloads', downloadsEl.value)
  SetupPage.registerEl('bookmarks', bookmarksEl.value)
})

function onWheel(e: WheelEvent): void {
  if (!rootEl.value) return
  const scrollOffset = rootEl.value.scrollTop
  const maxScrollOffset = rootEl.value.scrollHeight - rootEl.value.offsetHeight
  if (scrollOffset === 0 && e.deltaY < 0) e.preventDefault()
  if (scrollOffset === maxScrollOffset && e.deltaY > 0) e.preventDefault()
}

function onHighlighClick(name: string): void {
  if (SetupPage.reactive.permissions === name) {
    window.history.replaceState({}, '', location.origin + location.pathname)
  }
  SetupPage.reactive.permissions = true
}

function togglePermAllUrls(): void {
  const origins = ['<all_urls>']
  const p = ['webRequest', 'webRequestBlocking', 'proxy']
  if (Permissions.reactive.webData) browser.permissions.remove({ origins, permissions: p })
  else browser.permissions.request({ origins, permissions: p })
}

function togglePermBookmarks(): void {
  if (Permissions.reactive.bookmarks) browser.permissions.remove({ permissions: ['bookmarks'] })
  else browser.permissions.request({ origins: [], permissions: ['bookmarks'] })
}

function togglePermTabHide(): void {
  if (Permissions.reactive.tabHide) browser.permissions.remove({ permissions: ['tabHide'] })
  else browser.permissions.request({ origins: [], permissions: ['tabHide'] })
}

function togglePermClipboardWrite(): void {
  const p = ['clipboardWrite']
  if (Permissions.reactive.clipboardWrite) browser.permissions.remove({ permissions: p })
  else browser.permissions.request({ origins: [], permissions: p })
}

function togglePermHistory(): void {
  const p = ['history']
  if (Permissions.reactive.history) browser.permissions.remove({ permissions: p })
  else browser.permissions.request({ origins: [], permissions: p })
}

function togglePermDownloads() {
  console.log('[DEBUG] togglePermDownloads')
  const p = ['downloads']
  if (Permissions.reactive.downloads) browser.permissions.remove({ permissions: p })
  else browser.permissions.request({ origins: [], permissions: p })
}
</script>
