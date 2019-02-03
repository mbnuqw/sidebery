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
      @create="onCreate"
      @edit="onEdit")

  bookmarks-editor.editor(
    ref="editor"
    :is-active="editor"
    @cancel="onEditorCancel"
    @create="onEditorOk"
    @change="onEditorOk")
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

    /**
     * Handle creating bookmark
     */
    onCreated(id, bookmark) {
      let added = false
      if (bookmark.type === 'folder' && !bookmark.children) bookmark.children = []
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
     * Handle creating new bookmark
     */
    onCreate(type, path, onEndHandlers) {
      if (type === 'separator') {
        browser.bookmarks.create({
          parentId: path[0].id,
          type: 'separator',
          index: 0,
        })
        return
      }

      if (!this.$refs.editor) return
      this.$refs.editor.create(type, path)
      this.editor = true
      this.editEndHandlers = onEndHandlers
    },

    /**
     * Handle edit event of nodes tree
     */
    onEdit(node, path, onEndHandlers) {
      if (!this.$refs.editor) return
      this.$refs.editor.edit(node, path)
      this.editor = true
      this.editEndHandlers = onEndHandlers
    },

    /**
     * Handle cancel changes in editor
     */
    onEditorCancel() {
      this.editor = false
      while (this.editEndHandlers && this.editEndHandlers[0]) {
        this.editEndHandlers.pop()()
      }
    },

    /**
     * Handle saving changes in editor
     */
    onEditorOk() {
      this.editor = false
      while (this.editEndHandlers && this.editEndHandlers[0]) {
        this.editEndHandlers.pop()()
      }
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

.Bookmarks[drag-active="true"] .drag-box
  opacity: 1
  z-index: 10

.Bookmarks[drag-active="true"] .node
  opacity: 0

.Bookmarks[drag-end="true"] .drag-node[dragged]
  transition: transform var(--d-fast)

.Bookmarks[ctx-menu] .Node:not([to-front="true"]) > .body
  opacity: .4

.Bookmarks[editing] .Node:not([to-front]) > .body
  opacity: .4

.Bookmarks[not-renderable] .node
  box(none)

.Bookmarks[invisible] .node
  opacity: 0

// --- Draggable nodes ---
.Bookmarks .drag-box
  box(absolute)
  pos(0, 0)
  size(100%, same)
  opacity: 0
  z-index: -1
  transition: opacity var(--d-fast), z-index var(--d-fast)

.Bookmarks .drag-node
  box(absolute, flex)
  pos(0, 0)
  size(100%)
  align-items: center
  white-space: nowrap
  transition: transform var(--d-fast), opacity var(--d-fast)
  border-top-left-radius: 3px
  border-bottom-left-radius: 3px
  opacity: .4

  &[n-type="bookmark"]
    text(s: rem(14))
    padding-left: 12px
    color: var(--bookmarks-node-title-fg)

  &[n-type="folder"]
    text(s: rem(16))
    padding-left: 12px
    color: var(--bookmarks-folder-closed-fg)

  &[n-type="separator"]
    size(h: 17px)
    &:before
      content: ''
      box(absolute)
      pos(8px, l: 16px)
      size(calc(100% - 16px), 1px)
      border-radius: 2px
      background-image: linear-gradient(90deg, transparent, #545454, #545454, #545454)

  &[dragged]
    transition: none
    z-index: 50
    opacity: 1
    background-image: var(--bookmarks-drag-gradient)

  &[exp] > .title
    transform: translateX(12px)

  &[drag-parent="true"]
    opacity: 1

.Bookmarks .drag-node > .exp
  box(absolute)
  size(15px, same)
  flex-shrink: 0
  transform: translateX(-6px)
  transition: transform var(--d-fast), opacity var(--d-fast)

.Bookmarks .drag-node > .exp > svg
  box(absolute)
  pos(0, 0)
  size(100%, same)
  fill: var(--bookmarks-folder-open-fg)
  transform: rotateZ(0deg)
  transition: transform var(--d-fast)

.Bookmarks .drag-node > .fav
  box(relative)
  size(16px, same)
  flex-shrink: 0
  margin: 0 8px 0 0

.Bookmarks .drag-node > .fav > .placeholder
  box(absolute)
  size(3px, same)
  pos(7px, 6px)
  border-radius: 50%
  background-color: var(--favicons-placehoder-bg)
  &:before
  &:after
    content: ''
    box(absolute)
    size(3px, same)
    border-radius: 6px
    background-color: var(--favicons-placehoder-bg)
  &:before
    pos(0, -5px)
  &:after
    pos(0, 5px)

.Bookmarks .drag-node > .fav > img
  box(absolute)
  pos(0, 0)
  size(100%, same)

.Bookmarks .drag-node > .title
  box(relative)
  transition: transform var(--d-fast)

// --- Root nodes ---
.Bookmarks .node
  box(relative)
  opacity: 1
  transition: opacity var(--d-fast)
</style>
