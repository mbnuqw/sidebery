<template lang="pug">
.keybinding(
  :is-focused="keybinding.focus"
  :data-error="!!keybinding.error")
  .label(@click="changeKeybinding(keybinding)") {{keybinding.description}}
  .value(v-if="keybinding.focus") {{inputLabel}}
  .value(v-else-if="keybinding.error") {{translate('settings.kb_err_' + keybinding.error)}}
  .value(v-else @click="changeKeybinding(keybinding)") {{normalizeShortcut(keybinding.shortcut)}}
  input(
    type="text"
    tabindex="-1"
    ref="inputEl"
    @blur="onKBBlur(keybinding)"
    @keydown.prevent.stop="onKBKey($event, keybinding)"
    @keyup.prevent.stop="onKBKeyUp($event)")
  .icon-btn(
    :data-enabled="!!keybinding.shortcut"
    @click="removeKeybinding(keybinding)"): svg: use(xlink:href="#icon_remove")
</template>

<script lang="ts" setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { translate } from 'src/dict'
import { Command } from 'src/types'
import { Keybindings } from 'src/services/keybindings'
import { Info } from 'src/services/info'

const ERR_SHOW_TIMEOUT = 2000

const inputEl = ref<HTMLInputElement | null>(null)
const state = reactive({ newShortcut: '' })

defineProps<{ keybinding: Command }>()

let errTimeout: number
let errMsg = ''

const inputLabel = computed((): string => state.newShortcut || translate('settings.kb_input'))

function changeKeybinding(cmd: Command): void {
  state.newShortcut = ''
  errMsg = ''

  inputEl.value?.focus()
  Keybindings.update(cmd, { focus: true, error: '' })

  if (errTimeout) {
    clearTimeout(errTimeout)
    Keybindings.resetErrors()
  }
}

function normalizeShortcut(s?: string): string {
  if (!s) return '---'
  if (Info.reactive.os === 'mac') return s.replace('Command', '⌘').replace('MacCtrl', 'Ctrl')
  if (Info.reactive.os === 'win') return s.replace('Command', 'Win')
  if (Info.reactive.os === 'linux') return s.replace('Command', 'Super')
  return s
}

function onKBBlur(cmd: Command): void {
  if (!cmd.focus) return

  if (errMsg) {
    Keybindings.update(cmd, { focus: false, error: errMsg })
    if (errTimeout) clearTimeout(errTimeout)
    errTimeout = setTimeout(() => {
      Keybindings.update(cmd, { error: '' })
      errMsg = ''
    }, ERR_SHOW_TIMEOUT)
  } else {
    Keybindings.update(cmd, { focus: false })
  }
}

function onKBKey(e: KeyboardEvent, cmd: Command): void {
  if (e.key === 'Escape') return inputEl.value?.blur()
  if (e.key === 'Delete' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    const index = Keybindings.reactive.list.findIndex(c => c.name === cmd.name)
    if (index === -1) return

    Keybindings.update(cmd, { shortcut: '', focus: false })

    nextTick(() => inputEl.value?.blur())
    return
  }

  const keys: string[] = []
  if (e.ctrlKey) {
    if (Info.reactive.os === 'mac') keys.push('MacCtrl')
    else keys.push('Ctrl')
  }
  if (e.altKey) keys.push('Alt')
  if (e.shiftKey && keys.length <= 1) keys.push('Shift')

  const LetterRe = /^[0-9A-Za-z]$/
  const FRe = /^F\d\d?$/
  if (LetterRe.test(e.key)) keys.push(e.key.toUpperCase())
  else if (e.key.startsWith('Arrow')) keys.push(e.key.slice(5))
  else if (FRe.test(e.key)) keys.push(e.key)
  else if (e.key === ',' || e.key === '<') keys.push('Comma')
  else if (e.key === '.' || e.key === '>') keys.push('Period')
  else if (e.key === ' ') keys.push('Space')
  else if (
    e.key === 'Home' ||
    e.key === 'End' ||
    e.key === 'PageUp' ||
    e.key === 'PageDown' ||
    e.key === 'Insert' ||
    e.key === 'Delete' ||
    e.key === 'Up' ||
    e.key === 'Down' ||
    e.key === 'Left' ||
    e.key === 'Right'
  ) {
    keys.push(e.key)
  }

  const shortcut = keys.join('+')
  state.newShortcut = shortcut

  const checkResult = Keybindings.checkShortcut(shortcut)
  if (checkResult === 'valid') {
    Keybindings.update(cmd, { shortcut, focus: false })
    nextTick(() => inputEl.value?.blur())
  } else {
    errMsg = checkResult
  }
}

function onKBKeyUp(e: Event): void {
  inputEl.value?.blur()
}

function removeKeybinding(cmd: Command): void {
  if (!cmd.shortcut) return
  Keybindings.update(cmd, { shortcut: '', focus: false })
}
</script>
