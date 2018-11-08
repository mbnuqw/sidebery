<template lang="pug">
.Node(
  :n-type="node.type"
  :is-expanded="expanded"
  :is-parent="!!isParent"
  :to-front="toFront || editorSelect"
  :menu="menu")
  .body(:title="tooltip", @click="onClick", @mousedown="onMD")
    .fav(v-if="isBookmark", :no-fav="!favicon")
      .placeholder
      img(:src="favicon")
    .exp(v-if="isParent")
      svg: use(xlink:href="#icon_expand")
    .title(v-if="node.title") {{node.title}}
  transition(name="expand")
    .children(v-if="isParent" v-show="expanded")
      b-node.child(
        v-for="(n, i) in node.children"
        ref="children"
        :key="n.id"
        :node="n"
        :recalc-scroll="recalcScroll"
        :edit-node="editNode"
        @md="onChildMD"
        @expand="onFolderExpand"
        @create="onCreate"
        @edit="onEdit")
</template>


<script>
import Store from './store'
import State from './store.state'

export default {
  name: 'BNode',
  props: {
    node: Object,
    recalcScroll: Function,
    editNode: String,
  },

  data() {
    return {
      expanded: false,
      menu: false,
      toFront: false,
      editorSelect: false,
    }
  },

  computed: {
    editable() {
      return this.node.parentId !== 'root________'
    },

    isParent() {
      return this.node.children && this.node.children.length
    },

    isFolder() {
      return this.node.type === 'folder'
    },

    isBookmark() {
      return this.node.type === 'bookmark'
    },

    hostname() {
      if (!this.node.url) return
      return this.node.url.split('/')[2]
    },

    favicon() {
      if (!this.hostname) return
      return State.favicons[this.hostname]
    },

    tooltip() {
      return `${this.node.title}\n${this.node.url}`
    },
  },

  created() {
    this.expanded = !!this.node.expanded
  },

  methods: {
    onMD(e) {
      if (e.button === 0) this.$emit('md', e, [this.node])
      if (e.button === 1) this.openUrl(true, false)
      if (e.button === 2) {
        e.stopPropagation()
        this.openMenu(true)
      }
    },

    onClick() {
      if (this.node.type === 'folder') {
        this.expanded = !this.expanded
        this.node.expanded = this.expanded
        this.$emit('expand', this.node)
        setTimeout(() => this.recalcScroll(), 120)
      }
      if (this.node.type === 'bookmark') {
        this.openUrl(State.openBookmarkNewTab, true)
      }
    },

    onFolderExpand(node) {
      this.$emit('expand', node)
    },

    onChildMD(e, nodes) {
      nodes.push(this.node)
      this.$emit('md', e, nodes)
    },

    collapse(deep = false) {
      this.expanded = false
      this.node.expanded = this.expanded

      if (deep) {
        if (!this.$refs.children) return
        this.$refs.children.map(n => n.collapse(true))
      }
    },

    openMenu(isTarget) {
      if (isTarget) {
        Store.commit('closeCtxMenu')

        const openNewWinLabel = this.t('ctx_menu.open_in_new_window')
        const openPrivWinLabel = this.t('ctx_menu.open_in_new_priv_window')
        const openDefLabel = this.t('ctx_menu.open_in_default_panel')
        const openPanLabel = this.t('ctx_menu.open_in_')

        let isSep = this.node.type === 'separator'
        let opts = []
        if (!isSep) {
          opts.push([openNewWinLabel, this.openInNewWin])
          opts.push([openPrivWinLabel, this.openInNewWin, { priv: true }])
          if (this.isParent) opts.push([openDefLabel, this.openInPanel, 'firefox-default'])
          this.$root.$refs.sidebar.contexts.map(c => {
            opts.push([
              openPanLabel + `||${c.colorCode}>>${c.name}`, this.openInPanel, c.cookieStoreId
            ])
          })
        }
        if (this.isFolder) {
          opts.push([this.t('ctx_menu.create_bookmark'), this.create, 'bookmark'])
          opts.push([this.t('ctx_menu.create_folder'), this.create, 'folder'])
          opts.push([this.t('ctx_menu.create_separator'), this.create, 'separator'])
        }
        if (this.editable && !isSep) opts.push([this.t('ctx_menu.edit_bookmark'), this.edit])
        if (this.editable) opts.push([this.t('ctx_menu.delete_bookmark'), this.remove])

        State.ctxMenu = {
          el: this.$el.childNodes[0],
          off: this.closeMenu,
          opts,
        }
        this.menu = true
      }
      this.toFront = true
      if (this.$parent.openMenu) this.$parent.openMenu()
    },

    closeMenu() {
      this.menu = false
      this.toFront = false
      if (this.$parent.closeMenu) this.$parent.closeMenu()
    },

    openUrl(inNewTab, withFocus) {
      if (!this.node.url) return
      if (inNewTab) {
        let p = this.$root.getDefaultPanel()
        let index = p.endIndex + 1
        browser.tabs.create({
          index,
          url: this.node.url,
          active: withFocus,
        })
      } else {
        browser.tabs.update({ url: this.node.url })
        if (withFocus) this.$root.goToActiveTabPanel()
      }
    },

    openInPanel(panelId) {
      let p = this.$root.getPanel(panelId)
      let index = p.endIndex + 1

      if (this.isBookmark) {
        browser.tabs.create({
          index: index,
          url: this.node.url,
          cookieStoreId: panelId,
        })
      }

      if (this.isParent) {
        const urls = []
        const walker = list =>
          list.map(n => {
            if (n.type === 'bookmark' && !n.url.indexOf('http')) urls.push(n.url)
            if (n.type === 'folder') walker(n.children)
          })
        walker(this.node.children)

        urls.map(url => {
          browser.tabs.create({
            index: index++,
            url: url,
            cookieStoreId: panelId,
          })
        })
      }
    },

    openInNewWin({ priv }) {
      if (this.isBookmark) {
        return browser.windows.create({ url: this.node.url, incognito: priv })
      }

      if (this.isParent) {
        const urls = []
        const walker = list =>
          list.map(n => {
            if (n.type === 'bookmark' && !n.url.indexOf('http')) urls.push(n.url)
            if (n.type === 'folder') walker(n.children)
          })
        walker(this.node.children)
        return browser.windows.create({ url: urls, incognito: priv })
      }
    },

    remove() {
      if (!this.isParent) browser.bookmarks.remove(this.node.id)
      else browser.bookmarks.removeTree(this.node.id)
    },

    create(type) {
      if (this.isFolder) this.$emit('create', type, [this.node], [this.onEditEnd])
      else this.$emit('create', type, [])
      this.editorSelect = true
    },
    onCreate(type, path, onEndHandlers) {
      path.push(this.node)
      onEndHandlers.push(this.onEditEnd)
      this.$emit('create', type, path, onEndHandlers)
      this.editorSelect = true
    },

    edit() {
      this.editorSelect = true
      if (this.isFolder) this.$emit('edit', this.node, [this.node], [this.onEditEnd])
      else this.$emit('edit', this.node, [], [this.onEditEnd])
    },
    onEdit(node, path, onEndHandlers) {
      path.push(this.node)
      this.$emit('edit', node, path, onEndHandlers)
    },
    onEditEnd() {
      this.editorSelect = false
    },
  },
}
</script>


