<template lang="pug">
.BEditor(v-noise:300.g:12:af.a:0:42.s:0:9="")
  .field.-name
    text-input.input(
      ref="name"
      v-model="name"
      :or="t(namePlaceholder)"
      :tabindex="tabindex"
      @keydown="onNameKD")
  .field.-url(v-if="isBookmark")
    text-input.input(
      ref="url"
      v-model="url"
      :or="t('bookmarks_editor.url_placeholder')"
      :tabindex="tabindex"
      :line="true"
      @keydown="onUrlKD")
  
  .ctrls
    .btn(@click="onOk") {{t(okBtnLabel)}}
    .btn(@click="onCancel") {{t('bookmarks_editor.cancel')}}
</template>


<script>
import TextInput from './input.text.vue'

const URL_RE = /^(http:\/\/|https:\/\/)[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/

export default {
  components: {
    TextInput,
  },

  data() {
    return {
      tabindex: '-1',
      action: 'create',
      type: 'bookmark',
      id: '',
      name: '',
      url: '',
      tags: '', // https://bugzilla.mozilla.org/show_bug.cgi?id=1225916
      path: [],
    }
  },

  computed: {
    namePlaceholder() {
      if (this.type === 'bookmark') return 'bookmarks_editor.name_bookmark_placeholder'
      if (this.type === 'folder') return 'bookmarks_editor.name_folder_placeholder'
    },

    okBtnLabel() {
      if (this.action === 'create') return 'bookmarks_editor.create'
      if (this.action === 'edit') return 'bookmarks_editor.save'
    },

    isBookmark() {
      return this.type === 'bookmark'
    },
  },

  methods: {
    /**
     * KeyDown handler for name input
     */
    onNameKD(e) {
      if (e.key === 'Escape') this.$emit('cancel')
      if (e.key === 'Enter') {
        e.preventDefault()
        if ((this.isBookmark, this.$refs.url)) this.$refs.url.focus()
        else this.onOk()
      }
    },

    /**
     * KeyDown handler for url input
     */
    onUrlKD(e) {
      if (e.key === 'Escape') this.$emit('cancel')
      if (e.key === 'Enter') {
        e.preventDefault()
        this.onOk()
      }
    },

    /**
     * Start editor in creation mode
     */
    create(type, path = []) {
      this.action = 'create'
      this.type = type
      this.id = ''
      this.name = ''
      this.url = ''
      this.tags = ''
      this.path = path.reverse()
      this.tabindex = '0'

      this.$nextTick(() => {
        if (this.$refs.name) this.$refs.name.recalcTextHeight()
        if (this.$refs.url) this.$refs.url.recalcTextHeight()
      })

      setTimeout(() => {
        if (this.$refs.name) this.$refs.name.focus()
      }, 256)
    },

    /**
     * Start editor in editing mode
     */
    edit(node, path = []) {
      this.action = 'edit'
      this.id = node.id
      this.type = node.type
      this.name = node.title
      this.url = node.url
      this.path = path.reverse()
      this.tags = ''
      this.tabindex = '0'

      this.$nextTick(() => {
        if (this.$refs.name) this.$refs.name.recalcTextHeight()
        if (this.$refs.url) this.$refs.url.recalcTextHeight()
      })

      setTimeout(() => {
        if (this.$refs.name) this.$refs.name.focus()
      }, 256)
    },

    /**
     * Ok button (create/save) click handler
     */
    onOk() {
      if (!this.name) {
        if (this.$refs.name) this.$refs.name.error()
        return
      }
      if (this.isBookmark && !(this.url && URL_RE.test(this.url))) {
        if (this.$refs.url) this.$refs.url.error()
        return
      }
      if (this.action === 'create') this.createNode()
      if (this.action === 'edit') this.updateNode()
    },

    /**
     * Cancel button click handler
     */
    onCancel() {
      this.tabindex = '-1'
      this.$emit('cancel')
    },

    /**
     * Create new bookmark node
     */
    createNode() {
      browser.bookmarks.create({
        parentId: this.path[this.path.length - 1].id,
        title: this.name,
        type: this.type,
        url: this.url,
        index: 0,
      })

      this.tabindex = '-1'
      this.$emit('create')
    },

    /**
     * Update bookmark node
     */
    updateNode() {
      browser.bookmarks.update(this.id, {
        title: this.name,
        url: this.url,
      })

      this.tabindex = '-1'
      this.$emit('change')
    },
  },
}
</script>


<style lang="stylus">
@import '../../styles/mixins'

.BEditor
  box(absolute)
  size(100%)
  pos(b: 0, l: 0)
  padding: 0 0 16px
  background-color: var(--bookmarks-editor-bg)
  z-index: 100
  box-shadow: 0 -1px 12px 0 #00000056, 0 -1px 0 0 #00000012
  opacity: 0
  z-index: -1
  transform: translateY(100%)
  transition: opacity var(--d-fast), transform var(--d-fast), z-index var(--d-fast)
  &[is-active]
    opacity: 1
    z-index: 1000
    transform: translateY(0)

.BEditor .field
  box(relative)
  margin: 12px 16px 0
  &.-name
    > .input
      text(s: rem(18))
      color: var(--bookmarks-editor-name-fg)

.BEditor .field > .input
  text(s: rem(15))
  margin: 2px 0 0
  color: var(--bookmarks-editor-url-fg)
  transition: color 1s
  > input
  > textarea
  > .placeholder
    padding: 2px 0
  &.err
    transition: none
    color: var(--bookmarks-editor-error-fg)

.BEditor .ctrls
  box(relative, flex)
  align-items: center
  justify-content: center
  padding: 0 12px
  margin: 16px 0 0

.BEditor .ctrls > .btn
  text(s: rem(14))
  padding: 3px 10px
  margin: 0 8px
</style>
