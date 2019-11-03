<template lang="pug">
.SelectBookmarksFolderBar(
  v-if="$store.state.selectBookmarkFolder"
  v-noise:300.g:12:af.a:0:42.s:0:9="")
  h2 Select folder
  .folder-title {{folderName}}
  .ctrls
    .btn(@click="onSelectFolderOk") Ok
    .btn.-warn(@click="onSelectFolderCancel") Cancel
</template>


<script>
import State from '../store/state'

export default {
  data() {
    return {

    }
  },

  computed: {
    folderName() {
      if (!State.selected || !State.selected.length) return '---'
      let folderId = State.selected[0]
      if (!State.bookmarksMap) return '---'
      let folder = State.bookmarksMap[folderId]
      if (!folder || folder.type !== 'folder') return '---'
      return folder.title
    },
  },

  methods: {
    onSelectFolderOk() {
      if (State.selectBookmarkFolder.ok) State.selectBookmarkFolder.ok()
    },

    onSelectFolderCancel() {
      if (State.selectBookmarkFolder.cancel) State.selectBookmarkFolder.cancel()
    },
  },
}
</script>
