<template lang="pug">
.BookmarksPopup.popup-container(@mousedown.stop.self="onCancel" @mouseup.stop)
  .popup(v-if="Bookmarks.reactive.popup")
    h2 {{Bookmarks.reactive.popup.title}}
    .field(v-if="Bookmarks.reactive.popup.nameField")
      .field-label {{translate('popup.bookmarks.name_label')}}
      TextInput.input(
        ref="nameInput"
        v-model:value="Bookmarks.reactive.popup.name"
        :or="translate(titlePlaceholder)"
        :tabindex="state.tabindex"
        :line="true"
        @update:value="validate()"
        @keydown="onTitleKD")
    .field(v-if="Bookmarks.reactive.popup.urlField")
      .field-label URL
      TextInput.input(
        ref="urlInput"
        v-model:value="Bookmarks.reactive.popup.url"
        :or="translate('bookmarks_editor.url_placeholder')"
        :tabindex="state.tabindex"
        :line="true"
        @update:value="validate()"
        @keydown="onUrlKD")
    .location(
      v-if="Bookmarks.reactive.popup.locationField"
      :title="path"
      @click="toggleTree()")
      .field-label {{translate('popup.bookmarks.location_label')}}
      .location-body
        .location-value {{selectedFolder}}
        .new-folder-btn(v-if="!state.newFolderMode" @click.stop="onNewFolderClick")
          svg: use(xlink:href="#icon_new_folder")
      .new-folder-field(v-if="state.newFolderMode")
        LoadingDots(v-if="state.creatingNewFolder")
        TextInput.new-folder-input(
          v-if="!state.creatingNewFolder"
          ref="newFolderTitleInput"
          v-model:value="state.newFolderTitle"
          :or="translate('popup.bookmarks.location_new_folder_placeholder')"
          :line="true"
          @click.stop=""
          @keydown="onNewFolderKD")
        .new-folder-btn(v-if="!state.creatingNewFolder" @click.stop="onNewFolderClick")
          svg
            use(v-if="state.newFolderTitle" xlink:href="#icon_new_folder")
            use(v-else xlink:href="#icon_x")
    .tree(v-if="state.showTree")
      ScrollBox
        BookmarkNode.root-node(
          v-for="node in Bookmarks.reactive.tree"
          :key="node.id"
          :node="node"
          :filter="foldersFilter")
        LoadingDots(v-if="state.loading")
    .recent-locations(v-if="state.bookmarksRecentFolders.length && !state.showTree")
      .field-label {{translate('popup.bookmarks.recent_locations_label')}}
      .recent-folder(
        v-for="folder of state.bookmarksRecentFolders"
        :key="folder.id"
        :data-sel="folder.id === Bookmarks.reactive.popup.location"
        @click="onRecentFolderClick(folder)")
        svg.folder-icon: use(xlink:href="#icon_folder")
        .folder-label {{folder.title}}
    .ctrls
      .btn(
        v-for="ctrl of Bookmarks.reactive.popup.controls"
        :class="{ '-inactive': ctrl.inactive }"
        @click="onOk") {{translate(ctrl.label)}}
      .btn.-warn(@click="onCancel") {{translate('btn.cancel')}}
</template>

<script lang="ts" setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { translate } from 'src/dict'
import { Bookmark, Stored, TextInputComponent } from 'src/types'
import { NOID, BKM_ROOT_ID } from 'src/defaults'
import { Bookmarks } from 'src/services/bookmarks'
import { Selection } from 'src/services/selection'
import BookmarkNode from './bookmark-node.vue'
import ScrollBox from './scroll-box.vue'
import LoadingDots from './loading-dots.vue'
import TextInput from '../../components/text-input.vue'
import Utils from 'src/utils'
import { Store } from 'src/services/storage'

const nameInput = ref<TextInputComponent | null>(null)
const urlInput = ref<TextInputComponent | null>(null)
const newFolderTitleInput = ref<TextInputComponent | null>(null)

