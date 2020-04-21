<template lang="pug">
section
  h2 {{t('settings.bookmarks_title')}}
  toggle-field(
    label="settings.bookmarks_panel"
    :value="$store.state.bookmarksPanel"
    @input="setOpt('bookmarksPanel', $event)")
  select-field(
    label="settings.warn_on_multi_bookmark_delete"
    optLabel="settings.warn_on_multi_bookmark_delete_"
    :inactive="!$store.state.bookmarksPanel"
    :value="$store.state.warnOnMultiBookmarkDelete"
    :opts="$store.state.warnOnMultiBookmarkDeleteOpts"
    @input="setOpt('warnOnMultiBookmarkDelete', $event)")
  toggle-field(
    label="settings.bookmarks_rm_undo_note"
    :inactive="!$store.state.bookmarksPanel"
    :value="$store.state.bookmarksRmUndoNote"
    @input="setOpt('bookmarksRmUndoNote', $event)")
  toggle-field(
    label="settings.open_bookmark_new_tab"
    :inactive="!$store.state.bookmarksPanel"
    :value="$store.state.openBookmarkNewTab"
    @input="setOpt('openBookmarkNewTab', $event)")
  select-field(
    label="settings.mid_click_bookmark"
    optLabel="settings.mid_click_bookmark_"
    :inactive="!$store.state.bookmarksPanel"
    :value="$store.state.midClickBookmark"
    :opts="$store.state.midClickBookmarkOpts"
    @input="setOpt('midClickBookmark', $event)")
  .sub-fields
    toggle-field(
      label="settings.act_mid_click_tab"
      :inactive="!$store.state.bookmarksPanel || $store.state.midClickBookmark !== 'open_new_tab'"
      :value="$store.state.actMidClickTab"
      @input="setOpt('actMidClickTab', $event)")
  toggle-field(
    label="settings.auto_close_bookmarks"
    :inactive="!$store.state.bookmarksPanel"
    :value="$store.state.autoCloseBookmarks"
    @input="setOpt('autoCloseBookmarks', $event)")
  toggle-field(
    label="settings.auto_rm_other"
    :inactive="!$store.state.bookmarksPanel"
    :value="$store.state.autoRemoveOther"
    @input="setOpt('autoRemoveOther', $event)")
  toggle-field(
    label="settings.show_bookmark_len"
    :inactive="!$store.state.bookmarksPanel"
    :value="$store.state.showBookmarkLen"
    @input="setOpt('showBookmarkLen', $event)")
  toggle-field(
    label="settings.highlight_open_bookmarks"
    :inactive="!$store.state.bookmarksPanel"
    :value="$store.state.highlightOpenBookmarks"
    @input="setOpt('highlightOpenBookmarks', $event)")
  .sub-fields
    toggle-field(
      label="settings.activate_open_bookmark_tab"
      :inactive="!$store.state.bookmarksPanel || !$store.state.highlightOpenBookmarks"
      :value="$store.state.activateOpenBookmarkTab"
      @input="setOpt('activateOpenBookmarkTab', $event)")
  .ctrls
    .fetch-progress(v-if="fetchingBookmarksFavs")
      .progress-bar: .progress-lvl(:style="{transform: `translateX(${fetchingBookmarksFavsPercent}%)`}")
      .progress-info
        .progress-done {{fetchingBookmarksFavsDone}}/{{fetchingBookmarksFavsAll}} {{t('settings.fetch_bookmarks_favs_done')}}
        .progress-errors {{fetchingBookmarksFavsErrors}} {{t('settings.fetch_bookmarks_favs_errors')}}
      .btn(v-if="fetchingBookmarksFavs" @click="stopFetchingBookmarksFavicons") {{t('settings.fetch_bookmarks_favs_stop')}}
    .btn(v-if="!fetchingBookmarksFavs" @click="fetchBookmarksFavicons") {{t('settings.fetch_bookmarks_favs')}}
</template>

<script>
import ToggleField from '../../components/toggle-field'
import SelectField from '../../components/select-field'
import State from '../store/state'
import Actions from '../actions'

export default {
  components: { ToggleField, SelectField },

  data() {
    return {
      fetchingBookmarksFavs: false,
      fetchingBookmarksFavsDone: 0,
      fetchingBookmarksFavsAll: 0,
      fetchingBookmarksFavsErrors: 0,
      fetchingBookmarksFavsPercent: 0,
    }
  },

  methods: {
    /**
     * Returns array of urls of all bookmarks
     */
    async getBookmarkedUrls() {
      const bookmarksRoot = await browser.bookmarks.getTree()
      const bookmarksUrls = []
      const hWalk = nodes => {
        for (let n of nodes) {
          if (n.url) bookmarksUrls.push(n.url)
          if (n.children) hWalk(n.children)
        }
      }
      hWalk(bookmarksRoot[0].children)

      return bookmarksUrls
    },

    /**
     * Returns object of host separated urls
     */
    sortUrlByHosts(urls) {
      const hosts = {}
      for (let url of urls) {
        if (!url.startsWith('http')) continue

        let urlInfo
        try {
          urlInfo = new URL(url)
        } catch (err) {
          continue
        }

        let protoHost = urlInfo.protocol + '//' + urlInfo.host
        if (!hosts[protoHost]) hosts[protoHost] = []
        hosts[protoHost].push(url)
      }

      return hosts
    },

    /**
     * Fetch favicons for bookmarks
     */
    async fetchBookmarksFavicons() {
      if (!State.permAllUrls) {
        location.hash = 'all-urls'
        return
      }

      this.fetchingBookmarksFavs = true

      const bookmarksUrls = await this.getBookmarkedUrls()
      const hosts = this.sortUrlByHosts(bookmarksUrls)

      this.fetchingBookmarksFavsAll = Object.keys(hosts).length
      let perc = 100 / this.fetchingBookmarksFavsAll

      for (let host of Object.keys(hosts)) {
        if (!this.fetchingBookmarksFavs) break

        let icon
        try {
          icon = await Utils.loadBinAsBase64(host + '/favicon.ico')
        } catch (err) {
          this.fetchingBookmarksFavsErrors++
          this.fetchingBookmarksFavsPercent += perc
          this.fetchingBookmarksFavsDone++
          continue
        }
        if (!icon || !icon.startsWith('data:image') || icon[icon.length - 1] === ',') {
          this.fetchingBookmarksFavsErrors++
          this.fetchingBookmarksFavsPercent += perc
          this.fetchingBookmarksFavsDone++
          continue
        }

        this.fetchingBookmarksFavsPercent += perc
        this.fetchingBookmarksFavsDone++
        hosts[host].forEach(u => Actions.setFavicon(u, icon))
      }

      this.stopFetchingBookmarksFavicons()
    },

    /**
     * Stop fetching
     */
    stopFetchingBookmarksFavicons() {
      this.fetchingBookmarksFavs = false
      this.fetchingBookmarksFavsAll = 0
      this.fetchingBookmarksFavsDone = 0
      this.fetchingBookmarksFavsErrors = 0
      this.fetchingBookmarksFavsPercent = 0

      setTimeout(() => {
        browser.runtime.sendMessage({
          instanceType: 'sidebar',
          action: 'loadFavicons',
        })
      }, 1500)
    },
  },
}
</script>
