<template lang="pug">
.SearchBar(
  id="search_bar"
  :data-showed="Settings.state.searchBarMode === 'static' || Search.reactive.barIsShowed"
  :data-active="Search.reactive.popupIsShowed || Search.reactive.barIsFocused"
  :data-focused="Search.reactive.barIsFocused"
  :data-filled="!!Search.reactive.rawQuery")
  .search-icon(@mousedown.stop.prevent="" @mouseup.stop.prevent="")
    svg: use(href="#icon_search")
  .placeholder {{translate('bar.search.placeholder')}}
  input.input(
    ref="textEl"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    tabindex="-1"
    v-model="Search.reactive.rawQuery"
    @input.passive="onInput"
    @focus="onFocus"
    @blur="onBlur"
    @change="onChange"
    @keydown="onKD")
  .clear-btn(
    v-if="Settings.state.searchBarMode === 'dynamic' || Search.reactive.rawQuery"
    @mousedown.stop="onClearBtnMouseDown"
    @mouseup.stop="onClearBtnMouseUp")
    svg: use(href="#icon_remove")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import * as Settings from 'src/services/settings'
import * as Search from 'src/services/search.fg'

const textEl = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (textEl.value) Search.registerInputEl(textEl.value)
})

function onClearBtnMouseDown(e: MouseEvent): void {
  if (Search.reactive.rawQuery) Search.stop(true)
  else {
    Search.hideBar()
    e.preventDefault()
  }
}

function onClearBtnMouseUp(): void {
  Search.focus()
}

function onKD(e: KeyboardEvent): void {
  // Bookmarks
  if (
    Search.shortcuts.bookmarks &&
    Search.shortcuts.bookmarks.key === e.key &&
    Search.shortcuts.bookmarks.ctrl === e.ctrlKey &&
    Search.shortcuts.bookmarks.alt === e.altKey &&
    Search.shortcuts.bookmarks.meta === e.metaKey
  ) {
    e.preventDefault()
    e.stopPropagation()
    Search.bookmarks()
  }

  // History
  else if (
    Search.shortcuts.history &&
    Search.shortcuts.history.key === e.key &&
    Search.shortcuts.history.ctrl === e.ctrlKey &&
    Search.shortcuts.history.alt === e.altKey &&
    Search.shortcuts.history.meta === e.metaKey
  ) {
    e.preventDefault()
    e.stopPropagation()
    Search.history()
  }

  if (!Search.reactive.rawQuery) return

  // Select all
  if (e.code === 'KeyA' && e.ctrlKey && e.shiftKey) {
    e.preventDefault()
    Search.selectAll()
  }

  // Down
  else if (e.key === 'ArrowDown') {
    e.preventDefault()
    Search.next()
  }

  // Up
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    Search.prev()
  }

  // Enter
  else if (e.key === 'Enter' && !e.altKey) {
    e.preventDefault()
    Search.enter()
  }

  // Menu
  else if (e.key === 'ContextMenu') {
    e.preventDefault()
    Search.menu()
  }
}

function onInput(e: Event) {
  const rawQuery = (e.target as HTMLInputElement | null)?.value ?? ''

  if (Settings.state.searchInputTimeout > 0) {
    Search.searchDebounced(Settings.state.searchInputTimeout, rawQuery)
  } else {
    Search.search(rawQuery)
  }
}

function onChange(e: Event): void {
  if (!Search.active) return
  const rawQuery = (e.target as HTMLInputElement | null)?.value ?? ''
  Search.search(rawQuery)
}

function onFocus(e: Event): void {
  Search.reactive.barIsFocused = true
}

function onBlur(e: Event): void {
  Search.reactive.barIsFocused = false
}
</script>
