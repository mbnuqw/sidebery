<template lang="pug">
.Bookmarks(:data-unrenderable="!renderable" :data-invisible="!visible" @click="onClick")
  scroll-box(ref="scrollBox"): .bookmarks-wrapper
    component.node(
      v-for="n in $store.state.bookmarks"
      :is="n.type"
      :key="n.id"
      :node="n"
      @start-selection="onStartSelection")
  transition(name="editor")
    bookmark-editor.editor(v-if="$store.state.bookmarkEditor")
</template>


<script>
import Utils from '../../utils'
import EventBus from '../../event-bus'
import State from '../store/state'
import Actions from '../actions'
import ScrollBox from './scroll-box'
import Bookmark from './bookmark'
import Folder from './bookmarks-folder'
import BookmarkEditor from './bookmark-editor'

export default {
  components: {
    ScrollBox,
    Bookmark,
    Folder,
    BookmarkEditor,
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
          await Actions.loadBookmarks(State)
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
      Actions.closeCtxMenu()
    },

    onStartSelection(event) {
      this.$emit('start-selection', event)
    },

    /**
     * Handle creating bookmark
     */
    onCreated(id, bookmark) {
      if (!State.bookmarks.length) return

      // let added = false
      if (bookmark.type === 'bookmark') bookmark.host = bookmark.url.split('/')[2]
      if (bookmark.type === 'folder' && !bookmark.children) bookmark.children = []
      if (bookmark.type === 'folder') bookmark.expanded = false
      if (State.highlightOpenBookmarks && bookmark.url) {
        bookmark.isOpen = !!State.tabs.find(t => t.url === bookmark.url)
      }

      const parent = State.bookmarksMap[bookmark.parentId]
      if (parent && parent.children) {
        parent.children.splice(bookmark.index, 0, bookmark)
      }

      State.bookmarksMap[id] = bookmark
      if (bookmark.url) {
        if (State.bookmarksUrlMap[bookmark.url]) {
          State.bookmarksUrlMap[bookmark.url].push(bookmark)
        } else {
          State.bookmarksUrlMap[bookmark.url] = [bookmark]
        }
      }
    },

    /**
     * Handle bookmark change
     */
    onChanged(id, info) {
      if (!State.bookmarks.length) return

      const oldUrl = State.bookmarksMap[id].url
      if (oldUrl !== info.url && State.bookmarksUrlMap[oldUrl]) {
        const iob = State.bookmarksUrlMap[oldUrl].findIndex(b => b.id === id)
        if (iob > -1) State.bookmarksUrlMap[oldUrl].splice(iob, 1)
      }

      const bookmark = State.bookmarksMap[id]
      if (bookmark) {
        if (bookmark.title !== info.title) bookmark.title = info.title
        if (bookmark.url !== info.url) {
          bookmark.url = info.url
          bookmark.host = info.url.split('/')[2]
          if (State.bookmarksUrlMap[info.url]) {
            State.bookmarksUrlMap[info.url].push(bookmark)
          } else {
            State.bookmarksUrlMap[info.url] = [bookmark]
          }
        }
      }
    },

    /**
     * Handle moving bookmark
     */
    onMoved(id, info) {
      if (!State.bookmarks.length) return

      const oldParent = State.bookmarksMap[info.oldParentId]
      const newParent = State.bookmarksMap[info.parentId]

      if (oldParent && newParent) {
        const node = oldParent.children.splice(info.oldIndex, 1)[0]
        for (let i = info.oldIndex; i < oldParent.children.length; i++) {
          oldParent.children[i].index--
        }

        node.index = info.index
        node.parentId = info.parentId

        newParent.children.splice(node.index, 0, node)
        for (let i = info.index + 1; i < newParent.children.length; i++) {
          newParent.children[i].index++
        }
      }

      Actions.saveBookmarksTree(State)
    },

    /**
     * Handle removing bookmark node
     */
    onRemoved(id, info) {
      if (!State.bookmarks.length) return

      const parent = State.bookmarksMap[info.parentId]
      const node = State.bookmarksMap[id]
      const url = node ? node.url : undefined
      if (parent) {
        parent.children.splice(info.index, 1)
        for (let i = info.index; i < parent.children.length; i++) {
          parent.children[i].index--
        }
      }

      State.bookmarksMap[id] = undefined
      if (url && State.bookmarksUrlMap[url]) {
        const ib = State.bookmarksUrlMap[url].findIndex(b => b.id === id)
        if (ib > -1) State.bookmarksUrlMap[url].splice(ib, 1)
      }
    },

    /**
     * Calculate bookmarks bounds
     */
    getItemsBounds() {
      // probe bookmarks height
      const compStyle = getComputedStyle(this.$el)
      const fhRaw = compStyle.getPropertyValue('--bookmarks-folder-height')
      const fh = Utils.parseCSSNum(fhRaw.trim())[0]
      const fc = fh >> 1
      const fe = fc >> 1
    
      const bhRaw = compStyle.getPropertyValue('--bookmarks-bookmark-height')
      const bh = Utils.parseCSSNum(bhRaw.trim())[0]
      const bc = bh >> 1
      const be = bc >> 1

      const shRaw = compStyle.getPropertyValue('--bookmarks-separator-height')
      const sh = Utils.parseCSSNum(shRaw.trim())[0]
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
