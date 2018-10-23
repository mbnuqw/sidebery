<template lang="pug">
.Tab(:data-active="tab.active"
    :data-status="tab.status"
    :data-no-fav="!favicon || faviErr"
    :data-audible="tab.audible"
    :data-muted="tab.mutedInfo.muted"
    :data-menu="menu"
    :data-pinned="tab.pinned"
    :close-btn="$root.showTabRmBtn"
    :title="tooltip"
    @contextmenu.prevent.stop=""
    @mousedown="onMD"
    @mouseup.prevent="onMU"
    @mouseleave="onML"
    @dblclick="onDBL")
  .drag-layer(draggable="true"
    @dragstart="onDragStart"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave")
  .audio(@click="mute")
    svg.-loud: use(xlink:href="#icon_loud")
    svg.-mute: use(xlink:href="#icon_mute")
  .fav
    .placeholder
    img(:src="favicon", @load.passive="onFaviconLoad", @error="onFaviconErr")
  .ctx(v-if="tab.ctxIcon", :style="{background: tab.ctxColor}")
  .close(v-if="$root.showTabRmBtn", @mousedown.stop="close", @mouseup.stop="")
    svg: use(xlink:href="#icon_remove")
  .t-box
    .title {{tab.title}}
    .loading
      svg.-a: use(xlink:href="#icon_load")
      svg.-b: use(xlink:href="#icon_load")
      svg.-c: use(xlink:href="#icon_load")
</template>


<script>
import Utils from '../libs/utils'

export default {
  props: {
    tab: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      menu: false,
      faviErr: false,
    }
  },

  computed: {
    favicon() {
      if (this.tab.favIconUrl) return this.tab.favIconUrl
      else if (this.tab.url) {
        let hn = this.tab.url.split('/')[2]
        if (!hn) return
        return this.$root.favicons[hn]
      }
    },

    offsetStyle() {
      if (!this.offsetY) return {}
      return { transform: `translateY(${this.offsetY}px)` }
    },

    tooltip() {
      return `${this.tab.title}\n${this.tab.url}`
    },
  },

  methods: {
    /**
     * Double click handler
     */
    onDBL() {
      if (this.$root.tabDoubleClick === 'close_down') this.closeDown()
      if (this.$root.tabDoubleClick === 'reload') this.reload()
      if (this.$root.tabDoubleClick === 'duplicate') this.duplicate()
      if (this.$root.tabDoubleClick === 'pin') this.pin()
      if (this.$root.tabDoubleClick === 'mute') this.mute()
      if (this.$root.tabDoubleClick === 'clear_cookies') this.clearCookies()
    },

    /**
     * Mousedown handler
     */
    onMD(e) {
      if (e.button === 1) {
        e.stopPropagation()
        e.preventDefault()
        this.close()
      }

      if (e.button === 0) {
        // Double-click-drag
        if (this.mclickTimeout) return

        e.preventDefault()
        this.$emit('md', e, this)
        this.hodorL = setTimeout(() => {
          if (this.$root.tabLongLeftClick === 'close_down') this.closeDown()
          if (this.$root.tabLongLeftClick === 'reload') this.reload()
          if (this.$root.tabLongLeftClick === 'duplicate') this.duplicate()
          if (this.$root.tabLongLeftClick === 'pin') this.pin()
          if (this.$root.tabLongLeftClick === 'mute') this.mute()
          if (this.$root.tabLongLeftClick === 'clear_cookies') this.clearCookies()
          this.hodorL = null
        }, 250)
      }

      if (e.button === 2) {
        e.preventDefault()
        this.$emit('mdr', e, this)
        this.hodorR = setTimeout(() => {
          if (this.$root.tabLongRightClick === 'close_down') this.closeDown()
          if (this.$root.tabLongRightClick === 'reload') this.reload()
          if (this.$root.tabLongRightClick === 'duplicate') this.duplicate()
          if (this.$root.tabLongRightClick === 'pin') this.pin()
          if (this.$root.tabLongRightClick === 'mute') this.mute()
          if (this.$root.tabLongRightClick === 'clear_cookies') this.clearCookies()
          this.hodorR = null
        }, 250)
      }
    },

    onMU(e) {
      if (e.button === 0) {
        if (this.hodorL) this.hodorL = clearTimeout(this.hodorL)
      }
      if (e.button === 2) {
        if (this.hodorR) {
          this.openMenu()
          this.hodorR = clearTimeout(this.hodorR)
        }
      }

      // Set timeout for double-click-drag event
      this.mclickTimeout = setTimeout(() => {
        this.mclickTimeout = null
      }, 200)
    },

    onML() {
      if (this.hodorL) this.hodorL = clearTimeout(this.hodorL)
      if (this.hodorR) this.hodorR = clearTimeout(this.hodorR)
    },

    /**
     * Handle dragstart event.
     */
    onDragStart(e) {
      e.dataTransfer.setData('text/x-moz-text-internal', this.tab.url)
      e.dataTransfer.setData('text/uri-list', this.tab.url)
      e.dataTransfer.setData('text/plain', this.tab.url)
      e.dataTransfer.effectAllowed = 'move'
    },

    /**
     * Handle dragenter event
     */
    onDragEnter() {
      if (this.dragEnterTimeout) clearTimeout(this.dragEnterTimeout)
      this.dragEnterTimeout = setTimeout(() => {
        browser.tabs.update(this.tab.id, { active: true })
        this.dragEnterTimeout = null
      }, 200)
    },

    /**
     * Handle dragleave event
     */
    onDragLeave() {
      if (this.dragEnterTimeout) {
        clearTimeout(this.dragEnterTimeout)
        this.dragEnterTimeout = null
      }
    },

    /**
     * If favicon is just url to some image,
     * wait until it is loaded, convert to base64 and
     * store result to cache.
     */
    onFaviconLoad(e) {
      if (this.favicon.indexOf('http') === 0) {
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        canvas.width = e.target.naturalWidth
        canvas.height = e.target.naturalHeight
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(e.target, 0, 0, e.target.naturalWidth, e.target.naturalHeight)
        let base64 = canvas.toDataURL('image/png')
        let hn = this.tab.url.split('/')[2]
        if (!hn) return
        this.$root.setFavicon(hn, base64)
      }
    },

    onFaviconErr() {
      this.faviErr = true
    },

    mute() {
      browser.tabs.update(this.tab.id, { muted: !this.tab.mutedInfo.muted })
    },

    close() {
      this.$root.$refs.sidebar.removeTab(this.tab)
    },

    async openMenu() {
      if (this.menu) return
      let windows = await Utils.GetAllWindows()
      let otherWindows = []
      let otherDefaultWindows = []
      let privateWindow
      windows.map(w => {
        if (!privateWindow && w.incognito) privateWindow = w
        if (!w.current) otherWindows.push(w)
        if (!w.current && !w.incognito) otherDefaultWindows.push(w)
        return !w.current && !w.incognito
      })
      this.menu = true

      let opts = []
      if (!this.$root.private) {
        opts.push([this.t('ctx_menu.move_to_new_window'), this.moveToNewWin])
        if (otherDefaultWindows.length === 1) {
          opts.push([this.t('ctx_menu.move_to_another_window'), () => this.moveToWin(otherDefaultWindows[0])])
        }
        if (otherDefaultWindows.length > 1) opts.push([this.t('ctx_menu.move_to_window_'), this.moveToWin])
        opts.push([this.t('ctx_menu.reopen_in_priv_window'), () => this.reopenInPrivWin(privateWindow)])
        if (this.tab.cookieStoreId !== 'firefox-default') {
          opts.push([this.t('ctx_menu.reopen_in_default_panel'), this.openInPanel, 'firefox-default'])
        }
        this.$root.$refs.sidebar.contexts.map(c => {
          if (this.tab.cookieStoreId === c.cookieStoreId) return
          opts.push([
            this.t('ctx_menu.re_open_in_') + `||${c.colorCode}>>${c.name}`,
            this.openInPanel,
            c.cookieStoreId,
          ])
        })
      } else {
        if (otherWindows.length === 1) {
          opts.push([this.t('ctx_menu.reopen_in_another_window'), () => this.reopenInWin(otherWindows[0])])
        }
        if (otherWindows.length > 1) opts.push([this.t('ctx_menu.reopen_in_window_'), this.reopenInWin])
      }
      opts.push([this.tab.pinned ? this.t('ctx_menu.unpin') : this.t('ctx_menu.pin'), this.pin])
      opts.push([this.tab.mutedInfo.muted ? this.t('ctx_menu.unmute') : this.t('ctx_menu.mute'), this.mute])
      opts.push([this.t('ctx_menu.tab_reload'), this.reload])
      opts.push([this.t('ctx_menu.tab_duplicate'), this.duplicate])
      opts.push([this.t('ctx_menu.clear_cookies'), this.clearCookies])
      opts.push([this.t('ctx_menu.tab_close_down'), this.closeDown])

      this.$root.closeCtxMenu()
      this.$root.ctxMenu = {
        el: this.$el,
        off: this.closeMenu,
        opts,
      }
    },

    closeMenu() {
      this.menu = false
    },

    /**
     * Create new window with this tab
     */
    moveToNewWin() {
      this.$root.closeCtxMenu()
      browser.windows.create({ tabId: this.tab.id })
    },

    /**
     *  Move tab to window if provided,
     * otherwise show window-choosing menu
     */
    async moveToWin(window) {
      this.$root.closeCtxMenu()
      let id = window ? window.id : await this.$root.chooseWin()
      browser.tabs.move(this.tab.id, { windowId: id, index: -1 })
    },

    /**
     * Create new private window,
     * open there tab with current url and
     * close current tab.
     */
    reopenInPrivWin(window) {
      this.$root.closeCtxMenu()
      let url = this.tab.url.indexOf('http') ? null : this.tab.url
      if (!window) browser.windows.create({ incognito: true, url })
      else browser.tabs.create({ windowId: window.id, url })
    },

    /**
     * Open new tab with current url in
     * another window.
     */
    async reopenInWin(window) {
      this.$root.closeCtxMenu()
      let id = window ? window.id : await this.$root.chooseWin()
      let url = this.tab.url.indexOf('http') ? null : this.tab.url
      browser.tabs.create({ windowId: id, url })
    },

    /**
     * Open url in panel by cookieStoreId
     */
    openInPanel(id) {
      this.$root.closeCtxMenu()
      browser.tabs.create({
        active: true,
        cookieStoreId: id,
        url: this.tab.url.indexOf('http') ? null : this.tab.url,
      })
      browser.tabs.remove(this.tab.id)
    },

    /**
     * Clear all cookies of this url
     */
    async clearCookies() {
      this.$root.closeCtxMenu()
      let url = new URL(this.tab.url)
      let domain = url.hostname
        .split('.')
        .slice(-2)
        .join('.')
      let cookies = await browser.cookies.getAll({
        domain: domain,
        storeId: this.tab.cookieStoreId,
      })
      let fpcookies = await browser.cookies.getAll({
        firstPartyDomain: domain,
        storeId: this.tab.cookieStoreId,
      })

      cookies.concat(fpcookies).map(c => {
        browser.cookies.remove({
          storeId: this.tab.cookieStoreId,
          url: this.tab.url,
          name: c.name,
        })
      })
    },

    height() {
      return this.$el.offsetHeight
    },

    /**
     * Pin tab
     */
    async pin() {
      this.$root.closeCtxMenu()
      await browser.tabs.update(this.tab.id, { pinned: !this.tab.pinned })
    },

    /**
     * Close all tabs underneath
     */
    closeDown() {
      this.$emit('closedown')
    },

    /**
     * Reload tab
     */
    reload(bypassCache) {
      browser.tabs.reload(this.tab.id, { bypassCache })
    },

    /**
     * Duplicate tab
     */
    duplicate() {
      browser.tabs.duplicate(this.tab.id)
    },
  },
}
</script>


