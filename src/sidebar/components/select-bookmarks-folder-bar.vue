<template lang="pug">
.SelectBookmarksFolderBar(v-if="$store.state.selectBookmarkFolder")
  h2 {{t('bookmarks_select_folder.title')}}
  .folder-title(
    :data-wrong="wrongValueAnimation"
    @animationend="onAnimationEnd") {{folderName}}
  .ctrls
    .btn(@click="onSelectFolderOk") {{t('bookmarks_select_folder.ok')}}
    .btn.-warn(@click="onSelectFolderCancel") {{t('bookmarks_select_folder.cancel')}}
</template>

<script>
import State from '../store/state'

export default {
  data() {
    return {
      wrongValueAnimation: false,
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
      if (!State.selectBookmarkFolder.id) return this.error()
      if (State.selectBookmarkFolder.ok) State.selectBookmarkFolder.ok()
    },

    onSelectFolderCancel() {
      if (State.selectBookmarkFolder.cancel) State.selectBookmarkFolder.cancel()
    },

    error() {
      this.wrongValueAnimation = true
    },

    onAnimationEnd() {
      this.wrongValueAnimation = false
    },
  },
}
</script>
