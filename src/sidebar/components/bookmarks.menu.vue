<template lang="pug">
.Menu(v-noise:300.g:12:af.a:0:42.s:0:9="")
  h2 {{t('bookmarks_menu.title')}}
  .options
    .opt(@click="reloadBookmarks") {{t('bookmarks_menu.reload_bookmarks_tree')}}
    .opt(@click="collapseAll") {{t('bookmarks_menu.collapse_all_folders')}}
</template>


<script>
export default {
  props: {
    conf: Object,
  },

  data() {
    return {}
  },

  methods: {
    collapseAll() {
      this.$emit('panel-cmd', this.conf.name, 'collapseAll')
      this.$emit('close')
    },

    reloadBookmarks() {
      this.$emit('panel-cmd', this.conf.name, 'reloadBookmarks')
      this.$emit('close')
    },
  },
}
</script>