const state = reactive({
  loading: true,
  wrongValueAnimation: false,
  showTree: false,
  tabindex: '-1',
  type: 'bookmark' as browser.bookmarks.TreeNodeType,
  title: '',
  url: '',
  newFolderTitle: '',
  newFolderMode: false,
  creatingNewFolder: false,
  path: [] as Bookmark[],
  bookmarksRecentFolders: [] as Bookmark[],
})

let validateTimeout: number | undefined

const selectedFolder = computed((): string => {
  const location = Bookmarks.reactive.popup?.location ?? NOID
  if (location === NOID) return '---'
  let folder = Bookmarks.reactive.byId[location]
  if (!folder || folder.type !== 'folder') return '---'
  return folder.title
})

const path = computed<string>(() => {
  const location = Bookmarks.reactive.popup?.location ?? NOID
  if (!Bookmarks.reactive.tree.length) return ''
  if (location === NOID) return ''
  let folder = Bookmarks.reactive.byId[location]
  if (!folder || folder.type !== 'folder') return ''

  let result = folder.title + ' /'
  while (Bookmarks.reactive.byId[folder.parentId]) {
    folder = Bookmarks.reactive.byId[folder.parentId]
    result = folder.title + ' / ' + result
  }

  return result.trim()
})

const titlePlaceholder = computed((): string => {
  if (state.type === 'bookmark') return 'bookmarks_editor.name_bookmark_placeholder'
  else return 'bookmarks_editor.name_folder_placeholder'
})

void (async function init() {
  if (!Bookmarks.reactive.popup) return

  state.showTree = !!Bookmarks.reactive.popup.locationTree
  state.tabindex = '0'

  nextTick(() => {
    if (nameInput.value) nameInput.value.recalcTextHeight()
    if (urlInput.value) urlInput.value.recalcTextHeight()
  })

  setTimeout(() => {
    const popup = Bookmarks.reactive.popup
    if (!popup) return

    if (nameInput.value) nameInput.value.focus()

    if (popup.locationField && popup.location && popup.location !== NOID) {
      Selection.selectBookmark(popup.location)

      if (state.showTree) {
        Bookmarks.collapseAllBookmarks()
        const folder = Bookmarks.reactive.byId[popup.location]
        if (folder?.parentId && folder.parentId !== BKM_ROOT_ID) {
          Bookmarks.expandBookmark(folder.parentId)
        }
      }
    }
  }, 256)

  if (!Bookmarks.reactive.tree.length) await Bookmarks.load()
  if (Bookmarks.reactive.popup.recentLocations) loadBookmarksRecentFolders()
  setTimeout(() => (state.loading = false), 120)

  validate()
})()

async function loadBookmarksRecentFolders(): Promise<void> {
  const stored = await browser.storage.local.get<Stored>('bookmarksRecentFolders')
  if (!stored.bookmarksRecentFolders || !stored.bookmarksRecentFolders.length) return

  let firstFolderId: ID | undefined
  const folders = []
  for (const id of stored.bookmarksRecentFolders) {
    const folder = Bookmarks.reactive.byId[id]
    if (folder) {
      folders.push(folder)
      if (!firstFolderId) firstFolderId = id
    }
  }

  state.bookmarksRecentFolders = folders
  if (Bookmarks.reactive.popup) Bookmarks.reactive.popup.location = firstFolderId
}

const RECENT_FOLDERS_LIMIT = 5
async function saveBookmarksRecentFolders(lastFolderId: ID): Promise<void> {
  const lastFolder = Bookmarks.reactive.byId[lastFolderId]
  if (!lastFolder) return

  const recentIndex = state.bookmarksRecentFolders.findIndex(f => f.id === lastFolderId)
  if (recentIndex !== -1) state.bookmarksRecentFolders.splice(recentIndex, 1)

  const ids: ID[] = [lastFolderId]
  const limit = RECENT_FOLDERS_LIMIT - 1
  for (let i = 0; i < limit; i++) {
    const folder = state.bookmarksRecentFolders[i]
    if (!folder) break

    ids.push(folder.id)
  }

  await Store.set({ bookmarksRecentFolders: ids })
}

