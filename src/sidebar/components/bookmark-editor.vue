<template lang="pug">
.BEditor(@click="$store.state.bookmarkEditor = false")
  .editor-panel(@click.stop="")
    .field.-title
      TextInput.input(
        ref="title"
        v-model="title"
        :or="t(titlePlaceholder)"
        :tabindex="tabindex"
        @keydown="onTitleKD")
    .field.-url(v-if="isBookmark")
      TextInput.input(
        ref="url"
        v-model="url"
        :or="t('bookmarks_editor.url_placeholder')"
        :tabindex="tabindex"
        :line="true"
        @keydown="onUrlKD")
    
    .ctrls
      .btn(@click="onOk") {{t(okBtnLabel)}}
      .btn.-warn(@click="onCancel") {{t('btn.cancel')}}
</template>

<script>
import TextInput from '../../components/text-input'
import State from '../store/state'

const URL_RE = /^(https?:\/\/.+|about:.+)/

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
      title: '',
      url: '',
      tags: '', // https://bugzilla.mozilla.org/show_bug.cgi?id=1225916
      path: [],
    }
  },

  computed: {
    titlePlaceholder() {
      if (this.type === 'bookmark') return 'bookmarks_editor.name_bookmark_placeholder'
      else return 'bookmarks_editor.name_folder_placeholder'
    },

    okBtnLabel() {
      if (this.action === 'create') return 'btn.create'
      else return 'btn.save'
    },

    isBookmark() {
      return this.type === 'bookmark'
    },
  },

  created() {
    if (!State.bookmarkEditorTarget) return

    let done = false
    const path = []
    const walker = nodes => {
      for (let n of nodes) {
        if (done) break
        if (n.type !== 'folder') continue
        path.push(n)
        if (n.id === State.bookmarkEditorTarget.parentId) {
          done = true
          break
        }
        walker(n.children)
        if (!done) path.pop()
      }
    }
    walker(State.bookmarks)

    if (State.bookmarkEditorTarget.title) this.edit(State.bookmarkEditorTarget, path)
    else this.create(State.bookmarkEditorTarget.type, path)
  },

  methods: {
    /**
     * KeyDown handler for name input
     */
    onTitleKD(e) {
      if (e.key === 'Escape') this.onCancel()
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
      if (e.key === 'Escape') this.onCancel()
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
      this.title = ''
      this.url = ''
      this.tags = ''
      this.path = path
      this.tabindex = '0'

      this.$nextTick(() => {
        if (this.$refs.title) this.$refs.title.recalcTextHeight()
        if (this.$refs.url) this.$refs.url.recalcTextHeight()
      })

      setTimeout(() => {
        if (this.$refs.title) this.$refs.title.focus()
      }, 256)
    },

    /**
     * Start editor in editing mode
     */
    edit(node, path = []) {
      this.action = 'edit'
      this.id = node.id
      this.type = node.type
      this.title = node.title
      this.url = node.url
      this.path = path
      this.tags = ''
      this.tabindex = '0'

      this.$nextTick(() => {
        if (this.$refs.title) this.$refs.title.recalcTextHeight()
        if (this.$refs.url) this.$refs.url.recalcTextHeight()
      })

      setTimeout(() => {
        if (this.$refs.title) this.$refs.title.focus()
      }, 256)
    },

    /**
     * Ok button (create/save) click handler
     */
    onOk() {
      if (!this.title) {
        if (this.$refs.title) this.$refs.title.error()
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
      State.bookmarkEditor = false
      State.bookmarkEditorTarget = null
    },

    /**
     * Create new bookmark node
     */
    createNode() {
      let index = State.bookmarkEditorTarget.index || 0
      browser.bookmarks.create({
        parentId: this.path[this.path.length - 1].id,
        title: this.title,
        type: this.type,
        url: this.url,
        index,
      })

      this.tabindex = '-1'
      State.bookmarkEditor = false
      State.bookmarkEditorTarget = null
    },

    /**
     * Update bookmark node
     */
    updateNode() {
      browser.bookmarks.update(this.id, {
        title: this.title,
        url: this.url,
      })

      this.tabindex = '-1'
      State.bookmarkEditor = false
      State.bookmarkEditorTarget = null
    },
  },
}
</script>
