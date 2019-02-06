<template lang="pug">
.Bookmarks(
  :drag-active="drag && drag.dragged"
  :drag-end="dragEnd"
  :ctx-menu="!!ctxMenuOpened"
  :editing="editor"
  :not-renderable="!renderable"
  :invisible="!visible"
  @click="onClick")
  scroll-box(ref="scrollBox")
    b-node.node(
      v-for="n in $store.state.bookmarks"
      ref="nodes"
      :key="n.id"
      :node="n"
      :recalc-scroll="recalcScroll"
      @start-selection="onStartSelection")
  bookmarks-editor.editor(v-if="$store.state.bookmarkEditor")
</template>


<script>
import { mapGetters } from 'vuex'
import Utils from '../../../libs/utils'
import Store from '../../store'
import State from '../../store.state'
import EventBus from '../../event-bus'
import ScrollBox from '../scroll-box.vue'
import BNode from './bookmarks.node.vue'
import BookmarksEditor from '../bookmarks-editor.vue'

export default {
  components: {
    ScrollBox,
    BNode,
    BookmarksEditor,
  },

  props: {
    active: Boolean,
    index: Number,
  },

  data() {
    return {
      topOffset: 0,
      drag: null,
      flat: [],
      dragEnd: false,
      editor: false,
      renderable: false,
      visible: false,
      lastScrollY: 0,
    }
  },

  computed: {
    ...mapGetters(['ctxMenuOpened']),
  },

  watch: {
    // If bookmarks too many, do not render
    // them when panel is inactive
    active(c, p) {
      const scrollBox = this.$refs.scrollBox
      if (!scrollBox) return

      // Activation
      if (c && !p) {
        setTimeout(() => {
          this.renderable = true
          setTimeout(() => {
            if (!this.visible) scrollBox.setScrollY(this.lastScrollY)
            this.visible = true
          }, 16)
        }, 128)
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
        }, 128)
      }
    },
  },

  async created() {
    browser.bookmarks.onCreated.addListener(this.onCreated)
    browser.bookmarks.onChanged.addListener(this.onChanged)
    browser.bookmarks.onMoved.addListener(this.onMoved)
    browser.bookmarks.onRemoved.addListener(this.onRemoved)

    // Setup global events listeners
    EventBus.$on('bookmarks.collapseAll', this.collapseAll)
    EventBus.$on('bookmarks.render', () => {
      if (this.active) {
        this.$nextTick(() => {
          this.renderable = true
          setTimeout(() => {
            this.visible = true
          }, 16)
        })
      }
    })
  },

  mounted() {
    this.topOffset = this.$el.getBoundingClientRect().top
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
      if (bookmark.type === 'folder' && !bookmark.children) bookmark.children = []
      if (bookmark.type === 'folder') bookmark.expanded = false
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

      State.bookmarks = putWalk(State.bookmarks)
    },

    /**
     * Handle bookmark change
     */
    onChanged(id, info) {
      let updated = false
      const updateWalk = nodes => {
        return nodes.map(n => {
          if (!n.children) return n
          let b = n.children.find(b => b.id === id)
          if (b) {
            n.children.splice(b.index, 1, {
              ...b,
              title: info.title || b.title,
              url: info.url || b.url,
            })
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
      Store.dispatch('saveTreeState')
    },

    /**
     * Handle removing bookmark node
     */
    onRemoved(id, info) {
      let removed = false
      const rmWalk = nodes => {
        return nodes.map(n => {
          if (n.id === info.parentId) {
            n.children.splice(info.index, 1)
            for (let i = info.index; i < n.children.length; i++) {
              n.children[i].index--
            }
            removed = true
          } else if (n.children && !removed) n.children = rmWalk(n.children)
          return n
        })
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
      if (!this.active) return
      if (this.$refs.scrollBox) {
        this.$refs.scrollBox.recalcScroll()
      }
    },

    /**
     * Collapse all bookmarks folders
     */
    collapseAll() {
      if (!this.$refs.nodes) return
      this.$refs.nodes.map(vm => {
        vm.collapse(true)
      })
      Store.dispatch('saveTreeState')
    },
  },
}
</script>


<style lang="stylus">
@import '../../../styles/mixins'

.Bookmarks
  overflow: hidden

// .Bookmarks[drag-active="true"] .drag-box
//   opacity: 1
//   z-index: 10

// .Bookmarks[drag-active="true"] .node
//   opacity: 0

// .Bookmarks[drag-end="true"] .drag-node[dragged]
//   transition: transform var(--d-fast)

// .Bookmarks[ctx-menu] .Node:not([to-front="true"]) > .body
//   opacity: .4

// .Bookmarks[editing] .Node:not([to-front]) > .body
//   opacity: .4

.Bookmarks[not-renderable] .node
  box(none)

.Bookmarks[invisible] .node
  opacity: 0

// --- Root nodes ---
.Bookmarks .node
  box(relative)
  opacity: 1
  transition: opacity var(--d-fast)
</style>