function toggleTree(): void {
  if (!Bookmarks.reactive.popup?.location) return

  state.showTree = !state.showTree

  if (state.showTree) {
    Bookmarks.collapseAllBookmarks()
    const folder = Bookmarks.reactive.byId[Bookmarks.reactive.popup.location]
    if (folder?.parentId && folder.parentId !== BKM_ROOT_ID) {
      Bookmarks.expandBookmark(folder.parentId)
    }
  } else {
    Selection.resetSelection()
    Bookmarks.collapseAllBookmarks()
    Bookmarks.restoreTree()
  }
}

async function onNewFolderClick(e: MouseEvent): Promise<void> {
  if (!state.newFolderMode) {
    state.newFolderMode = true
    await nextTick()
    if (newFolderTitleInput.value) newFolderTitleInput.value.focus()
    return
  }

  if (!state.newFolderTitle) state.newFolderMode = false
  else await createNewFolder()
}

async function createNewFolder(): Promise<void> {
  if (!Bookmarks.reactive.popup) return

  state.creatingNewFolder = true

  const location = Bookmarks.reactive.popup.location ?? NOID
  let parent = Bookmarks.reactive.byId[location]
  if (!parent || parent.type !== 'folder') return

  const folder = (await browser.bookmarks.create({
    index: parent.children?.length ?? 0,
    parentId: parent.id,
    title: state.newFolderTitle.trim(),
    type: 'folder',
  })) as Bookmark

  if (!folder) {
    state.creatingNewFolder = false
    return
  }

  await Utils.sleep(750)

  Bookmarks.reactive.popup.location = folder.id

  if (state.showTree) {
    Selection.resetSelection()
    Selection.selectBookmark(folder.id)
  }

  state.newFolderMode = false
  state.newFolderTitle = ''
  state.creatingNewFolder = false
}

function onNewFolderKD(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    state.newFolderMode = false
    state.newFolderTitle = ''
  }
  if (e.key === 'Enter') {
    if (!state.newFolderTitle) state.newFolderMode = false
    else createNewFolder()
  }
}

function onTitleKD(e: KeyboardEvent): void {
  if (e.key === 'Escape') onCancel()
  if (e.key === 'Enter') {
    e.preventDefault()
    onOk()
  }
}

function onUrlKD(e: KeyboardEvent): void {
  if (e.key === 'Escape') onCancel()
  if (e.key === 'Enter') {
    e.preventDefault()
    onOk()
  }
}

function validate(): void {
  clearTimeout(validateTimeout)
  validateTimeout = setTimeout(() => {
    if (Bookmarks.reactive.popup?.validate) {
      Bookmarks.reactive.popup.validate(Bookmarks.reactive.popup)
    }
  }, 200)
}

function onOk(): void {
  if (!Bookmarks.reactive.popup) return

  if (!Bookmarks.reactive.popup.nameValid && nameInput.value) {
    nameInput.value.error()
    return
  }

  if (!Bookmarks.reactive.popup.urlValid && urlInput.value) {
    urlInput.value.error()
    return
  }

  if (Bookmarks.reactive.popup.location && Bookmarks.reactive.popup.recentLocations) {
    saveBookmarksRecentFolders(Bookmarks.reactive.popup.location)
  }

  state.tabindex = '-1'
  Selection.resetSelection()

  if (state.showTree) {
    Bookmarks.collapseAllBookmarks()
    Bookmarks.restoreTree()
  }

  Bookmarks.reactive.popup.close({
    name: Bookmarks.reactive.popup.name,
    url: Bookmarks.reactive.popup.url,
    location: Bookmarks.reactive.popup.location,
    controlIndex: 0,
  })
}

function onCancel(): void {
  if (!Bookmarks.reactive.popup) return

  state.tabindex = '-1'
  Selection.resetSelection()

  if (state.showTree) {
    Bookmarks.collapseAllBookmarks()
    Bookmarks.restoreTree()
  }

  Bookmarks.reactive.popup.close()
}

function foldersFilter(node: Bookmark): boolean {
  return node.type === 'folder'
}

function onRecentFolderClick(folder: Bookmark): void {
  if (!Bookmarks.reactive.popup) return
  Bookmarks.reactive.popup.location = folder.id
}
</script>