<style lang="stylus">
@import '../styles/mixins'

.Tab
  box(relative, flex)
  size(h: 30px)
  align-items: center
  transform: translateZ(0)
  transition: opacity var(--d-fast), transform .12s, z-index 0s .2s, background-color var(--d-fast)
  &:hover
    .fav
      opacity: 1
    .title
      color: var(--tabs-fg-hover)
    .close
      opacity: 1
      z-index: 20

  &[data-active]
    background-color: var(--tabs-actibated-bg)
    .fav
      opacity: 1
    .title
      color: var(--tabs-actibated-fg)
    .grad
      background-image: var(--tabs-actibated-overflow-gradient)

  &[close-btn]:hover
    &[data-audible] .title
    &[data-muted] .title
      mask: linear-gradient(-90deg, transparent, transparent 42px, #000000 64px, #000000)
    &[data-status="loading"] .title
      mask: linear-gradient(-90deg, transparent, transparent 32px, #000000 54px, #000000)
    &[data-status="loading"]&[data-audible] .title
    &[data-status="loading"]&[data-muted] .title
      mask: linear-gradient(-90deg, transparent, transparent 52px, #000000 72px, #000000)
    .title
      mask: linear-gradient(-90deg, transparent, transparent 24px, #000000 48px, #000000)
  
  &[data-status="loading"]
    cursor: progress
    .title
      transform: translateX(9px)
      mask: linear-gradient(-90deg, transparent, transparent 9px, #000000 22px, #000000)
    .loading > svg.-a
      animation: tab-loading .8s infinite
    .loading > svg.-b
      animation: tab-loading .8s .07s infinite
    .loading > svg.-c
      animation: tab-loading .8s .14s infinite

  &[data-no-fav]
    .fav > .placeholder
      opacity: 1
      transform: translateY(0)
    .fav > img
      opacity: 0
      transform: translateY(-4px)

  &[data-audible]
    .audio
      opacity: 1
      transform: translateX(0)
    .fav
    .t-box
      transform: translateX(16px)
    .title
      mask: linear-gradient(-90deg, transparent, transparent 16px, #000000 28px, #000000)

  &[data-muted]
    .audio
      opacity: .8
      transform: translateX(0)
      > svg.-loud
        opacity: 0
      > svg.-mute
        opacity: 1
    .fav
    .t-box
      transform: translateX(16px)
    .title
      mask: linear-gradient(-90deg, transparent, transparent 16px, #000000 28px, #000000)

  &[data-menu]
    z-index: 10
    background-color: var(--tabs-selected-bg)
    .title
      color: var(--tabs-selected-fg)

// --- Drag layer ---
.Tab .drag-layer
  box(absolute)
  size(100%, same)
  pos(0, 0)
  z-index: 15

// --- Audio ---
.Tab .audio
  box(absolute)
  pos(0, 0)
  size(16px, 100%)
  z-index: 1
  opacity: 0
  transform: translateX(-100%)
  transition: opacity var(--d-fast), transform var(--d-fast)

  > svg
    box(absolute)
    pos(9px, 6px)
    size(11px, same)
    fill: var(--tabs-fg)
    transition: opacity var(--d-fast)

  > svg.-mute
    opacity: 0

// --- Favicon ---
.Tab .fav
  box(relative)
  size(16px, same)
  flex-shrink: 0
  margin: 0 6px 0 7px
  opacity: 1
  z-index: 20
  transition: opacity var(--d-fast), transform var(--d-fast)

.Tab .fav > .placeholder
  box(absolute)
  size(3px, same)
  pos(7px, 6px)
  border-radius: 50%
  background-color: var(--fav-out)
  opacity: 0
  transform: translateY(4px)
  transition: opacity var(--d-fast), transform var(--d-fast)
  &:before
  &:after
    content: ''
    box(absolute)
    size(3px, same)
    border-radius: 6px
    background-color: var(--fav-out)
  &:before
    pos(0, -5px)
  &:after
    pos(0, 5px)

.Tab .fav > img
  box(absolute)
  size(100%, same)
  transition: opacity var(--d-fast), transform var(--d-fast)

// --- Context hightligh
.Tab .ctx
  box(absolute)
  pos(b: 11px, l: 0px)
  size(2px, 8px)
  z-index: 2000
  box-shadow: 0 0 2px 0 var(--c-bg)

// --- Title box ---
.Tab .t-box
  box(relative)
  size(100%)
  transition: opacity var(--d-fast), transform var(--d-fast)
  overflow: hidden

// Title
.Tab .title
  box(relative)
  text(s: rem(16), h: 28px)
  color: var(--tabs-fg)
  padding: 0 1px
  transition: color .2s
  white-space: nowrap
  overflow: hidden
  transition: transform var(--d-fast), color var(--d-fast), mask var(--d-fast)
  mask: linear-gradient(-90deg, transparent, #000000 12px, #000000)

// Loading
.Tab .loading
  box(absolute)
  pos(0, 0)
  size(3px, 100%)
  transition: transform var(--d-fast)

  > svg
    box(absolute)
    pos(9px)
    size(5px, 3px)
    fill: var(--tabs-loading-fg)
    opacity: 0
  > svg.-b
    pos(13px)
  > svg.-c
    pos(17px)

// --- CLose button ---
.Tab .close
  box(absolute)
  pos(4px, r: 4px)
  size(23px, same)
  cursor: pointer
  z-index: -1
  opacity: 0
  &:hover > svg
    fill: #ea4335
  &:active > svg
    transition: none
    fill: #fa5335
  > svg
    box(absolute)
    pos(3px, same)
    size(17px, same)
    fill: #a63626
    transition: fill var(--d-fast)

// --- Animations ---
@keyframes tab-loading
  0%
    opacity: 1
  100%
    opacity: 0
</style>
