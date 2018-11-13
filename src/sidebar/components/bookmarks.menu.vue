<template lang="pug">
.Menu(v-noise:300.g:12:af.a:0:42.s:0:9="")
  h2 {{t('bookmarks_menu.title')}}
  .options
    .opt(@click="reloadBookmarks") {{t('bookmarks_menu.reload_bookmarks_tree')}}
    .opt(@click="collapseAll") {{t('bookmarks_menu.collapse_all_folders')}}
</template>


<script>
import EventBus from '../event-bus'

export default {
  props: {
    conf: Object,
  },

  data() {
    return {}
  },

  methods: {
    collapseAll() {
      EventBus.$emit('bookmarks.collapseAll')
      this.$emit('close')
    },

    reloadBookmarks() {
      EventBus.$emit('bookmarks.reloadBookmarks')
      this.$emit('close')
    },
  },
}
</script>
