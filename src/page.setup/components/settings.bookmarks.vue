<template lang="pug">
section(ref="el")
  h2 {{translate('settings.bookmarks_title')}}
  ToggleField(
    label="settings.load_bookmarks_on_demand"
    v-model:value="Settings.state.loadBookmarksOnDemand"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.warn_on_multi_bookmark_delete"
    optLabel="settings.warn_on_multi_bookmark_delete_"
    v-model:value="Settings.state.warnOnMultiBookmarkDelete"
    :opts="Settings.getOpts('warnOnMultiBookmarkDelete')"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.bookmarks_rm_undo_note"
    v-model:value="Settings.state.bookmarksRmUndoNote"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.auto_close_bookmarks"
    v-model:value="Settings.state.autoCloseBookmarks"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.auto_rm_other"
    v-model:value="Settings.state.autoRemoveOther"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.show_bookmark_len"
    v-model:value="Settings.state.showBookmarkLen"
    @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.highlight_open_bookmarks"
    v-model:value="Settings.state.highlightOpenBookmarks"
    @update:value="Settings.saveDebounced(150)")
  .sub-fields
    ToggleField(
      label="settings.activate_open_bookmark_tab"
      v-model:value="Settings.state.activateOpenBookmarkTab"
      :inactive="!Settings.state.highlightOpenBookmarks"
      @update:value="Settings.saveDebounced(150)")
  ToggleField(
    label="settings.pin_opened_bookmarks_folder"
    v-model:value="Settings.state.pinOpenedBookmarksFolder"
    @update:value="Settings.saveDebounced(150)")
  SelectField(
    label="settings.old_bookmarks_after_save"
    optLabel="settings.old_bookmarks_after_save_"
    v-model:value="Settings.state.oldBookmarksAfterSave"
    :opts="Settings.getOpts('oldBookmarksAfterSave')"
    :folded="true"
    @update:value="Settings.saveDebounced(150)")

  .ctrls
    .fetch-progress(v-if="state.fetchingBookmarksFavs")
      .progress-bar
        .progress-lvl(:style="progressBarStyle")
      .progress-info
        .progress-host {{state.fetchingBookmarksFavsHost}}
      .progress-info
        .progress-done {{state.fetchingBookmarksFavsDone}}/{{state.fetchingBookmarksFavsAll}} {{translate('settings.fetch_bookmarks_favs_done')}}
        .progress-errors {{state.fetchingBookmarksFavsErrors}} {{translate('settings.fetch_bookmarks_favs_errors')}}
      .btn(v-if="state.fetchingBookmarksFavs" @click="stopFetchingBookmarksFavicons") {{translate('settings.fetch_bookmarks_favs_stop')}}
    .btn(v-if="!state.fetchingBookmarksFavs" @click="fetchBookmarksFavicons") {{translate('settings.fetch_bookmarks_favs')}}
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, CSSProperties, computed } from 'vue'
import { Bookmark, Stored, InstanceType } from 'src/types'
import * as Utils from 'src/utils'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { Permissions } from 'src/services/permissions'
import { SetupPage } from 'src/services/setup-page'
import * as IPC from 'src/services/ipc'
import ToggleField from '../../components/toggle-field.vue'
import SelectField from '../../components/select-field.vue'

const el = ref<HTMLElement | null>(null)

const state = reactive({
  fetchingBookmarksFavs: false,
  fetchingBookmarksFavsDone: 0,
  fetchingBookmarksFavsAll: 0,
  fetchingBookmarksFavsErrors: 0,
  fetchingBookmarksFavsPercent: 0,
  fetchingBookmarksFavsHost: '',
})

onMounted(() => SetupPage.registerEl('settings_bookmarks', el.value))

const progressBarStyle = computed<CSSProperties>(() => {
  return { transform: `translateX(${state.fetchingBookmarksFavsPercent}%)` }
})

/**
 * Returns array of urls of all bookmarks
 */
async function getBookmarkedUrls(): Promise<string[]> {
  const bookmarksRoot = (await browser.bookmarks.getTree()) as Bookmark[]
  const bookmarksUrls: string[] = []
  const hWalk = (nodes: Bookmark[]) => {
    for (let n of nodes) {
      if (n.url) bookmarksUrls.push(n.url)
      if (n.children) hWalk(n.children)
    }
  }
  if (bookmarksRoot[0]?.children) hWalk(bookmarksRoot[0].children)

  return bookmarksUrls
}

/**
 * Returns object of host separated urls
 */
function sortUrlByHosts(urls: string[], exclude: string[]): Record<string, string> {
  const hosts: Record<string, string> = {}
  for (let url of urls) {
    if (!url.startsWith('http')) continue
    if (url.length < 13) continue

    let urlInfo
    try {
      urlInfo = new URL(url)
    } catch (err) {
      continue
    }

    let protoHost = urlInfo.protocol + '//' + urlInfo.host
    if (exclude.includes(urlInfo.host)) continue

    if (!hosts[protoHost]) hosts[protoHost] = url
    else if (hosts[protoHost].length > url.length) hosts[protoHost] = url
  }

  return hosts
}

/**
 * Fetch favicons for bookmarks
 */
async function fetchBookmarksFavicons(): Promise<void> {
  if (!Permissions.reactive.webData || !Permissions.reactive.bookmarks) {
    const result = await Permissions.request('<all_urls>', 'bookmarks')
    if (!result) return
  }

  state.fetchingBookmarksFavs = true

  const stored = await browser.storage.local.get<Stored>('favDomains')
  const favDomains: string[] = Object.keys(stored?.favDomains ?? {})
  const bookmarksUrls = await getBookmarkedUrls()
  const hosts = sortUrlByHosts(bookmarksUrls, favDomains)

  state.fetchingBookmarksFavsAll = Object.keys(hosts).length
  let perc = 100 / state.fetchingBookmarksFavsAll

  for (let host of Object.keys(hosts)) {
    if (!state.fetchingBookmarksFavs) break

    let icon: string
    try {
      state.fetchingBookmarksFavsHost = host
      icon = (await Utils.loadBinAsBase64(host + '/favicon.ico')) as string
    } catch (err) {
      state.fetchingBookmarksFavsErrors++
      state.fetchingBookmarksFavsPercent += perc
      state.fetchingBookmarksFavsDone++
      continue
    }
    if (!icon || !icon.startsWith('data:image') || icon[icon.length - 1] === ',') {
      state.fetchingBookmarksFavsErrors++
      state.fetchingBookmarksFavsPercent += perc
      state.fetchingBookmarksFavsDone++
      continue
    }

    state.fetchingBookmarksFavsPercent += perc
    state.fetchingBookmarksFavsDone++

    IPC.bg('saveFavicon', hosts[host], icon)
  }

  state.fetchingBookmarksFavsAll = 0
  state.fetchingBookmarksFavsDone = 0
  state.fetchingBookmarksFavsErrors = 0
  state.fetchingBookmarksFavsPercent = 0

  setTimeout(() => {
    IPC.broadcast({ dstType: InstanceType.sidebar, action: 'loadFavicons' })
  }, 1500)
}

/**
 * Stop fetching
 */
function stopFetchingBookmarksFavicons(): void {
  state.fetchingBookmarksFavs = false
}
</script>