<style lang="stylus">
@import '../styles/mixins'

.Node
  box(relative)
  padding: 0 0 0 12px
  margin: 0
  border-top-left-radius: 3px
  border-bottom-left-radius: 3px

.Node[n-type="bookmark"]
  > .body
    size(h: 24px)
    > .title
      text(s: rem(14), w: 400)

.Node[n-type="folder"]
  &:not([is-parent]) // Empty folder
    > .body
    > .body:hover
    > .body:active
      > .title
        color: var(--bookmarks-folder-empty-fg)
  > .body
    size(h: 28px)
    &:hover > .title
      color: var(--bookmarks-folder-closed-fg-hover)
    &:active > .title
      color: var(--bookmarks-folder-closed-fg-active)
    > .title
      text(s: rem(16), w: 400)
      color: var(--bookmarks-folder-closed-fg)

.Node[n-type="separator"]
  > .body
    size(h: 17px)
    &:before
      content: ''
      box(absolute)
      pos(8px, l: 16px)
      size(calc(100% - 16px), 1px)
      border-radius: 2px
      background-image: linear-gradient(90deg, transparent, #545454, #545454, #545454)

// > To Front
.Node[to-front="true"]
  z-index: 100

// > Expanded
.Node[is-expanded][is-parent]
  > .body
    &:hover > .title
      color: var(--bookmarks-folder-open-hover-fg)
    &:active > .title
      color: var(--bookmarks-folder-open-active-fg)
    > .title
      color: var(--bookmarks-folder-open-fg)
      mask: linear-gradient(-90deg, transparent 12px, #000000 24px, #000000)
      transform: translateX(12px)
  > .body > .exp
    transform: translateX(-6px)
    opacity: 1
  > .body > .exp > svg
    transform: rotateZ(0deg)

// > Opened Menu
.Node[menu="true"][n-type="bookmark"]
.Node[menu="true"][n-type="folder"]
.Node[menu="true"][n-type="separator"]
  z-index: 30
  background-color: var(--tabs-selected-bg)
  > .body
  > .body:hover
  > .body:active
    z-index: 100
    > .title
      color: var(--tabs-selected-fg)

.Node[menu="true"][n-type="separator"]
  > .body
    &:before
      background-image: linear-gradient(90deg, transparent, var(--tabs-selected-fg), var(--tabs-selected-fg), var(--tabs-selected-fg))

// Body of node
.Node .body
  box(relative, flex)
  align-items: center
  cursor: pointer
  transform: tranlateZ(0)
  transition: opacity var(--d-fast)
  &:hover > .title
    color: var(--c-label-fg-hover)
  &:active > .title
    transition: none
    color: var(--c-label-fg-active)

// Favicon
.Node .fav
  box(relative)
  size(16px, same)
  flex-shrink: 0
  margin: 0 8px 0 0
  z-index: 20
  transition: opacity var(--d-fast), transform var(--d-fast)
  &[no-fav]
    > .placeholder
      opacity: 1
      transform: translateY(0)
    > img
      opacity: 0
      transform: translateY(-4px)
.Node .fav > .placeholder
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
.Node .fav > img
  box(absolute)
  pos(0, 0)
  size(100%, same)
  transition: opacity var(--d-fast), transform var(--d-fast)

// Title
.Node .title
  box(relative)
  size(100%)
  color: var(--c-label-fg)
  white-space: nowrap
  overflow: hidden
  transition: transform var(--d-fast)
  mask: linear-gradient(-90deg, transparent, #000000 12px, #000000)

// Node's children box
.Node .children
  box(relative)
  transform: tranlateZ(0)

// Expanded state icon
.Node .exp
  box(absolute)
  size(15px, same)
  margin: 1px 2px 0 0
  flex-shrink: 0
  transform: translateX(-14px)
  opacity: 0
  transition: transform var(--d-fast), opacity var(--d-fast)
.Node .exp > svg
  box(absolute)
  pos(0, 0)
  size(100%, same)
  fill: var(--bookmarks-folder-open-fg)
  transform: rotateZ(-90deg)
  transition: transform var(--d-fast)

// --- Vue transitions ---
.expand-enter-active
  transition: opacity var(--d-norm), transform var(--d-fast)
.expand-enter
  opacity: 0
  transform: translateX(-12px)
.expand-enter-to
.expand-leave
  opacity: 1
  transform: translateX(0)
</style>
