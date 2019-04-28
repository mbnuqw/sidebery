<template lang="pug">
.Bookmarks(
  :not-renderable="!renderable"
  :invisible="!visible"
  @click="onClick")
  scroll-box(ref="scrollBox"): .bookmarks-wrapper
    component.node(
      v-for="n in $store.state.bookmarks"
      :is="n.type"
      :key="n.id"
      :node="n"
      @start-selection="onStartSelection")
  transition(name="editor")
    bookmarks-editor.editor(v-if="$store.state.bookmarkEditor")
</template>


<script>
import Utils from '../../../libs/utils'
import Store from '../../store'
import State from '../../store.state'
import EventBus from '../../event-bus'
import ScrollBox from '../scroll-box.vue'
import Bookmark from './bookmarks.bookmark.vue'
import Folder from './bookmarks.folder.vue'
import Separator from './bookmarks.separator.vue'
import BookmarksEditor from '../bookmarks-editor.vue'

export default {
  components: {
    ScrollBox,
    Bookmark,
    Folder,
    Separator,
    BookmarksEditor,
  },

  props: {
    active: Boolean,
    index: Number,
  },

  data() {
    return {
      editor: false,
      renderable: false,
      visible: false,
      lastScrollY: 0,
    }
  },

  watch: {
    // If bookmarks too many, do not render
    // them when panel is inactive
    async active(c, p) {
      const scrollBox = this.$refs.scrollBox
      if (!scrollBox) return

      // Activation
      if (c && !p) {
        if (State.bookmarks.length === 0) {
          await Store.dispatch('loadBookmarks')
        }

        setTimeout(() => {
          this.renderable = true
          setTimeout(() => {
            if (!this.visible) scrollBox.setScrollY(this.lastScrollY)
            this.visible = true
          }, 16)
        }, 16)
      }

      // Deactivation
      if (!c) {
        scrollBox.recalcScroll()
        if (scrollBox.contentHeight < scrollBox.boxHeight << 2) {
          this.renderable = true
          this.visible = true
          return
        }
        setTimeout(() => {
          this.lastScrollY = this.$refs.scrollBox.scrollY
          this.renderable = false
          setTimeout(() => {
            this.visible = false
          }, 16)
        }, 120)
      }
    },
  },

  async created() {
    browser.bookmarks.onCreated.addListener(this.onCreated)
    browser.bookmarks.onChanged.addListener(this.onChanged)
    browser.bookmarks.onMoved.addListener(this.onMoved)
    browser.bookmarks.onRemoved.addListener(this.onRemoved)

    // Setup global events listeners
    EventBus.$on('recalcPanelScroll', () => {
      if (this.index !== State.panelIndex) return
      this.recalcScroll()
    })

    // Render
    if (State.panelIndex === 0) {
      this.renderable = true
      setTimeout(() => {
        this.visible = true
      }, 16)
    }
  },

  beforeDestroy() {
    browser.bookmarks.onCreated.removeListener(this.onCreated)
    browser.bookmarks.onChanged.removeListener(this.onChanged)
    browser.bookmarks.onMoved.removeListener(this.onMoved)
    browser.bookmarks.onRemoved.removeListener(this.onRemoved)
  },

  methods: {
    onClick() {
      Store.commit('closeCtxMenu')
    },

    onStartSelection(event) {
      this.$emit('start-selection', event)
    },

    /**
     * Handle creating bookmark
     */
    onCreated(id, bookmark) {
      let added = false
      if (bookmark.type === 'bookmark') bookmark.host = bookmark.url.split('/')[2]
      if (bookmark.type === 'folder' && !bookmark.children) bookmark.children = []
      if (bookmark.type === 'folder') bookmark.expanded = false
      if (State.selOpenedBookmarks && bookmark.url) {
        bookmark.opened = !!State.tabs.find(t => t.url === bookmark.url)
      }

      const putWalk = nodes => {
        return nodes.map(n => {
          if (n.id === bookmark.parentId) {
            if (!n.children) n.children = []
            n.children.splice(bookmark.index, 0, bookmark)
            for (let i = bookmark.index + 1; i < n.children.length; i++) {
              n.children[i].index++
            }
            added = true
          } else if (n.children && !added) n.children = putWalk(n.children)
          return n
        })
      }

      State.bookmarksMap[id] = bookmark
      if (bookmark.url) {
        if (State.bookmarksUrlMap[bookmark.url]) {
          State.bookmarksUrlMap[bookmark.url].push(bookmark)
        } else {
          State.bookmarksUrlMap[bookmark.url] = [bookmark]
        }
      }
      State.bookmarks = putWalk(State.bookmarks)
    },

    /**
     * Handle bookmark change
     */
    onChanged(id, info) {
      const oldUrl = State.bookmarksMap[id].url
      if (oldUrl !== info.url && State.bookmarksUrlMap[oldUrl]) {
        const iob = State.bookmarksUrlMap[oldUrl].findIndex(b => b.id === id)
        if (iob > -1) State.bookmarksUrlMap[oldUrl].splice(iob, 1)
      }

      let updated = false
      const updateWalk = nodes => {
        return nodes.map(n => {
          if (!n.children) return n
          let b = n.children.find(b => b.id === id)
          if (b) {
            if (b.title !== info.title) b.title = info.title
            if (b.url !== info.url) {
              b.url = info.url
              b.host = info.url.split('/')[2]
              if (State.bookmarksUrlMap[info.url]) {
                State.bookmarksUrlMap[info.url].push(b)
              } else {
                State.bookmarksUrlMap[info.url] = [b]
              }
            }
            updated = true
          } else if (!updated) n.children = updateWalk(n.children)
          return n
        })
      }

      State.bookmarks = updateWalk(State.bookmarks)
    },

    /**
     * Handle moving bookmark
     */
    onMoved(id, info) {
      let node
      let removed = false
      const rmWalk = nodes => {
        return nodes.map(n => {
          if (n.id === info.oldParentId) {
            node = n.children.splice(info.oldIndex, 1)[0]
            node.index = info.index
            node.parentId = info.parentId
            for (let i = info.oldIndex; i < n.children.length; i++) {
              n.children[i].index--
            }
            removed = true
          } else if (n.children && !removed) n.children = rmWalk(n.children)
          return n
        })
      }

      let moved = false
      const putWalk = nodes => {
        return nodes.map(n => {
          if (n.id === info.parentId) {
            if (!n.children) n.children = []
            n.children.splice(info.index, 0, node)
            for (let i = info.index + 1; i < n.children.length; i++) {
              n.children[i].index++
            }
            moved = true
          } else if (n.children && !moved) n.children = putWalk(n.children)
          return n
        })
      }

      State.bookmarks = putWalk(rmWalk(State.bookmarks))
      Store.dispatch('saveBookmarksTree')
    },

    /**
     * Handle removing bookmark node
     */
    onRemoved(id, info) {
      let removed = false
      let url
      const rmWalk = nodes => {
        return nodes.map(n => {
          if (n.id === info.parentId) {
            url = n.children[info.index].url
            n.children.splice(info.index, 1)
            for (let i = info.index; i < n.children.length; i++) {
              n.children[i].index--
            }
            removed = true
          } else if (n.children && !removed) n.children = rmWalk(n.children)
          return n
        })
      }

      State.bookmarksMap[id] = undefined
      if (url && State.bookmarksUrlMap[url]) {
        const ib = State.bookmarksUrlMap[url].findIndex(b => b.id === id)
        if (ib > -1) State.bookmarksUrlMap[url].splice(ib, 1)
      }
      State.bookmarks = rmWalk(State.bookmarks)
    },

    /**
     * Calculate bookmarks bounds
     */
    getItemsBounds() {
      // probe bookmarks height
      const compStyle = getComputedStyle(this.$el)
      const fhRaw = compStyle.getPropertyValue('--bookmarks-folder-height')
      const fh = Utils.ParseCSSNum(fhRaw.trim())[0]
      const fc = fh >> 1
      const fe = fc >> 1
    
      const bhRaw = compStyle.getPropertyValue('--bookmarks-bookmark-height')
      const bh = Utils.ParseCSSNum(bhRaw.trim())[0]
      const bc = bh >> 1
      const be = bc >> 1

      const shRaw = compStyle.getPropertyValue('--bookmarks-separator-height')
      const sh = Utils.ParseCSSNum(shRaw.trim())[0]
      const sc = sh >> 1
      const se = sc >> 1

      let overallHeight = 0
      let h, c, e
      const bounds = []
      const walker = nodes => {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]

          if (n.type === 'folder') {
            h = fh
            c = fc
            e = fe
          }
          if (n.type === 'bookmark') {
            h = bh
            c = bc
            e = be
          }
          if (n.type === 'separator') {
            h = sh
            c = sc
            e = se
          }

          bounds.push({
            type: 'bookmark',
            id: n.id,
            index: n.index,
            in: n.type === 'folder',
            folded: !n.expanded,
            parent: n.parentId,
            start: overallHeight,
            top: overallHeight + e,
            center: overallHeight + c,
            bottom: overallHeight + c + e,
            end: overallHeight + h,
          })

          overallHeight += h

          if (n.children && n.expanded) {
            walker(n.children)
          }
        }
      }
      walker(State.bookmarks)

      return bounds
    },

    /**
     * Return scroll-box element
     */
    getScrollEl() {
      if (!this.$refs.scrollBox) return
      else return this.$refs.scrollBox.getScrollBox()
    },

    /**
     * Return top offset of panel
     */
    getTopOffset() {
      const b = this.$el.getBoundingClientRect()
      return b.top
    },

    /**
     * Recalculate scroll possition
     */
    recalcScroll() {
      if (this.$refs.scrollBox) {
        this.$refs.scrollBox.recalcScroll()
      }
    },
  },
}
</script>


<style lang="stylus">
@import '../../../styles/mixins'

.Bookmarks
  overflow: hidden

.Bookmarks .bookmarks-wrapper
  box(relative)
  padding-bottom: 64px

.Bookmarks[not-renderable]
  cursor: progress

.Bookmarks[not-renderable] .node
  box(none)

.Bookmarks[invisible] .node
  opacity: 0

// --- Root nodes ---
.Bookmarks .node
  box(relative)
  opacity: 1
  transition: opacity var(--d-fast)

// --- Editor Transitions ---
.Bookmarks
  .editor-enter-active
  .editor-leave-active
    transition: opacity var(--d-fast), z-index var(--d-fast), transform var(--d-fast)
  .editor-enter
    transform: translateY(100%)
    opacity: 0
    z-index: 0
  .editor-enter-to
    transform: translateY(0)
    opacity: 1
    z-index: 10
  .editor-leave
    transform: translateY(0)
    opacity: 1
    z-index: 10
  .editor-leave-to
    transform: translateY(100%)
    opacity: 0
    z-index: 0
</style>
