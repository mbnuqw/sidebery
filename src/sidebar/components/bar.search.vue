<template lang="pug">
.SearchBar(
  id="search_bar"
  :data-showed="Settings.state.searchBarMode === 'static' || Search.reactive.barIsShowed"
  :data-active="Search.reactive.barIsActive"
  :data-focused="Search.reactive.barIsFocused"
  :data-filled="!!Search.reactive.rawValue")
  .search-icon(@mousedown.stop.prevent="" @mouseup.stop.prevent="")
    svg: use(xlink:href="#icon_search")
  .placeholder {{translate('bar.search.placeholder')}}
  input.input(
    ref="textEl"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    tabindex="-1"
    v-model="Search.reactive.rawValue"
    @input.passive="onInput"
    @focus="onFocus"
    @blur="onBlur"
    @change="onChange"
    @keydown="onKD")
  .clear-btn(
    v-if="Settings.state.searchBarMode === 'dynamic' || Search.reactive.rawValue"
    @mousedown.stop="onClearBtnMouseDown"
    @mouseup.stop="onClearBtnMouseUp")
    svg: use(xlink:href="#icon_remove")
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { translate } from 'src/dict'
import { Settings } from 'src/services/settings'
import { Search } from 'src/services/search'

const textEl = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (textEl.value) Search.registerInputEl(textEl.value)
})

function onClearBtnMouseDown(e: MouseEvent): void {
  if (Search.rawValue) Search.onOutsideSearchInput('')
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

  if (!Search.rawValue) return

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

let inputTimeout: number | undefined
function onInput(e: Event) {
  Search.rawValue = (e.target as HTMLInputElement | null)?.value ?? ''

  clearTimeout(inputTimeout)
  inputTimeout = setTimeout(() => {
    Search.search((e.target as HTMLInputElement | null)?.value)
  }, Search.INPUT_TIMEOUT)
}

function onChange(e: Event): void {
  const target = e.target as HTMLInputElement | null
  const value = target?.value ?? ''
  if (value !== Search.rawValue) Search.search(value)
}

function onFocus(e: Event): void {
  Search.reactive.barIsActive = true
  Search.reactive.barIsFocused = true
}

function onBlur(e: Event): void {
  Search.reactive.barIsActive = false
  Search.reactive.barIsFocused = false
}
</script>
