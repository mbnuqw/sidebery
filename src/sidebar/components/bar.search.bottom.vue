<template lang="pug">
.BottomSearchBar(
  ref="rootEl"
  :data-active="Search.reactive.barIsFocused || !!Search.reactive.rawQuery"
  :data-focused="Search.reactive.barIsFocused"
  :data-filled="!!Search.reactive.rawQuery"
  @click="onBarClick")
  .search-icon(@mousedown.stop.prevent="onIconMouseDown")
    svg: use(href="#icon_search")
  input.input(
    ref="textEl"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    tabindex="-1"
    :placeholder="translate('bar.search.tabs_placeholder')"
    v-model="Search.reactive.rawQuery"
    @input.passive="onInput"
    @focus="onFocus"
    @blur="onBlur"
    @change="onChange"
    @keydown="onKD")
  .clear-btn(
    v-if="Search.reactive.rawQuery"
    title="Esc"
    @mousedown.stop.prevent="onClearMouseDown")
    svg: use(href="#icon_remove")
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { translate } from 'src/dict'
import * as Settings from 'src/services/settings'
import * as Search from 'src/services/search.fg'

const textEl = ref<HTMLInputElement | null>(null)
const rootEl = ref<HTMLElement | null>(null)

onMounted(() => {
  if (textEl.value) {
    Search.registerBottomInputEl(textEl.value)
  }
})

onBeforeUnmount(() => {
  Search.registerBottomInputEl(undefined)
})

function onBarClick(): void {
  focus()
}

function onIconMouseDown(): void {
  focus()
}

function focus(): void {
  if (textEl.value) {
    textEl.value.focus({ preventScroll: true })
    textEl.value.select()
  }
}

function onClearMouseDown(): void {
  Search.stop()
  if (textEl.value) textEl.value.focus({ preventScroll: true })
}

function onInput(e: InputEvent): void {
  const rawQuery = (e.target as HTMLInputElement | null)?.value ?? ''
  Search.reactive.barIsFilled = !!rawQuery
  if (e.isComposing) return

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

function onFocus(): void {
  Search.reactive.barIsFocused = true
}

function onBlur(): void {
  Search.reactive.barIsFocused = false
}

function onKD(e: KeyboardEvent): void {
  // F8 toggle / blur
  if (e.code === 'F8' || e.key === 'F8') {
    e.preventDefault()
    e.stopPropagation()
    if (Search.reactive.rawQuery) {
      Search.stop()
    }
    textEl.value?.blur()
    return
  }

  // Escape
  if (e.code === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    Search.stop()
    textEl.value?.blur()
    return
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

defineExpose({
  focus,
})
</script>
